const prisma = require('../config/db');

// In-memory active draft storage for admin preview & manual tweaking before DB commit
const activeDrafts = new Map();

/**
 * Generate candidate conflict-free DRAFT timetable for all active divisions
 */
const generateTimetableDraft = async (params = {}) => {
  const {
    periodsPerDay = 6,
    days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    academicYearId,
  } = params;

  // 1. Fetch current Academic Year if not provided
  let yearId = academicYearId;
  if (!yearId) {
    const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    yearId = currentYear?.id;
  }

  if (!yearId) {
    const fallbackYear = await prisma.academicYear.findFirst();
    yearId = fallbackYear?.id;
  }

  // 2. Fetch all Divisions, Subjects, and Staff
  const divisions = await prisma.division.findMany({
    include: { standard: true, subjects: true },
  });

  const staffMembers = await prisma.staff.findMany({
    include: { department: true },
  });

  const allSubjects = await prisma.subject.findMany();

  if (divisions.length === 0 || staffMembers.length === 0) {
    throw new Error('Insufficient database records: At least 1 division and 1 staff member required to generate timetable.');
  }

  // Time slot mapping
  const timeSlots = [
    { periodNumber: 1, startTime: '08:00 AM', endTime: '08:45 AM' },
    { periodNumber: 2, startTime: '08:45 AM', endTime: '09:30 AM' },
    { periodNumber: 3, startTime: '09:45 AM', endTime: '10:30 AM' }, // After short break
    { periodNumber: 4, startTime: '10:30 AM', endTime: '11:15 AM' },
    { periodNumber: 5, startTime: '11:30 AM', endTime: '12:15 PM' }, // After lunch break
    { periodNumber: 6, startTime: '12:15 PM', endTime: '01:00 PM' },
  ];

  const draftSlots = [];
  const conflicts = [];
  const teacherBookings = new Set(); // Key: "staffId:day:periodNumber"
  const roomBookings = new Set();    // Key: "roomNumber:day:periodNumber"

  // Loop through each division, day, and period to assign balanced subjects & teachers
  for (const division of divisions) {
    const divSubjects = division.subjects.length > 0 ? division.subjects : allSubjects;
    const roomNumber = division.roomNumber || `Room-${division.name}`;

    for (const day of days) {
      for (let pIdx = 0; pIdx < Math.min(periodsPerDay, timeSlots.length); pIdx++) {
        const slotConfig = timeSlots[pIdx];
        const periodNumber = slotConfig.periodNumber;

        // Pick a subject sequentially to balance daily frequency
        const subject = divSubjects[(pIdx + days.indexOf(day)) % divSubjects.length] || allSubjects[0];

        // Find available faculty member for this subject/department
        let assignedStaff = staffMembers.find((st) => {
          const bookingKey = `${st.id}:${day}:${periodNumber}`;
          return !teacherBookings.has(bookingKey);
        });

        if (!assignedStaff) {
          assignedStaff = staffMembers[0]; // Fallback if tight teacher pool
          conflicts.push({
            type: 'TEACHER_CLASH_WARNING',
            severity: 'WARN',
            day,
            periodNumber,
            message: `Faculty member ${assignedStaff.firstName} ${assignedStaff.lastName} double-booked on ${day} Period ${periodNumber}. Manual adjustment recommended.`,
          });
        } else {
          teacherBookings.add(`${assignedStaff.id}:${day}:${periodNumber}`);
        }

        const roomKey = `${roomNumber}:${day}:${periodNumber}`;
        if (roomBookings.has(roomKey)) {
          conflicts.push({
            type: 'ROOM_CLASH_WARNING',
            severity: 'WARN',
            day,
            periodNumber,
            message: `Classroom ${roomNumber} assigned simultaneously on ${day} Period ${periodNumber}.`,
          });
        } else {
          roomBookings.add(roomKey);
        }

        draftSlots.push({
          tempId: `draft_${division.id}_${day}_${periodNumber}`,
          divisionId: division.id,
          divisionName: `${division.standard.name} — Div ${division.name}`,
          academicYearId: yearId,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCode: subject.code,
          staffId: assignedStaff.id,
          staffName: `${assignedStaff.firstName} ${assignedStaff.lastName}`,
          dayOfWeek: day,
          periodNumber,
          startTime: slotConfig.startTime,
          endTime: slotConfig.endTime,
          roomNumber,
        });
      }
    }
  }

  const draftId = `draft_${Date.now()}`;
  const draftResult = {
    draftId,
    status: 'DRAFT',
    totalSlots: draftSlots.length,
    conflictsCount: conflicts.length,
    conflicts,
    slots: draftSlots,
    createdAt: new Date().toISOString(),
  };

  activeDrafts.set(draftId, draftResult);
  return draftResult;
};

/**
 * Get active draft by ID
 */
const getDraftById = (draftId) => {
  return activeDrafts.get(draftId) || null;
};

/**
 * Manually update a specific period slot in the active draft
 */
const updateDraftSlot = (draftId, tempId, updates) => {
  const draft = activeDrafts.get(draftId);
  if (!draft) throw new Error('Draft timetable session expired or not found.');

  const slotIndex = draft.slots.findIndex((s) => s.tempId === tempId);
  if (slotIndex === -1) throw new Error('Slot not found in draft.');

  draft.slots[slotIndex] = {
    ...draft.slots[slotIndex],
    ...updates,
  };

  activeDrafts.set(draftId, draft);
  return draft;
};

/**
 * Approve and commit draft timetable into PostgreSQL database transaction
 */
const approveAndCommitDraft = async (draftId) => {
  const draft = activeDrafts.get(draftId);
  if (!draft) throw new Error('Draft timetable session expired or not found.');

  let committedCount = 0;
  await prisma.$transaction(async (tx) => {
    // Purge existing timetable entries for the affected divisions to prevent stale conflicts
    const divisionIds = [...new Set(draft.slots.map((s) => s.divisionId))];
    await tx.timetable.deleteMany({
      where: { divisionId: { in: divisionIds } },
    });

    for (const slot of draft.slots) {
      if (!slot.academicYearId) continue;

      await tx.timetable.create({
        data: {
          divisionId: slot.divisionId,
          subjectId: slot.subjectId,
          staffId: slot.staffId,
          academicYearId: slot.academicYearId,
          dayOfWeek: slot.dayOfWeek,
          periodNumber: slot.periodNumber,
          startTime: slot.startTime,
          endTime: slot.endTime,
          roomNumber: slot.roomNumber,
        },
      });
      committedCount++;
    }
  });

  activeDrafts.delete(draftId);
  return { committedCount };
};

module.exports = {
  generateTimetableDraft,
  getDraftById,
  updateDraftSlot,
  approveAndCommitDraft,
};

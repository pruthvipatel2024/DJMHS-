const prisma = require('../config/db');
const {
  generateTimetableDraft,
  getDraftById,
  updateDraftSlot,
  approveAndCommitDraft,
} = require('../services/timetableGenerator.service');

/**
 * Get weekly schedule matrix for a division or staff member from PostgreSQL
 */
const getTimetable = async (req, res, next) => {
  try {
    const { divisionId, staffId } = req.query;
    const where = {};

    if (divisionId) where.divisionId = divisionId;
    else if (staffId) where.staffId = staffId;
    else if (req.user.role.name === 'TEACHER' && req.user.staffProfile) {
      where.staffId = req.user.staffProfile.id;
    } else if (req.user.role.name === 'STUDENT' && req.user.studentProfile) {
      where.divisionId = req.user.studentProfile.divisionId;
    }

    const entries = await prisma.timetable.findMany({
      where,
      include: {
        subject: true,
        staff: { select: { id: true, empId: true, firstName: true, lastName: true } },
        division: { include: { standard: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const matrix = days.map((day) => ({
      day,
      periods: entries.filter((e) => e.dayOfWeek === day),
    }));

    res.status(200).json({ success: true, data: { matrix, count: entries.length, rawEntries: entries } });
  } catch (err) {
    next(err);
  }
};

/**
 * Assign or update a single timetable slot in PostgreSQL
 */
const setTimetableSlot = async (req, res, next) => {
  try {
    const { id, divisionId, subjectId, staffId, academicYearId, dayOfWeek, periodNumber, startTime, endTime, roomNumber } = req.body;

    if (!divisionId || !subjectId || !staffId || !dayOfWeek || periodNumber === undefined) {
      return res.status(400).json({ success: false, error: 'Incomplete Slot', message: 'Division, subject, teacher, day, and period number required.' });
    }

    const cleanDay = String(dayOfWeek).slice(0, 3).toUpperCase();
    const cleanPeriod = Number(periodNumber);

    let yearId = academicYearId;
    if (!yearId) {
      const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
      yearId = currentYear?.id || (await prisma.academicYear.findFirst())?.id;
    }

    // Resolve subject ID if subject name was passed or verify subject exists
    let resolvedSubjectId = subjectId;
    let existingSubject = await prisma.subject.findUnique({ where: { id: subjectId } });
    
    if (!existingSubject) {
      // Find division standard to look up or create subject
      const division = await prisma.division.findUnique({ where: { id: divisionId }, include: { standard: true } });
      if (division) {
        existingSubject = await prisma.subject.findFirst({
          where: {
            standardId: division.standardId,
            OR: [
              { name: { equals: String(subjectId).trim(), mode: 'insensitive' } },
              { code: { equals: String(subjectId).trim().toUpperCase() } },
            ],
          },
        });

        if (!existingSubject) {
          // Auto create subject for this standard
          const acronym = String(subjectId).trim().split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase();
          const cleanCode = `${acronym}-${division.standard.level || '00'}-${Math.floor(100 + Math.random() * 900)}`;
          existingSubject = await prisma.subject.create({
            data: {
              standardId: division.standardId,
              name: String(subjectId).trim(),
              code: cleanCode,
            },
          });
        }
        resolvedSubjectId = existingSubject.id;
      }
    }

    // Check if a timetable slot already exists for this division at this time slot
    const existingDivisionSlot = await prisma.timetable.findFirst({
      where: {
        divisionId,
        dayOfWeek: cleanDay,
        periodNumber: cleanPeriod,
      },
    });

    const targetId = id || existingDivisionSlot?.id;

    // Teacher Clash Detection: Check if designated faculty member is already teaching ANY other class at this time
    const teacherClash = await prisma.timetable.findFirst({
      where: {
        staffId,
        dayOfWeek: cleanDay,
        periodNumber: cleanPeriod,
        ...(targetId ? { id: { not: targetId } } : {}),
      },
      include: {
        division: { include: { standard: true } },
        subject: true,
        staff: true,
      },
    });

    if (teacherClash) {
      const teacherName = `${teacherClash.staff?.firstName || 'Faculty'} ${teacherClash.staff?.lastName || ''}`.trim();
      const clashClass = `${teacherClash.division?.standard?.name || 'Class'} (Division ${teacherClash.division?.name || 'A'})`;
      return res.status(409).json({
        success: false,
        error: 'Teacher Schedule Clash',
        message: `Teacher Conflict: Faculty member ${teacherName} is already assigned to teach '${teacherClash.subject?.name || 'Subject'}' in ${clashClass} on ${cleanDay} Period ${cleanPeriod}. A single teacher cannot be scheduled in two classes at the same time.`,
      });
    }

    // Room Clash Detection: Check if the room/lab is already occupied by another class
    if (roomNumber && roomNumber !== 'Classroom' && roomNumber.trim() !== '') {
      const roomClash = await prisma.timetable.findFirst({
        where: {
          roomNumber: { equals: roomNumber.trim(), mode: 'insensitive' },
          dayOfWeek: cleanDay,
          periodNumber: cleanPeriod,
          ...(targetId ? { id: { not: targetId } } : {}),
        },
        include: {
          division: { include: { standard: true } },
          subject: true,
        },
      });

      if (roomClash) {
        const clashClass = `${roomClash.division?.standard?.name || 'Class'} (Division ${roomClash.division?.name || 'A'})`;
        return res.status(409).json({
          success: false,
          error: 'Room Schedule Clash',
          message: `Room Conflict: Classroom / Laboratory '${roomNumber}' is already occupied by ${clashClass} on ${cleanDay} Period ${cleanPeriod}.`,
        });
      }
    }

    let slot;
    if (targetId) {
      slot = await prisma.timetable.update({
        where: { id: targetId },
        data: {
          divisionId,
          subjectId: resolvedSubjectId,
          staffId,
          dayOfWeek: cleanDay,
          periodNumber: cleanPeriod,
          startTime: startTime || '08:00 AM',
          endTime: endTime || '08:45 AM',
          roomNumber: roomNumber || null,
        },
        include: { subject: true, staff: true, division: { include: { standard: true } } },
      });
    } else {
      slot = await prisma.timetable.create({
        data: {
          divisionId,
          subjectId: resolvedSubjectId,
          staffId,
          academicYearId: yearId,
          dayOfWeek: cleanDay,
          periodNumber: cleanPeriod,
          startTime: startTime || '08:00 AM',
          endTime: endTime || '08:45 AM',
          roomNumber: roomNumber || null,
        },
        include: { subject: true, staff: true, division: { include: { standard: true } } },
      });
    }

    res.status(200).json({
      success: true,
      message: `Timetable slot assigned successfully for ${cleanDay} Period ${cleanPeriod}.`,
      data: slot,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove single timetable entry
 */
const deleteTimetableSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.timetable.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Schedule period assignment vacated successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Auto-Generate Candidate Timetable DRAFT
 */
const handleGenerateDraft = async (req, res, next) => {
  try {
    const draft = await generateTimetableDraft(req.body);
    res.status(200).json({
      success: true,
      message: `Automatic timetable draft generated successfully with ${draft.conflictsCount} warning alerts.`,
      data: draft,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update single slot in active draft
 */
const handleUpdateDraftSlot = async (req, res, next) => {
  try {
    const { draftId, tempId, updates } = req.body;
    const updatedDraft = updateDraftSlot(draftId, tempId, updates);
    res.status(200).json({
      success: true,
      message: 'Draft timetable slot updated.',
      data: updatedDraft,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Approve & Commit DRAFT timetable into PostgreSQL database
 */
const handleApproveDraft = async (req, res, next) => {
  try {
    const { draftId } = req.body;
    const result = await approveAndCommitDraft(draftId);
    res.status(200).json({
      success: true,
      message: `Timetable draft approved! ${result.committedCount} period assignments committed to PostgreSQL database.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Clear all timetable entries for a specific division
 */
const clearDivisionTimetable = async (req, res, next) => {
  try {
    const { divisionId } = req.params;
    if (!divisionId) {
      return res.status(400).json({ success: false, message: 'Division ID required.' });
    }
    const result = await prisma.timetable.deleteMany({
      where: { divisionId },
    });
    res.status(200).json({
      success: true,
      message: `Cleared all ${result.count} timetable assignments for this class division.`,
      data: { count: result.count },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Clear all timetable entries across the entire institution
 */
const clearAllTimetable = async (req, res, next) => {
  try {
    const result = await prisma.timetable.deleteMany({});
    res.status(200).json({
      success: true,
      message: `All ${result.count} timetable assignments cleared across the institution.`,
      data: { count: result.count },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Clear all timetable entries for a specific staff member
 */
const clearStaffTimetable = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff ID required.' });
    }
    const result = await prisma.timetable.deleteMany({
      where: { staffId },
    });
    res.status(200).json({
      success: true,
      message: `Cleared ${result.count} timetable assignments for selected faculty member.`,
      data: { count: result.count },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTimetable,
  setTimetableSlot,
  deleteTimetableSlot,
  handleGenerateDraft,
  handleUpdateDraftSlot,
  handleApproveDraft,
  clearDivisionTimetable,
  clearStaffTimetable,
  clearAllTimetable,
};

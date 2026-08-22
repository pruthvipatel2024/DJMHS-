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

    let yearId = academicYearId;
    if (!yearId) {
      const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
      yearId = currentYear?.id || (await prisma.academicYear.findFirst())?.id;
    }

    // Teacher Clash Detection (PRD Chapter 7)
    const existingClash = await prisma.timetable.findFirst({
      where: {
        staffId,
        dayOfWeek,
        periodNumber: Number(periodNumber),
        id: id ? { not: id } : undefined,
      },
      include: { division: { include: { standard: true } }, subject: true },
    });

    if (existingClash) {
      const clashDiv = `${existingClash.division.standard.name} (Division ${existingClash.division.name})`;
      return res.status(409).json({
        success: false,
        error: 'Teacher Schedule Clash',
        message: `System Alert: Designated teacher is already assigned to teach '${existingClash.subject.name}' in ${clashDiv} on ${dayOfWeek} Period ${periodNumber}.`,
      });
    }

    let slot;
    if (id) {
      slot = await prisma.timetable.update({
        where: { id },
        data: { divisionId, subjectId, staffId, dayOfWeek, periodNumber: Number(periodNumber), startTime: startTime || '08:00 AM', endTime: endTime || '08:45 AM', roomNumber },
        include: { subject: true, staff: true },
      });
    } else {
      slot = await prisma.timetable.create({
        data: { divisionId, subjectId, staffId, academicYearId: yearId, dayOfWeek, periodNumber: Number(periodNumber), startTime: startTime || '08:00 AM', endTime: endTime || '08:45 AM', roomNumber },
        include: { subject: true, staff: true },
      });
    }

    res.status(200).json({
      success: true,
      message: `Timetable slot assigned successfully for ${dayOfWeek} Period ${periodNumber}.`,
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

module.exports = {
  getTimetable,
  setTimetableSlot,
  deleteTimetableSlot,
  handleGenerateDraft,
  handleUpdateDraftSlot,
  handleApproveDraft,
};

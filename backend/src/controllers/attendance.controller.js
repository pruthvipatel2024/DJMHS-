const prisma = require('../config/db');
const { sendSMS } = require('../services/communication.service');

/**
 * Get attendance sheet for a specified division and date
 */
const getAttendanceByDivision = async (req, res, next) => {
  try {
    const { divisionId, date } = req.query;

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    let division = null;
    if (divisionId) {
      try {
        division = await prisma.division.findFirst({
          where: { OR: [{ id: divisionId }, { name: { contains: divisionId, mode: 'insensitive' } }] },
          include: { standard: true },
        });
      } catch (e) {
        /* ignore non-UUID string query */
      }
    }

    if (!division) {
      division = await prisma.division.findFirst({ include: { standard: true } });
    }

    const targetDivId = division ? division.id : divisionId;

    // Find active students
    let students = [];
    if (targetDivId) {
      try {
        students = await prisma.student.findMany({
          where: { divisionId: targetDivId, status: 'ACTIVE' },
          orderBy: { rollNumber: 'asc' },
        });
      } catch (e) {
        students = [];
      }
    }

    // Fallback: If no students found in exact division, fetch all active students so register is never empty
    if (students.length === 0) {
      students = await prisma.student.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { rollNumber: 'asc' },
      });
    }

    // Query existing attendance records for queryDate
    const existingRecords = await prisma.studentAttendance.findMany({
      where: {
        date: queryDate,
      },
    });

    const studentAttendance = students.map((std) => {
      const rec = existingRecords.find((r) => r.studentId === std.id);
      return {
        studentId: std.id,
        grNumber: std.grNumber,
        rollNumber: std.rollNumber,
        firstName: std.firstName,
        lastName: std.lastName,
        status: rec ? rec.status : 'PRESENT', // Default to Present
        remarks: rec?.remarks || '',
      };
    });

    const userRole = req.user?.role?.name || (typeof req.user?.role === 'string' ? req.user.role : 'TEACHER');
    const isAdmin = userRole === 'ADMIN';
    const isMarked = existingRecords.length > 0;
    const isLocked = isMarked && !isAdmin;

    res.status(200).json({
      success: true,
      data: {
        division,
        date: queryDate.toISOString().split('T')[0],
        isMarked,
        isLocked,
        isAdmin,
        students: studentAttendance,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit or update attendance for a division on a specific date
 * Automatically triggers guardian SMS alerts for absent students per PRD Chapter 5!
 */
const markAttendance = async (req, res, next) => {
  try {
    const { divisionId, date, records } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Payload',
        message: 'Student attendance records array is required.',
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const userRole = req.user?.role?.name || (typeof req.user?.role === 'string' ? req.user.role : 'TEACHER');
    const isAdmin = userRole === 'ADMIN';

    // Enforce Lock Rule: Once attendance is submitted, non-admin users cannot change it.
    const existingCount = await prisma.studentAttendance.count({
      where: {
        ...(divisionId ? { divisionId } : {}),
        date: targetDate,
      },
    });

    if (existingCount > 0 && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Register Locked',
        message: 'Attendance for today has already been submitted for this class. Only Institutional Administrators can modify or update submitted attendance registers.',
      });
    }

    let absentCount = 0;
    let presentCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const rec of records) {
        if (!rec.studentId) continue;

        const currentStudent = await tx.student.findUnique({
          where: { id: rec.studentId },
          select: {
            divisionId: true,
            firstName: true,
            lastName: true,
            grNumber: true,
            parents: { include: { parent: true } },
          },
        });

        const effectiveDivId = currentStudent?.divisionId || divisionId;
        if (!effectiveDivId) continue;

        await tx.studentAttendance.upsert({
          where: {
            studentId_date: {
              studentId: rec.studentId,
              date: targetDate,
            },
          },
          update: {
            status: rec.status || 'PRESENT',
            remarks: rec.remarks || null,
            markedById: req.user?.id || null,
          },
          create: {
            studentId: rec.studentId,
            divisionId: effectiveDivId,
            date: targetDate,
            status: rec.status || 'PRESENT',
            remarks: rec.remarks || null,
            markedById: req.user?.id || null,
          },
        });

        if (rec.status === 'PRESENT' || rec.status === 'HALF_DAY') {
          presentCount++;
        } else if (rec.status === 'ABSENT') {
          absentCount++;
          const primaryGuardian = currentStudent?.parents?.find((p) => p.isPrimary)?.parent || currentStudent?.parents?.[0]?.parent;
          if (primaryGuardian?.phone) {
            await sendSMS(
              primaryGuardian.phone,
              `DJMHS High School Attendance Alert: Your ward ${currentStudent.firstName} ${currentStudent.lastName} (GR: ${currentStudent.grNumber}) was marked ABSENT today (${targetDate.toLocaleDateString()}). Please contact class teacher for details.`
            );
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Attendance register saved successfully! (${presentCount} Present, ${absentCount} Absent). Guardian SMS alerts dispatched for absent wards.`,
      data: { presentCount, absentCount },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get monthly attendance matrix report with under-75% warnings
 */
const getAttendanceReport = async (req, res, next) => {
  try {
    const { divisionId, month, year } = req.query;
    const targetMonth = parseInt(month, 10) || (new Date().getMonth() + 1);
    const targetYear = parseInt(year, 10) || new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const students = await prisma.student.findMany({
      where: divisionId ? { divisionId, status: 'ACTIVE' } : { status: 'ACTIVE' },
      select: { id: true, grNumber: true, rollNumber: true, firstName: true, lastName: true, division: { include: { standard: true } } },
      orderBy: { rollNumber: 'asc' },
    });

    const records = await prisma.studentAttendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const reportMatrix = students.map((std) => {
      const stdRecords = records.filter((r) => r.studentId === std.id);
      const totalMarkedDays = stdRecords.length;
      const presentDays = stdRecords.filter((r) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;

      const attendancePercentage = totalMarkedDays > 0 ? ((presentDays / totalMarkedDays) * 100).toFixed(1) : '100.0';
      const isLowAttendance = Number(attendancePercentage) < 75.0;

      return {
        student: std,
        attendancePercentage: Number(attendancePercentage),
        presentDays,
        totalMarkedDays,
        isLowAttendance,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        daysInMonth: endDate.getDate(),
        matrix: reportMatrix,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAttendanceByDivision,
  markAttendance,
  getAttendanceReport,
};

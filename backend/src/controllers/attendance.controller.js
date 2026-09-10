const prisma = require('../config/db');
const { sendSMS } = require('../services/communication.service');
const { exportToExcel } = require('../services/excel.service');

/**
 * Get attendance sheet for a specified division and date with cumulative student metrics
 */
const getAttendanceByDivision = async (req, res, next) => {
  try {
    const { divisionId, standardId, date } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const todayStr = today.toISOString().split('T')[0];
    const queryDateStr = queryDate.toISOString().split('T')[0];

    const isFuture = queryDate > today;
    const isHistorical = queryDate < today;

    let division = null;
    if (divisionId) {
      try {
        division = await prisma.division.findFirst({
          where: { OR: [{ id: divisionId }, { name: divisionId }] },
          include: { standard: true },
        });
      } catch (e) {
        /* ignore */
      }
    }

    if (!division && standardId) {
      division = await prisma.division.findFirst({
        where: { standardId },
        include: { standard: true },
      });
    }

    if (!division) {
      division = await prisma.division.findFirst({ include: { standard: true } });
    }

    const targetDivId = division ? division.id : divisionId;

    // Find active students strictly belonging to this division
    let students = [];
    if (targetDivId) {
      students = await prisma.student.findMany({
        where: { divisionId: targetDivId, status: 'ACTIVE', deletedAt: null },
        orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
      });
    }

    // Query existing attendance records for the target date
    const existingRecords = targetDivId
      ? await prisma.studentAttendance.findMany({
          where: {
            divisionId: targetDivId,
            date: queryDate,
          },
        })
      : [];

    // Query all historical attendance records for the students in this division to compute cumulative percentages
    const studentIds = students.map((s) => s.id);
    const allHistoricalRecords = studentIds.length > 0
      ? await prisma.studentAttendance.findMany({
          where: {
            studentId: { in: studentIds },
          },
          select: {
            studentId: true,
            status: true,
          },
        })
      : [];

    const studentAttendance = students.map((std) => {
      const rec = existingRecords.find((r) => r.studentId === std.id);
      
      const stdHistory = allHistoricalRecords.filter((r) => r.studentId === std.id);
      const totalMarkedDays = stdHistory.length;
      const presentDays = stdHistory.filter((r) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
      const attendancePercentage = totalMarkedDays > 0
        ? Number(((presentDays / totalMarkedDays) * 100).toFixed(1))
        : 100.0;
      const isLowAttendance = totalMarkedDays > 0 && attendancePercentage < 75.0;

      return {
        studentId: std.id,
        grNumber: std.grNumber,
        rollNumber: std.rollNumber || '',
        firstName: std.firstName,
        lastName: std.lastName,
        photoUrl: std.photoUrl || null,
        gender: std.gender || 'Male',
        status: rec ? rec.status : 'PRESENT', // Default to Present for marking
        remarks: rec?.remarks || '',
        presentDays,
        totalMarkedDays,
        attendancePercentage,
        isLowAttendance,
      };
    });

    const userRole = req.user?.role?.name || (typeof req.user?.role === 'string' ? req.user.role : 'TEACHER');
    const isAdmin = userRole === 'ADMIN';
    const isMarked = existingRecords.length > 0;
    
    // Check if active user is designated Class Teacher for this division
    let isClassTeacher = false;
    if (req.user?.staffProfile?.id && targetDivId) {
      const mapping = await prisma.classTeacherMapping.findFirst({
        where: {
          staffId: req.user.staffProfile.id,
          divisionId: targetDivId,
        },
      });
      if (mapping) isClassTeacher = true;
    } else if (isAdmin) {
      isClassTeacher = true;
    }

    // Lock conditions:
    // 1. Future dates are always locked for marking
    // 2. Historical past dates are locked for non-admins (Teachers can only view history)
    // 3. Already marked registers for today are locked for non-admins
    // 4. Non-class-teachers are locked from marking attendance
    const isLocked = isFuture || (isHistorical && !isAdmin) || (isMarked && !isAdmin) || (!isAdmin && !isClassTeacher);

    res.status(200).json({
      success: true,
      data: {
        division,
        date: queryDateStr,
        todayDate: todayStr,
        isFuture,
        isHistorical,
        isMarked,
        isLocked,
        isAdmin,
        isClassTeacher,
        students: studentAttendance,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit or update attendance for a division on a specific date
 * Strictly enforces date validation (no future dates) and locks
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

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const userRole = req.user?.role?.name || (typeof req.user?.role === 'string' ? req.user.role : 'TEACHER');
    const isAdmin = userRole === 'ADMIN';

    // Verify Class Teacher Authorization for non-admin staff
    if (!isAdmin) {
      let isAuthorizedClassTeacher = false;
      const staffId = req.user?.staffProfile?.id;
      if (staffId && divisionId) {
        const mapping = await prisma.classTeacherMapping.findFirst({
          where: { staffId, divisionId },
        });
        if (mapping) isAuthorizedClassTeacher = true;
      }
      if (!isAuthorizedClassTeacher) {
        return res.status(403).json({
          success: false,
          error: 'Class Teacher Authorization Required',
          message: 'Only designated Class Teachers for this division or Institutional Administrators are authorized to submit student attendance registers.',
        });
      }
    }

    // 1. Strictly block ANY future date attendance submission
    if (targetDate > today) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Date',
        message: 'Attendance cannot be marked or modified for future dates.',
      });
    }

    // 2. Restrict previous / past dates for non-admin teachers
    if (targetDate < startOfToday && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Date Restricted',
        message: 'Teachers are only permitted to submit attendance for the current day. Historical past registers are read-only.',
      });
    }

    // 3. Enforce Lock Rule: Once attendance is submitted, non-admin users cannot change it
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
        message: 'Attendance for today has already been submitted for this class. Only Institutional Administrators can modify submitted registers.',
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
            ).catch(() => {});
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

/**
 * Export Monthly Attendance Matrix to Excel
 */
const exportAttendanceToExcel = async (req, res, next) => {
  try {
    const { divisionId, month, year } = req.query;
    const targetMonth = parseInt(month, 10) || (new Date().getMonth() + 1);
    const targetYear = parseInt(year, 10) || new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const students = await prisma.student.findMany({
      where: divisionId && divisionId !== 'all' ? { divisionId, status: 'ACTIVE' } : { status: 'ACTIVE' },
      select: {
        id: true,
        grNumber: true,
        rollNumber: true,
        firstName: true,
        lastName: true,
        division: { include: { standard: true } },
      },
      orderBy: [{ division: { name: 'asc' } }, { rollNumber: 'asc' }],
    });

    const records = await prisma.studentAttendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const columns = [
      { header: 'GR Number', key: 'grNumber' },
      { header: 'Roll No', key: 'rollNumber' },
      { header: 'Student Name', key: 'studentName' },
      { header: 'Standard & Division', key: 'cohort' },
      { header: 'Total Working Days', key: 'totalDays' },
      { header: 'Present Days', key: 'presentDays' },
      { header: 'Absent Days', key: 'absentDays' },
      { header: 'Attendance %', key: 'percentage' },
      { header: 'Status Flag', key: 'flag' },
    ];

    const rows = students.map((std) => {
      const stdRecords = records.filter((r) => r.studentId === std.id);
      const totalMarkedDays = stdRecords.length;
      const presentDays = stdRecords.filter((r) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
      const absentDays = totalMarkedDays - presentDays;
      const pct = totalMarkedDays > 0 ? ((presentDays / totalMarkedDays) * 100).toFixed(1) : '100.0';

      return {
        grNumber: std.grNumber || 'N/A',
        rollNumber: std.rollNumber || 'N/A',
        studentName: `${std.firstName} ${std.lastName}`,
        cohort: std.division ? `${std.division.standard?.name || ''} - Div ${std.division.name}` : 'N/A',
        totalDays: totalMarkedDays,
        presentDays: presentDays,
        absentDays: absentDays,
        percentage: `${pct}%`,
        flag: Number(pct) < 75.0 ? 'LOW ATTENDANCE (<75%)' : 'REGULAR',
      };
    });

    const buffer = await exportToExcel(`Attendance ${targetMonth}-${targetYear}`, columns, rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="DJMHS_Monthly_Attendance_${targetMonth}_${targetYear}_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAttendanceByDivision,
  markAttendance,
  getAttendanceReport,
  exportAttendanceToExcel,
};

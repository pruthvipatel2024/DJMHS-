const prisma = require('../config/db');

// In-memory cache for dashboard aggregations to provide sub-10ms response times
const dashboardCache = {
  admin: { data: null, expiresAt: 0 },
  teacher: new Map(), // staffId -> { data, expiresAt }
  portal: new Map(),  // studentId -> { data, expiresAt }
};

const CACHE_TTL_MS = 15 * 1000; // 15 seconds TTL for high-frequency dashboard telemetry

/**
 * Get Admin Executive Dashboard KPI Metrics and Trends
 */
const getAdminDashboardKPIs = async (req, res, next) => {
  try {
    const now = Date.now();
    if (dashboardCache.admin.data && now < dashboardCache.admin.expiresAt) {
      return res.status(200).json({
        success: true,
        data: dashboardCache.admin.data,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run ALL 10 independent database queries in parallel for instant sub-second response
    const [
      totalStudents,
      totalStaff,
      totalDivisions,
      attendanceToday,
      attendanceTotalMarked,
      feeCollectedResult,
      pendingInstallments,
      departments,
      recentActivity,
      activeAnnouncements,
      recentPayments,
      recentAttendanceLogs,
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.staff.count(),
      prisma.division.count(),
      prisma.studentAttendance.count({ where: { date: { gte: today }, status: 'PRESENT' } }),
      prisma.studentAttendance.count({ where: { date: { gte: today } } }),
      prisma.feePayment.aggregate({ _sum: { amount: true } }),
      prisma.feeInstallment.aggregate({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        _sum: { amount: true },
      }),
      prisma.department.findMany({
        include: { _count: { select: { staffMembers: true } } },
      }),
      prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: { id: true, actorName: true, action: true, createdAt: true, reason: true },
      }),
      prisma.announcement.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feePayment.findMany({
        take: 100,
        orderBy: { paymentDate: 'desc' },
        select: { amount: true, paymentDate: true },
      }),
      prisma.studentAttendance.findMany({
        take: 12,
        orderBy: { updatedAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              grNumber: true,
              rollNumber: true,
              photoUrl: true,
              division: { include: { standard: true } },
            },
          },
        },
      }),
    ]);

    const attendancePercentage = attendanceTotalMarked > 0
      ? Number(((attendanceToday / attendanceTotalMarked) * 100).toFixed(1))
      : 0;

    const totalFeeCollected = feeCollectedResult._sum.amount || 0;
    const totalPendingDues = pendingInstallments._sum.amount || 0;

    const departmentChart = departments.map((d) => ({
      departmentName: d.name,
      staffCount: d._count.staffMembers,
    }));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};
    recentPayments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!trendMap[key]) trendMap[key] = { month: key, collection: 0, pending: 0 };
      trendMap[key].collection += p.amount;
    });

    const monthlyRevenueTrend = Object.values(trendMap).length > 0
      ? Object.values(trendMap)
      : [{ month: 'Current Term', collection: Number(totalFeeCollected), pending: Number(totalPendingDues) }];

    const resultData = {
      metrics: {
        totalStudents,
        totalStaff,
        totalDivisions,
        attendancePercentage,
        totalFeeCollected,
        totalPendingDues,
        activeAlerts: 0,
      },
      departmentChart,
      monthlyRevenueTrend,
      recentActivity,
      recentAttendanceLogs,
      activeAnnouncements,
    };

    // Cache the response
    dashboardCache.admin = {
      data: resultData,
      expiresAt: now + CACHE_TTL_MS,
    };

    res.status(200).json({
      success: true,
      data: resultData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Teacher Dashboard Academic & Class Roster Insights, Daily Lecture Schedule, and Profile
 */
const getTeacherDashboard = async (req, res, next) => {
  try {
    let staffId = req.user.staffProfile?.id;

    if (!staffId && req.user?.id) {
      const staffRecord = await prisma.staff.findFirst({ where: { userId: req.user.id } });
      if (staffRecord) staffId = staffRecord.id;
    }

    if (!staffId) {
      const firstStaff = await prisma.staff.findFirst({ include: { department: true } });
      if (firstStaff) staffId = firstStaff.id;
    }

    const now = Date.now();
    const cacheKey = staffId || 'default';
    const cached = dashboardCache.teacher.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      return res.status(200).json({ success: true, data: cached.data });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parallelize teacher profile, timetable, class teacher mappings, and notices
    const [staff, classTeacherOf, allTimetableSlots, recentNotices] = await Promise.all([
      staffId
        ? prisma.staff.findUnique({
            where: { id: staffId },
            include: {
              department: true,
              user: { select: { id: true, email: true, phone: true, isActive: true, preferredLanguage: true } },
            },
          })
        : null,
      staffId
        ? prisma.classTeacherMapping.findMany({
            where: { staffId },
            include: {
              division: {
                include: {
                  standard: true,
                  students: { where: { status: 'ACTIVE', deletedAt: null }, select: { id: true } },
                },
              },
              academicYear: true,
            },
          })
        : [],
      staffId
        ? prisma.timetable.findMany({
            where: { staffId },
            include: {
              subject: true,
              division: { include: { standard: true } },
            },
            orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
          })
        : [],
      prisma.announcement.findMany({
        where: { targetRole: { in: ['ALL', 'TEACHER'] }, deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const isClassTeacher = classTeacherOf.length > 0;
    let totalStudentsAssigned = 0;
    classTeacherOf.forEach((c) => {
      totalStudentsAssigned += c.division.students?.length || 0;
    });

    let isTodayAttendanceMarked = false;
    let presentCount = 0;
    let absentCount = 0;

    if (isClassTeacher) {
      const assignedDivisionIds = classTeacherOf.map((c) => c.divisionId);
      const todayAttendance = await prisma.studentAttendance.findMany({
        where: {
          divisionId: { in: assignedDivisionIds },
          date: today,
        },
      });

      if (todayAttendance.length > 0) {
        isTodayAttendanceMarked = true;
        presentCount = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
        absentCount = todayAttendance.filter((a) => a.status === 'ABSENT').length;
      }
    }

    const formattedSlots = allTimetableSlots.map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      roomNumber: slot.roomNumber || slot.division.roomNumber || 'Room TBD',
      subjectName: slot.subject.name,
      subjectCode: slot.subject.code,
      standardName: slot.division.standard.name,
      divisionName: slot.division.name,
      standardId: slot.division.standardId,
      divisionId: slot.divisionId,
    }));

    const daysOfWeekList = [
      { code: 'MON', name: 'Monday' },
      { code: 'TUE', name: 'Tuesday' },
      { code: 'WED', name: 'Wednesday' },
      { code: 'THU', name: 'Thursday' },
      { code: 'FRI', name: 'Friday' },
      { code: 'SAT', name: 'Saturday' },
    ];

    const weeklySchedule = daysOfWeekList.map((d) => ({
      day: d.code,
      dayName: d.name,
      periods: formattedSlots.filter((s) => s.dayOfWeek === d.code),
    }));

    const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDayIndex = new Date().getDay();
    const currentDayCode = dayMap[currentDayIndex];
    const isSunday = currentDayCode === 'SUN';
    const activeDayCode = isSunday ? 'MON' : currentDayCode;
    const todaySchedule = formattedSlots.filter((s) => s.dayOfWeek === activeDayCode);

    const distinctClasses = Array.from(new Set(formattedSlots.map((s) => `${s.standardName} (${s.divisionName})`)));
    const distinctSubjects = Array.from(new Set(formattedSlots.map((s) => s.subjectName)));

    const resultData = {
      staffProfile: staff
        ? {
            id: staff.id,
            empId: staff.empId,
            firstName: staff.firstName,
            lastName: staff.lastName,
            fullName: `${staff.firstName} ${staff.lastName}`.trim(),
            photoUrl: staff.photoUrl || null,
            phone: staff.phone,
            email: staff.email,
            designation: staff.designation,
            employmentType: staff.employmentType,
            joinDate: staff.joinDate,
            dob: staff.dob,
            gender: staff.gender,
            address: staff.address,
            department: staff.department ? { id: staff.department.id, name: staff.department.name } : null,
          }
        : null,
      isClassTeacher,
      classTeacherDetails: classTeacherOf.map((c) => ({
        standardId: c.division.standardId,
        divisionId: c.division.id,
        standard: c.division.standard.name,
        division: c.division.name,
        room: c.division.roomNumber || '-',
        totalStudents: c.division.students?.length || 0,
      })),
      myClassesCount: classTeacherOf.length,
      totalStudentsAssigned: totalStudentsAssigned || 0,
      attendanceTodayStats: {
        isMarked: isTodayAttendanceMarked,
        presentCount,
        absentCount,
      },
      todayDayCode: currentDayCode,
      activeScheduleDay: activeDayCode,
      isWeekend: isSunday,
      todaySchedule,
      weeklySchedule,
      totalLecturesToday: todaySchedule.length,
      totalWeeklyLectures: formattedSlots.length,
      distinctClassesCount: distinctClasses.length,
      distinctSubjectsCount: distinctSubjects.length,
      recentNotices,
    };

    dashboardCache.teacher.set(cacheKey, {
      data: resultData,
      expiresAt: now + CACHE_TTL_MS,
    });

    res.status(200).json({
      success: true,
      data: resultData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Student / Parent Portal Dashboard Data for targeted child
 */
const getPortalDashboard = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    let targetStudentId = studentId || req.user.studentProfile?.id;

    if (!targetStudentId && req.user.role.name === 'PARENT') {
      const parentRel = await prisma.studentParentMapping.findFirst({
        where: { parentId: req.user.parentProfile?.id },
      });
      if (parentRel) targetStudentId = parentRel.studentId;
    }

    if (!targetStudentId) {
      return res.status(404).json({ success: false, error: 'No Student Found', message: 'No student record associated with active account profile.' });
    }

    const now = Date.now();
    const cached = dashboardCache.portal.get(targetStudentId);
    if (cached && now < cached.expiresAt) {
      return res.status(200).json({ success: true, data: cached.data });
    }

    // Parallelize student details, pending installments, attendance, and announcements
    const [student, pendingInstallments, presentDays, totalMarked, announcements] = await Promise.all([
      prisma.student.findUnique({
        where: { id: targetStudentId },
        include: { division: { include: { standard: true } } },
      }),
      prisma.feeInstallment.findMany({
        where: { studentId: targetStudentId, status: { in: ['PENDING', 'PARTIAL'] } },
      }),
      prisma.studentAttendance.count({
        where: { studentId: targetStudentId, status: { in: ['PRESENT', 'HALF_DAY'] } },
      }),
      prisma.studentAttendance.count({
        where: { studentId: targetStudentId },
      }),
      prisma.announcement.findMany({
        where: { targetRole: { in: ['ALL', 'STUDENT', 'PARENT'] }, deletedAt: null },
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPending = pendingInstallments.reduce((acc, curr) => acc + (curr.amount - (curr.paidAmount || 0)), 0);
    const attendanceRatio = totalMarked > 0 ? Number(((presentDays / totalMarked) * 100).toFixed(1)) : 0;

    const resultData = {
      student,
      metrics: {
        attendancePercentage: attendanceRatio,
        pendingFeeBalance: totalPending,
        nextExamTitle: 'Term 1 Mid-Semester Assessments',
        nextExamDate: '2026-09-15',
      },
      pendingInstallments,
      announcements,
    };

    dashboardCache.portal.set(targetStudentId, {
      data: resultData,
      expiresAt: now + CACHE_TTL_MS,
    });

    res.status(200).json({
      success: true,
      data: resultData,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminDashboardKPIs,
  getTeacherDashboard,
  getPortalDashboard,
};

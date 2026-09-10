const prisma = require('../config/db');
const { exportMultiSheetExcel } = require('../services/excel.service');

// Default initial GSEB subjects to seed if standard subjects are empty
const defaultGSEBSubjects = {
  9: [
    { name: 'Mathematics', code: 'MATH-09', isOptional: false },
    { name: 'Science & Technology', code: 'SCI-09', isOptional: false },
    { name: 'Social Science', code: 'SS-09', isOptional: false },
    { name: 'Gujarati (First Language)', code: 'GUJ-09', isOptional: false },
    { name: 'English (Second Language)', code: 'ENG-09', isOptional: false },
    { name: 'Hindi', code: 'HIN-09', isOptional: false },
    { name: 'Physical Education & Health', code: 'PE-09', isOptional: true },
  ],
  10: [
    { name: 'Mathematics', code: 'MATH-10', isOptional: false },
    { name: 'Science & Technology', code: 'SCI-10', isOptional: false },
    { name: 'Social Science', code: 'SS-10', isOptional: false },
    { name: 'Gujarati (First Language)', code: 'GUJ-10', isOptional: false },
    { name: 'English (Second Language)', code: 'ENG-10', isOptional: false },
    { name: 'Hindi', code: 'HIN-10', isOptional: false },
    { name: 'Physical Education & Health', code: 'PE-10', isOptional: true },
  ],
  11: [
    { name: 'Elements of Accounts', code: 'ACC-11', isOptional: false },
    { name: 'Statistics', code: 'STAT-11', isOptional: false },
    { name: 'Economics', code: 'ECO-11', isOptional: false },
    { name: 'Organization of Commerce & Management', code: 'BA-11', isOptional: false },
    { name: 'Secretarial Practice & Commercial Correspondence', code: 'SPCC-11', isOptional: false },
    { name: 'English (Compulsory)', code: 'ENG-11', isOptional: false },
    { name: 'Gujarati', code: 'GUJ-11', isOptional: false },
  ],
  12: [
    { name: 'Elements of Accounts', code: 'ACC-12', isOptional: false },
    { name: 'Statistics', code: 'STAT-12', isOptional: false },
    { name: 'Economics', code: 'ECO-12', isOptional: false },
    { name: 'Organization of Commerce & Management', code: 'BA-12', isOptional: false },
    { name: 'Secretarial Practice & Commercial Correspondence', code: 'SPCC-12', isOptional: false },
    { name: 'English (Compulsory)', code: 'ENG-12', isOptional: false },
    { name: 'Gujarati', code: 'GUJ-12', isOptional: false },
  ],
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const academicYears = await prisma.academicYear.findMany({ orderBy: { name: 'desc' } });
    const departments = await prisma.department.findMany({ include: { _count: { select: { staffMembers: true } } } });
    
    // Auto-seed standard subjects if empty
    const standardsCount = await prisma.standard.count();
    if (standardsCount > 0) {
      const allStandards = await prisma.standard.findMany({ include: { subjects: true } });
      for (const std of allStandards) {
        if (std.subjects.length === 0 && defaultGSEBSubjects[std.level]) {
          const list = defaultGSEBSubjects[std.level];
          for (const s of list) {
            await prisma.subject.create({
              data: {
                standardId: std.id,
                name: s.name,
                code: s.code,
                isOptional: s.isOptional,
              },
            }).catch(() => {});
          }
        }
      }
    }

    const standards = await prisma.standard.findMany({
      include: {
        divisions: {
          include: {
            subjectMappings: {
              include: {
                staff: { select: { id: true, empId: true, firstName: true, lastName: true } },
                subject: true,
              },
            },
          },
        },
        subjects: {
          include: {
            teacherMappings: {
              include: {
                staff: { select: { id: true, empId: true, firstName: true, lastName: true } },
                division: true,
              },
            },
          },
          orderBy: { code: 'asc' },
        },
      },
      orderBy: { level: 'asc' },
    });

    const allSubjects = await prisma.subject.findMany({
      include: {
        standard: true,
        teacherMappings: {
          include: {
            staff: { select: { id: true, empId: true, firstName: true, lastName: true } },
            division: true,
          },
        },
      },
      orderBy: [{ standard: { level: 'asc' } }, { code: 'asc' }],
    });

    res.status(200).json({
      success: true,
      data: {
        settings,
        academicYears,
        departments,
        standards,
        subjects: allSubjects,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getSchoolProfile = async (req, res, next) => {
  try {
    const profile = await prisma.schoolProfile.findFirst();
    res.status(200).json({
      success: true,
      data: profile || {},
    });
  } catch (err) {
    next(err);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const updated = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, category: 'GENERAL' },
    });
    res.status(200).json({ success: true, message: 'Institutional parameter saved successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const newDept = await prisma.department.create({
      data: { name: name.trim(), description: description?.trim() },
    });
    res.status(201).json({ success: true, message: 'Department faculty wing established.', data: newDept });
  } catch (err) {
    next(err);
  }
};

const createStandard = async (req, res, next) => {
  try {
    const { name, level, capacity } = req.body;
    const std = await prisma.standard.create({
      data: { name: name.trim(), level: parseInt(level, 10), capacity: parseInt(capacity, 10) || 80 },
    });

    // Auto-seed default subjects for this standard level if available
    const lvl = parseInt(level, 10);
    if (defaultGSEBSubjects[lvl]) {
      for (const s of defaultGSEBSubjects[lvl]) {
        await prisma.subject.create({
          data: {
            standardId: std.id,
            name: s.name,
            code: s.code,
            isOptional: s.isOptional,
          },
        }).catch(() => {});
      }
    }

    res.status(201).json({ success: true, message: 'New standard tier established.', data: std });
  } catch (err) {
    next(err);
  }
};

const createDivision = async (req, res, next) => {
  try {
    const { standardId, name, roomNumber, capacity } = req.body;
    const div = await prisma.division.create({
      data: { standardId, name: name.trim(), roomNumber: roomNumber?.trim() || null, capacity: parseInt(capacity, 10) || 40 },
    });
    res.status(201).json({ success: true, message: `Division '${name}' assigned successfully.`, data: div });
  } catch (err) {
    next(err);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await prisma.department.update({
      where: { id },
      data: { name: name?.trim(), description: description?.trim() },
    });
    res.status(200).json({ success: true, message: 'Department details updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Department removed from database.' });
  } catch (err) {
    next(err);
  }
};

const updateStandard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, level, capacity } = req.body;
    const updated = await prisma.standard.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(level && { level: parseInt(level, 10) }),
        ...(capacity && { capacity: parseInt(capacity, 10) }),
      },
    });
    res.status(200).json({ success: true, message: 'Standard details updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteStandard = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.standard.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Standard removed from database.' });
  } catch (err) {
    next(err);
  }
};

const updateDivision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, roomNumber, capacity } = req.body;
    const updated = await prisma.division.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(roomNumber !== undefined && { roomNumber: roomNumber ? roomNumber.trim() : null }),
        ...(capacity && { capacity: parseInt(capacity, 10) }),
      },
    });
    res.status(200).json({ success: true, message: 'Division details updated.', data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteDivision = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.division.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Division removed from database.' });
  } catch (err) {
    next(err);
  }
};

// ===================== SUBJECT MANAGEMENT (STANDARD-WISE) =====================

const getSubjects = async (req, res, next) => {
  try {
    const { standardId } = req.query;
    const where = {};
    if (standardId) where.standardId = standardId;

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        standard: true,
        teacherMappings: {
          include: {
            staff: { select: { id: true, empId: true, firstName: true, lastName: true, department: true } },
            division: true,
          },
        },
      },
      orderBy: [{ standard: { level: 'asc' } }, { code: 'asc' }],
    });

    res.status(200).json({ success: true, data: subjects });
  } catch (err) {
    next(err);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { standardId, name, code, isOptional } = req.body;

    if (!standardId || !name) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Standard and Subject Name are mandatory.' });
    }

    const cleanName = String(name).trim();
    let cleanCode = code ? String(code).trim().toUpperCase() : '';

    if (!cleanCode) {
      const std = await prisma.standard.findUnique({ where: { id: standardId } });
      const acronym = cleanName.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase();
      cleanCode = `${acronym}-${std ? std.level : '00'}`;
    }

    // Check if code already exists
    let existing = await prisma.subject.findUnique({ where: { code: cleanCode } });
    if (existing) {
      cleanCode = `${cleanCode}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const subject = await prisma.subject.create({
      data: {
        standardId,
        name: cleanName,
        code: cleanCode,
        isOptional: !!isOptional,
      },
      include: { standard: true },
    });

    res.status(201).json({ success: true, message: `Subject '${cleanName}' created successfully.`, data: subject });
  } catch (err) {
    next(err);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, isOptional, standardId } = req.body;

    const updateData = {};
    if (name) updateData.name = String(name).trim();
    if (code) updateData.code = String(code).trim().toUpperCase();
    if (isOptional !== undefined) updateData.isOptional = !!isOptional;
    if (standardId) updateData.standardId = standardId;

    const updated = await prisma.subject.update({
      where: { id },
      data: updateData,
      include: { standard: true },
    });

    res.status(200).json({ success: true, message: 'Subject details updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.$transaction(async (tx) => {
      await tx.staffSubjectMapping.deleteMany({ where: { subjectId: id } });
      await tx.timetable.deleteMany({ where: { subjectId: id } });
      await tx.examSchedule.deleteMany({ where: { subjectId: id } });
      await tx.subject.delete({ where: { id } });
    });

    res.status(200).json({ success: true, message: 'Subject and its allocations deleted from database.' });
  } catch (err) {
    next(err);
  }
};

// ===================== TEACHER SUBJECT & CLASS ALLOCATION =====================

const getSubjectAllocations = async (req, res, next) => {
  try {
    const { standardId, divisionId, staffId } = req.query;
    const where = {};

    if (divisionId) where.divisionId = divisionId;
    if (staffId) where.staffId = staffId;
    if (standardId) {
      where.division = { standardId };
    }

    const allocations = await prisma.staffSubjectMapping.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            empId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            photoUrl: true,
            department: true,
          },
        },
        subject: {
          include: { standard: true },
        },
        division: {
          include: { standard: true },
        },
      },
      orderBy: [{ division: { standard: { level: 'asc' } } }, { division: { name: 'asc' } }, { subject: { name: 'asc' } }],
    });

    res.status(200).json({ success: true, data: allocations });
  } catch (err) {
    next(err);
  }
};

const assignStaffSubject = async (req, res, next) => {
  try {
    const { staffId, subjectId, divisionId } = req.body;

    if (!staffId || !subjectId || !divisionId) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Staff, Subject, and Division are required.' });
    }

    // Upsert or replace existing assignment for this subject in this division
    const mapping = await prisma.$transaction(async (tx) => {
      await tx.staffSubjectMapping.deleteMany({
        where: { subjectId, divisionId },
      });

      return await tx.staffSubjectMapping.create({
        data: { staffId, subjectId, divisionId },
        include: {
          staff: { select: { id: true, empId: true, firstName: true, lastName: true } },
          subject: true,
          division: { include: { standard: true } },
        },
      });
    });

    res.status(200).json({ success: true, message: 'Teacher assigned to subject and class successfully.', data: mapping });
  } catch (err) {
    next(err);
  }
};

const bulkSaveClassSubjectAssignments = async (req, res, next) => {
  try {
    const { divisionId, assignments } = req.body;

    if (!divisionId || !Array.isArray(assignments)) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Division ID and assignments list are required.' });
    }

    const division = await prisma.division.findUnique({
      where: { id: divisionId },
      include: { standard: true },
    });

    if (!division) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Class division not found.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Clear existing mappings for this division
      await tx.staffSubjectMapping.deleteMany({ where: { divisionId } });

      const created = [];
      for (const item of assignments) {
        if (item.subjectId && item.staffId) {
          const mapping = await tx.staffSubjectMapping.create({
            data: {
              divisionId,
              subjectId: item.subjectId,
              staffId: item.staffId,
            },
            include: {
              staff: { select: { id: true, empId: true, firstName: true, lastName: true } },
              subject: true,
            },
          });
          created.push(mapping);
        }
      }
      return created;
    });

    res.status(200).json({
      success: true,
      message: `Class subject teacher allocations saved successfully for ${division.standard.name} Division ${division.name} (${result.length} subject teachers assigned).`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const deleteSubjectAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.staffSubjectMapping.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Teacher allocation removed from this subject and class.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Download Complete Institutional Backup as JSON Archive
 */
const downloadJsonBackup = async (req, res, next) => {
  try {
    const [
      settings,
      academicYears,
      departments,
      standards,
      subjects,
      staff,
      students,
      parents,
      staffSubjectMappings,
      timetables,
      feeStructures,
      feeInstallments,
      studentAttendance,
      exams,
      admissionInquiries,
      complaints,
      announcements,
      auditLogs,
    ] = await Promise.all([
      prisma.setting.findMany(),
      prisma.academicYear.findMany({ where: { deletedAt: null } }),
      prisma.department.findMany({ where: { deletedAt: null } }),
      prisma.standard.findMany({ where: { deletedAt: null }, include: { divisions: true } }),
      prisma.subject.findMany({ where: { deletedAt: null }, include: { standard: true } }),
      prisma.staff.findMany({
        where: { deletedAt: null },
        include: {
          department: true,
          user: {
            select: {
              id: true,
              identifier: true,
              email: true,
              phone: true,
              isActive: true,
              isLocked: true,
              preferredLanguage: true,
              role: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.student.findMany({
        where: { deletedAt: null },
        include: {
          division: { include: { standard: true } },
          parents: { include: { parent: true } },
        },
      }),
      prisma.parent.findMany({ where: { deletedAt: null } }),
      prisma.staffSubjectMapping.findMany({
        include: {
          staff: true,
          subject: true,
          division: { include: { standard: true } },
        },
      }),
      prisma.timetable.findMany({
        include: {
          academicYear: true,
          division: { include: { standard: true } },
          subject: true,
          staff: true,
        },
      }),
      prisma.feeStructure.findMany({ include: { standard: true, academicYear: true } }),
      prisma.feeInstallment.findMany({
        include: {
          student: { include: { division: { include: { standard: true } } } },
          payments: true,
        },
      }),
      prisma.studentAttendance.findMany({
        take: 5000,
        orderBy: { date: 'desc' },
        include: { student: true },
      }),
      prisma.exam.findMany({
        where: { deletedAt: null },
        include: {
          standard: true,
          academicYear: true,
          schedules: { include: { subject: true } },
        },
      }),
      prisma.mark.findMany({
        include: {
          student: true,
          examSchedule: { include: { exam: true, subject: true } },
        },
      }),
      prisma.admissionInquiry.findMany({ where: { deletedAt: null } }),
      prisma.complaint.findMany({ include: { assignedToStaff: true } }),
      prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.findMany({ take: 1000, orderBy: { createdAt: 'desc' } }),
    ]);

    const backupPayload = {
      metadata: {
        institution: "D.J. Malaviya Hindi High School (DJMHS)",
        system: "DJMHS Institutional ERP System",
        exportTimestamp: new Date().toISOString(),
        exportedBy: req.user ? `${req.user.identifier || req.user.email} (${req.user.role?.name})` : 'ADMIN',
        schemaVersion: "1.0.0",
        recordSummary: {
          settings: settings.length,
          academicYears: academicYears.length,
          departments: departments.length,
          standards: standards.length,
          divisions: standards.reduce((acc, s) => acc + (s.divisions?.length || 0), 0),
          subjects: subjects.length,
          staff: staff.length,
          students: students.length,
          parents: parents.length,
          subjectAllocations: staffSubjectMappings.length,
          timetables: timetables.length,
          feeInstallments: feeInstallments.length,
          attendanceRecords: studentAttendance.length,
          exams: exams.length,
          admissionInquiries: admissionInquiries.length,
          complaints: complaints.length,
          announcements: announcements.length,
          auditLogs: auditLogs.length,
        },
      },
      data: {
        settings,
        academicYears,
        departments,
        standards,
        subjects,
        staff,
        students,
        parents,
        staffSubjectMappings,
        timetables,
        feeStructures,
        feeInstallments,
        studentAttendance,
        exams,
        admissionInquiries,
        complaints,
        announcements,
        auditLogs,
      },
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="DJMHS_Complete_Backup_${Date.now()}.json"`);
    res.send(jsonString);
  } catch (err) {
    next(err);
  }
};

/**
 * Download Complete Institutional Backup as Multi-Sheet Excel Workbook
 */
const downloadExcelBackup = async (req, res, next) => {
  try {
    const [
      settings,
      standards,
      departments,
      subjects,
      staff,
      students,
      parents,
      staffSubjectMappings,
      timetables,
      feeInstallments,
      studentAttendance,
      exams,
      marks,
      admissionInquiries,
      complaints,
      announcements,
    ] = await Promise.all([
      prisma.setting.findMany(),
      prisma.standard.findMany({ where: { deletedAt: null }, include: { divisions: true } }),
      prisma.department.findMany({ where: { deletedAt: null } }),
      prisma.subject.findMany({ where: { deletedAt: null }, include: { standard: true } }),
      prisma.staff.findMany({
        where: { deletedAt: null },
        include: { department: true, user: true },
        orderBy: [{ department: { name: 'asc' } }, { firstName: 'asc' }],
      }),
      prisma.student.findMany({
        where: { deletedAt: null },
        include: {
          division: { include: { standard: true } },
          parents: { include: { parent: true } },
        },
        orderBy: [{ division: { name: 'asc' } }, { rollNumber: 'asc' }],
      }),
      prisma.parent.findMany({ where: { deletedAt: null } }),
      prisma.staffSubjectMapping.findMany({
        include: {
          staff: true,
          subject: true,
          division: { include: { standard: true } },
        },
      }),
      prisma.timetable.findMany({
        include: {
          division: { include: { standard: true } },
          subject: true,
          staff: true,
        },
      }),
      prisma.feeInstallment.findMany({
        include: {
          student: { include: { division: { include: { standard: true } }, parents: { include: { parent: true } } } },
          payments: true,
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.studentAttendance.findMany({
        take: 2000,
        orderBy: { date: 'desc' },
        include: { student: { include: { division: { include: { standard: true } } } } },
      }),
      prisma.exam.findMany({
        where: { deletedAt: null },
        include: {
          standard: true,
          schedules: { include: { subject: true } },
        },
      }),
      prisma.mark.findMany({
        include: {
          student: { include: { division: { include: { standard: true } } } },
          examSchedule: { include: { exam: true, subject: true } },
        },
      }),
      prisma.admissionInquiry.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } }),
      prisma.complaint.findMany({ include: { assignedToStaff: true }, orderBy: { createdAt: 'desc' } }),
      prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    const sheets = [];

    // Sheet 1: Settings
    sheets.push({
      sheetName: 'System Settings',
      tabColor: 'FF1E3A8A',
      columns: [
        { header: 'Setting Parameter', key: 'key' },
        { header: 'Configured Value', key: 'value' },
        { header: 'Description / Purpose', key: 'description' },
      ],
      rows: settings.map((s) => ({
        key: s.key,
        value: s.value,
        description: s.description || 'Institutional Configuration Parameter',
      })),
    });

    // Sheet 2: Standards & Divisions
    const standardDivisionRows = [];
    standards.forEach((std) => {
      if (std.divisions && std.divisions.length > 0) {
        std.divisions.forEach((div) => {
          standardDivisionRows.push({
            standard: std.name,
            level: std.level,
            division: div.name,
            room: div.roomNumber || 'N/A',
            capacity: div.capacity || 40,
          });
        });
      } else {
        standardDivisionRows.push({
          standard: std.name,
          level: std.level,
          division: 'Default',
          room: 'N/A',
          capacity: std.capacity || 60,
        });
      }
    });

    sheets.push({
      sheetName: 'Standards & Divisions',
      tabColor: 'FF2563EB',
      columns: [
        { header: 'Standard / Tier', key: 'standard' },
        { header: 'Grade Level', key: 'level' },
        { header: 'Division', key: 'division' },
        { header: 'Classroom', key: 'room' },
        { header: 'Student Capacity', key: 'capacity' },
      ],
      rows: standardDivisionRows,
    });

    // Sheet 3: Departments
    sheets.push({
      sheetName: 'Departments',
      tabColor: 'FF4F46E5',
      columns: [
        { header: 'Department Name', key: 'name' },
        { header: 'Department Description', key: 'description' },
      ],
      rows: departments.map((d) => ({
        name: d.name,
        description: d.description || 'N/A',
      })),
    });

    // Sheet 4: Subjects
    sheets.push({
      sheetName: 'Curriculum Subjects',
      tabColor: 'FF7C3AED',
      columns: [
        { header: 'Standard', key: 'standard' },
        { header: 'Subject Name', key: 'name' },
        { header: 'Subject Code', key: 'code' },
        { header: 'Course Type', key: 'type' },
      ],
      rows: subjects.map((sub) => ({
        standard: sub.standard?.name || 'General',
        name: sub.name,
        code: sub.code,
        type: sub.isOptional ? 'Optional Elective' : 'Core Compulsory',
      })),
    });

    // Sheet 5: Faculty & Staff
    sheets.push({
      sheetName: 'Faculty & Staff',
      tabColor: 'FF0D9488',
      columns: [
        { header: 'Employee ID', key: 'empId' },
        { header: 'Staff Name', key: 'name' },
        { header: 'Designation', key: 'designation' },
        { header: 'Department', key: 'department' },
        { header: 'Phone Number', key: 'phone' },
        { header: 'Email Address', key: 'email' },
        { header: 'Gender', key: 'gender' },
        { header: 'Date of Birth', key: 'dob' },
        { header: 'Joining Date', key: 'joinDate' },
        { header: 'Employment Type', key: 'employmentType' },
        { header: 'Address', key: 'address' },
        { header: 'Account Status', key: 'status' },
      ],
      rows: staff.map((s) => ({
        empId: s.empId || 'N/A',
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        designation: s.designation ? s.designation.replace(/_/g, ' ') : 'TEACHER',
        department: s.department?.name || 'General',
        phone: s.phone || 'N/A',
        email: s.email || s.user?.email || 'N/A',
        gender: s.gender || 'N/A',
        dob: s.dob ? new Date(s.dob).toISOString().split('T')[0] : 'N/A',
        joinDate: s.joinDate ? new Date(s.joinDate).toISOString().split('T')[0] : 'N/A',
        employmentType: s.employmentType || 'PERMANENT',
        address: s.address || 'N/A',
        status: s.user?.isActive !== false ? 'ACTIVE' : 'INACTIVE',
      })),
    });

    // Sheet 6: Students Roster
    sheets.push({
      sheetName: 'Students General Register',
      tabColor: 'FF059669',
      columns: [
        { header: 'GR Number', key: 'grNumber' },
        { header: 'Roll No', key: 'rollNumber' },
        { header: 'Student Name', key: 'name' },
        { header: 'Gender', key: 'gender' },
        { header: 'Date of Birth', key: 'dob' },
        { header: 'Standard', key: 'standard' },
        { header: 'Division', key: 'division' },
        { header: 'Blood Group', key: 'bloodGroup' },
        { header: 'Emergency Contact', key: 'emergencyContact' },
        { header: 'Guardian Name', key: 'guardian' },
        { header: 'Guardian Phone', key: 'phone' },
        { header: 'Guardian Email', key: 'email' },
        { header: 'Status', key: 'status' },
      ],
      rows: students.map((s) => {
        const primaryParent = s.parents?.find((p) => p.isPrimary)?.parent || s.parents?.[0]?.parent;
        return {
          grNumber: s.grNumber || 'N/A',
          rollNumber: s.rollNumber || 'N/A',
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          gender: s.gender || 'N/A',
          dob: s.dob ? new Date(s.dob).toISOString().split('T')[0] : 'N/A',
          standard: s.division?.standard?.name || 'N/A',
          division: s.division?.name || 'A',
          bloodGroup: s.bloodGroup || 'N/A',
          emergencyContact: s.emergencyContact || 'N/A',
          guardian: primaryParent ? `${primaryParent.fatherName || primaryParent.guardianName || 'Guardian'}` : 'N/A',
          phone: primaryParent?.phone || 'N/A',
          email: primaryParent?.email || 'N/A',
          status: s.status || 'ACTIVE',
        };
      }),
    });

    // Sheet 7: Parents Directory
    sheets.push({
      sheetName: 'Parents Directory',
      tabColor: 'FF16A34A',
      columns: [
        { header: 'Father Name', key: 'fatherName' },
        { header: 'Mother Name', key: 'motherName' },
        { header: 'Guardian Name', key: 'guardianName' },
        { header: 'Primary Mobile', key: 'phone' },
        { header: 'Email Address', key: 'email' },
        { header: 'Occupation', key: 'occupation' },
        { header: 'Residential Address', key: 'address' },
      ],
      rows: parents.map((p) => ({
        fatherName: p.fatherName || 'N/A',
        motherName: p.motherName || 'N/A',
        guardianName: p.guardianName || 'N/A',
        phone: p.phone || 'N/A',
        email: p.email || 'N/A',
        occupation: p.occupation || 'N/A',
        address: p.address || 'N/A',
      })),
    });

    // Sheet 8: Teacher Allocations
    sheets.push({
      sheetName: 'Teacher Subject Allocations',
      tabColor: 'FFCA8A04',
      columns: [
        { header: 'Standard', key: 'standard' },
        { header: 'Division', key: 'division' },
        { header: 'Curriculum Subject', key: 'subject' },
        { header: 'Subject Code', key: 'code' },
        { header: 'Assigned Faculty', key: 'teacher' },
        { header: 'Employee ID', key: 'empId' },
      ],
      rows: staffSubjectMappings.map((m) => ({
        standard: m.division?.standard?.name || 'N/A',
        division: m.division?.name || 'A',
        subject: m.subject?.name || 'N/A',
        code: m.subject?.code || 'N/A',
        teacher: m.staff ? `${m.staff.firstName} ${m.staff.lastName}` : 'Unassigned',
        empId: m.staff?.empId || 'N/A',
      })),
    });

    // Sheet 9: Master Timetable
    sheets.push({
      sheetName: 'Master Timetable',
      tabColor: 'FFD97706',
      columns: [
        { header: 'Standard', key: 'standard' },
        { header: 'Division', key: 'division' },
        { header: 'Day of Week', key: 'day' },
        { header: 'Period Slot', key: 'period' },
        { header: 'Subject', key: 'subject' },
        { header: 'Assigned Teacher', key: 'teacher' },
        { header: 'Room', key: 'room' },
      ],
      rows: timetables.map((t) => ({
        standard: t.division?.standard?.name || 'N/A',
        division: t.division?.name || 'A',
        day: t.dayOfWeek || 'MONDAY',
        period: `Period ${t.periodIndex || 1}`,
        subject: t.subject?.name || 'N/A',
        teacher: t.staff ? `${t.staff.firstName} ${t.staff.lastName}` : 'N/A',
        room: t.roomNumber || t.division?.roomNumber || 'N/A',
      })),
    });

    // Sheet 10: Fee Ledger
    sheets.push({
      sheetName: 'Fee Collection Ledger',
      tabColor: 'FFEA580C',
      columns: [
        { header: 'Installment Title', key: 'title' },
        { header: 'Student Name', key: 'studentName' },
        { header: 'GR Number', key: 'grNumber' },
        { header: 'Standard & Div', key: 'cohort' },
        { header: 'Due Date', key: 'dueDate' },
        { header: 'Amount Due (INR)', key: 'amount' },
        { header: 'Amount Paid (INR)', key: 'paidAmount' },
        { header: 'Balance Due (INR)', key: 'balance' },
        { header: 'Payment Status', key: 'status' },
      ],
      rows: feeInstallments.map((inst) => {
        const totalPaid = inst.payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || (inst.status === 'PAID' ? inst.amount : 0);
        const balance = Math.max(0, inst.amount - totalPaid);
        return {
          title: inst.title || 'Tuition Fee Installment',
          studentName: inst.student ? `${inst.student.firstName} ${inst.student.lastName}` : 'N/A',
          grNumber: inst.student?.grNumber || 'N/A',
          cohort: inst.student?.division ? `${inst.student.division.standard?.name || ''} - Div ${inst.student.division.name}` : 'N/A',
          dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString().split('T')[0] : 'N/A',
          amount: Number(inst.amount || 0).toLocaleString('en-IN'),
          paidAmount: Number(totalPaid).toLocaleString('en-IN'),
          balance: Number(balance).toLocaleString('en-IN'),
          status: inst.status || 'PENDING',
        };
      }),
    });

    // Sheet 11: Examination Marks
    sheets.push({
      sheetName: 'Examination Scores',
      tabColor: 'FF9333EA',
      columns: [
        { header: 'Exam Title', key: 'exam' },
        { header: 'Standard & Div', key: 'cohort' },
        { header: 'GR Number', key: 'grNumber' },
        { header: 'Student Name', key: 'name' },
        { header: 'Subject', key: 'subject' },
        { header: 'Marks Obtained', key: 'score' },
        { header: 'Max Marks', key: 'max' },
        { header: 'Grade', key: 'grade' },
        { header: 'Remarks', key: 'remarks' },
      ],
      rows: marks.map((m) => ({
        exam: m.examSchedule?.exam?.name || 'Assessment Term',
        cohort: m.student?.division ? `${m.student.division.standard?.name || ''} - Div ${m.student.division.name}` : 'N/A',
        grNumber: m.student?.grNumber || 'N/A',
        name: m.student ? `${m.student.firstName} ${m.student.lastName}` : 'N/A',
        subject: m.examSchedule?.subject?.name || 'N/A',
        score: m.isAbsent ? 'ABSENT' : (m.marksObtained !== null && m.marksObtained !== undefined ? m.marksObtained : 'N/A'),
        max: m.examSchedule?.maxMarks || 100,
        grade: m.grade || (m.isAbsent ? 'F (Absent)' : 'N/A'),
        remarks: m.remarks || 'None',
      })),
    });

    // Sheet 12: Admission Inquiries
    sheets.push({
      sheetName: 'Admission Inquiries',
      tabColor: 'FF0284C7',
      columns: [
        { header: 'Inquiry No', key: 'inquiryNo' },
        { header: 'Prospective Pupil', key: 'studentName' },
        { header: 'Parent / Guardian', key: 'parentName' },
        { header: 'Phone Number', key: 'phone' },
        { header: 'Email Address', key: 'email' },
        { header: 'Status', key: 'status' },
        { header: 'Submission Date', key: 'createdAt' },
        { header: 'Notes', key: 'notes' },
      ],
      rows: admissionInquiries.map((inq) => ({
        inquiryNo: inq.inquiryNo || 'N/A',
        studentName: inq.studentName || 'N/A',
        parentName: inq.parentName || 'N/A',
        phone: inq.phone || 'N/A',
        email: inq.email || 'N/A',
        status: inq.status || 'NEW',
        createdAt: inq.createdAt ? new Date(inq.createdAt).toISOString().split('T')[0] : 'N/A',
        notes: inq.notes || 'None',
      })),
    });

    // Sheet 13: Helpdesk Complaints
    sheets.push({
      sheetName: 'Complaints Helpdesk',
      tabColor: 'FFE11D48',
      columns: [
        { header: 'Ticket Number', key: 'ticketNo' },
        { header: 'Category', key: 'category' },
        { header: 'Subject', key: 'subject' },
        { header: 'Description', key: 'description' },
        { header: 'Priority', key: 'priority' },
        { header: 'Status', key: 'status' },
        { header: 'Assigned Staff', key: 'assignedStaff' },
        { header: 'Resolution Notes', key: 'resolution' },
      ],
      rows: complaints.map((c) => ({
        ticketNo: c.ticketNumber || c.ticketNo || 'N/A',
        category: c.category || 'General',
        subject: c.title || c.subject || 'N/A',
        description: c.description || 'N/A',
        priority: c.priority || 'NORMAL',
        status: c.status || 'OPEN',
        assignedStaff: c.assignedToStaff ? `${c.assignedToStaff.firstName} ${c.assignedToStaff.lastName}` : 'Unassigned',
        resolution: c.resolutionNotes || 'Pending',
      })),
    });

    // Sheet 14: Announcements
    sheets.push({
      sheetName: 'Broadcast Notices',
      tabColor: 'FF475569',
      columns: [
        { header: 'Notice Title', key: 'title' },
        { header: 'Notice Content', key: 'content' },
        { header: 'Target Audience', key: 'targetRole' },
        { header: 'Priority', key: 'priority' },
        { header: 'Published Date', key: 'publishedAt' },
      ],
      rows: announcements.map((a) => ({
        title: a.titleEn || 'Untitled Notice',
        content: a.contentEn || 'N/A',
        targetRole: a.targetRole || 'ALL',
        priority: a.priority || 'NORMAL',
        publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString().split('T')[0] : 'N/A',
      })),
    });

    const buffer = await exportMultiSheetExcel(sheets);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="DJMHS_Complete_Institutional_Backup_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  getSchoolProfile,
  updateSetting,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createStandard,
  updateStandard,
  deleteStandard,
  createDivision,
  updateDivision,
  deleteDivision,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectAllocations,
  assignStaffSubject,
  bulkSaveClassSubjectAssignments,
  deleteSubjectAllocation,
  downloadJsonBackup,
  downloadExcelBackup,
};

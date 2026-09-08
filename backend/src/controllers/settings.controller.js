const prisma = require('../config/db');

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
};

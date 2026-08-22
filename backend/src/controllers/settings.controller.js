const prisma = require('../config/db');

const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const academicYears = await prisma.academicYear.findMany({ orderBy: { name: 'desc' } });
    const departments = await prisma.department.findMany({ include: { _count: { select: { staffMembers: true } } } });
    const standards = await prisma.standard.findMany({ include: { divisions: true }, orderBy: { level: 'asc' } });

    res.status(200).json({
      success: true,
      data: {
        settings,
        academicYears,
        departments,
        standards,
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
      data: profile || {}
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
      data: { name, description },
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
      data: { name, level: parseInt(level, 10), capacity: parseInt(capacity, 10) || 80 },
    });
    res.status(201).json({ success: true, message: 'New standard tier established.', data: std });
  } catch (err) {
    next(err);
  }
};

const createDivision = async (req, res, next) => {
  try {
    const { standardId, name, roomNumber, capacity } = req.body;
    const div = await prisma.division.create({
      data: { standardId, name, roomNumber, capacity: parseInt(capacity, 10) || 40 },
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
      data: { name, description },
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
        ...(name && { name }),
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
        ...(name && { name }),
        ...(roomNumber && { roomNumber }),
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
};

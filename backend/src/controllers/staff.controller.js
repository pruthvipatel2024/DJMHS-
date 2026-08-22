const prisma = require('../config/db');
const { hashPassword } = require('../utils/password.utils');
const { sendEmail, sendSMS } = require('../services/communication.service');
const { parseStaffBulkImport, exportToExcel } = require('../services/excel.service');
const { uploadMediaAsset } = require('../services/cloudinary.service');
const fs = require('fs');

const mapDesignation = (desig) => {
  if (!desig) return 'TEACHER';
  const u = String(desig).toUpperCase().trim();
  if (u.includes('PRINCIPAL') && !u.includes('VICE')) return 'PRINCIPAL';
  if (u.includes('VICE')) return 'VICE_PRINCIPAL';
  if (u.includes('HOD') || u.includes('HEAD')) return 'HOD';
  if (u.includes('CLASS')) return 'CLASS_TEACHER';
  if (u.includes('ADMIN')) return 'OFFICE_ADMIN';
  if (u.includes('NON') || u.includes('STAFF')) return 'NON_TEACHING_STAFF';
  return 'TEACHER';
};

/**
 * Get all staff members with department and teaching mappings
 */
const getAllStaff = async (req, res, next) => {
  try {
    const { departmentId, search } = req.query;
    const where = { deletedAt: null };

    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { empId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    // Auto-reconcile any unlinked TEACHER/ADMIN User records so 100% of database users appear
    const teacherRoles = await prisma.role.findMany({ where: { name: { in: ['TEACHER', 'ADMIN'] } } });
    const teacherRoleIds = teacherRoles.map(r => r.id);
    const unlinkedUsers = await prisma.user.findMany({
      where: {
        roleId: { in: teacherRoleIds },
        deletedAt: null,
        staffProfile: null,
      },
    });

    if (unlinkedUsers.length > 0) {
      let defaultDept = await prisma.department.findFirst();
      if (!defaultDept) {
        defaultDept = await prisma.department.create({
          data: { name: 'Commerce & Accounts', description: 'Faculty Department' }
        });
      }

      for (const u of unlinkedUsers) {
        const count = await prisma.staff.count();
        const empId = `DJMHS-EMP-${(count + 1).toString().padStart(4, '0')}`;
        const cleanId = (u.email || u.identifier || 'faculty.member').split('@')[0];
        const parts = cleanId.split('.');
        const firstName = parts[0] ? (parts[0].charAt(0).toUpperCase() + parts[0].slice(1)) : 'Faculty';
        const lastName = parts[1] ? (parts[1].charAt(0).toUpperCase() + parts[1].slice(1)) : 'Member';

        await prisma.staff.create({
          data: {
            userId: u.id,
            empId,
            firstName,
            lastName,
            gender: 'Male',
            dob: new Date('1990-01-01'),
            designation: u.roleId === teacherRoles.find(r => r.name === 'ADMIN')?.id ? 'PRINCIPAL' : 'TEACHER',
            departmentId: defaultDept.id,
            email: u.email || `${u.identifier}@sdjmt.edu.in`,
            phone: u.phone || '9876543210',
            address: 'Bhavnagar, Gujarat',
          },
        }).catch(() => {});
      }
    }

    const staffList = await prisma.staff.findMany({
      where,
      include: {
        department: true,
        user: { select: { isActive: true, email: true } },
        classTeaching: { include: { division: { include: { standard: true } } } },
      },
      orderBy: { empId: 'asc' },
    });

    res.status(200).json({ success: true, data: staffList });
  } catch (err) {
    next(err);
  }
};

/**
 * Get individual staff profile by ID with qualifications and schedules
 */
const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        department: true,
        user: { select: { id: true, identifier: true, isActive: true, email: true, phone: true } },
        classTeaching: { include: { division: { include: { standard: true } } } },
        subjectTeaching: { include: { subject: true, division: { include: { standard: true } } } },
      },
    });

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff Not Found', message: 'Requested staff record does not exist.' });
    }

    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
};

/**
 * Onboard new staff with automatic Employee ID generation & credentials
 */
const createStaff = async (req, res, next) => {
  try {
    const { firstName, lastName, gender, dob, designation, departmentId, phone, email, address, joinDate } = req.body;

    // Auto-generate unique Employee ID: DJMHS-EMP-XXXX per PRD Chapter 3.5
    let count = await prisma.staff.count();
    let nextCount = count + 1;
    let empId = `DJMHS-EMP-${nextCount.toString().padStart(4, '0')}`;
    let existingStaff = await prisma.staff.findUnique({ where: { empId } });
    while (existingStaff) {
      nextCount++;
      empId = `DJMHS-EMP-${nextCount.toString().padStart(4, '0')}`;
      existingStaff = await prisma.staff.findUnique({ where: { empId } });
    }

    // Create User Account with Default Password
    const defaultPassword = 'Password@123';
    const passwordHash = await hashPassword(defaultPassword);

    const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });

    let photoAsset = null;
    if (req.file) {
      photoAsset = await uploadMediaAsset(req.file.path, 'djmhs_staff');
    }

    let validDeptId = departmentId;
    let targetDept = null;
    if (departmentId) {
      targetDept = await prisma.department.findFirst({
        where: { OR: [{ id: departmentId }, { name: { contains: departmentId, mode: 'insensitive' } }] },
      });
    }
    if (!targetDept) {
      targetDept = await prisma.department.findFirst();
    }
    if (targetDept) validDeptId = targetDept.id;

    const validDesignation = mapDesignation(designation);

    const cleanEmail = (email && email.trim()) ? email.trim() : null;
    const cleanPhone = (phone && phone.trim()) ? phone.trim() : null;
    let staffIdentifier = cleanEmail || empId;

    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { identifier: staffIdentifier },
          { identifier: empId },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (existingUser) {
      staffIdentifier = empId;
    }

    // Transaction to ensure relational consistency
    const newStaff = await prisma.$transaction(async (tx) => {
      let newUser = existingUser;
      if (!newUser) {
        newUser = await tx.user.create({
          data: {
            identifier: staffIdentifier,
            email: cleanEmail,
            phone: cleanPhone,
            passwordHash: passwordHash,
            roleId: teacherRole.id,
            isFirstLogin: true,
          },
        });
      }

      return await tx.staff.create({
        data: {
          userId: newUser.id,
          empId: empId,
          firstName,
          lastName,
          gender: gender || 'Other',
          dob: new Date(dob || '1990-01-01'),
          designation: validDesignation,
          joinDate: joinDate ? new Date(joinDate) : new Date(),
          departmentId: validDeptId,
          phone,
          email,
          address: address || 'Bhavnagar, Gujarat',
          photoUrl: photoAsset ? photoAsset.photoUrl : (req.body.photoUrl || null),
        },
        include: { department: true },
      });
    });

    // Non-blocking notification dispatch
    if (phone) {
      sendSMS(phone, `Welcome to DJMHS High School! Your Faculty Portal ID is ${email || empId} and password is ${defaultPassword}. Please change password on first login.`).catch(() => {});
    }
    if (email) {
      sendEmail(email, 'DJMHS High School - Faculty Onboarding Credentials', `<p>Welcome <strong>${firstName} ${lastName}</strong> to DJMHS High School Faculty team. Login identifier: <strong>${email}</strong> | Password: <strong>${defaultPassword}</strong></p>`).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: `Staff member onboarded successfully! Employee ID: ${empId}. Login credentials transmitted via SMS/Email.`,
      data: newStaff,
    });
  } catch (err) {
    next(err);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      gender,
      dob,
      designation,
      departmentId,
      phone,
      email,
      address,
      joinDate,
      employmentType,
      photoUrl,
    } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (gender) updateData.gender = gender;
    if (dob) updateData.dob = new Date(dob);
    if (designation) updateData.designation = mapDesignation(designation);
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (joinDate) updateData.joinDate = new Date(joinDate);
    if (employmentType) updateData.employmentType = employmentType;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;

    if (req.file) {
      const asset = await uploadMediaAsset(req.file.path, 'djmhs_staff');
      if (asset) updateData.photoUrl = asset.photoUrl;
    }

    if (departmentId) {
      const targetDept = await prisma.department.findFirst({
        where: { OR: [{ id: departmentId }, { name: { contains: departmentId, mode: 'insensitive' } }] },
      });
      if (targetDept) {
        updateData.department = { connect: { id: targetDept.id } };
      }
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: { department: true },
    });

    res.status(200).json({ success: true, message: 'Staff personnel profile updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * Soft delete / Deactivate staff member per PRD Chapter 3.12
 */
const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return res.status(404).json({ success: false, error: 'Not found' });

    await prisma.$transaction(async (tx) => {
      // Set staff soft delete timestamp
      await tx.staff.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      // Set user account inactive & soft delete timestamp
      await tx.user.update({
        where: { id: staff.userId },
        data: { isActive: false, deletedAt: new Date() },
      });
      // Revoke any active device sessions immediately
      await tx.session.deleteMany({ where: { userId: staff.userId } });
    });

    res.status(200).json({ success: true, message: 'Staff member deactivated successfully and active logins terminated.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk Excel Partial-Success Import for Staff per PRD Chapter 3.15
 */
const bulkImportStaff = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File Required', message: 'Please upload a valid Excel spreadsheet for processing.' });
    }

    const { validRows, failedRows } = await parseStaffBulkImport(req.file.path);
    const successfullyCreated = [];
    const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });
    const defaultPasswordHash = await hashPassword('Password@123');

    for (const row of validRows) {
      try {
        let dept = await prisma.department.findFirst({
          where: { name: { contains: row.departmentName, mode: 'insensitive' } },
        });
        if (!dept) {
          dept = await prisma.department.create({ data: { name: row.departmentName, description: `${row.departmentName} Wing` } });
        }

        const count = await prisma.staff.count();
        const empId = `DJMHS-EMP-${(count + 1 + successfullyCreated.length).toString().padStart(4, '0')}`;

        const created = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: { identifier: row.email, email: row.email, phone: row.phone, passwordHash: defaultPasswordHash, roleId: teacherRole.id, isFirstLogin: true },
          });
          return await tx.staff.create({
            data: {
              userId: user.id,
              empId,
              firstName: row.firstName,
              lastName: row.lastName,
              gender: row.gender,
              dob: row.dob,
              designation: row.designation,
              departmentId: dept.id,
              phone: row.phone,
              email: row.email,
              address: row.address,
            },
          });
        });
        successfullyCreated.push(created);
      } catch (e) {
        failedRows.push({ rowNumber: 'Data Row', email: row.email, reason: e.message });
      }
    }

    // Clean up temporary uploaded spreadsheet file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: `Bulk evaluation completed. Imported ${successfullyCreated.length} staff records successfully.`,
      data: {
        successCount: successfullyCreated.length,
        failedCount: failedRows.length,
        failedRows: failedRows,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  bulkImportStaff,
};

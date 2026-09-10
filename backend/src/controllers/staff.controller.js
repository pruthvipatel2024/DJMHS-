const prisma = require('../config/db');
const { hashPassword } = require('../utils/password.utils');
const { sendEmail, sendSMS } = require('../services/communication.service');
const { getStaffOnboardingTemplate } = require('../services/emailTemplate.service');
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

    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined' && departmentId.trim() !== '') {
      where.departmentId = departmentId;
    }
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
        try {
          const count = await prisma.staff.count();
          const empId = `DJMHS-EMP-${(count + 1 + Math.floor(Math.random() * 100)).toString().padStart(4, '0')}`;
          const cleanId = (u.email || u.identifier || 'faculty.member').split('@')[0];
          const parts = cleanId.split('.');
          const firstName = parts[0] ? (parts[0].charAt(0).toUpperCase() + parts[0].slice(1)) : 'Faculty';
          const lastName = parts[1] ? (parts[1].charAt(0).toUpperCase() + parts[1].slice(1)) : 'Member';
          const uniquePhone = u.phone || `98${Math.floor(10000000 + Math.random() * 90000000)}`;

          await prisma.staff.create({
            data: {
              userId: u.id,
              empId,
              firstName,
              lastName,
              gender: 'Male',
              dob: new Date('1990-01-01'),
              designation: u.roleId === teacherRoles.find(r => r.name === 'ADMIN')?.id ? 'PRINCIPAL' : 'TEACHER',
              joinDate: new Date(),
              departmentId: defaultDept.id,
              email: u.email || `${cleanId}.${Math.floor(100 + Math.random() * 900)}@sdjmt.edu.in`,
              phone: uniquePhone,
              address: 'Bhavnagar, Gujarat',
            },
          });
        } catch (err) {
          console.warn('[Staff Reconcile] Notice:', err.message);
        }
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

    const cleanFirstName = firstName ? String(firstName).trim() : '';
    const cleanLastName = lastName ? String(lastName).trim() : '';
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanAddress = address ? String(address).trim() : 'Bhavnagar, Gujarat';

    if (!cleanFirstName || cleanFirstName.length < 2) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'First name must be at least 2 characters.' });
    }
    if (!cleanLastName || cleanLastName.length < 2) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Last name must be at least 2 characters.' });
    }
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9 (e.g. 9825012345).' });
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Please provide a valid email address.' });
    }

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
            isActive: true,
          },
        });
      } else {
        // When user already exists, update their contact & status without overwriting their existing passwordHash or isFirstLogin
        newUser = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            identifier: cleanEmail || existingUser.identifier || empId,
            email: cleanEmail || existingUser.email,
            phone: cleanPhone || existingUser.phone,
            roleId: teacherRole.id,
            isActive: true,
            deletedAt: null,
            isLocked: false,
            lockUntil: null,
            failedLoginAttempts: 0,
          },
        });
      }

      // Check if staff profile already exists
      const existingStaffProfile = await tx.staff.findFirst({
        where: {
          OR: [
            { userId: newUser.id },
            { empId: empId },
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ],
        },
      });

      if (existingStaffProfile) {
        return await tx.staff.update({
          where: { id: existingStaffProfile.id },
          data: {
            userId: newUser.id,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            gender: gender || 'Other',
            dob: new Date(dob || '1990-01-01'),
            designation: validDesignation,
            joinDate: joinDate ? new Date(joinDate) : new Date(),
            departmentId: validDeptId,
            phone: cleanPhone,
            email: cleanEmail,
            address: cleanAddress,
            photoUrl: photoAsset ? photoAsset.photoUrl : (req.body.photoUrl || existingStaffProfile.photoUrl || null),
            deletedAt: null,
          },
          include: { department: true },
        });
      }

      return await tx.staff.create({
        data: {
          userId: newUser.id,
          empId: empId,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          gender: gender || 'Other',
          dob: new Date(dob || '1990-01-01'),
          designation: validDesignation,
          joinDate: joinDate ? new Date(joinDate) : new Date(),
          departmentId: validDeptId,
          phone: cleanPhone,
          email: cleanEmail,
          address: cleanAddress,
          photoUrl: photoAsset ? photoAsset.photoUrl : (req.body.photoUrl || null),
        },
        include: { department: true },
      });
    });

    // Non-blocking notification dispatch with HTML email template
    if (cleanPhone) {
      sendSMS(cleanPhone, `Welcome to DJMHS High School! Your Faculty Portal ID is ${cleanEmail || empId} and password is ${defaultPassword}. Please change password on first login.`).catch(() => {});
    }
    if (cleanEmail) {
      const htmlBody = getStaffOnboardingTemplate({
        staffName: `${cleanFirstName} ${cleanLastName}`,
        empId,
        designation: validDesignation,
        department: newStaff.department?.name || 'Commerce Department',
        email: cleanEmail,
        initialPassword: defaultPassword,
      });
      sendEmail(cleanEmail, 'DJMHS High School — Faculty Onboarding Credentials', htmlBody)
        .then((res) => {
          if (res && res.success) {
            console.log(`[Staff Onboarding] Email successfully dispatched to ${cleanEmail} (Message ID: ${res.messageId})`);
          } else {
            console.warn(`[Staff Onboarding] Email dispatch notice for ${cleanEmail}:`, res?.error || res);
          }
        })
        .catch((err) => {
          console.error(`[Staff Onboarding] Failed to dispatch onboarding email to ${cleanEmail}:`, err.message);
        });
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

    const staffRecord = await prisma.staff.findUnique({ where: { id } });
    if (!staffRecord) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Staff personnel record not found.' });
    }

    const updateData = {};
    if (firstName) {
      const cleanFirstName = String(firstName).trim();
      if (cleanFirstName.length < 2) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'First name must be at least 2 characters.' });
      }
      updateData.firstName = cleanFirstName;
    }

    if (lastName) {
      const cleanLastName = String(lastName).trim();
      if (cleanLastName.length < 2) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Last name must be at least 2 characters.' });
      }
      updateData.lastName = cleanLastName;
    }

    if (gender) updateData.gender = gender;
    if (dob) updateData.dob = new Date(dob);
    if (designation) updateData.designation = mapDesignation(designation);

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9 (e.g. 9825012345).' });
      }
      updateData.phone = cleanPhone;
    }

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ success: false, error: 'Validation Error', message: 'Please provide a valid email address.' });
      }
      updateData.email = cleanEmail;
    }

    if (address !== undefined) updateData.address = address ? String(address).trim() : '';
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

    const updated = await prisma.$transaction(async (tx) => {
      const updatedStaff = await tx.staff.update({
        where: { id },
        data: updateData,
        include: { department: true },
      });

      // Keep user login credentials & phone in sync
      if (staffRecord.userId && (updateData.email || updateData.phone)) {
        await tx.user.update({
          where: { id: staffRecord.userId },
          data: {
            ...(updateData.email ? { email: updateData.email, identifier: updateData.email } : {}),
            ...(updateData.phone ? { phone: updateData.phone } : {}),
          },
        }).catch(() => {});
      }

      return updatedStaff;
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

/**
 * Export Staff & Faculty directory to Excel workbook
 */
const exportStaffToExcel = async (req, res, next) => {
  try {
    const { departmentId, designation, search } = req.query;
    const where = { deletedAt: null };

    if (departmentId && departmentId !== 'all' && departmentId !== 'undefined' && departmentId.trim() !== '') {
      where.departmentId = departmentId;
    }
    if (designation && designation !== 'all' && designation !== 'undefined' && designation.trim() !== '') {
      where.designation = designation;
    }
    if (search && search.trim() !== '') {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { empId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const staffList = await prisma.staff.findMany({
      where,
      include: {
        department: true,
        user: { include: { role: true } },
      },
      orderBy: [{ department: { name: 'asc' } }, { firstName: 'asc' }],
    });

    const columns = [
      { header: 'Employee ID', key: 'empId' },
      { header: 'Full Name', key: 'name' },
      { header: 'Designation', key: 'designation' },
      { header: 'Department', key: 'department' },
      { header: 'Phone Number', key: 'phone' },
      { header: 'Email Address', key: 'email' },
      { header: 'Gender', key: 'gender' },
      { header: 'Date of Birth', key: 'dob' },
      { header: 'Joining Date', key: 'joinDate' },
      { header: 'Employment Type', key: 'employmentType' },
      { header: 'Residential Address', key: 'address' },
      { header: 'Account Status', key: 'status' },
    ];

    const rows = staffList.map((s) => ({
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
    }));

    const buffer = await exportToExcel('Staff Directory', columns, rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="DJMHS_Staff_Roster_${Date.now()}.xlsx"`);
    res.send(buffer);
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
  exportStaffToExcel,
};

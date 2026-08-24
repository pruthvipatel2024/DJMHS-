const prisma = require('../config/db');
const { hashPassword } = require('../utils/password.utils');
const { sendEmail, sendSMS } = require('../services/communication.service');
const { getStudentAdmissionTemplate } = require('../services/emailTemplate.service');
const { parseStudentBulkImport, exportToExcel } = require('../services/excel.service');
const { uploadMediaAsset } = require('../services/cloudinary.service');
const fs = require('fs');

/**
 * Get all active students with division, standard, and parent connections
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { divisionId, standardId, search } = req.query;
    const where = { status: 'ACTIVE', deletedAt: null };

    if (divisionId && divisionId !== 'all' && divisionId !== 'undefined' && divisionId.trim() !== '') {
      where.divisionId = divisionId;
    } else if (standardId && standardId !== 'all' && standardId !== 'undefined' && standardId.trim() !== '') {
      where.division = { standardId: standardId };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { grNumber: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search } },
      ];
    }

    // Auto-reconcile any unlinked STUDENT User records so 100% of student users appear
    const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (studentRole) {
      const unlinkedStudentUsers = await prisma.user.findMany({
        where: {
          roleId: studentRole.id,
          deletedAt: null,
          studentProfile: null,
        },
      });

      if (unlinkedStudentUsers.length > 0) {
        let defaultDiv = await prisma.division.findFirst();
        if (defaultDiv) {
          for (const u of unlinkedStudentUsers) {
            const count = await prisma.student.count();
            const grNumber = `DJMHS-GR-${(count + 1).toString().padStart(6, '0')}`;
            const cleanId = (u.email || u.identifier || 'enrolled.student').split('@')[0];
            const parts = cleanId.split('.');
            const firstName = parts[0] ? (parts[0].charAt(0).toUpperCase() + parts[0].slice(1)) : 'Enrolled';
            const lastName = parts[1] ? (parts[1].charAt(0).toUpperCase() + parts[1].slice(1)) : 'Student';

            await prisma.student.create({
              data: {
                userId: u.id,
                grNumber,
                rollNumber: String(count + 1),
                firstName,
                lastName,
                gender: 'Male',
                dob: new Date('2010-01-01'),
                divisionId: defaultDiv.id,
              },
            }).catch(() => {});
          }
        }
      }
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        division: { include: { standard: true } },
        parents: { include: { parent: { include: { user: { select: { phone: true, email: true } } } } } },
        user: { select: { isActive: true, email: true } },
      },
      orderBy: [{ division: { name: 'asc' } }, { rollNumber: 'asc' }],
    });

    res.status(200).json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single student profile by ID with academic history and fee status
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        division: { include: { standard: true } },
        parents: { include: { parent: { include: { user: true } } } },
        feeInstallments: true,
        promotions: {
          include: {
            academicYear: true,
            fromDivision: { include: { standard: true } },
            toDivision: { include: { standard: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Not Found', message: 'Requested student GR record does not exist.' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

/**
 * Onboard Student with automatic GR Number generation and Multi-Child Parent linkage
 */
const createStudent = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      dob,
      divisionId,
      rollNumber,
      bloodGroup,
      address,
      parentFirstName,
      parentLastName,
      parentPhone,
      parentEmail,
      relationship,
    } = req.body;

    // 1. Auto-generate General Register Number: DJMHS-GR-XXXXXX per PRD Chapter 3.5 & Chapter 8
    let count = await prisma.student.count();
    let nextCount = count + 1;
    let grNumber = `DJMHS-GR-${nextCount.toString().padStart(6, '0')}`;
    let existingStudent = await prisma.student.findUnique({ where: { grNumber } });
    while (existingStudent) {
      nextCount++;
      grNumber = `DJMHS-GR-${nextCount.toString().padStart(6, '0')}`;
      existingStudent = await prisma.student.findUnique({ where: { grNumber } });
    }

    const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    const parentRole = await prisma.role.findUnique({ where: { name: 'PARENT' } });
    const defaultPassword = 'Password@123';
    const passwordHash = await hashPassword(defaultPassword);

    let photoAsset = null;
    if (req.file) {
      photoAsset = await uploadMediaAsset(req.file.path, 'djmhs_students');
    }

    let validDivisionId = divisionId;
    let targetDivision = null;
    if (divisionId) {
      targetDivision = await prisma.division.findFirst({
        where: { OR: [{ id: divisionId }, { name: divisionId }] },
      });
    }
    if (!targetDivision) {
      targetDivision = await prisma.division.findFirst({ include: { standard: true } });
    }
    if (targetDivision) validDivisionId = targetDivision.id;

    // Auto-compute unique roll number for target division
    let targetRoll = rollNumber ? String(rollNumber).trim() : '';
    if (!targetRoll) {
      const maxRollStudent = await prisma.student.findFirst({
        where: { divisionId: validDivisionId, status: 'ACTIVE', deletedAt: null },
        orderBy: { rollNumber: 'desc' },
        select: { rollNumber: true },
      });
      let maxVal = 0;
      if (maxRollStudent && maxRollStudent.rollNumber) {
        const p = parseInt(maxRollStudent.rollNumber, 10);
        if (!isNaN(p)) maxVal = p;
      }
      targetRoll = String(maxVal + 1);
    }
    let rollExists = await prisma.student.findFirst({
      where: { divisionId: validDivisionId, rollNumber: targetRoll, status: 'ACTIVE', deletedAt: null },
    });
    if (rollExists) {
      let rVal = parseInt(targetRoll, 10) || 1;
      while (rollExists) {
        rVal++;
        targetRoll = String(rVal);
        rollExists = await prisma.student.findFirst({
          where: { divisionId: validDivisionId, rollNumber: targetRoll, status: 'ACTIVE', deletedAt: null },
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create Student User profile
      const studentUser = await tx.user.create({
        data: {
          identifier: grNumber,
          passwordHash: passwordHash,
          roleId: studentRole.id,
          isFirstLogin: true,
        },
      });

      // Create Student profile
      const student = await tx.student.create({
        data: {
          userId: studentUser.id,
          grNumber,
          rollNumber: targetRoll,
          firstName,
          lastName,
          gender: gender || 'Male',
          dob: new Date(dob || '2010-01-01'),
          bloodGroup,
          divisionId: validDivisionId,
          photoUrl: photoAsset ? photoAsset.photoUrl : (req.body.photoUrl || null),
        },
        include: { division: { include: { standard: true } } },
      });

      // 2. Multi-Child Parent Linkage Logic per PRD Chapter 4 & 9
      let parent = null;
      let isNewParent = false;
      if (parentPhone || parentEmail) {
        parent = await tx.parent.findFirst({
          where: {
            OR: [
              ...(parentPhone ? [{ phone: parentPhone }] : []),
              ...(parentEmail ? [{ email: parentEmail }] : [])
            ]
          },
        });
      }

      if (!parent) {
        isNewParent = true;
        const cleanPhone = (parentPhone && parentPhone.trim()) ? parentPhone.trim() : null;
        const cleanEmail = (parentEmail && parentEmail.trim()) ? parentEmail.trim() : null;
        const pIdentifier = cleanEmail || cleanPhone || `parent_${grNumber.toLowerCase()}`;

        let existingParentUser = await tx.user.findFirst({
          where: {
            OR: [
              { identifier: pIdentifier },
              ...(cleanEmail ? [{ email: cleanEmail }] : []),
              ...(cleanPhone ? [{ phone: cleanPhone }] : [])
            ]
          }
        });

        let parentUserId = existingParentUser ? existingParentUser.id : null;
        if (!parentUserId) {
          const parentUser = await tx.user.create({
            data: {
              identifier: pIdentifier,
              email: cleanEmail,
              phone: cleanPhone,
              passwordHash: passwordHash,
              roleId: parentRole.id,
              isFirstLogin: true,
            },
          });
          parentUserId = parentUser.id;
        }

        const parentFullName = [parentFirstName, parentLastName].filter(Boolean).join(' ') || 'Guardian';
        const rel = (relationship || 'Father').trim();
        const relLower = rel.toLowerCase();
        const isMother = relLower === 'mother';
        const isGuardian = relLower === 'guardian';

        parent = await tx.parent.create({
          data: {
            userId: parentUserId,
            fatherName: (!isMother && !isGuardian) ? parentFullName : (parentFirstName || 'Father'),
            motherName: isMother ? parentFullName : null,
            guardianName: isGuardian ? parentFullName : null,
            phone: cleanPhone,
            email: cleanEmail,
            address: address || 'Bhavnagar, Gujarat',
            relationship: rel,
          },
        });
      }

      // Link student and parent
      await tx.studentParentMapping.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          relationship: relationship || 'Father',
          isPrimary: true,
        },
      });

      return { student, parent, isNewParent };
    });

    // Non-blocking notification dispatches
    if (parentPhone) {
      sendSMS(
        parentPhone,
        `DJMHS High School Admission Confirmed for ${firstName} ${lastName}! GR No: ${grNumber}. Parent Portal Login ID: ${parentEmail || parentPhone}, Password: ${defaultPassword}.`
      ).catch(() => {});
    }
    if (parentEmail) {
      const htmlBody = getStudentAdmissionTemplate({
        studentName: `${firstName} ${lastName}`,
        grNumber,
        standardName: targetDiv?.standard?.name || 'Commerce Stream',
        divisionName: targetDiv?.name || 'A',
        parentName: parentFirstName ? `${parentFirstName} ${parentLastName || ''}` : 'Parent/Guardian',
        loginIdentifier: parentEmail || grNumber,
        initialPassword: defaultPassword,
      });
      sendEmail(
        parentEmail,
        'DJMHS High School — Student Admission & Parent Portal Access Credentials',
        htmlBody
      ).catch((e) => console.error('Admission Email Error:', e.message));
    }

    res.status(201).json({
      success: true,
      message: `Student enrolled successfully! GR Number: ${grNumber}. Linked to guardian profile.`,
      data: result.student,
    });
  } catch (err) {
    next(err);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      gender,
      dob,
      bloodGroup,
      divisionId,
      rollNumber,
      allergies,
      emergencyContact,
      photoUrl,
      parentFirstName,
      parentLastName,
      parentPhone,
      parentEmail,
      relationship,
      address,
    } = req.body;

    const studentData = {};
    if (firstName) studentData.firstName = firstName;
    if (lastName) studentData.lastName = lastName;
    if (gender) studentData.gender = gender;
    if (dob) studentData.dob = new Date(dob);
    if (bloodGroup !== undefined) studentData.bloodGroup = bloodGroup || null;
    if (rollNumber) studentData.rollNumber = rollNumber;
    if (allergies !== undefined) studentData.allergies = allergies || null;
    if (emergencyContact !== undefined) studentData.emergencyContact = emergencyContact || null;
    if (photoUrl !== undefined) studentData.photoUrl = photoUrl || null;

    if (req.file) {
      const asset = await uploadMediaAsset(req.file.path, 'djmhs_students');
      if (asset) studentData.photoUrl = asset.photoUrl;
    }

    if (divisionId) {
      const targetDiv = await prisma.division.findFirst({
        where: { OR: [{ id: divisionId }, { name: { contains: divisionId, mode: 'insensitive' } }] },
      });
      if (targetDiv) {
        studentData.division = { connect: { id: targetDiv.id } };
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedStudent = await tx.student.update({
        where: { id },
        data: studentData,
        include: {
          division: { include: { standard: true } },
          parents: { include: { parent: true } },
        },
      });

      const parentMapping = updatedStudent.parents?.[0];
      if (parentMapping?.parentId) {
        const parentFullName = [parentFirstName, parentLastName].filter(Boolean).join(' ');
        const rel = (relationship || parentMapping.relationship || 'Father').trim();
        const isMother = rel.toLowerCase() === 'mother';
        const isGuardian = rel.toLowerCase() === 'guardian';

        const parentUpdateData = {};
        if (parentFullName) {
          if (isMother) parentUpdateData.motherName = parentFullName;
          else if (isGuardian) parentUpdateData.guardianName = parentFullName;
          else parentUpdateData.fatherName = parentFullName;
        }
        if (parentPhone) parentUpdateData.phone = parentPhone;
        if (parentEmail !== undefined) parentUpdateData.email = parentEmail || null;
        if (address !== undefined) parentUpdateData.address = address || null;
        if (rel) parentUpdateData.relationship = rel;

        if (Object.keys(parentUpdateData).length > 0) {
          await tx.parent.update({
            where: { id: parentMapping.parentId },
            data: parentUpdateData,
          });
        }

        if (rel) {
          await tx.studentParentMapping.updateMany({
            where: { studentId: id, parentId: parentMapping.parentId },
            data: { relationship: rel },
          });
        }
      }

      return updatedStudent;
    });

    res.status(200).json({ success: true, message: 'Student record updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * Soft Delete / Withdraw student from institution
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ success: false, error: 'Not found' });

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: { status: 'DEACTIVATED', deletedAt: new Date() },
      });
      await tx.user.update({
        where: { id: student.userId },
        data: { isActive: false, deletedAt: new Date() },
      });
      await tx.session.deleteMany({ where: { userId: student.userId } });
    });

    res.status(200).json({ success: true, message: 'Student withdrawn from institutional roster and active login sessions revoked.' });
  } catch (err) {
    next(err);
  }
};

/**
 * End-of-Year Academic Promotion Engine per PRD Chapter 4 & 8
 * Promotes a cohort of students from a source division to a target division
 */
const promoteStudents = async (req, res, next) => {
  try {
    const { studentIds, targetDivisionId, academicYearId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No Students Specified', message: 'Please select at least one student for grade promotion.' });
    }
    if (!targetDivisionId) {
      return res.status(400).json({ success: false, error: 'Target Required', message: 'Target standard division must be designated.' });
    }

    const targetDivision = await prisma.division.findUnique({
      where: { id: targetDivisionId },
      include: { standard: true },
    });

    if (!targetDivision) {
      return res.status(404).json({ success: false, error: 'Division Not Found', message: 'Target academic division does not exist.' });
    }

    let currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    const activeYearId = academicYearId || currentYear?.id;

    let promotedCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const stdId of studentIds) {
        const currentStudent = await tx.student.findUnique({
          where: { id: stdId },
          include: { division: true },
        });
        if (!currentStudent) continue;

        // Archive previous standard in StudentAcademicHistory per PRD Chapter 4
        if (currentStudent.divisionId && activeYearId) {
          await tx.studentAcademicHistory.create({
            data: {
              studentId: stdId,
              academicYearId: activeYearId,
              standardId: currentStudent.division.standardId,
              divisionName: currentStudent.division.name,
              finalStatus: 'PROMOTED',
            },
          });
        }

        // Migrate student to new division
        await tx.student.update({
          where: { id: stdId },
          data: {
            divisionId: targetDivisionId,
            status: 'ACTIVE',
          },
        });
        promotedCount++;
      }
    });

    res.status(200).json({
      success: true,
      message: `Academic promotion complete! ${promotedCount} students successfully promoted into ${targetDivision.standard.name} (Division ${targetDivision.name}).`,
      data: { promotedCount, targetDivision },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Preview Excel Student Import with validation, duplicate detection, and ImportJob logging
 */
const previewStudentImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No File Uploaded', message: 'Please upload an Excel (.xlsx) file.' });
    }

    const preview = await parseStudentBulkImport(req.file.path, req.user.id);

    // Clean up temporary file
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Excel workbook parsed and validated successfully.',
      data: preview,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Confirm and execute student bulk import via PostgreSQL transaction
 */
const confirmStudentImport = async (req, res, next) => {
  try {
    const { importJobId, rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No Rows', message: 'No valid rows provided for import.' });
    }

    const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    const parentRole = await prisma.role.findUnique({ where: { name: 'PARENT' } });
    const defaultPasswordHash = await hashPassword('Password@123');

    let importedCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        // Generate GR Number if not provided
        let grNumber = row.grNumber;
        if (!grNumber) {
          const totalCount = await tx.student.count();
          grNumber = `DJMHS-GR-${(totalCount + importedCount + 1).toString().padStart(6, '0')}`;
        }

        // Create student user
        const studentUser = await tx.user.create({
          data: {
            identifier: grNumber,
            email: `${grNumber.toLowerCase()}@sdjmt-student.edu.in`,
            passwordHash: defaultPasswordHash,
            roleId: studentRole.id,
            isActive: true,
            isFirstLogin: true,
          },
        });

        // Create student record
        const student = await tx.student.create({
          data: {
            userId: studentUser.id,
            grNumber,
            rollNumber: row.rollNumber || '01',
            firstName: row.firstName,
            lastName: row.lastName || '',
            gender: row.gender || 'Male',
            dob: new Date(row.dobStr || '2010-01-01'),
            divisionId: row.divisionId,
            status: 'ACTIVE',
          },
        });

        // Parent linkage
        if (row.parentPhone) {
          let parentUser = await tx.user.findFirst({
            where: { phone: row.parentPhone },
          });

          let parentRecord;
          if (!parentUser) {
            parentUser = await tx.user.create({
              data: {
                identifier: row.parentPhone,
                phone: row.parentPhone,
                email: row.parentEmail || null,
                passwordHash: defaultPasswordHash,
                roleId: parentRole.id,
                isActive: true,
              },
            });

            parentRecord = await tx.parent.create({
              data: {
                userId: parentUser.id,
                fatherName: row.fatherName || 'Guardian',
                motherName: row.motherName || '',
                phone: row.parentPhone,
                email: row.parentEmail || null,
                address: row.address || 'Bhavnagar, Gujarat',
              },
            });
          } else {
            parentRecord = await tx.parent.findUnique({
              where: { userId: parentUser.id },
            });
          }

          if (parentRecord) {
            await tx.studentParentMapping.create({
              data: {
                studentId: student.id,
                parentId: parentRecord.id,
                isPrimary: true,
              },
            });
          }
        }

        importedCount++;
      }

      // Update ImportJob status if ID provided
      if (importJobId) {
        await tx.importJob.update({
          where: { id: importJobId },
          data: {
            status: 'COMPLETED',
            successCount: importedCount,
          },
        });
      }
    });

    res.status(200).json({
      success: true,
      message: `Bulk import completed! ${importedCount} students successfully onboarded to PostgreSQL General Register.`,
      data: { importedCount },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Export Students to Excel dynamically from PostgreSQL
 */
const exportStudentsToExcel = async (req, res, next) => {
  try {
    const { standardId, divisionId, gender, status, search } = req.query;
    const where = { deletedAt: null };

    if (status) where.status = status;
    else where.status = 'ACTIVE';

    if (gender) where.gender = gender;
    if (divisionId) where.divisionId = divisionId;
    else if (standardId) where.division = { standardId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { grNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        division: { include: { standard: true } },
        parents: { include: { parent: true } },
      },
      orderBy: [{ division: { name: 'asc' } }, { rollNumber: 'asc' }],
    });

    const columns = [
      { header: 'GR Number', key: 'grNumber', width: 18 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Gender', key: 'gender', width: 12 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Standard', key: 'standard', width: 20 },
      { header: 'Division', key: 'division', width: 12 },
      { header: 'Roll No', key: 'rollNumber', width: 10 },
      { header: 'Guardian Name', key: 'guardian', width: 25 },
      { header: 'Guardian Phone', key: 'phone', width: 18 },
      { header: 'Guardian Email', key: 'email', width: 25 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    const rows = students.map((s) => {
      const primaryParent = s.parents?.find((p) => p.isPrimary)?.parent || s.parents?.[0]?.parent;
      return {
        grNumber: s.grNumber,
        name: `${s.firstName} ${s.lastName}`,
        gender: s.gender,
        dob: s.dob ? new Date(s.dob).toISOString().split('T')[0] : '',
        standard: s.division?.standard?.name || 'N/A',
        division: s.division?.name || 'A',
        rollNumber: s.rollNumber,
        guardian: primaryParent ? `${primaryParent.fatherName || primaryParent.guardianName || 'Guardian'}` : 'N/A',
        phone: primaryParent?.phone || 'N/A',
        email: primaryParent?.email || 'N/A',
        status: s.status,
      };
    });

    const buffer = await exportToExcel('Students Roster', columns, rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="DJMHS_Students_Export_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  promoteStudents,
  previewStudentImport,
  confirmStudentImport,
  exportStudentsToExcel,
};

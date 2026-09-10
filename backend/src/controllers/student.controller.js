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
    }
    if (standardId && standardId !== 'all' && standardId !== 'undefined' && standardId.trim() !== '') {
      where.division = { ...(where.division || {}), standardId: standardId };
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
    if (firstName) studentData.firstName = firstName.trim();
    if (lastName) studentData.lastName = lastName.trim();
    if (gender) studentData.gender = gender;
    if (dob) {
      const parsedDob = new Date(dob);
      if (!isNaN(parsedDob.getTime())) {
        studentData.dob = parsedDob;
      }
    }
    if (bloodGroup !== undefined) studentData.bloodGroup = bloodGroup ? bloodGroup.trim() : null;
    if (rollNumber !== undefined) studentData.rollNumber = rollNumber ? String(rollNumber).trim() : '';
    if (allergies !== undefined) studentData.allergies = allergies ? allergies.trim() : null;
    if (emergencyContact !== undefined) studentData.emergencyContact = emergencyContact ? emergencyContact.trim() : null;
    if (photoUrl !== undefined) studentData.photoUrl = photoUrl || null;

    if (req.file) {
      const asset = await uploadMediaAsset(req.file.path, 'djmhs_students');
      if (asset) studentData.photoUrl = asset.photoUrl;
    }

    if (divisionId) {
      const targetDiv = await prisma.division.findFirst({
        where: { OR: [{ id: divisionId }, { name: divisionId }] },
      });
      if (targetDiv) {
        studentData.division = { connect: { id: targetDiv.id } };
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existingStudent = await tx.student.findUnique({
        where: { id },
        include: {
          parents: { include: { parent: { include: { user: true } } } },
        },
      });

      if (!existingStudent) {
        throw new Error('Student record not found.');
      }

      const updatedStudent = await tx.student.update({
        where: { id },
        data: studentData,
        include: {
          division: { include: { standard: true } },
          parents: { include: { parent: { include: { user: true } } } },
        },
      });

      const parentFullName = [parentFirstName, parentLastName].filter(Boolean).join(' ').trim();
      const cleanPhone = (parentPhone && parentPhone.trim()) ? parentPhone.trim() : null;
      const cleanEmail = (parentEmail && parentEmail.trim()) ? parentEmail.trim() : null;
      const cleanAddress = (address && address.trim()) ? address.trim() : null;
      const rel = (relationship || 'Father').trim();
      const isMother = rel.toLowerCase() === 'mother';
      const isGuardian = rel.toLowerCase() === 'guardian';

      const parentMapping = updatedStudent.parents?.[0];

      if (parentMapping?.parent) {
        const parentId = parentMapping.parentId;
        const parentRecord = parentMapping.parent;

        const parentUpdateData = {};
        if (parentFullName) {
          if (isMother) {
            parentUpdateData.motherName = parentFullName;
          } else if (isGuardian) {
            parentUpdateData.guardianName = parentFullName;
          } else {
            parentUpdateData.fatherName = parentFullName;
          }
        }
        if (cleanPhone) parentUpdateData.phone = cleanPhone;
        if (cleanEmail !== undefined) parentUpdateData.email = cleanEmail;
        if (cleanAddress !== undefined) parentUpdateData.address = cleanAddress;
        if (rel) parentUpdateData.relationship = rel;

        if (Object.keys(parentUpdateData).length > 0) {
          await tx.parent.update({
            where: { id: parentId },
            data: parentUpdateData,
          });
        }

        // Update Parent's User account if phone or email changed
        if (parentRecord.userId && (cleanPhone || cleanEmail)) {
          const userUpdateData = {};
          if (cleanPhone) {
            userUpdateData.phone = cleanPhone;
            if (!parentRecord.email && !cleanEmail) userUpdateData.identifier = cleanPhone;
          }
          if (cleanEmail) {
            userUpdateData.email = cleanEmail;
            userUpdateData.identifier = cleanEmail;
          }
          await tx.user.update({
            where: { id: parentRecord.userId },
            data: userUpdateData,
          }).catch((err) => console.warn('Parent user update warning:', err.message));
        }

        if (rel) {
          await tx.studentParentMapping.updateMany({
            where: { studentId: id, parentId },
            data: { relationship: rel },
          });
        }
      } else if (parentFullName || cleanPhone || cleanEmail || cleanAddress) {
        // No parent mapped yet: find or create Parent record
        let parent = null;
        if (cleanPhone || cleanEmail) {
          parent = await tx.parent.findFirst({
            where: {
              OR: [
                ...(cleanPhone ? [{ phone: cleanPhone }] : []),
                ...(cleanEmail ? [{ email: cleanEmail }] : []),
              ],
            },
          });
        }

        if (!parent) {
          const parentRole = await tx.role.findUnique({ where: { name: 'PARENT' } });
          const defaultPassword = 'Password@123';
          const defaultPasswordHash = await hashPassword(defaultPassword);
          const pIdentifier = cleanEmail || cleanPhone || `parent_${updatedStudent.grNumber.toLowerCase()}`;

          let existingParentUser = await tx.user.findFirst({
            where: {
              OR: [
                { identifier: pIdentifier },
                ...(cleanEmail ? [{ email: cleanEmail }] : []),
                ...(cleanPhone ? [{ phone: cleanPhone }] : []),
              ],
            },
          });

          let parentUserId = existingParentUser ? existingParentUser.id : null;
          if (!parentUserId && parentRole) {
            const parentUser = await tx.user.create({
              data: {
                identifier: pIdentifier,
                email: cleanEmail,
                phone: cleanPhone,
                passwordHash: defaultPasswordHash,
                roleId: parentRole.id,
                isActive: true,
                isFirstLogin: true,
              },
            });
            parentUserId = parentUser.id;
          }

          parent = await tx.parent.create({
            data: {
              userId: parentUserId,
              fatherName: (!isMother && !isGuardian) ? (parentFullName || 'Father') : null,
              motherName: isMother ? (parentFullName || 'Mother') : null,
              guardianName: isGuardian ? (parentFullName || 'Guardian') : null,
              phone: cleanPhone || `P-${Date.now()}`,
              email: cleanEmail,
              address: cleanAddress || 'Bhavnagar, Gujarat',
              relationship: rel,
            },
          });
        }

        // Link student and parent
        await tx.studentParentMapping.create({
          data: {
            studentId: id,
            parentId: parent.id,
            relationship: rel,
            isPrimary: true,
          },
        });
      }

      // Re-fetch complete updated student
      return tx.student.findUnique({
        where: { id },
        include: {
          division: { include: { standard: true } },
          parents: { include: { parent: { include: { user: true } } } },
        },
      });
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

    // Handle graduation / alumni archive special target
    const isGraduation = targetDivisionId === 'GRADUATED' || targetDivisionId === 'graduated_alumni';

    let targetDivision = null;
    if (!isGraduation) {
      targetDivision = await prisma.division.findFirst({
        where: {
          OR: [
            { id: targetDivisionId },
            { name: targetDivisionId },
          ],
        },
        include: { standard: true },
      });

      if (!targetDivision) {
        return res.status(404).json({ success: false, error: 'Division Not Found', message: 'Target academic division does not exist.' });
      }
    }

    let currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!currentYear) {
      currentYear = await prisma.academicYear.findFirst({ orderBy: { startDate: 'desc' } });
    }
    if (!currentYear) {
      currentYear = await prisma.academicYear.create({
        data: {
          name: '2026-2027',
          isCurrent: true,
          startDate: new Date('2026-06-01'),
          endDate: new Date('2027-04-30'),
        },
      });
    }
    const activeYearId = academicYearId || currentYear.id;

    let promotedCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const stdId of studentIds) {
        const currentStudent = await tx.student.findUnique({
          where: { id: stdId },
          include: { division: { include: { standard: true } } },
        });
        if (!currentStudent) continue;

        if (isGraduation) {
          if (currentStudent.divisionId && activeYearId) {
            await tx.studentAcademicHistory.create({
              data: {
                studentId: stdId,
                academicYearId: activeYearId,
                fromDivisionId: currentStudent.divisionId,
                toDivisionId: currentStudent.divisionId,
                promotionStatus: 'PROMOTED',
                remarks: 'Graduated / Alumni Archive (Standard 12 Completed)',
              },
            });
          }
          await tx.student.update({
            where: { id: stdId },
            data: { status: 'GRADUATED' },
          });
          promotedCount++;
        } else {
          // Resolve roll number conflict in destination division
          let targetRoll = currentStudent.rollNumber || '01';
          let rollConflict = await tx.student.findFirst({
            where: {
              divisionId: targetDivision.id,
              rollNumber: targetRoll,
              status: 'ACTIVE',
              deletedAt: null,
              id: { not: stdId },
            },
          });

          if (rollConflict) {
            const existingStudentsInDiv = await tx.student.findMany({
              where: {
                divisionId: targetDivision.id,
                status: 'ACTIVE',
                deletedAt: null,
                id: { not: stdId },
              },
              select: { rollNumber: true },
            });
            let maxVal = 0;
            existingStudentsInDiv.forEach((s) => {
              const p = parseInt(s.rollNumber, 10);
              if (!isNaN(p) && p > maxVal) maxVal = p;
            });
            targetRoll = String(maxVal + 1).padStart(2, '0');
          }

          // Archive previous standard in StudentAcademicHistory per PRD Chapter 4
          if (currentStudent.divisionId && activeYearId) {
            await tx.studentAcademicHistory.create({
              data: {
                studentId: stdId,
                academicYearId: activeYearId,
                fromDivisionId: currentStudent.divisionId,
                toDivisionId: targetDivision.id,
                promotionStatus: 'PROMOTED',
                remarks: `Promoted from ${currentStudent.division?.standard?.name || 'Previous Standard'} (Div ${currentStudent.division?.name || 'A'}) to ${targetDivision.standard?.name || 'Standard'} (Div ${targetDivision.name})`,
              },
            });
          }

          // Migrate student to new division
          await tx.student.update({
            where: { id: stdId },
            data: {
              divisionId: targetDivision.id,
              rollNumber: targetRoll,
              status: 'ACTIVE',
            },
          });
          promotedCount++;
        }
      }
    });

    // Record Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.identifier || 'ADMIN',
          action: isGraduation ? 'STUDENTS_GRADUATED' : 'STUDENTS_PROMOTED',
          entity: 'STUDENT',
          reason: isGraduation
            ? `Graduated ${promotedCount} students to alumni archive.`
            : `Promoted ${promotedCount} students into ${targetDivision.standard.name} (Division ${targetDivision.name}).`,
          ipAddress: req.ip || null,
        },
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: isGraduation
        ? `Academic cohort graduation complete! ${promotedCount} students migrated to alumni status.`
        : `Academic promotion complete! ${promotedCount} students successfully promoted into ${targetDivision.standard.name} (Division ${targetDivision.name}).`,
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

    if (status && status !== 'all' && status !== 'undefined' && status.trim() !== '') {
      where.status = status;
    }

    if (gender && gender !== 'all' && gender !== 'undefined' && gender.trim() !== '') {
      where.gender = gender;
    }

    if (divisionId && divisionId !== 'all' && divisionId !== 'undefined' && divisionId.trim() !== '') {
      where.divisionId = divisionId;
    } else if (standardId && standardId !== 'all' && standardId !== 'undefined' && standardId.trim() !== '') {
      where.division = { standardId };
    }

    if (search && search.trim() !== '') {
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
    ];

    const rows = students.map((s) => {
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

const prisma = require('../config/db');

/**
 * Normalizes GR Number format (e.g., '000001' or 'DJMHS-GR-000001')
 */
const normalizeGrNumber = (grNumber) => {
  if (!grNumber) return '';
  const trimmed = grNumber.trim();
  if (trimmed.toUpperCase().startsWith('DJMHS-GR-')) {
    return trimmed.toUpperCase();
  }
  return `DJMHS-GR-${trimmed.padStart(6, '0')}`;
};

/**
 * Resolves registered parent email address dynamically from PostgreSQL for a given GR Number.
 * Follows strict selection rules:
 * 1. Linked Parent with `isPrimary: true` and valid email.
 * 2. Any Linked Parent with valid email.
 * 3. Associated Student User Account email.
 */
const resolveStudentOtpRecipient = async (grNumber) => {
  const normalizedGr = normalizeGrNumber(grNumber);

  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { grNumber: normalizedGr },
        { grNumber: grNumber.trim() },
        { grNumber: { contains: grNumber.trim() } },
      ],
    },
    include: {
      parents: {
        include: {
          parent: {
            include: {
              user: true,
            },
          },
        },
      },
      user: true,
    },
  });

  if (!student) {
    return {
      success: false,
      code: 'STUDENT_NOT_FOUND',
      message: 'No student account was found for this GR number.',
    };
  }

  // Determine recipient deterministically
  const primaryParentMapping = student.parents?.find((p) => p.isPrimary && p.parent);
  let resolvedEmail = primaryParentMapping?.parent?.email || primaryParentMapping?.parent?.user?.email;
  let resolvedPhone = primaryParentMapping?.parent?.phone || primaryParentMapping?.parent?.user?.phone;
  let resolvedName = primaryParentMapping?.parent?.fatherName || primaryParentMapping?.parent?.motherName || `${student.firstName} ${student.lastName}`;

  // If no primary parent mapping with email, search any linked parent
  if (!resolvedEmail && student.parents?.length) {
    for (const mapping of student.parents) {
      if (mapping.parent) {
        const candidateEmail = mapping.parent.email || mapping.parent.user?.email;
        if (candidateEmail) {
          resolvedEmail = candidateEmail;
          resolvedPhone = mapping.parent.phone || mapping.parent.user?.phone;
          resolvedName = mapping.parent.fatherName || mapping.parent.motherName || resolvedName;
          break;
        }
      }
    }
  }

  // Fallback to student user email
  if (!resolvedEmail && student.user?.email) {
    resolvedEmail = student.user.email;
    resolvedPhone = student.user.phone;
  }

  // Email Validation & Normalization
  if (!resolvedEmail || typeof resolvedEmail !== 'string' || !resolvedEmail.includes('@')) {
    return {
      success: false,
      code: 'NO_REGISTERED_CONTACT',
      message: 'No valid registered parent email address is available for this student.',
    };
  }

  const normalizedEmail = resolvedEmail.trim().toLowerCase();

  return {
    success: true,
    grNumber: student.grNumber,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    recipientEmail: normalizedEmail,
    recipientPhone: resolvedPhone,
    recipientName: resolvedName,
    source: 'POSTGRESQL',
  };
};

module.exports = {
  normalizeGrNumber,
  resolveStudentOtpRecipient,
};

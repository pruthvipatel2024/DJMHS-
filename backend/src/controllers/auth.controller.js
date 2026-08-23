const prisma = require('../config/db');
const jwtUtils = require('../utils/jwt.utils');
const { getClientIp } = require('../utils/ip.utils');
const { comparePassword, hashPassword, checkPasswordComplexity } = require('../utils/password.utils');
const { sendOTP } = require('../services/communication.service');
const { requestStudentOtp, verifyStudentOtp } = require('../services/otp.service');

const login = async (req, res, next) => {
  try {
    const { identifier, password, rememberMe } = req.body;

    // Resolve user by Email, Phone, Employee ID, or GR Number per PRD Chapter 1.6.1
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { identifier: identifier },
          { email: identifier },
          { phone: identifier },
        ],
      },
      include: {
        role: true,
        staffProfile: { include: { department: true } },
        studentProfile: { include: { division: { include: { standard: true } } } },
        parentProfile: {
          include: {
            students: {
              include: {
                student: { include: { division: { include: { standard: true } } } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication Failed', message: 'Invalid institutional credentials entered.' });
    }

    // Account active check
    if (!user.isActive || user.deletedAt !== null) {
      return res.status(403).json({ success: false, error: 'Account Suspended', message: 'Please contact the school administrative office.' });
    }

    // Check account lockout status (5 consecutive failed attempts lock for 15 mins per PRD Chapter 1.8)
    if (user.isLocked && user.lockUntil && new Date(user.lockUntil) > new Date()) {
      const remainMinutes = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        error: 'Account Temporarily Locked',
        message: `Your account is temporarily locked due to repeated failed logins. Please try again after ${remainMinutes} minutes.`,
      });
    }

    // Verify Password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const newFailedCount = user.failedLoginAttempts + 1;
      let updateData = { failedLoginAttempts: newFailedCount };

      if (newFailedCount >= 5) {
        updateData.isLocked = true;
        updateData.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minute lockout
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData });

      // Record Failed Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          actorName: user.identifier,
          action: 'LOGIN_FAILED',
          entity: 'USER',
          entityId: user.id,
          reason: `Invalid password attempt (${newFailedCount}/5)`,
          ipAddress: getClientIp(req),
        },
      });

      return res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: newFailedCount >= 5
          ? 'Too many invalid attempts. Your account has been locked for 15 minutes.'
          : `Invalid institutional credentials. Attempt ${newFailedCount} of 5 before temporary lockout.`,
      });
    }

    // Reset failed login counts on successful authentication
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, isLocked: false, lockUntil: null },
    });

    // Check concurrent sessions (Admin/Staff limit 3, Student/Parent limit 5 per PRD Chapter 1.6.4)
    const activeSessions = await prisma.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    });

    const maxSessions = ['ADMIN', 'TEACHER'].includes(user.role.name) ? 3 : 5;
    if (activeSessions.length >= maxSessions) {
      // Evict the oldest active device session to maintain concurrent threshold
      const oldestSession = activeSessions[0];
      await prisma.session.delete({ where: { id: oldestSession.id } });
    }

    // Generate Tokens & Persist Session
    const payload = { sub: user.id, role: user.role.name, identifier: user.identifier };
    const token = jwtUtils.generateAccessToken(payload);
    const refreshToken = jwtUtils.generateRefreshToken(payload, rememberMe);

    const expiresDurationMs = rememberMe ? (30 * 24 * 60 * 60 * 1000) : (7 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(Date.now() + expiresDurationMs);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: token,
        refreshToken: refreshToken,
        device: req.headers['user-agent'] || 'Web Browser Client',
        ipAddress: getClientIp(req),
        expiresAt: expiresAt,
      },
    });

    // Record Success Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actorName: user.identifier,
        action: 'LOGIN_SUCCESS',
        entity: 'USER',
        entityId: user.id,
        ipAddress: getClientIp(req),
      },
    });

    // Clean sensitive properties before sending payload
    const { passwordHash, resetOtp, resetOtpExpiry, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      refreshToken,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }, { identifier: identifier }],
        deletedAt: null,
      },
      include: {
        staffProfile: true,
        studentProfile: {
          include: {
            parents: {
              include: { parent: { include: { user: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      // Generic success message to prevent user enumeration attacks
      return res.status(200).json({ success: true, message: 'If an active institutional account exists with this identifier, a verification OTP has been sent via SMS/Email.' });
    }

    // Generate 6 digit numeric OTP valid for 15 minutes per PRD Chapter 1.6.2
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetOtp: otp, resetOtpExpiry: expiry },
    });

    await sendOTP(user, otp);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actorName: user.identifier,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'USER',
        entityId: user.id,
        ipAddress: getClientIp(req),
      },
    });

    res.status(200).json({
      success: true,
      message: 'A 6-digit security OTP has been dispatched to your registered SMS/Email. Valid for 15 minutes.',
    });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }, { identifier: identifier }],
        deletedAt: null,
      },
    });

    if (!user || user.resetOtp !== otp || !user.resetOtpExpiry || new Date(user.resetOtpExpiry) < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or Expired OTP', message: 'The OTP entered is incorrect or has expired. Please request a new code.' });
    }

    const complexity = checkPasswordComplexity(newPassword);
    if (!complexity.valid) {
      return res.status(400).json({ success: false, error: 'Password Policy Violation', message: complexity.message });
    }

    const hashedPassword = await hashPassword(newPassword);

    // Update password, clear OTP, unlock account, set firstLogin false, and invalidate all existing active sessions per PRD Chapter 1.6.3
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetOtp: null,
        resetOtpExpiry: null,
        isLocked: false,
        lockUntil: null,
        failedLoginAttempts: 0,
        isFirstLogin: false,
      },
    });

    await prisma.session.deleteMany({ where: { userId: user.id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actorName: user.identifier,
        action: 'PASSWORD_RESET_COMPLETED',
        entity: 'USER',
        entityId: user.id,
        reason: 'Self-service OTP password recovery completed.',
        ipAddress: getClientIp(req),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset completed successfully! You may now sign in with your new credentials.',
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.sessionToken;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    res.status(200).json({ success: true, message: 'You have been logged out of this device successfully.' });
  } catch (err) {
    next(err);
  }
};

const logoutAllDevices = async (req, res, next) => {
  try {
    await prisma.session.deleteMany({ where: { userId: req.user.id } });
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actorName: req.user.identifier,
        action: 'LOGOUT_ALL_DEVICES',
        entity: 'USER',
        entityId: req.user.id,
        ipAddress: getClientIp(req),
      },
    });
    res.status(200).json({ success: true, message: 'All active device sessions have been successfully terminated.' });
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id, expiresAt: { gt: new Date() } },
      select: { id: true, device: true, ipAddress: true, createdAt: true, expiresAt: true, token: true },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = sessions.map(s => ({
      id: s.id,
      device: s.device,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrentDevice: s.token === req.sessionToken,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    await prisma.session.deleteMany({
      where: { id: sessionId, userId: req.user.id },
    });
    res.status(200).json({ success: true, message: 'Targeted device session terminated.' });
  } catch (err) {
    next(err);
  }
};

const firstTimeChangePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const complexity = checkPasswordComplexity(newPassword);
    if (!complexity.valid) {
      return res.status(400).json({ success: false, error: 'Password Policy Violation', message: complexity.message });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: hashedPassword, isFirstLogin: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actorName: req.user.identifier,
        action: 'FIRST_LOGIN_PASSWORD_CHANGED',
        entity: 'USER',
        entityId: req.user.id,
        ipAddress: getClientIp(req),
      },
    });

    res.status(200).json({ success: true, message: 'Your personal security password has been successfully established!' });
  } catch (err) {
    next(err);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

const requestStudentOtpController = async (req, res, next) => {
  try {
    const { grNumber } = req.body;
    if (!grNumber) {
      return res.status(400).json({ success: false, error: 'GR Required', message: 'Student General Register (GR) Number is required.' });
    }

    const cleanGr = String(grNumber).trim();
    const formattedGr = cleanGr.toUpperCase().startsWith('DJMHS-GR-')
      ? cleanGr.toUpperCase()
      : `DJMHS-GR-${cleanGr.replace(/^DJMHS-GR-/i, '').padStart(6, '0')}`;

    // Lookup student in PostgreSQL
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { grNumber: cleanGr },
          { grNumber: formattedGr },
          { grNumber: { equals: cleanGr, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      include: {
        parents: { include: { parent: { include: { user: true } } } },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student Not Found',
        message: `No active student found matching GR Number "${cleanGr}". Please verify your GR card.`,
      });
    }

    const primaryParent = student.parents?.find((p) => p.isPrimary)?.parent || student.parents?.[0]?.parent;
    const contact = {
      phone: primaryParent?.phone || primaryParent?.user?.phone,
      email: primaryParent?.email || primaryParent?.user?.email,
      studentName: `${student.firstName} ${student.lastName}`,
    };

    await requestStudentOtp(student.grNumber, contact);

    res.status(200).json({
      success: true,
      message: `Verification OTP dispatched to registered guardian contact (${contact.email || contact.phone || 'Email/SMS'}). Valid for 5 minutes.`,
    });
  } catch (err) {
    next(err);
  }
};

const verifyStudentOtpController = async (req, res, next) => {
  try {
    const { grNumber, otp } = req.body;
    if (!grNumber || !otp) {
      return res.status(400).json({ success: false, error: 'Incomplete Request', message: 'GR Number and OTP are required.' });
    }

    const cleanGr = String(grNumber).trim();
    const formattedGr = cleanGr.toUpperCase().startsWith('DJMHS-GR-')
      ? cleanGr.toUpperCase()
      : `DJMHS-GR-${cleanGr.replace(/^DJMHS-GR-/i, '').padStart(6, '0')}`;

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { grNumber: cleanGr },
          { grNumber: formattedGr },
          { grNumber: { equals: cleanGr, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
    });

    const canonicalGr = student ? student.grNumber : cleanGr;

    // Verify OTP using secure OTP service
    await verifyStudentOtp(canonicalGr, otp);

    // Retrieve Student user account from PostgreSQL
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { identifier: canonicalGr },
          { studentProfile: { grNumber: canonicalGr } },
          { id: student?.userId },
        ],
      },
      include: {
        role: true,
        studentProfile: { include: { division: { include: { standard: true } } } },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User Not Found', message: 'Student user record not found.' });
    }

    // Issue JWT Access & Refresh Token Session
    const tokenPayload = { sub: user.id, role: user.role.name, identifier: user.identifier };
    const accessToken = jwtUtils.generateAccessToken(tokenPayload);
    const refreshToken = jwtUtils.generateRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken: refreshToken,
        ipAddress: getClientIp(req),
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actorName: user.identifier,
        action: 'STUDENT_OTP_LOGIN_SUCCESS',
        entity: 'USER',
        entityId: user.id,
        ipAddress: getClientIp(req),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Student OTP authentication successful.',
      token: accessToken,
      refreshToken: refreshToken,
      user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  logout,
  logoutAllDevices,
  getSessions,
  revokeSession,
  firstTimeChangePassword,
  getCurrentUser,
  requestStudentOtpController,
  verifyStudentOtpController,
};

const jwtUtils = require('../utils/jwt.utils');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Missing or invalid authentication token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwtUtils.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Token Expired or Invalid', message: 'Please sign in again to continue.' });
    }

    // Verify session existence in database for immediate revocation capability
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            role: true,
            staffProfile: true,
            studentProfile: true,
            parentProfile: { include: { students: { include: { student: true } } } },
          },
        },
      },
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ success: false, error: 'Session Expired', message: 'Your session has ended. Please log back in.' });
    }

    const user = session.user;

    // Check account active status
    if (!user.isActive || user.deletedAt !== null) {
      return res.status(403).json({ success: false, error: 'Account Deactivated', message: 'Your account has been deactivated. Contact Administrator.' });
    }

    // Check temporary Account Lockout (5 consecutive failures lock for 15 min per PRD Chapter 1.8)
    if (user.isLocked && user.lockUntil && new Date(user.lockUntil) > new Date()) {
      const remainMinutes = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        error: 'Account Temporarily Locked',
        message: `Account is locked due to multiple failed login attempts. Try again in ${remainMinutes} minutes.`,
      });
    }

    // Check enforced password change on first login for Staff (Admin/Teacher) only
    const roleName = user.role?.name;
    const isStaffRole = roleName === 'ADMIN' || roleName === 'TEACHER';

    if (user.isFirstLogin && isStaffRole && !req.originalUrl.includes('/change-password') && !req.originalUrl.includes('/logout')) {
      return res.status(403).json({
        success: false,
        error: 'First Login Password Change Required',
        message: 'You must set a secure password on your first login before accessing ERP features.',
        code: 'FIRST_LOGIN_CHANGE_REQUIRED',
      });
    }

    // Attach verified user and active role scope to request object
    req.user = user;
    req.sessionToken = token;
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: 'User role permissions not defined.' });
    }

    const userRole = req.user.role.name;
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied',
        message: `Action requires one of the following roles: [${allowedRoles.join(', ')}]. Your active role is '${userRole}'.`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };

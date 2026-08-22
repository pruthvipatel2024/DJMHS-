const prisma = require('../config/db');

/**
 * Authorize users based on strict high-level role titles (ADMIN, TEACHER, STUDENT, PARENT)
 * @param  {...string} allowedRoles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: 'No role attached to authenticated user.' });
    }

    const userRole = req.user.role.name;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Permission Denied',
        message: `Role '${userRole}' is not permitted to perform this action. Requires: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

/**
 * Fine-grained permission authorization against the database RolePermission matrix
 * @param {string} requiredPermission - e.g., 'student:create', 'attendance:mark'
 */
const authorizePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Admins automatically possess full operational access across all institutional modules
      if (req.user.role.name === 'ADMIN') {
        return next();
      }

      const roleId = req.user.roleId;
      const permissionCheck = await prisma.rolePermission.findFirst({
        where: {
          roleId: roleId,
          permission: { name: requiredPermission },
        },
      });

      if (!permissionCheck) {
        return res.status(403).json({
          success: false,
          error: 'RBAC Scope Violation',
          message: `Your account does not possess the explicit permission '${requiredPermission}' required for this institutional action.`,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authorizeRoles,
  authorizePermission,
};

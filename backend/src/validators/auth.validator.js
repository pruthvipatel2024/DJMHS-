const { z } = require('zod');

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email, Mobile Number, or ID is required.'),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean().optional().default(false),
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Please enter your registered Email or Mobile Number.'),
});

const resetPasswordSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required.'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits.'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long.'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long.'),
});

/**
 * Express middleware to validate request bodies against Zod schemas
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  validateBody,
};

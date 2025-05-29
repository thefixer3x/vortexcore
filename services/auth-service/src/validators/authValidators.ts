import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../middleware/errorHandler';

// Common validation schemas
const emailSchema = Joi.string()
  .email()
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  });

const passwordSchema = Joi.string()
  .min(8)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required',
  });

const nameSchema = Joi.string()
  .min(1)
  .max(50)
  .pattern(/^[a-zA-Z\s]+$/)
  .messages({
    'string.min': 'Name must be at least 1 character long',
    'string.max': 'Name must be less than 50 characters',
    'string.pattern.base': 'Name can only contain letters and spaces',
  });

// Validation schemas
const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
});

const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
  mfaToken: Joi.string().length(6).pattern(/^\d+$/).optional().messages({
    'string.length': 'MFA token must be 6 digits',
    'string.pattern.base': 'MFA token must contain only numbers',
  }),
  rememberMe: Joi.boolean().optional(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: passwordSchema,
});

const forgotPasswordSchema = Joi.object({
  email: emailSchema,
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  newPassword: passwordSchema,
});

const updateProfileSchema = Joi.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided',
});

// Validation middleware generator
const createValidator = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new ValidationError(errorMessages.join('; '));
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Export validators
export const validateRegister = createValidator(registerSchema);
export const validateLogin = createValidator(loginSchema);
export const validateRefresh = createValidator(refreshSchema);
export const validateChangePassword = createValidator(changePasswordSchema);
export const validateForgotPassword = createValidator(forgotPasswordSchema);
export const validateResetPassword = createValidator(resetPasswordSchema);
export const validateUpdateProfile = createValidator(updateProfileSchema);

// Custom validation utilities
export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one number');
  }

  // Special character check
  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one special character (@$!%*?&)');
  }

  // Length bonus
  if (password.length >= 12) {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

export default {
  validateRegister,
  validateLogin,
  validateRefresh,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateEmailFormat,
  validatePasswordStrength,
};

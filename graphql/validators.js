const { body, validationResult } = require('express-validator');
const { UserInputError } = require('apollo-server-express');
const { GENDER_ENUM } = require('../models/Employee');

const loginChains = [
  body('usernameOrEmail').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

async function runValidation(req, chains) {
  for (const chain of chains) {
    await chain.run(req);
  }
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => e.msg || `${e.path}: invalid`);
    throw new UserInputError('Validation failed', { errors });
  }
  return req.body;
}

const signupChains = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Username must be between 1 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const addEmployeeChains = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  body('gender')
    .optional({ values: 'null' })
    .trim()
    .isIn(GENDER_ENUM)
    .withMessage('Gender must be Male, Female, or Other'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('salary')
    .notEmpty()
    .withMessage('Salary is required')
    .isFloat({ min: 1000 })
    .withMessage('Salary must be at least 1000')
    .toFloat(),
  body('date_of_joining')
    .notEmpty()
    .withMessage('Date of joining is required')
    .isISO8601()
    .withMessage('Date of joining must be a valid date'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('employee_photo').optional({ values: 'null' }).trim(),
];

const updateEmployeeChains = [
  body('first_name').optional().trim(),
  body('last_name').optional().trim(),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email must be valid')
    .normalizeEmail(),
  body('gender')
    .optional({ values: 'null' })
    .trim()
    .isIn(GENDER_ENUM)
    .withMessage('Gender must be Male, Female, or Other'),
  body('designation').optional().trim(),
  body('salary')
    .optional()
    .isFloat({ min: 1000 })
    .withMessage('Salary must be at least 1000')
    .toFloat(),
  body('date_of_joining')
    .optional()
    .isISO8601()
    .withMessage('Date of joining must be a valid date'),
  body('department').optional().trim(),
  body('employee_photo').optional({ values: 'null' }).trim(),
];

async function validateLoginInput(input) {
  const req = { body: input };
  return runValidation(req, loginChains);
}

async function validateSignupInput(input) {
  const req = { body: input };
  return runValidation(req, signupChains);
}

async function validateAddEmployeeInput(input) {
  const req = { body: input };
  return runValidation(req, addEmployeeChains);
}

async function validateUpdateEmployeeInput(input) {
  const req = { body: input };
  return runValidation(req, updateEmployeeChains);
}

module.exports = {
  validateLoginInput,
  validateSignupInput,
  validateAddEmployeeInput,
  validateUpdateEmployeeInput,
};

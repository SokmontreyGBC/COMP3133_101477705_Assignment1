const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { UserInputError } = require('apollo-server-express');
const {
  validateLoginInput,
  validateSignupInput,
  validateAddEmployeeInput,
  validateUpdateEmployeeInput,
} = require('./validators');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function toGraphQLUser(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    createdAt: doc.createdAt?.toISOString?.() ?? doc.created_at?.toISOString?.() ?? '',
    updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updated_at?.toISOString?.() ?? '',
  };
}

function toGraphQLEmployee(doc) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    first_name: doc.first_name,
    last_name: doc.last_name,
    email: doc.email,
    gender: doc.gender ?? null,
    designation: doc.designation,
    salary: doc.salary,
    date_of_joining: doc.date_of_joining?.toISOString?.() ?? doc.date_of_joining,
    department: doc.department,
    employee_photo: doc.employee_photo ?? null,
    createdAt: doc.createdAt?.toISOString?.() ?? '',
    updatedAt: doc.updatedAt?.toISOString?.() ?? '',
  };
}

/** Map Mongoose validation/duplicate errors to UserInputError for consistent API responses. */
function handleMongooseError(err) {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    throw new UserInputError('Validation failed', { errors });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    throw new UserInputError(`Duplicate value for ${field}`);
  }
  throw err;
}

const resolvers = {
  Query: {
    async login(_, { usernameOrEmail, password }) {
      const sanitized = await validateLoginInput({ usernameOrEmail, password });
      const key = sanitized.usernameOrEmail.trim();
      const isEmail = key.includes('@');
      const user = await User.findOne(
        isEmail ? { email: key.toLowerCase() } : { username: key }
      );
      if (!user) {
        throw new UserInputError('Invalid username/email or password');
      }
      const valid = await bcrypt.compare(sanitized.password, user.password);
      if (!valid) {
        throw new UserInputError('Invalid username/email or password');
      }
      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user: toGraphQLUser(user) };
    },

    async getAllEmployees() {
      const employees = await Employee.find().sort({ createdAt: -1 });
      return employees.map(toGraphQLEmployee);
    },

    async getEmployeeByEid(_, { eid }) {
      if (!mongoose.Types.ObjectId.isValid(eid)) {
        throw new UserInputError('Invalid employee id');
      }
      const employee = await Employee.findById(eid);
      if (!employee) {
        throw new UserInputError('Employee not found');
      }
      return toGraphQLEmployee(employee);
    },

    async getEmployeesByDesignationOrDepartment(_, { designation, department }) {
      if (!designation?.trim() && !department?.trim()) {
        throw new UserInputError('Provide at least designation or department');
      }
      const filter = {};
      if (designation?.trim()) filter.designation = new RegExp(designation.trim(), 'i');
      if (department?.trim()) filter.department = new RegExp(department.trim(), 'i');
      const employees = await Employee.find(filter).sort({ createdAt: -1 });
      return employees.map(toGraphQLEmployee);
    },
  },
  Mutation: {
    async signup(_, { input }) {
      const sanitized = await validateSignupInput(input);
      const { username, email, password } = sanitized;
      const existing = await User.findOne({
        $or: [{ username }, { email }],
      });
      if (existing) {
        throw new UserInputError('Username or email already registered');
      }
      const hashed = await bcrypt.hash(password, 10);
      try {
        const user = await User.create({ username, email, password: hashed });
        const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
        return { token, user: toGraphQLUser(user) };
      } catch (err) {
        handleMongooseError(err);
      }
    },

    async addEmployee(_, { input }) {
      const sanitized = await validateAddEmployeeInput(input);
      const existing = await Employee.findOne({ email: sanitized.email });
      if (existing) {
        throw new UserInputError('Employee with this email already exists');
      }
      const payload = {
        first_name: sanitized.first_name,
        last_name: sanitized.last_name,
        email: sanitized.email,
        gender: sanitized.gender || undefined,
        designation: sanitized.designation,
        salary: sanitized.salary,
        date_of_joining: new Date(sanitized.date_of_joining),
        department: sanitized.department,
        employee_photo: sanitized.employee_photo || null,
      };
      try {
        const employee = await Employee.create(payload);
        return toGraphQLEmployee(employee);
      } catch (err) {
        handleMongooseError(err);
      }
    },

    async updateEmployeeByEid(_, { eid, input }) {
      if (!mongoose.Types.ObjectId.isValid(eid)) {
        throw new UserInputError('Invalid employee id');
      }
      const sanitized = await validateUpdateEmployeeInput(input);
      const employee = await Employee.findById(eid);
      if (!employee) {
        throw new UserInputError('Employee not found');
      }
      if (sanitized.email && sanitized.email !== employee.email) {
        const existing = await Employee.findOne({ email: sanitized.email });
        if (existing) throw new UserInputError('Employee with this email already exists');
      }
      const updates = {};
      if (sanitized.first_name !== undefined) updates.first_name = sanitized.first_name;
      if (sanitized.last_name !== undefined) updates.last_name = sanitized.last_name;
      if (sanitized.email !== undefined) updates.email = sanitized.email;
      if (sanitized.gender !== undefined) updates.gender = sanitized.gender || null;
      if (sanitized.designation !== undefined) updates.designation = sanitized.designation;
      if (sanitized.salary !== undefined) updates.salary = sanitized.salary;
      if (sanitized.date_of_joining !== undefined) updates.date_of_joining = new Date(sanitized.date_of_joining);
      if (sanitized.department !== undefined) updates.department = sanitized.department;
      if (sanitized.employee_photo !== undefined) updates.employee_photo = sanitized.employee_photo || null;
      try {
        const updated = await Employee.findByIdAndUpdate(eid, updates, { new: true, runValidators: true });
        return toGraphQLEmployee(updated);
      } catch (err) {
        handleMongooseError(err);
      }
    },

    async deleteEmployeeByEid(_, { eid }) {
      if (!mongoose.Types.ObjectId.isValid(eid)) {
        throw new UserInputError('Invalid employee id');
      }
      const employee = await Employee.findByIdAndDelete(eid);
      if (!employee) {
        throw new UserInputError('Employee not found');
      }
      return toGraphQLEmployee(employee);
    },
  },
};

module.exports = resolvers;

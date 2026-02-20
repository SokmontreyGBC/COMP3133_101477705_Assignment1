const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { UserInputError } = require('apollo-server-express');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const { GENDER_ENUM } = require('../models/Employee');

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

function validateAddEmployee(input) {
  const errors = [];
  if (!input.first_name?.trim()) errors.push('First name is required');
  if (!input.last_name?.trim()) errors.push('Last name is required');
  if (!input.email?.trim()) errors.push('Email is required');
  if (!input.designation?.trim()) errors.push('Designation is required');
  if (input.salary == null || input.salary === '') errors.push('Salary is required');
  else if (Number(input.salary) < 1000) errors.push('Salary must be at least 1000');
  if (!input.date_of_joining) errors.push('Date of joining is required');
  if (!input.department?.trim()) errors.push('Department is required');
  if (input.gender != null && input.gender !== '' && !GENDER_ENUM.includes(input.gender)) {
    errors.push('Gender must be Male, Female, or Other');
  }
  if (errors.length) throw new UserInputError('Validation failed', { errors });
}

function validateUpdateEmployee(input) {
  const errors = [];
  if (input.salary != null && input.salary !== '' && Number(input.salary) < 1000) {
    errors.push('Salary must be at least 1000');
  }
  if (input.gender != null && input.gender !== '' && !GENDER_ENUM.includes(input.gender)) {
    errors.push('Gender must be Male, Female, or Other');
  }
  if (errors.length) throw new UserInputError('Validation failed', { errors });
}

function validateSignup({ username, email, password }) {
  const errors = [];
  if (!username?.trim()) errors.push('Username is required');
  if (!email?.trim()) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  else if (password.length < 6) errors.push('Password must be at least 6 characters');
  if (errors.length) throw new UserInputError('Validation failed', { errors });
}

const resolvers = {
  Query: {
    async login(_, { usernameOrEmail, password }) {
      if (!usernameOrEmail?.trim() || !password) {
        throw new UserInputError('Username/email and password are required');
      }
      const key = usernameOrEmail.trim();
      const isEmail = key.includes('@');
      const user = await User.findOne(
        isEmail ? { email: key.toLowerCase() } : { username: key }
      );
      if (!user) {
        throw new UserInputError('Invalid username/email or password');
      }
      const valid = await bcrypt.compare(password, user.password);
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
      validateSignup(input);
      const { username, email, password } = input;
      const existing = await User.findOne({
        $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }],
      });
      if (existing) {
        throw new UserInputError('Username or email already registered');
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
      });
      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user: toGraphQLUser(user) };
    },

    async addEmployee(_, { input }) {
      validateAddEmployee(input);
      const existing = await Employee.findOne({ email: input.email.trim().toLowerCase() });
      if (existing) {
        throw new UserInputError('Employee with this email already exists');
      }
      const employee = await Employee.create({
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        email: input.email.trim().toLowerCase(),
        gender: input.gender?.trim() || undefined,
        designation: input.designation.trim(),
        salary: Number(input.salary),
        date_of_joining: new Date(input.date_of_joining),
        department: input.department.trim(),
        employee_photo: input.employee_photo?.trim() || null,
      });
      return toGraphQLEmployee(employee);
    },

    async updateEmployeeByEid(_, { eid, input }) {
      if (!mongoose.Types.ObjectId.isValid(eid)) {
        throw new UserInputError('Invalid employee id');
      }
      validateUpdateEmployee(input);
      const employee = await Employee.findById(eid);
      if (!employee) {
        throw new UserInputError('Employee not found');
      }
      if (input.email?.trim() && input.email.trim().toLowerCase() !== employee.email) {
        const existing = await Employee.findOne({ email: input.email.trim().toLowerCase() });
        if (existing) throw new UserInputError('Employee with this email already exists');
      }
      const updates = {};
      if (input.first_name !== undefined) updates.first_name = input.first_name.trim();
      if (input.last_name !== undefined) updates.last_name = input.last_name.trim();
      if (input.email !== undefined) updates.email = input.email.trim().toLowerCase();
      if (input.gender !== undefined) updates.gender = input.gender?.trim() || null;
      if (input.designation !== undefined) updates.designation = input.designation.trim();
      if (input.salary !== undefined) updates.salary = Number(input.salary);
      if (input.date_of_joining !== undefined) updates.date_of_joining = new Date(input.date_of_joining);
      if (input.department !== undefined) updates.department = input.department.trim();
      if (input.employee_photo !== undefined) updates.employee_photo = input.employee_photo?.trim() || null;
      const updated = await Employee.findByIdAndUpdate(eid, updates, { new: true, runValidators: true });
      return toGraphQLEmployee(updated);
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

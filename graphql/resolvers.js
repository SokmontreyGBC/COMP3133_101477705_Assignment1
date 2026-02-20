const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { UserInputError } = require('apollo-server-express');

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

function validateSignup({ username, email, password }) {
  const errors = [];
  if (!username?.trim()) errors.push('Username is required');
  if (!email?.trim()) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  else if (password.length < 6) errors.push('Password must be at least 6 characters');
  if (errors.length) throw new UserInputError('Validation failed', { errors });
}

async function signup(_, { input }) {
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
}

async function login(_, { usernameOrEmail, password }) {
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
}

const resolvers = {
  Query: {
    login,
  },
  Mutation: {
    signup,
  },
};

module.exports = resolvers;

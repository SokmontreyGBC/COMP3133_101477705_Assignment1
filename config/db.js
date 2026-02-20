require('dotenv').config();
const mongoose = require('mongoose');

const DB_NAME = process.env.MONGODB_DB_NAME || 'comp3133_101477705_Assigment1';
const URI = process.env.MONGO_URI;

const connectDB = async () => {
  if (!URI) {
    throw new Error('Missing MONGO_URI in .env');
  }
  await mongoose.connect(URI, { dbName: DB_NAME });
};

module.exports = { connectDB };

const mongoose = require('mongoose');

const GENDER_ENUM = ['Male', 'Female', 'Other'];

const employeeSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: {
        values: GENDER_ENUM,
        message: 'Gender must be Male, Female, or Other',
      },
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [1000, 'Salary must be at least 1000'],
    },
    date_of_joining: {
      type: Date,
      required: [true, 'Date of joining is required'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    employee_photo: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Employee', employeeSchema);
module.exports.GENDER_ENUM = GENDER_ENUM;

# Employee Management System

A full-stack backend application built with Node.js, Express, GraphQL, and MongoDB for managing employees with authentication and profile picture uploads.

## Features

- **User Authentication**
  - User signup with email and username
  - Login with username or email
  - JWT-based authentication

- **Employee Management**
  - Create, read, update, and delete employees
  - Search employees by designation or department
  - Get employee by ID
  - Get all employees

- **Profile Picture Upload**
  - Upload employee profile pictures to Cloudinary
  - Support for multiple image formats (JPEG, PNG, GIF, WebP)

- **Data Validation**
  - Input validation using express-validator
  - Mongoose schema validation
  - Comprehensive error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for image uploads - optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/SokmontreyGBC/COMP3133_101477705_Assignment1.git
cd COMP3133_101477705_Assignment1
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGO_URI=your_mongodb_connection_string
MONGODB_DB_NAME=comp3133_101477705_Assigment1
JWT_SECRET=your_jwt_secret_key

# Optional: For employee profile picture uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Running the Application

Start the server:
```bash
npm start
```

The server will start on `http://localhost:4000` by default (or the PORT specified in your `.env`).

- GraphQL endpoint: `http://localhost:4000/graphql`
- Upload endpoint: `http://localhost:4000/api/upload`

## API Documentation

### GraphQL Queries

#### Login
```graphql
query {
  login(usernameOrEmail: "username", password: "password") {
    token
    user {
      id
      username
      email
    }
  }
}
```

#### Get All Employees
```graphql
query {
  getAllEmployees {
    id
    first_name
    last_name
    email
    designation
    department
    salary
    date_of_joining
    employee_photo
  }
}
```

#### Get Employee by ID
```graphql
query {
  getEmployeeByEid(eid: "employee_id") {
    id
    first_name
    last_name
    email
    designation
    department
    salary
    date_of_joining
    employee_photo
  }
}
```

#### Search Employees by Designation or Department
```graphql
query {
  getEmployeesByDesignationOrDepartment(
    designation: "Developer"
    department: "Engineering"
  ) {
    id
    first_name
    last_name
    email
    designation
    department
  }
}
```

### GraphQL Mutations

#### Signup
```graphql
mutation {
  signup(input: {
    username: "johndoe"
    email: "john@example.com"
    password: "password123"
  }) {
    token
    user {
      id
      username
      email
    }
  }
}
```

#### Add Employee
```graphql
mutation {
  addEmployee(input: {
    first_name: "John"
    last_name: "Doe"
    email: "john.doe@example.com"
    gender: "Male"
    designation: "Software Developer"
    salary: 5000
    date_of_joining: "2025-01-15"
    department: "Engineering"
    employee_photo: "https://cloudinary-url.com/image.jpg"
  }) {
    id
    first_name
    last_name
    email
    designation
    department
  }
}
```

#### Update Employee
```graphql
mutation {
  updateEmployeeByEid(
    eid: "employee_id"
    input: {
      salary: 6000
      designation: "Senior Developer"
    }
  ) {
    id
    first_name
    last_name
    salary
    designation
  }
}
```

#### Delete Employee
```graphql
mutation {
  deleteEmployeeByEid(eid: "employee_id") {
    id
    first_name
    last_name
    email
  }
}
```

### REST Endpoints

#### Upload Profile Picture
**POST** `/api/upload`

- **Content-Type**: `multipart/form-data`
- **Body**: Form field named `photo` with image file
- **Response**:
```json
{
  "url": "https://res.cloudinary.com/..."
}
```

**Example using Postman:**
- Method: POST
- URL: `http://localhost:4000/api/upload`
- Body: form-data
- Key: `photo` (type: File)
- Value: Select image file

## Project Structure

```
├── config/
│   ├── db.js              # MongoDB connection
│   └── cloudinary.js      # Cloudinary configuration
├── graphql/
│   ├── typeDefs.js        # GraphQL schema definitions
│   ├── resolvers.js       # GraphQL resolvers
│   └── validators.js      # Input validation using express-validator
├── models/
│   ├── User.js            # User Mongoose model
│   └── Employee.js        # Employee Mongoose model
├── index.js               # Application entry point
├── package.json           # Dependencies
└── .env                   # Environment variables (not committed)
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express** - Web framework
- **Apollo Server Express** - GraphQL server
- **MongoDB / Mongoose** - Database and ODM
- **GraphQL** - Query language and API
- **express-validator** - Input validation
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Cloudinary** - Image storage and management
- **Multer** - File upload handling

## Validation Rules

### User Signup
- Username: Required, 1-100 characters
- Email: Required, valid email format
- Password: Required, minimum 6 characters

### Employee
- **first_name**: Required
- **last_name**: Required
- **email**: Required, unique, valid email format
- **gender**: Optional, must be "Male", "Female", or "Other"
- **designation**: Required
- **salary**: Required, minimum 1000
- **date_of_joining**: Required, valid date (ISO 8601)
- **department**: Required
- **employee_photo**: Optional, URL string

## Testing

### Using Postman or GraphiQL

1. **Test Signup**: Create a new user account
2. **Test Login**: Login with username/email and password
3. **Test Employee Operations**: Create, read, update, delete employees
4. **Test Search**: Search by designation or department
5. **Test Upload**: Upload an image and use the returned URL in employee creation

### Sample User for Testing

```
Username: testuser
Email: test@example.com
Password: password123
```

## Error Handling

The API returns detailed error messages for:
- Validation errors (missing fields, invalid formats)
- Duplicate entries (email already exists)
- Not found errors (invalid employee ID)
- Authentication errors (invalid credentials)

All errors follow GraphQL error format with descriptive messages.

## License

ISC

## Author

Student ID: 101477705

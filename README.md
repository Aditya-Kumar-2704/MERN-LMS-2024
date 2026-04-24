# Vikash Classes MCQ Assessment System

A simple university-style MCQ assessment system built with:

- Frontend: React, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT with Admin and Student roles

## Features

- Admin dashboard
  - Create and manage subjects
  - Add, edit, and delete MCQ questions
  - Create timed tests from selected questions
- Student dashboard
  - View subjects and published tests
  - Attempt MCQ tests with a timer
  - Auto-submit when time is over
  - Review score, correct answers, and answer history
- Backend logic
  - Subject, Question, Test, and Result models
  - JWT authentication and role-based access
  - Shuffled questions and options for each student attempt
  - Automatic score calculation

## Folder Structure

```text
Vikash/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── admin-view/
│   │   │   ├── student-view/
│   │   │   └── ui/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   └── student/
│   │   │       ├── home/
│   │   │       ├── test/
│   │   │       └── result/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── controllers/
│   │   ├── assessment-controller/
│   │   ├── admin-controller/
│   │   └── auth-controller/
│   ├── helpers/
│   ├── middleware/
│   ├── models/
│   │   ├── User.js
│   │   ├── Subject.js
│   │   ├── Question.js
│   │   ├── Test.js
│   │   └── Result.js
│   ├── routes/
│   │   ├── admin-routes/
│   │   ├── auth-routes/
│   │   └── student-routes/
│   ├── server.js
│   └── package.json
└── README.md
```

## Important Environment Variables

Create a `.env` file inside `server/` with values like:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vikash-assessment
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL=admin@example.com
```

Notes:

- The first registered account matching `ADMIN_EMAIL` becomes the admin account.
- Student accounts can sign up from the auth page normally.

## How To Run Locally

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Start MongoDB

Make sure your local MongoDB server is running and matches `MONGO_URI`.

### 3. Start the backend

```bash
cd server
npm run dev
```

### 4. Start the frontend

```bash
cd client
npm run dev
```

### 5. Open the app

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

## Suggested Test Flow

1. Register the admin using the same email as `ADMIN_EMAIL`.
2. Log in as admin and create subjects.
3. Add questions for each subject.
4. Create tests by selecting questions and setting the timer.
5. Register a student account.
6. Log in as student, attempt a test, and review the result page.

# UniThrift — API Documentation

> Here are the exact API routes built in the Node.js/Express backend to make Iteration 1 function. If your TA asks how the React frontend talks to the MSSQL database, this is your answer.

---

## 🔌 Iteration 1 API Endpoints

---

### `POST /api/signup`

**What it does:** Registers a new student.

**Database Action:**
It first checks the `Users` table to ensure the email doesn't already exist. Then, it validates the `@nu.edu.pk` domain, hashes the password using `bcryptjs`, saves the uploaded profile picture via `multer`, and finally `INSERT`s the new record into the `Users` table.

---

### `POST /api/login`

**What it does:** Authenticates a returning student.

**Database Action:**
It queries the `Users` table by email. If found, it compares the hashed password. If everything matches, it sends the user's profile data (name, bio, profile picture URL, etc.) back to React to be saved in the browser's session storage.

---

### `PUT /api/users/update/:id`

**What it does:** Saves edits made in the Profile Page modal.

**Database Action:**
It first runs a `SELECT` query on the `Users` table to ensure the new chosen name isn't already taken by someone else (`user_id != @id`). If the name is free, it runs an `UPDATE` query to save the new bio, department, and password.

---

### `GET /api/departments`

**What it does:** Populates the department dropdown menu on the signup and profile edit forms.

**Database Action:**
It runs a simple `SELECT * FROM Departments` to pull the seed data (Computer Science, Software Engineering, etc.) so the frontend doesn't have to hardcode them.

---

*UniThrift — Fundamentals of Software Engineering | Iteration 1 / Sprint 1*

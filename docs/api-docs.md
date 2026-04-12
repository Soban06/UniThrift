# UniThrift — API Documentation

**Base URL:** `http://localhost:5000/api`

This document outlines the exact API routes built in the Node.js/Express backend for Iteration 1. These endpoints enable the React frontend to communicate with the MSSQL database.

---

## 🔌 Iteration 1 API Endpoints

### Authentication & User Management

#### `POST /signup`

**What it does:** Registers a new student.

**Database Action:**
1. Checks the `Users` table to ensure the email doesn't already exist
2. Validates the `@nu.edu.pk` domain
3. Hashes the password using `bcryptjs`
4. Saves the uploaded profile picture via `multer` (or assigns a local default image if skipped)
5. Executes an `INSERT` query to add the new record into the `Users` table

---

#### `POST /login`

**What it does:** Authenticates a returning student.

**Database Action:**
1. Queries the `Users` table by email
2. If found, compares the hashed password
3. If credentials match, sends the user's profile data (name, bio, profile picture URL, etc.) back to React
4. Data is saved in the browser's session storage

---

#### `PUT /users/update/:id`

**What it does:** Saves edits made in the Profile Page modal.

**Database Action:**
1. Runs a `SELECT` query on the `Users` table to ensure the new chosen name isn't already taken by someone else (`user_id != @id`)
2. If the name is free, executes an `UPDATE` query to save the new bio, department, and password

---

### Reference Data

#### `GET /departments`

**What it does:** Populates the department dropdown menu on the signup and profile edit forms.

**Database Action:**
- Runs a simple `SELECT * FROM Departments` to pull the seed data (Computer Science, Software Engineering, etc.)
- Prevents the frontend from hardcoding department values

---

### Item/Listing Management

#### `GET /items`

**What it does:** Fetches all item listings to populate the main Marketplace grid.

**Database Action:**
- Executes a `SELECT` query on the `Items` table (joined with the `Departments` table)
- Retrieves an array of all active listings
- Returns details like item title, price, image, and associated department for display on frontend cards

---

#### `GET /items/:itemId`

**What it does:** Retrieves the full, detailed view of a single listing when a user clicks on an item card.

**Database Action:**
- Executes a `SELECT` query on the `Items` table filtering by the specific `@itemId` from URL parameters
- Fetches granular data including:
  - Stock quantity
  - Detailed descriptions
  - Seller statistics

---

#### `POST /items/upload`

**What it does:** Creates a brand new item listing for the marketplace.

**Database Action:**
1. Express backend intercepts the `FormData`
2. If an image is provided, `multer` saves it to the local `uploads` folder
3. If no image is provided, assigns a default frontend placeholder
4. Executes an `INSERT INTO Items` query to store:
   - Title
   - Price
   - Stock quantity
   - Image link

---

#### `PUT /items/update/:itemId`

**What it does:** Saves changes when a seller edits their own item via the Item Page modal.

**Database Action:**

**Security Check:**
- Runs a `SELECT` query to verify that the `userId` making the request matches the `seller_id` of the item

**Execution:**
- If authorized, executes an `UPDATE` query on the `Items` table to overwrite:
  - Title
  - Description
  - Price
  - Stock quantity

---

#### `DELETE /items/:itemId`

**What it does:** Permanently removes an item listing from the application.

**Database Action:**

**Security Check:**
- Runs a `SELECT` query to ensure the user attempting deletion is the verified owner of the listing

**Execution:**
- If authorized, executes a `DELETE FROM Items` query where `item_id` matches the URL parameter
- Permanently removes the listing from the marketplace

---

## 📝 Notes

- **Project:** UniThrift — Fundamentals of Software Engineering
- **Version:** Iteration 1 / Sprint 1
- **Security:** Password hashing implemented via `bcryptjs`
- **File Upload:** Handled through `multer` middleware
- **Email Validation:** Restricted to `@nu.edu.pk` domain

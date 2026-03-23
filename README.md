# Uni-Thrift

## Description
A university-focused e-commerce and borrowing platform designed exclusively for FAST-NUCES students. Uni-Thrift provides a secure, centralized hub for students to buy, sell, and borrow academic materials, electronics, and everyday items. To maintain a trusted campus network, account creation is strictly restricted to valid `@nu.edu.pk` email addresses. 

Features include secure user authentication, profile customization with profile picture uploads, and a mechanical-themed UI tailored to the student body.

## Team Members
- Saad Jahangir (Roll No. [24L-2516])
- Muhammad Soban Sohail  (Roll No. [24L-2545])
- Mahad Jawad Rana (Roll No. [24L-2516])

## Tech Stack
- **Backend:** Node.js / Express
- **Frontend:** React / HTML-CSS
- **Database:** Microsoft SQL Server (MSSQL)

## Prerequisites
- Node.js installed on your machine.
- Microsoft SQL Server running locally.
- A local database created and named `UniThrift`.

## Setup & Configuration

### 1. Database Configuration
Before running the servers, you must configure the environment variables for the database connection. 

Inside the `backend` directory, create a file named `.env` and add the following credentials (update them to match your local SQL Server setup):

```env
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
DB_SERVER=localhost
DB_NAME=UniThrift
PORT=5000
```

*Note: Ensure the `Users` table is created in your `UniThrift` database before registering a new account.*

## How to Run

### Backend
Open a terminal, navigate to the backend directory, install the dependencies, and start the server:

```bash
cd backend
npm install
node server.js
```
*The terminal should output: "✅ SUCCESS! Connected via standard SQL Auth."*

### Frontend
Open a second terminal window, navigate to the frontend directory, install the React dependencies, and start the development server:

```bash
cd frontend
npm install
npm start
```
*The application will automatically open in your default web browser at `http://localhost:3000`.*

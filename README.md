# Uni-Thrift
## Description
A university-focused e-commerce and borrowing platform designed
exclusively for FAST-NUCES students. Uni-Thrift provides a secure,
centralized hub for students to buy, sell, and borrow academic
materials, electronics, and everyday items. To maintain a trusted campus
network, account creation is strictly restricted to valid @nu.edu.pk
email addresses.
Features include secure user authentication, profile customization with
profile picture uploads, and a mechanical-themed UI tailored to the
student body.
## Team Members
- Saad Jahangir (Roll No. [24L-2516])
- Muhammad Soban Sohail (Roll No. [24L-2545])
- Mahad Jawad Rana (Roll No. [24L-2504])
## Tech Stack
- **Backend:** Node.js / Express
- **Frontend:** React / HTML-CSS
- **Database:** Microsoft SQL Server (MSSQL)
## Prerequisites
- Node.js installed on your machine.
- Microsoft SQL Server running locally.
- SQL Server Management Studio (SSMS) for database management.
- A local database created and named UniThrift.
## Setup & Configuration
### 1. SQL Server Configuration (Crucial)
To ensure the Node.js backend can successfully connect to your local
Microsoft SQL Server, you must enable TCP/IP and configure your SQL
login credentials.
**Enable TCP/IP:**
1. Open **SQL Server Configuration Manager**.
2. Expand **SQL Server Network Configuration** -> **Protocols for [Your_Instance_Name]** (e.g., SQLEXPRESS).
3. Right-click on **TCP/IP** and select **Enable**.
4. Right-click on **TCP/IP** again and select **Properties**.
5. Go to the **IP Addresses** tab, scroll all the way down to the **IPAll** section, and ensure the **TCP Port** is set to 1433. Apply the changes.
6. Go to **SQL Server Services** (in the left pane), right-click your SQL Server instance, and select **Restart** to apply the changes.
**Enable SQL Server Authentication:**
If you are using the default sa (System Administrator) account for your
connection, you need to set its password and enable it. Open a New Query
in SQL Server Management Studio (SSMS) and execute the following
commands:
sql
ALTER LOGIN sa WITH PASSWORD = 'YourPassword123';
ALTER LOGIN sa ENABLE;

### 2. Database Environment Variables
Inside the backend directory, create a file named .env and add the
following credentials (update them to match the SQL Server setup you
configured above):
env
DB_USER=sa
DB_PASSWORD=YourPassword123
DB_SERVER=localhost
DB_NAME=UniThrift
PORT=5000

> **Note:** Ensure the Users table is created in your UniThrift database before registering a new account.
## How to Run
### Backend
Open a terminal, navigate to the backend directory, create the required
uploads folder for profile pictures, install dependencies, and start the
server:
bash
cd backend
mkdir uploads
npm install
node server.js

> The terminal should output: ✅ SUCCESS! Connected via standard SQL Auth.
### Frontend
Open a second terminal window, navigate to the frontend directory,
install the React dependencies, and start the development server:
bash
cd frontend
npm install
npm start

> The application will automatically open in your default web browser at http://localhost:3000.

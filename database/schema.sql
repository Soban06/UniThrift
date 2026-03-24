IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'UniThrift')
    CREATE DATABASE UniThrift;
GO
USE UniThrift;
GO

-- 1. Departments Table
CREATE TABLE Departments (
    department_id INT IDENTITY(1,1) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL
);
GO

-- 2. Users Table
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    university_email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    department_id INT,
    reliability_score DECIMAL(3,2) DEFAULT 5.00,
    role VARCHAR(50) DEFAULT 'student',
    is_suspended BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    profile_pic_url VARCHAR(MAX) DEFAULT NULL,
    user_description VARCHAR(MAX) DEFAULT NULL,

    -- Named constraint for easy future management
    CONSTRAINT FK_Users_Departments FOREIGN KEY (department_id) 
    REFERENCES Departments(department_id) ON DELETE SET NULL ON UPDATE NO ACTION
);
GO
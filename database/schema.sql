IF NOT EXISTS (SELECT *
FROM sys.databases
WHERE name = 'UniThrift')
    CREATE DATABASE UniThrift;
GO
USE UniThrift;
GO

-- 1. Departments Table
CREATE TABLE Departments
(
    department_id INT IDENTITY(1,1) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL
);
GO

-- 2. Users Table
CREATE TABLE Users
(
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    university_email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    department_id INT,
    reliability_score DECIMAL(3,2) DEFAULT 5.00,
    role VARCHAR(50) DEFAULT 'student',
    is_suspended BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    profile_pic_url VARCHAR(MAX) DEFAULT 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png',
    user_description VARCHAR(MAX) DEFAULT NULL,

    -- Named constraint for easy future management
    CONSTRAINT FK_Users_Departments FOREIGN KEY (department_id) 
    REFERENCES Departments(department_id) ON DELETE SET NULL ON UPDATE NO ACTION
);
GO


-- 1. Create Categories and insert the 4 default options
CREATE TABLE Categories
(
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL
);
GO

INSERT INTO Categories
    (category_name)
VALUES
    ('Books & Notes'),
    ('Electronics'),
    ('Stationery'),
    ('Miscellaneous');
GO

-- 2. Create the Items table to tie it all together
CREATE TABLE Items
(
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    seller_id INT FOREIGN KEY REFERENCES Users(user_id),
    title VARCHAR(100) NOT NULL,
    item_description VARCHAR(MAX),
    price DECIMAL(10,2) NOT NULL,
    listing_type VARCHAR(20) CHECK (listing_type IN ('sell', 'borrow')),
    category_id INT FOREIGN KEY REFERENCES Categories(category_id),
    department_id INT FOREIGN KEY REFERENCES Departments(department_id),
    status VARCHAR(20) DEFAULT 'available',
    stock_quantity INT DEFAULT 1,
    image_url VARCHAR(255)DEFAULT 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png',
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Wishlist (
    wishlist_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    item_id INT FOREIGN KEY REFERENCES Items(item_id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT GETDATE(),
    -- This ensures a user can't wishlist the same item twice
    CONSTRAINT UQ_User_Item UNIQUE (user_id, item_id) 
);
GO

INSERT INTO Departments
    (department_name)
VALUES
    ('Data Science'),
    ('Computer Science'),
    ( 'Software Engineering'),
    ('Electrical Engineering');

SELECT *
FROM Departments;
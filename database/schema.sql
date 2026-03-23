CREATE DATABASE UniThrift;
GO

USE UniThrift;
GO

-- 1. Departments Table
CREATE TABLE Departments (
    department_id INT IDENTITY(1,1) PRIMARY KEY,
    dept_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Categories Table
CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Users Table
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    university_email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    department_id INT FOREIGN KEY REFERENCES Departments(department_id),
    reliability_score DECIMAL(3, 2) DEFAULT 5.0,
    role VARCHAR(10) DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    is_suspended BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    profile_pic_url VARCHAR(MAX) DEFAULT 'https://via.placeholder.com/150/808080/FFFFFF?text=No+Image',
    user_description VARCHAR(500) NULL
);

-- 4. Items Table
CREATE TABLE Items (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    seller_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 1 CHECK (stock_quantity >= 0),
    listing_type VARCHAR(10) NOT NULL CHECK (listing_type IN ('lending', 'donation', 'resale')),
    category_id INT FOREIGN KEY REFERENCES Categories(category_id),
    department_id INT FOREIGN KEY REFERENCES Departments(department_id),
    status VARCHAR(10) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'on_loan', 'removed', 'out_of_stock')),
    is_digital BIT DEFAULT 0,
    file_url VARCHAR(1000) DEFAULT NULL,
    cover_image_path VARCHAR(1000) DEFAULT 'D:/UniThrift/Storage/Covers/default.jpg',
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 5. Ebook Details Table
CREATE TABLE Ebook_Details (
    ebook_id INT IDENTITY(1,1) PRIMARY KEY,
    item_id INT NOT NULL FOREIGN KEY REFERENCES Items(item_id) ON DELETE CASCADE,
    author VARCHAR(255),
    edition VARCHAR(50),
    isbn VARCHAR(20),
    page_count INT,
    file_size_kb INT
);

-- 6. Transactions Table
CREATE TABLE Transactions (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    item_id INT NOT NULL FOREIGN KEY REFERENCES Items(item_id),
    buyer_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    seller_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('purchase', 'borrow')),
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'returned')),
    transaction_date DATETIME2 DEFAULT GETDATE()
);

-- 7. Cart Table
CREATE TABLE Cart (
    cart_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    item_id INT NOT NULL FOREIGN KEY REFERENCES Items(item_id),
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    added_at DATETIME2 DEFAULT GETDATE()
);

-- 8. Messages Table
CREATE TABLE Messages (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    sender_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    receiver_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    item_id INT FOREIGN KEY REFERENCES Items(item_id),
    content TEXT NOT NULL,
    sent_at DATETIME2 DEFAULT GETDATE()
);

-- 9. Ratings Table
CREATE TABLE Ratings (
    rating_id INT IDENTITY(1,1) PRIMARY KEY,
    reviewer_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    reviewee_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    transaction_id INT NOT NULL FOREIGN KEY REFERENCES Transactions(transaction_id),
    score INT CHECK (score BETWEEN 1 AND 5),
    comment TEXT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 10. SOS Requests Table
CREATE TABLE SOS_Requests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    requester_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    item_needed VARCHAR(100) NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('emergency', 'high', 'medium', 'low')),
    department_id INT FOREIGN KEY REFERENCES Departments(department_id),
    status VARCHAR(10) DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'expired')),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 11. Wishlists Table
CREATE TABLE Wishlists (
    wishlist_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    item_id INT NOT NULL FOREIGN KEY REFERENCES Items(item_id)
);
GO
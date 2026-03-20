DROP TABLE IF EXISTS Cart;
DROP TABLE IF EXISTS Ratings;
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS SOS_Requests;
DROP TABLE IF EXISTS Wishlists;
DROP TABLE IF EXISTS Ebook_Details;
DROP TABLE IF EXISTS Items;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Departments;

CREATE TABLE Departments (
    department_id INT PRIMARY KEY IDENTITY(1,1),
    dept_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Categories (
    category_id INT PRIMARY KEY IDENTITY(1,1),
    category_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    full_name VARCHAR(100) NOT NULL,
    university_email VARCHAR(255) UNIQUE NOT NULL, 
    password_hash VARCHAR(255) NOT NULL,
    department_id INT,
    reliability_score DECIMAL(3, 2) DEFAULT 5.0,
    role VARCHAR(10) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    is_suspended BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

CREATE TABLE Items (
    item_id INT PRIMARY KEY IDENTITY(1,1),
    seller_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 1 CHECK (stock_quantity >= 0),
    listing_type VARCHAR(10) NOT NULL CHECK (listing_type IN ('resale', 'donation', 'lending')),
    category_id INT,
    department_id INT,
    status VARCHAR(10) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'on_loan', 'removed', 'out_of_stock')),
    is_digital BIT DEFAULT 0,
    file_url VARCHAR(1000) DEFAULT NULL,
    cover_image_path VARCHAR(1000) DEFAULT 'D:/UniThrift/Storage/Covers/default.jpg',
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (seller_id) REFERENCES Users(user_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id),
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

CREATE TABLE Cart (
    cart_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    added_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
);

CREATE TABLE Ebook_Details (
    ebook_id INT PRIMARY KEY IDENTITY(1,1),
    item_id INT NOT NULL,
    author VARCHAR(255),
    edition VARCHAR(50),
    isbn VARCHAR(20),
    page_count INT,
    file_size_kb INT,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE
);

CREATE TABLE Wishlists (
    wishlist_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
);

CREATE TABLE SOS_Requests (
    request_id INT PRIMARY KEY IDENTITY(1,1),
    requester_id INT NOT NULL,
    item_needed VARCHAR(100) NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
    department_id INT,
    status VARCHAR(10) DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'expired')),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (requester_id) REFERENCES Users(user_id),
    FOREIGN KEY (department_id) REFERENCES Departments(department_id)
);

CREATE TABLE Transactions (
    transaction_id INT PRIMARY KEY IDENTITY(1,1),
    item_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('purchase', 'borrow')),
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'returned')),
    transaction_date DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (item_id) REFERENCES Items(item_id),
    FOREIGN KEY (buyer_id) REFERENCES Users(user_id),
    FOREIGN KEY (seller_id) REFERENCES Users(user_id)
);

CREATE TABLE Messages (
    message_id INT PRIMARY KEY IDENTITY(1,1),
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    item_id INT,
    content TEXT NOT NULL,
    sent_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (sender_id) REFERENCES Users(user_id),
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id),
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
);

CREATE TABLE Ratings (
    rating_id INT PRIMARY KEY IDENTITY(1,1),
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    transaction_id INT NOT NULL,
    score INT CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (reviewer_id) REFERENCES Users(user_id),
    FOREIGN KEY (reviewee_id) REFERENCES Users(user_id),
    FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id)
);

INSERT INTO Departments (dept_name) VALUES ('Computer Science'), ('Electrical Engineering'), ('Business Administration'), ('Civil Engineering');
INSERT INTO Categories (category_name) VALUES ('Electronics'), ('Stationery'), ('Books'), ('Lab Gear'), ('Engineering Kits');

INSERT INTO Users (full_name, university_email, password_hash, department_id, role) VALUES 
('Muhammad Soban Sohail', 'soban.sohail@nu.edu.pk', '$2b$10$hashed_pw_1', 1, 'admin'),
('Saad Jahangir', 'saad.jahangir@nu.edu.pk', '$2b$10$hashed_pw_2', 1, 'student'),
('Mahad Jawad Rana', 'mahad.rana@nu.edu.pk', '$2b$10$hashed_pw_3', 1, 'student');

INSERT INTO Items (seller_id, title, description, price, stock_quantity, listing_type, category_id, department_id, status, is_digital, file_url, cover_image_path) VALUES 
(2, 'Calculus Early Transcendentals', '10th Edition textbook', 1500.00, 5, 'resale', 3, 1, 'available', 0, NULL, 'D:/UniThrift/Storage/Covers/calc_cover.jpg'),
(3, 'Data Structures PDF', 'Semester 3 notes and book', 0.00, 999, 'donation', 3, 1, 'available', 1, 'D:/UniThrift/Storage/Ebooks/DSA_Notes.pdf', 'D:/UniThrift/Storage/Covers/dsa_cover.jpg');

INSERT INTO Cart (user_id, item_id, quantity) VALUES (1, 1, 1);
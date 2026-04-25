-- =========================================================
-- 1. DATABASE CREATION
-- =========================================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'UniThrift')
BEGIN
    CREATE DATABASE UniThrift;
END
GO

USE UniThrift;
GO

-- =========================================================
-- 2. TABLE CREATION (Strictly Ordered for Foreign Keys)
-- =========================================================

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

    CONSTRAINT FK_Users_Departments FOREIGN KEY (department_id) 
    REFERENCES Departments(department_id) ON DELETE SET NULL ON UPDATE NO ACTION
);
GO

-- 3. Categories Table
CREATE TABLE Categories
(
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL
);
GO

-- 4. Items Table
CREATE TABLE Items
(
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    seller_id INT FOREIGN KEY REFERENCES Users(user_id),
    title VARCHAR(100) NOT NULL,
    item_description VARCHAR(MAX),
    price DECIMAL(10,2) NOT NULL,
    listing_type VARCHAR(20) CHECK (listing_type IN ('sell', 'borrow', 'sos_borrow')),
    category_id INT FOREIGN KEY REFERENCES Categories(category_id),
    department_id INT FOREIGN KEY REFERENCES Departments(department_id),
    status VARCHAR(20) DEFAULT 'available',
    stock_quantity INT DEFAULT 1,
    image_url VARCHAR(255) DEFAULT 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png',
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 5. Wishlist Table
CREATE TABLE Wishlist
(
    wishlist_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    item_id INT FOREIGN KEY REFERENCES Items(item_id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_User_Item UNIQUE (user_id, item_id)
);
GO

-- 6. SOS Requests Table
CREATE TABLE SOS_Requests
(
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    requester_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    department_id INT NOT NULL FOREIGN KEY REFERENCES Departments(department_id),
    title VARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    quantity_needed INT NOT NULL DEFAULT 1,
    quantity_fulfilled INT NOT NULL DEFAULT 0,
    price_willing_to_pay DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'high', 'emergency')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'closed')),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 7. Transactions Table
CREATE TABLE Transactions
(
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,
    item_id INT NOT NULL FOREIGN KEY REFERENCES Items(item_id),
    buyer_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    seller_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'borrow')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    quantity INT NOT NULL DEFAULT 1,
    transaction_date DATETIME DEFAULT GETDATE()
);
GO

-- 8. Messages Table
CREATE TABLE Messages
(
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    sender_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    receiver_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    item_id INT NULL FOREIGN KEY REFERENCES Items(item_id),
    content NVARCHAR(MAX) NOT NULL,
    sent_at DATETIME DEFAULT GETDATE()
);
GO

-- 9. Ratings Table
CREATE TABLE Ratings
(
    rating_id INT IDENTITY(1,1) PRIMARY KEY,
    reviewer_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    reviewee_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
    transaction_id INT NOT NULL,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    review_text VARCHAR(500) NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 10. Notifications Table
CREATE TABLE Notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    sender_id INT NULL FOREIGN KEY REFERENCES Users(user_id), 
    item_id INT NULL FOREIGN KEY REFERENCES Items(item_id),   
    transaction_id INT NULL FOREIGN KEY REFERENCES Transactions(transaction_id), 
    sos_id INT NULL FOREIGN KEY REFERENCES SOS_Requests(request_id), 
    -- 🌟 FIXED: Added 'rating_request' right here!
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('message', 'handshake_request', 'handshake_accepted', 'handshake_rejected', 'sos_alert', 'rating_request')),
    message_text NVARCHAR(MAX) NOT NULL,
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- =========================================================
-- 3. SEED DATA
-- =========================================================

INSERT INTO Categories (category_name)
VALUES ('Books & Notes'), ('Electronics'), ('Stationery'), ('Miscellaneous');
GO

INSERT INTO Departments (department_name)
VALUES ('Data Science'), ('Computer Science'), ('Software Engineering'), ('Electrical Engineering');
GO

-- =========================================================
-- 4. VIEWS
-- =========================================================

CREATE VIEW AvailableMarketplaceItems
AS
    SELECT
        i.item_id,
        i.title,
        i.price,
        i.listing_type,
        c.category_name,
        d.department_name,
        u.full_name AS seller_name
    FROM Items i
        JOIN Categories c ON i.category_id = c.category_id
        JOIN Departments d ON i.department_id = d.department_id
        JOIN Users u ON i.seller_id = u.user_id
    WHERE i.status = 'available' AND u.is_suspended = 0 AND i.listing_type IN ('sell', 'borrow');
GO

-- =========================================================
-- 5. STORED PROCEDURES
-- =========================================================

CREATE PROCEDURE sp_ProcessPurchase
    @ItemID INT,
    @BuyerID INT,
    @SellerID INT,
    @Qty INT
AS
BEGIN
    SET NOCOUNT ON; 
    
    BEGIN TRANSACTION;

    DECLARE @CurrentStock INT;

    SELECT @CurrentStock = stock_quantity 
    FROM Items 
    WHERE item_id = @ItemID;

    IF (@CurrentStock >= @Qty)
    BEGIN
        INSERT INTO Transactions (item_id, buyer_id, seller_id, transaction_type, status, quantity)
        VALUES (@ItemID, @BuyerID, @SellerID, 'purchase', 'completed', @Qty);
        
        COMMIT;
    END
    ELSE
    BEGIN
        ROLLBACK;
        THROW 50001, 'Insufficient stock available. Transaction denied.', 1;
    END
END;
GO

CREATE PROCEDURE sp_UpdateReliability
    @UserID INT
AS
BEGIN
    UPDATE Users
    SET reliability_score = (
        SELECT ISNULL(AVG(CAST(score AS DECIMAL(3,2))), 5.00)
        FROM Ratings
        WHERE reviewee_id = @UserID
    )
    WHERE user_id = @UserID;
END;
GO

CREATE PROCEDURE sp_InitiateBorrowHandshake
    @ItemID INT,
    @BuyerID INT,
    @SellerID INT,
    @Qty INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    DECLARE @CurrentStock INT;
    SELECT @CurrentStock = stock_quantity FROM Items WHERE item_id = @ItemID;

    IF (@CurrentStock >= @Qty)
    BEGIN
        DECLARE @NewTxID INT;
        INSERT INTO Transactions (item_id, buyer_id, seller_id, transaction_type, status, quantity)
        VALUES (@ItemID, @BuyerID, @SellerID, 'borrow', 'pending', @Qty);
        SET @NewTxID = SCOPE_IDENTITY();

        UPDATE Items 
        SET stock_quantity = stock_quantity - @Qty 
        WHERE item_id = @ItemID;

        INSERT INTO Notifications (user_id, sender_id, item_id, transaction_id, notification_type, message_text)
        VALUES (@SellerID, @BuyerID, @ItemID, @NewTxID, 'handshake_request', 'New borrow request pending your approval.');

        INSERT INTO Notifications (user_id, sender_id, item_id, transaction_id, notification_type, message_text)
        VALUES (@BuyerID, @SellerID, @ItemID, @NewTxID, 'handshake_request', 'Waiting for lender to approve your borrow request.');

        COMMIT;
    END
    ELSE
    BEGIN
        ROLLBACK;
        THROW 50001, 'Insufficient stock available for borrowing.', 1;
    END
END;
GO

CREATE PROCEDURE sp_ResolveHandshake
    @TransactionID INT,
    @ResolvingUserID INT, 
    @Action VARCHAR(10)   
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    DECLARE @ItemID INT, @BuyerID INT, @SellerID INT, @Qty INT, @CurrentStatus VARCHAR(20), @ListingType VARCHAR(20);
    
    SELECT 
        @ItemID = t.item_id, 
        @BuyerID = t.buyer_id, 
        @SellerID = t.seller_id, 
        @Qty = t.quantity, 
        @CurrentStatus = t.status,
        @ListingType = i.listing_type
    FROM Transactions t
    JOIN Items i ON t.item_id = i.item_id
    WHERE t.transaction_id = @TransactionID;

    IF (@CurrentStatus <> 'pending')
    BEGIN
        ROLLBACK;
        THROW 50002, 'This transaction is no longer pending.', 1;
    END

    IF (@ListingType = 'sos_borrow' AND @ResolvingUserID <> @BuyerID)
    BEGIN
        ROLLBACK;
        THROW 50003, 'Only the original requester can accept an S.O.S. offer.', 1;
    END
    ELSE IF (@ListingType <> 'sos_borrow' AND @ResolvingUserID <> @SellerID AND @Action = 'accept')
    BEGIN
        ROLLBACK;
        THROW 50003, 'Only the lender can approve this standard borrow request.', 1;
    END

    IF (@Action = 'reject')
    BEGIN
        UPDATE Transactions SET status = 'cancelled' WHERE transaction_id = @TransactionID;
        UPDATE Items SET stock_quantity = stock_quantity + @Qty WHERE item_id = @ItemID;
        
        DELETE FROM Notifications WHERE transaction_id = @TransactionID AND notification_type = 'handshake_request';

        DECLARE @NotifyUser INT = CASE WHEN @ResolvingUserID = @BuyerID THEN @SellerID ELSE @BuyerID END;
        
        INSERT INTO Notifications (user_id, item_id, transaction_id, notification_type, message_text)
        VALUES (@NotifyUser, @ItemID, @TransactionID, 'handshake_rejected', 'The handshake was cancelled or rejected.');
    END
    ELSE IF (@Action = 'accept')
    BEGIN
        UPDATE Transactions SET status = 'completed' WHERE transaction_id = @TransactionID;
        DELETE FROM Notifications WHERE transaction_id = @TransactionID AND notification_type = 'handshake_request';
    END

    COMMIT;
END;
GO

-- =========================================================
-- 6. THE NODE-SAFE TRIGGER
-- =========================================================

CREATE TRIGGER trg_UpdateItemStatus
ON Transactions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON; 

    IF EXISTS (SELECT 1 FROM inserted WHERE status = 'completed' AND transaction_type = 'purchase')
    BEGIN
        UPDATE Items
        SET stock_quantity = Items.stock_quantity - ins.quantity,
            status = CASE 
                        WHEN (Items.stock_quantity - ins.quantity) <= 0 THEN 'sold' 
                        ELSE Items.status 
                     END
        FROM Items
        JOIN inserted ins ON Items.item_id = ins.item_id
        LEFT JOIN deleted del ON ins.transaction_id = del.transaction_id
        WHERE ins.transaction_type = 'purchase'
          AND ins.status = 'completed'
          AND (del.status IS NULL OR del.status <> 'completed');
    END
END;
GO
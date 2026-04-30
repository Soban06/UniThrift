const sql = require('mssql');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 1. Database Config
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function seedDatabase() {
    try {
        console.log("⏳ Connecting to Database...");
        const pool = await sql.connect(dbConfig);
        console.log("✅ Connected! Generating secure password hash...");

        // 2. Generate a REAL bcrypt hash for the dummy password
        const salt = await bcrypt.genSalt(10);
        const safePasswordHash = await bcrypt.hash("password123", salt);

        console.log("🧨 Initiating Database Wipe & Reset...");

        // 3. The Titanium Seed Query
        const seedQuery = `
            -- A. DISABLE FOREIGN KEYS temporarily
            EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all";

            -- B. WIPE ALL DATA
            DELETE FROM Ratings;
            DELETE FROM Messages;
            DELETE FROM Notifications;
            DELETE FROM Transactions;
            DELETE FROM Wishlist;
            DELETE FROM SOS_Requests;
            DELETE FROM Items;
            DELETE FROM Users;
            DELETE FROM Categories;
            DELETE FROM Departments;

            -- C. RE-ENABLE FOREIGN KEYS
            EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all";

            -- ==========================================
            --  START PLANTING DATA (WITH FORCED IDs)
            -- ==========================================

            PRINT 'Planting Departments...'
            SET IDENTITY_INSERT Departments ON;
            INSERT INTO Departments (department_id, department_name) VALUES
            (1, 'Computer Science'), (2, 'Electrical Engineering'), (3, 'Data Science'), (4, 'Business Administration');
            SET IDENTITY_INSERT Departments OFF;

            PRINT 'Planting Categories...'
            SET IDENTITY_INSERT Categories ON;
            INSERT INTO Categories (category_id, category_name) VALUES
            (1, 'Textbooks'), (2, 'Electronics'), (3, 'Stationery'), (4, 'Clothing'), (5, 'Other');
            SET IDENTITY_INSERT Categories OFF;

            PRINT 'Planting Users...'
            SET IDENTITY_INSERT Users ON;
            INSERT INTO Users (user_id, full_name, university_email, password_hash, department_id, role, reliability_score, profile_pic_url) VALUES
            (1, 'Ali Khan', 'l221234@lhr.nu.edu.pk', '${safePasswordHash}', 1, 'student', 4.8, '/default-avatar.png'),
            (2, 'Fatima Tariq', 'l214567@lhr.nu.edu.pk', '${safePasswordHash}', 2, 'student', 5.0, '/default-avatar.png'),
            (3, 'Saad Jahangir', 'l239876@lhr.nu.edu.pk', '${safePasswordHash}', 3, 'student', 4.5, '/default-avatar.png'),
            (4, 'Zara Ahmed', 'l201111@lhr.nu.edu.pk', '${safePasswordHash}', 4, 'student', NULL, '/default-avatar.png');
            SET IDENTITY_INSERT Users OFF;

            PRINT 'Planting Marketplace Items...'
            SET IDENTITY_INSERT Items ON;
            INSERT INTO Items (item_id, seller_id, title, item_description, price, listing_type, department_id, category_id, status, stock_quantity, image_url) VALUES
            (1, 1, 'Calculus Early Transcendentals 8th Ed', 'Slightly used, no highlights. Perfect for semester 1.', 1500, 'sell', 1, 1, 'available', 1, '/default.png'),
            (2, 2, 'Arduino Uno Kit with Sensors', 'Used for 1 semester, works perfectly. Includes jumper wires.', 3000, 'sell', 2, 2, 'available', 2, '/default.png'),
            (3, 1, 'Engineering Drawing D-Board', 'Standard size for mechanical lab.', 500, 'borrow', 2, 3, 'available', 1, '/default.png'),
            (4, 3, 'Data Structures in C++', 'Good condition.', 1200, 'sell', 1, 1, 'available', 1, '/default.png'),
            (5, 4, 'FAST NUCES Hoodie (Medium)', 'Worn twice. Super warm.', 2000, 'sell', 4, 4, 'available', 1, '/default.png');
            SET IDENTITY_INSERT Items OFF;

            PRINT 'Planting Active S.O.S Requests...'
            SET IDENTITY_INSERT SOS_Requests ON;
            INSERT INTO SOS_Requests (request_id, requester_id, department_id, title, description, quantity_needed, price_willing_to_pay, priority, status) VALUES
            (1, 3, 1, 'Need Scientific Calculator', 'Exam is tomorrow morning, please help!', 1, 100, 'emergency', 'open'),
            (2, 4, 2, 'Breadboard', 'Need for DLD lab right now.', 1, 50, 'high', 'open');
            SET IDENTITY_INSERT SOS_Requests OFF;

            PRINT 'Planting Completed Transactions (History)...'
            SET IDENTITY_INSERT Transactions ON;
            INSERT INTO Transactions (transaction_id, item_id, buyer_id, seller_id, transaction_type, status, quantity) VALUES
            (1, 1, 3, 1, 'purchase', 'completed', 1),
            (2, 3, 2, 1, 'borrow', 'completed', 1);
            SET IDENTITY_INSERT Transactions OFF;

            PRINT 'Planting Trust Ratings...'
            SET IDENTITY_INSERT Ratings ON;
            INSERT INTO Ratings (rating_id, reviewer_id, reviewee_id, transaction_id, score, review_text) VALUES
            (1, 3, 1, 1, 5, 'Great seller, book was in perfect condition!'),
            (2, 2, 1, 2, 4, 'Smooth exchange, thanks!');
            SET IDENTITY_INSERT Ratings OFF;

            -- D. RESET THE IDENTITY COUNTERS SO NEW APP INSERTS START AT THE RIGHT NUMBER
            DBCC CHECKIDENT ('Departments', RESEED);
            DBCC CHECKIDENT ('Categories', RESEED);
            DBCC CHECKIDENT ('Users', RESEED);
            DBCC CHECKIDENT ('Items', RESEED);
            DBCC CHECKIDENT ('SOS_Requests', RESEED);
            DBCC CHECKIDENT ('Transactions', RESEED);
            DBCC CHECKIDENT ('Ratings', RESEED);
            DBCC CHECKIDENT ('Notifications', RESEED, 0); -- Empty table starts at 0
        `;

        await pool.request().query(seedQuery);
        
        console.log("🌲 SEED COMPLETE! Your ecosystem is alive.");
        process.exit(0); 
        
    } catch (err) {
        console.error("❌ SEED FAILED:", err);
        process.exit(1);
    }
}

seedDatabase();

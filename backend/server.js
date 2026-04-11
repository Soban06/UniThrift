const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Make the 'uploads' folder publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Configuration for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// SQL Configuration (getting from .env file)
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

console.log("⏳ Attempting to connect to the UniThrift database...");

sql.connect(dbConfig)
    .then(pool => {
        console.log("✅ SUCCESS! Connected via standard SQL Auth.");

        // --- SIGN UP ROUTE ---
        app.post('/api/signup', upload.single('profilePic'), async (req, res) => {
            const { name, email, password, departmentId, description } = req.body;
            if (!email.endsWith('nu.edu.pk')) {
                return res.status(400).json({ error: 'Only nu.edu.pk emails are allowed.' });
            }
            try {
                const checkUser = await pool.request()
                    .input('email', sql.VarChar, email)
                    .query('SELECT * FROM Users WHERE university_email = @email');

                if (checkUser.recordset.length > 0) {
                    return res.status(400).json({ error: 'A user with this email already exists.' });
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                const finalProfilePic = req.file
                    ? `http://localhost:5000/uploads/${req.file.filename}`
                    : '/default.png';

                const insertResult = await pool.request()
                    .input('name', sql.VarChar, name)
                    .input('email', sql.VarChar, email)
                    .input('password', sql.VarChar, hashedPassword)
                    .input('deptId', sql.Int, departmentId)
                    .input('bio', sql.VarChar, description || '')
                    .input('picUrl', sql.VarChar, finalProfilePic)
                    .query(`
                        INSERT INTO Users (full_name, university_email, password_hash, department_id, role, user_description, profile_pic_url) 
                        OUTPUT INSERTED.user_id, INSERTED.full_name, INSERTED.university_email, INSERTED.profile_pic_url, INSERTED.role,INSERTED.user_description
                        VALUES (@name, @email, @password, @deptId, 'student', @bio, @picUrl)
                    `);

                const newUser = insertResult.recordset[0];
                res.status(201).json({
                    message: 'User registered successfully!',
                    user: { id: newUser.user_id, name: newUser.full_name, email: newUser.university_email, profilePic: newUser.profile_pic_url, role: newUser.role, bio: newUser.user_description }
                });
            } catch (err) {
                console.error("Signup error:", err);
                res.status(500).json({ error: 'Server error during registration.' });
            }
        });

        // --- ITEM UPLOAD ROUTE (FIXED) ---
        // 🌟 Added 'upload.single' middleware here to parse FormData
        app.post('/api/items/upload', upload.single('itemImage'), async (req, res) => {
            try {
                // Now req.body will actually contain your data!
                const {
                    sellerId, title, description, price,
                    listingType, departmentId, categoryId,
                    quantity
                } = req.body;

                // Handle the image path
                const finalImageUrl = req.file
                    ? `http://localhost:5000/uploads/${req.file.filename}`
                     : '/default.png';
                // 🌟 Using the 'pool' variable from the .then block
                await pool.request()
                    .input('sellerId', sql.Int, sellerId)
                    .input('title', sql.VarChar, title)
                    .input('desc', sql.VarChar, description || '')
                    .input('price', sql.Decimal(10, 2), price)
                    .input('type', sql.VarChar, listingType)
                    .input('deptId', sql.Int, departmentId)
                    .input('catId', sql.Int, categoryId)
                    .input('imgUrl', sql.VarChar, finalImageUrl)
                    .input('qty', sql.Int, quantity || 1)
                    .query(`
                        INSERT INTO Items (seller_id, title, item_description, price, listing_type, department_id, category_id, image_url, status, stock_quantity)
                        VALUES (@sellerId, @title, @desc, @price, @type, @deptId, @catId, @imgUrl, 'available', @qty)
                    `);

                res.status(200).json({ message: "Item uploaded successfully!" });
            } catch (err) {
                console.error("Upload error details:", err);
                res.status(500).json({ error: "Database upload failed." });
            }
        });
        // --- EDIT ITEM DETAILS ---
        app.put('/api/items/update/:itemId', async (req, res) => {
            try {
                const { itemId } = req.params;
                const { title, item_description, price, stock_quantity, userId } = req.body;

                // Ensure the user updating the item is actually the seller
                const checkOwnership = await pool.request()
                    .input('itemId', sql.Int, itemId)
                    .input('userId', sql.Int, userId)
                    .query('SELECT * FROM Items WHERE item_id = @itemId AND seller_id = @userId');

                if (checkOwnership.recordset.length === 0) {
                    return res.status(403).json({ message: "Unauthorized. You do not own this item." });
                }

                await pool.request()
                    .input('title', sql.VarChar, title)
                    .input('description', sql.VarChar, item_description || '')
                    .input('price', sql.Decimal(10, 2), price)
                    .input('stock', sql.Int, stock_quantity)
                    .input('itemId', sql.Int, itemId)
                    .query(`
                        UPDATE Items 
                        SET title = @title, 
                            item_description = @description, 
                            price = @price, 
                            stock_quantity = @stock 
                        WHERE item_id = @itemId
                    `);

                res.json({ message: "Item updated successfully!" });
            } catch (err) {
                console.error("Error updating item:", err);
                res.status(500).send("Server Error");
            }
        });
        // --- DELETE ITEM ---
        app.delete('/api/items/:itemId', async (req, res) => {
            try {
                const { itemId } = req.params;
                const { userId } = req.body; // Get the user ID from the request body

                // 1. Ensure the user deleting the item is actually the seller
                const checkOwnership = await pool.request()
                    .input('itemId', sql.Int, itemId)
                    .input('userId', sql.Int, userId)
                    .query('SELECT * FROM Items WHERE item_id = @itemId AND seller_id = @userId');

                if (checkOwnership.recordset.length === 0) {
                    return res.status(403).json({ message: "Unauthorized. You do not own this item." });
                }

                // 2. Permanently delete the item
                await pool.request()
                    .input('itemId', sql.Int, itemId)
                    .query('DELETE FROM Items WHERE item_id = @itemId');

                res.json({ message: "Item deleted successfully!" });
            } catch (err) {
                console.error("Error deleting item:", err);
                res.status(500).send("Server Error");
            }
        });

        // --- GET USER SELLING HISTORY ---
        app.get('/api/users/:userId/history', async (req, res) => {
            const { userId } = req.params;
            try {
                const result = await pool.request()
                    .input('userId', sql.Int, userId)
                    .query(`
                        SELECT item_id, title, status, created_at 
                        FROM Items 
                        WHERE seller_id = @userId 
                        ORDER BY created_at DESC
                    `);
                res.status(200).json(result.recordset);
            } catch (err) {
                console.error("History fetch error:", err);
                res.status(500).json({ error: "Failed to fetch selling history." });
            }
        });

        // --- GET SINGLE ITEM DETAILS ---
        app.get('/api/items/:itemId', async (req, res) => {
            try {
                const { itemId } = req.params;
                const result = await pool.request()
                    .input('itemId', sql.Int, itemId)
                    .query(`
                        SELECT i.*, 
                               u.full_name as seller_name, 
                               d.department_name as dept_name, 
                               c.category_name,
                        
                               (SELECT COUNT(*) FROM Wishlist WHERE item_id = @itemId) as wishlist_count
                        FROM Items i
                        JOIN Users u ON i.seller_id = u.user_id
                        JOIN Departments d ON i.department_id = d.department_id
                        JOIN Categories c ON i.category_id = c.category_id
                        WHERE i.item_id = @itemId
                    `);

                if (result.recordset.length > 0) {
                    res.json(result.recordset[0]);
                } else {
                    res.status(404).json({ message: "Item not found" });
                }
            } catch (err) {
                console.error("Item fetch error:", err);
                res.status(500).send("Server Error");
            }
        });

        // --- LOGIN ROUTE ---
        app.post('/api/login', async (req, res) => {
            const { email, password } = req.body;
            try {
                const result = await pool.request()
                    .input('email', sql.VarChar, email)
                    .query('SELECT * FROM Users WHERE university_email = @email');

                if (result.recordset.length === 0) {
                    return res.status(400).json({ error: 'User not found. Please sign up.' });
                }

                const user = result.recordset[0];
                const validPassword = await bcrypt.compare(password, user.password_hash);
                if (!validPassword) {
                    return res.status(400).json({ error: 'Invalid password.' });
                }

                res.status(200).json({
                    message: 'Login successful!',
                    user: { id: user.user_id, name: user.full_name, email: user.university_email, profilePic: user.profile_pic_url, role: user.role, bio: user.user_description }
                });
            } catch (err) {
                console.error("Login error:", err);
                res.status(500).json({ error: 'Server error during login.' });
            }
        });

        // --- UPDATE PROFILE ROUTE ---
        app.put('/api/users/update/:id', async (req, res) => {
            const userId = req.params.id;
            const { name, bio, departmentId, password } = req.body;

            try {
                const checkName = await pool.request()
                    .input('name', sql.VarChar, name)
                    .input('id', sql.Int, userId)
                    .query('SELECT * FROM Users WHERE full_name = @name AND user_id != @id');

                if (checkName.recordset.length > 0) {
                    return res.status(409).json({ message: 'NAME CLASH: This identifier is already assigned to another subject.' });
                }

                let query = `UPDATE Users SET full_name = @name, user_description = @bio, department_id = @deptId`;
                const request = pool.request()
                    .input('id', sql.Int, userId)
                    .input('name', sql.VarChar, name)
                    .input('bio', sql.VarChar, bio || '')
                    .input('deptId', sql.Int, departmentId);

                if (password && password.trim() !== "") {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);
                    request.input('password', sql.VarChar, hashedPassword);
                    query += `, password_hash = @password`;
                }

                query += ` WHERE user_id = @id`;
                await request.query(query);
                res.status(200).json({ message: 'System Sync Complete.' });
            } catch (err) {
                console.error("Update error:", err);
                res.status(500).json({ message: 'INTERNAL CORE ERROR: Sync Failed.' });
            }
        });

        // --- GET ALL MARKETPLACE ITEMS ---
        app.get('/api/items', async (req, res) => {
            try {
                // We only want items that are 'available' and actually in stock
                const result = await pool.request().query(`
                    SELECT i.*, 
                           u.full_name as seller_name, 
                           d.department_name as dept_name, 
                           c.category_name 
                    FROM Items i
                    JOIN Users u ON i.seller_id = u.user_id
                    JOIN Departments d ON i.department_id = d.department_id
                    JOIN Categories c ON i.category_id = c.category_id
                    WHERE i.stock_quantity > 0
                    ORDER BY i.created_at DESC
                `);

                res.status(200).json(result.recordset);
            } catch (err) {
                console.error("Marketplace fetch error:", err);
                res.status(500).json({ error: "Failed to fetch items." });
            }
        });

        // --- TOGGLE WISHLIST (Add/Remove) ---
        app.post('/api/wishlist/toggle', async (req, res) => {
            const { userId, itemId } = req.body;
            try {
                // Check if it's already wishlisted
                const check = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('itemId', sql.Int, itemId)
                    .query('SELECT * FROM Wishlist WHERE user_id = @userId AND item_id = @itemId');

                if (check.recordset.length > 0) {
                    // It exists, so remove it (Unlike)
                    await pool.request()
                        .input('userId', sql.Int, userId)
                        .input('itemId', sql.Int, itemId)
                        .query('DELETE FROM Wishlist WHERE user_id = @userId AND item_id = @itemId');
                    res.status(200).json({ wishlisted: false });
                } else {
                    // Doesn't exist, so add it (Like)
                    await pool.request()
                        .input('userId', sql.Int, userId)
                        .input('itemId', sql.Int, itemId)
                        .query('INSERT INTO Wishlist (user_id, item_id) VALUES (@userId, @itemId)');
                    res.status(200).json({ wishlisted: true });
                }
            } catch (err) {
                console.error("Wishlist toggle error:", err);
                res.status(500).json({ error: "Failed to update wishlist" });
            }
        });

        // --- GET USER WISHLIST ---
        app.get('/api/users/:userId/wishlist', async (req, res) => {
            const { userId } = req.params;
            try {
                // Gets items, joining through the Wishlist table
                const result = await pool.request()
                    .input('userId', sql.Int, userId)
                    .query(`
                        SELECT i.*, 
                               u.full_name as seller_name, 
                               d.department_name as dept_name
                        FROM Items i
                        JOIN Wishlist w ON i.item_id = w.item_id
                        JOIN Users u ON i.seller_id = u.user_id
                        JOIN Departments d ON i.department_id = d.department_id
                        WHERE w.user_id = @userId
                        ORDER BY w.created_at DESC
                    `);
                res.status(200).json(result.recordset);
            } catch (err) {
                console.error("Wishlist fetch error:", err);
                res.status(500).json({ error: "Failed to fetch wishlist." });
            }
        });

        app.get('/', (req, res) => {
            res.send("Welcome to the UniThrift Backend API! The server is alive and well (つ｡˃ ᵕ ˂)つ.");
        });

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("❌ DATABASE CONNECTION FAILED:");
        console.error(err.message);
    });
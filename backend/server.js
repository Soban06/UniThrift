const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Make the 'uploads' folder publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d' }));

// Multer Configuration for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('uploads/')) {
            fs.mkdirSync('uploads/');
        }
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// SQL Configuration
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

// ============================================================================
// 🛡️ SECURITY MIDDLEWARE
// ============================================================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid or Expired Token." });
        req.user = user;
        next();
    });
};

console.log("⏳ Attempting to connect to the UniThrift database...");

sql.connect(dbConfig)
    .then(pool => {
        console.log("✅ SUCCESS! Connected via standard SQL Auth.");

        // ============================================================================
        // 👤 AUTHENTICATION & USERS
        // ============================================================================
        app.post('/api/signup', upload.single('profilePic'), async (req, res) => {
            const { name, email, password, departmentId, description } = req.body;
            if (!email.endsWith('nu.edu.pk')) return res.status(400).json({ error: 'Only nu.edu.pk emails are allowed.' });
            
            try {
                const checkUser = await pool.request().input('email', sql.VarChar, email).query('SELECT * FROM Users WHERE university_email = @email');
                if (checkUser.recordset.length > 0) return res.status(400).json({ error: 'A user with this email already exists.' });

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                const finalProfilePic = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : '/default-avatar.png';

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
                const token = jwt.sign({ id: newUser.user_id, email: newUser.university_email }, process.env.JWT_SECRET, { expiresIn: '24h' });

                res.status(201).json({ message: 'User registered successfully!', token: token, user: { id: newUser.user_id, name: newUser.full_name, email: newUser.university_email, profilePic: newUser.profile_pic_url, role: newUser.role, bio: newUser.user_description } });
            } catch (err) {
                res.status(500).json({ error: 'Server error during registration.' });
            }
        });

        app.post('/api/login', async (req, res) => {
            const { email, password } = req.body;
            try {
                const result = await pool.request().input('email', sql.VarChar, email).query('SELECT * FROM Users WHERE university_email = @email');
                if (result.recordset.length === 0) return res.status(400).json({ error: 'User not found.' });

                const user = result.recordset[0];
                const validPassword = await bcrypt.compare(password, user.password_hash);
                if (!validPassword) return res.status(400).json({ error: 'Invalid password.' });

                const token = jwt.sign({ id: user.user_id, email: user.university_email }, process.env.JWT_SECRET, { expiresIn: '24h' });
                res.status(200).json({ message: 'Login successful!', token: token, user: { id: user.user_id, name: user.full_name, email: user.university_email, profilePic: user.profile_pic_url, role: user.role, bio: user.user_description } });
            } catch (err) {
                res.status(500).json({ error: 'Server error during login.' });
            }
        });

        app.put('/api/users/update/:id', authenticateToken, async (req, res) => {
            const userId = req.params.id;
            const { name, bio, departmentId, password } = req.body;
            try {
                const checkName = await pool.request().input('name', sql.VarChar, name).input('id', sql.Int, userId).query('SELECT * FROM Users WHERE full_name = @name AND user_id != @id');
                if (checkName.recordset.length > 0) return res.status(409).json({ message: 'NAME CLASH.' });

                let query = `UPDATE Users SET full_name = @name, user_description = @bio, department_id = @deptId`;
                const request = pool.request().input('id', sql.Int, userId).input('name', sql.VarChar, name).input('bio', sql.VarChar, bio || '').input('deptId', sql.Int, departmentId);

                if (password && password.trim() !== "") {
                    const salt = await bcrypt.genSalt(10);
                    request.input('password', sql.VarChar, await bcrypt.hash(password, salt));
                    query += `, password_hash = @password`;
                }

                query += ` WHERE user_id = @id`;
                await request.query(query);
                res.status(200).json({ message: 'System Sync Complete.' });
            } catch (err) {
                res.status(500).json({ message: 'Sync Failed.' });
            }
        });

        // ============================================================================
        // 🛒 MARKETPLACE & ITEMS
        // ============================================================================
        app.post('/api/items/upload', authenticateToken, upload.single('itemImage'), async (req, res) => {
            try {
                const { sellerId, title, description, price, listingType, departmentId, categoryId, quantity } = req.body;
                const finalImageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : '/default.png';

                await pool.request()
                    .input('sellerId', sql.Int, sellerId).input('title', sql.VarChar, title).input('desc', sql.VarChar, description || '').input('price', sql.Decimal(10, 2), price).input('type', sql.VarChar, listingType).input('deptId', sql.Int, departmentId).input('catId', sql.Int, categoryId).input('imgUrl', sql.VarChar, finalImageUrl).input('qty', sql.Int, quantity || 1)
                    .query(`INSERT INTO Items (seller_id, title, item_description, price, listing_type, department_id, category_id, image_url, status, stock_quantity) VALUES (@sellerId, @title, @desc, @price, @type, @deptId, @catId, @imgUrl, 'available', @qty)`);
                res.status(200).json({ message: "Item uploaded successfully!" });
            } catch (err) {
                res.status(500).json({ error: "Database upload failed." });
            }
        });

        app.put('/api/items/update/:itemId', authenticateToken, async (req, res) => {
            try {
                const { itemId } = req.params;
                const { title, item_description, price, stock_quantity, userId } = req.body;
                const checkOwnership = await pool.request().input('itemId', sql.Int, itemId).input('userId', sql.Int, userId).query('SELECT * FROM Items WHERE item_id = @itemId AND seller_id = @userId');
                if (checkOwnership.recordset.length === 0) return res.status(403).json({ message: "Unauthorized." });

                await pool.request().input('title', sql.VarChar, title).input('description', sql.VarChar, item_description || '').input('price', sql.Decimal(10, 2), price).input('stock', sql.Int, stock_quantity).input('itemId', sql.Int, itemId)
                    .query(`UPDATE Items SET title = @title, item_description = @description, price = @price, stock_quantity = @stock WHERE item_id = @itemId`);
                res.json({ message: "Item updated successfully!" });
            } catch (err) {
                res.status(500).send("Server Error");
            }
        });

        app.delete('/api/items/:itemId', authenticateToken, async (req, res) => {
            try {
                const { itemId } = req.params;
                const { userId } = req.body;
                const checkOwnership = await pool.request().input('itemId', sql.Int, itemId).input('userId', sql.Int, userId).query('SELECT * FROM Items WHERE item_id = @itemId AND seller_id = @userId');
                if (checkOwnership.recordset.length === 0) return res.status(403).json({ message: "Unauthorized." });

                await pool.request().input('itemId', sql.Int, itemId).query('DELETE FROM Items WHERE item_id = @itemId');
                res.json({ message: "Item deleted successfully!" });
            } catch (err) {
                res.status(500).send("Server Error");
            }
        });

        app.get('/api/items', async (req, res) => {
            try {
                const result = await pool.request().query(`SELECT i.*, u.full_name as seller_name, d.department_name as dept_name, c.category_name FROM Items i JOIN Users u ON i.seller_id = u.user_id JOIN Departments d ON i.department_id = d.department_id JOIN Categories c ON i.category_id = c.category_id WHERE i.stock_quantity > 0 AND i.status = 'available' ORDER BY i.created_at DESC`);
                res.status(200).json(result.recordset);
            } catch (err) {
                res.status(500).json({ error: "Failed to fetch items." });
            }
        });

        app.get('/api/items/:itemId', async (req, res) => {
            try {
                const result = await pool.request().input('itemId', sql.Int, req.params.itemId).query(`SELECT i.*, u.full_name as seller_name, d.department_name as dept_name, c.category_name, (SELECT COUNT(*) FROM Wishlist WHERE item_id = @itemId) as wishlist_count, ISNULL((SELECT SUM(quantity) FROM Transactions WHERE seller_id = i.seller_id AND status = 'completed' AND transaction_type = 'purchase'), 0) as seller_sold_count FROM Items i JOIN Users u ON i.seller_id = u.user_id JOIN Departments d ON i.department_id = d.department_id JOIN Categories c ON i.category_id = c.category_id WHERE i.item_id = @itemId`);
                if (result.recordset.length > 0) res.json(result.recordset[0]);
                else res.status(404).json({ message: "Item not found" });
            } catch (err) {
                res.status(500).send("Server Error");
            }
        });

        // ====================================================================
        // 🔄 TRANSACTIONS, MESSAGES, RATINGS
        // ====================================================================
        app.post('/api/transactions/purchase', authenticateToken, async (req, res) => {
            try {
                await pool.request().input('ItemID', sql.Int, req.body.itemId).input('BuyerID', sql.Int, req.body.buyerId).input('SellerID', sql.Int, req.body.sellerId).input('Qty', sql.Int, req.body.qty).execute('sp_ProcessPurchase');
                res.status(200).json({ message: 'Transaction successful!' });
            } catch (err) {
                res.status(500).json({ error: 'Transaction Failed.' });
            }
        });

        app.get('/api/messages/:itemId/:user1/:user2', authenticateToken, async (req, res) => {
            try {
                let parsedItemId = null;
                if (req.params.itemId && req.params.itemId !== 'null' && req.params.itemId !== 'undefined' && req.params.itemId !== '') {
                    parsedItemId = parseInt(req.params.itemId, 10);
                    if (isNaN(parsedItemId)) parsedItemId = null;
                }
                const u1 = parseInt(req.params.user1, 10);
                const u2 = parseInt(req.params.user2, 10);

                if (isNaN(u1) || isNaN(u2)) return res.status(400).json({ error: "Invalid User IDs provided to chat." });

                const result = await pool.request().input('itemId', sql.Int, parsedItemId).input('u1', sql.Int, u1).input('u2', sql.Int, u2).query(`SELECT m.*, u.full_name as sender_name FROM Messages m JOIN Users u ON m.sender_id = u.user_id WHERE (m.item_id = @itemId OR (@itemId IS NULL AND m.item_id IS NULL)) AND ((m.sender_id = @u1 AND m.receiver_id = @u2) OR (m.sender_id = @u2 AND m.receiver_id = @u1)) ORDER BY m.sent_at ASC`);
                res.status(200).json(result.recordset);
            } catch (err) {
                res.status(500).json({ error: "Failed to fetch chat history." });
            }
        });

        app.get('/api/users/:userId/chats', authenticateToken, async (req, res) => {
            try {
                const result = await pool.request().input('userId', sql.Int, req.params.userId).query(`WITH RankedMessages AS (SELECT CASE WHEN sender_id = @userId THEN receiver_id ELSE sender_id END as contact_id, content, sent_at, item_id, ROW_NUMBER() OVER(PARTITION BY CASE WHEN sender_id = @userId THEN receiver_id ELSE sender_id END ORDER BY sent_at DESC) as rn FROM Messages WHERE sender_id = @userId OR receiver_id = @userId) SELECT rm.contact_id, rm.content as last_message, rm.sent_at, rm.item_id, u.full_name, u.profile_pic_url FROM RankedMessages rm JOIN Users u ON rm.contact_id = u.user_id WHERE rm.rn = 1 ORDER BY rm.sent_at DESC`);
                res.status(200).json(result.recordset);
            } catch (err) {
                res.status(500).json({ error: "Failed to fetch chat contacts." });
            }
        });

        app.post('/api/messages', authenticateToken, async (req, res) => {
            try {
                let parsedItemId = null;
                if (req.body.itemId && req.body.itemId !== 'null' && req.body.itemId !== 'undefined' && req.body.itemId !== '') {
                    parsedItemId = parseInt(req.body.itemId, 10);
                    if (isNaN(parsedItemId)) parsedItemId = null;
                }
                const sender = parseInt(req.body.senderId, 10);
                const receiver = parseInt(req.body.receiverId, 10);

                if (isNaN(sender) || isNaN(receiver)) return res.status(400).json({ error: "Invalid IDs." });

                await pool.request().input('sender', sql.Int, sender).input('receiver', sql.Int, receiver).input('item', sql.Int, parsedItemId).input('content', sql.NVarChar, req.body.content)
                    .query(`INSERT INTO Messages (sender_id, receiver_id, item_id, content) VALUES (@sender, @receiver, @item, @content); INSERT INTO Notifications (user_id, sender_id, notification_type, message_text) VALUES (@receiver, @sender, 'message', 'New chat message received');`);
                res.status(201).json({ message: "Message sent successfully!" });
            } catch (err) {
                res.status(500).json({ error: "Failed to send message." });
            }
        });

        app.post('/api/ratings', authenticateToken, async (req, res) => {
            try {
                await pool.request().input('reviewer', sql.Int, req.body.reviewerId).input('reviewee', sql.Int, req.body.revieweeId).input('transId', sql.Int, req.body.transactionId).input('score', sql.Int, req.body.score).input('text', sql.VarChar, req.body.reviewText || '').query(`INSERT INTO Ratings (reviewer_id, reviewee_id, transaction_id, score, review_text) VALUES (@reviewer, @reviewee, @transId, @score, @text)`);
                await pool.request().input('UserID', sql.Int, req.body.revieweeId).execute('sp_UpdateReliability');
                res.status(200).json({ message: "Rating submitted!" });
            } catch (err) {
                res.status(500).json({ error: "Failed to submit rating." });
            }
        });

        // ============================================================================
        // 📊 USER UTILITIES
        // ============================================================================
        app.post('/api/wishlist/toggle', authenticateToken, async (req, res) => {
            try {
                const check = await pool.request().input('userId', sql.Int, req.body.userId).input('itemId', sql.Int, req.body.itemId).query('SELECT * FROM Wishlist WHERE user_id = @userId AND item_id = @itemId');
                if (check.recordset.length > 0) {
                    await pool.request().input('userId', sql.Int, req.body.userId).input('itemId', sql.Int, req.body.itemId).query('DELETE FROM Wishlist WHERE user_id = @userId AND item_id = @itemId');
                    res.status(200).json({ wishlisted: false });
                } else {
                    await pool.request().input('userId', sql.Int, req.body.userId).input('itemId', sql.Int, req.body.itemId).query('INSERT INTO Wishlist (user_id, item_id) VALUES (@userId, @itemId)');
                    res.status(200).json({ wishlisted: true });
                }
            } catch (err) {
                res.status(500).json({ error: "Failed to update wishlist" });
            }
        });

        app.get('/api/users/:userId/wishlist', async (req, res) => {
            try {
                const result = await pool.request().input('userId', sql.Int, req.params.userId).query(`SELECT i.*, u.full_name as seller_name, d.department_name as dept_name FROM Items i JOIN Wishlist w ON i.item_id = w.item_id JOIN Users u ON i.seller_id = u.user_id JOIN Departments d ON i.department_id = d.department_id WHERE w.user_id = @userId ORDER BY w.created_at DESC`);
                res.status(200).json(result.recordset);
            } catch (err) {
                res.status(500).json({ error: "Failed to fetch wishlist." });
            }
        });

        app.get('/api/users/:id/public', async (req, res) => {
            try {
                const result = await pool.request().input('userId', sql.Int, req.params.id).query(`SELECT user_id, full_name, profile_pic_url, reliability_score, created_at, user_description FROM Users WHERE user_id = @userId`);
                if (result.recordset.length === 0) return res.status(404).json({ error: "User not found" });
                res.json(result.recordset[0]);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.get('/api/users/:id/listings', async (req, res) => {
            try {
                const result = await pool.request().input('userId', sql.Int, req.params.id).query(`SELECT item_id, title, price, listing_type, status FROM Items WHERE seller_id = @userId AND listing_type != 'sos_borrow' ORDER BY created_at DESC`);
                res.json(result.recordset);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.get('/api/users/:userId/history', async (req, res) => {
            try {
                const result = await pool.request().input('userId', sql.Int, req.params.userId).query(`SELECT item_id, title, status, created_at FROM Items WHERE seller_id = @userId ORDER BY created_at DESC`);
                res.status(200).json(result.recordset);
            } catch (err) {
                res.status(500).json({ error: "Failed to fetch history." });
            }
        });

        app.get('/api/departments', async (req, res) => {
            try {
                const result = await pool.request().query('SELECT * FROM Departments');
                res.status(200).json(result.recordset);
            } catch (err) {
                res.status(500).json({ error: "Failed to fetch departments." });
            }
        });

        // ==========================================
        // 🔔 NOTIFICATIONS & HANDSHAKES
        // ==========================================
        app.get('/api/notifications/:userId', authenticateToken, async (req, res) => {
            try {
                const result = await pool.request().input('userId', sql.Int, req.params.userId).query(`SELECT n.notification_id, n.notification_type, n.message_text, n.is_read, n.created_at, n.sender_id, u.full_name AS sender_name, n.item_id, i.title AS item_name, n.sos_id, n.transaction_id, t.status AS transaction_status, t.quantity FROM Notifications n LEFT JOIN Users u ON n.sender_id = u.user_id LEFT JOIN Items i ON n.item_id = i.item_id LEFT JOIN Transactions t ON n.transaction_id = t.transaction_id WHERE n.user_id = @userId AND n.is_read = 0 ORDER BY n.created_at DESC`);
                res.json(result.recordset);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

    app.put('/api/notifications/:userId/read-dms', authenticateToken, async (req, res) => {
            try {
                await pool.request()
                    .input('userId', sql.Int, req.params.userId)
                    // 🌟 FIX: Now clears both DMs and Rejection Alerts!
                    .query(`UPDATE Notifications SET is_read = 1 WHERE user_id = @userId AND notification_type IN ('message', 'handshake_rejected')`);
                res.json({ message: "Alerts marked as read" });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.post('/api/transactions/borrow', authenticateToken, async (req, res) => {
            try {
                await pool.request().input('ItemID', sql.Int, req.body.itemId).input('BuyerID', sql.Int, req.body.buyerId).input('SellerID', sql.Int, req.body.sellerId).input('Qty', sql.Int, req.body.qty).execute('sp_InitiateBorrowHandshake');
                res.status(200).json({ message: "Borrow request sent! Waiting for handshake." });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.post('/api/transactions/handshake/resolve', authenticateToken, async (req, res) => {
            const { transactionId, userId, action, sosId } = req.body; 
            try {
                await pool.request()
                    .input('TransactionID', sql.Int, transactionId)
                    .input('ResolvingUserID', sql.Int, userId)
                    .input('Action', sql.VarChar(10), action)
                    .execute('sp_ResolveHandshake');
                
                if (action === 'accept' && sosId) {
                    await pool.request().input('sosId', sql.Int, sosId).query("UPDATE SOS_Requests SET status = 'fulfilled' WHERE request_id = @sosId");

                    const txResult = await pool.request().input('txId', sql.Int, transactionId).query("SELECT buyer_id, seller_id FROM Transactions WHERE transaction_id = @txId");
                    
                    if (txResult.recordset.length > 0) {
                        const buyerId = txResult.recordset[0].buyer_id;
                        const sellerId = txResult.recordset[0].seller_id;
                        await pool.request()
                            .input('asker', sql.Int, buyerId).input('lender', sql.Int, sellerId).input('msg', sql.NVarChar, `🚨 S.O.S ACCEPTED: I have accepted your offer to fulfill my request! Let's arrange a meetup.`)
                            .query(`INSERT INTO Messages (sender_id, receiver_id, item_id, content) VALUES (@asker, @lender, NULL, @msg); INSERT INTO Notifications (user_id, sender_id, notification_type, message_text) VALUES (@lender, @asker, 'message', 'Your S.O.S offer was accepted! Check your messages.');`);
                    }

                    await pool.request()
                        .input('sosId', sql.Int, sosId)
                        .input('acceptedTxId', sql.Int, transactionId)
                        .query(`
                            SELECT n.transaction_id, n.sender_id, t.item_id, t.quantity INTO #OtherOffers FROM Notifications n JOIN Transactions t ON n.transaction_id = t.transaction_id WHERE n.sos_id = @sosId AND n.notification_type = 'handshake_request' AND n.transaction_id != @acceptedTxId AND t.status = 'pending';
                            UPDATE Transactions SET status = 'cancelled' WHERE transaction_id IN (SELECT transaction_id FROM #OtherOffers);
                            UPDATE Items SET stock_quantity = stock_quantity + O.quantity FROM Items I JOIN #OtherOffers O ON I.item_id = O.item_id;
                            INSERT INTO Notifications (user_id, item_id, transaction_id, notification_type, message_text) SELECT sender_id, item_id, transaction_id, 'handshake_rejected', 'Your S.O.S offer was declined because the request was fulfilled by someone else.' FROM #OtherOffers;
                            DELETE FROM Notifications WHERE sos_id = @sosId AND notification_type = 'handshake_request';
                            DELETE FROM Notifications WHERE sos_id = @sosId AND notification_type = 'sos_alert';
                            DROP TABLE #OtherOffers;
                        `);
                } else if (action === 'reject' && sosId) {
                    await pool.request().input('txId', sql.Int, transactionId).query("UPDATE Notifications SET message_text = 'Your offer to help was rejected.' WHERE transaction_id = @txId AND notification_type = 'handshake_rejected'");
                }

                res.status(200).json({ message: `Handshake ${action}ed.` });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // ==========================================
        // 🚨 S.O.S EMERGENCY REQUESTS
        // ==========================================
        app.get('/api/sos', async (req, res) => {
            try {
                const result = await pool.request().query(`
                    SELECT s.request_id, s.title, s.quantity_needed, s.price_willing_to_pay, s.priority, s.status, s.created_at,
                           u.full_name as requester_name, u.profile_pic_url, d.department_name
                    FROM SOS_Requests s
                    JOIN Users u ON s.requester_id = u.user_id
                    JOIN Departments d ON s.department_id = d.department_id
                    WHERE s.status = 'open'
                    ORDER BY CASE WHEN s.priority = 'emergency' THEN 1 WHEN s.priority = 'high' THEN 2 ELSE 3 END, s.created_at DESC
                `);
                res.status(200).json(result.recordset);
            } catch (err) {
                res.status(500).json({ error: "Failed to fetch SOS requests." });
            }
        });

        app.get('/api/sos/:id', async (req, res) => {
            try {
                const sosId = parseInt(req.params.id, 10);
                if (isNaN(sosId)) return res.status(400).json({ error: "Invalid SOS ID format" });

                const result = await pool.request()
                    .input('sosId', sql.Int, sosId)
                    .query(`
                        SELECT s.*, u.full_name AS requester_name, d.department_name
                        FROM SOS_Requests s
                        LEFT JOIN Users u ON s.requester_id = u.user_id
                        LEFT JOIN Departments d ON s.department_id = d.department_id
                        WHERE s.request_id = @sosId
                    `);
                
                if (result.recordset.length === 0) return res.status(404).json({ error: "SOS not found" });
                res.json(result.recordset[0]);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.post('/api/sos', authenticateToken, async (req, res) => {
            const { requesterId, deptId, title, description, qty, price, priority } = req.body;
            try {
                const result = await pool.request()
                    .input('reqId', sql.Int, requesterId).input('deptId', sql.Int, deptId).input('title', sql.VarChar(255), title).input('desc', sql.NVarChar(sql.MAX), description || '').input('qty', sql.Int, qty).input('price', sql.Decimal(10,2), price).input('priority', sql.VarChar(20), priority)
                    .query(`
                        INSERT INTO SOS_Requests (requester_id, department_id, title, description, quantity_needed, price_willing_to_pay, priority)
                        OUTPUT INSERTED.request_id
                        VALUES (@reqId, @deptId, @title, @desc, @qty, @price, @priority);
                    `);
                
                const newSosId = result.recordset[0].request_id;
                const alertMsg = `Emergency Request: Needs ${title} (${priority.toUpperCase()})`;

                await pool.request()
                    .input('reqId', sql.Int, requesterId).input('sosId', sql.Int, newSosId).input('msg', sql.NVarChar(sql.MAX), alertMsg)
                    .query(`
                        INSERT INTO Notifications (user_id, sender_id, sos_id, notification_type, message_text)
                        SELECT user_id, @reqId, @sosId, 'sos_alert', @msg FROM Users WHERE user_id != @reqId;

                        INSERT INTO Notifications (user_id, sender_id, sos_id, notification_type, message_text)
                        VALUES (@reqId, @reqId, @sosId, 'sos_alert', 'Your S.O.S is currently active. Take it down when no longer needed.');
                    `);

                res.status(201).json({ message: "SOS Broadcasted to all users!", requestId: newSosId });
            } catch (err) {
                res.status(500).json({ error: "Failed to post SOS request." });
            }
        });

        app.post('/api/sos/offer', authenticateToken, async (req, res) => {
            const { sosId, lenderId, requesterId, title, price, qty, deptId } = req.body;
            try {
                const itemResult = await pool.request()
                    .input('seller', sql.Int, lenderId).input('title', sql.VarChar, `S.O.S: ${title}`).input('price', sql.Decimal(10,2), price).input('dept', sql.Int, deptId).input('qty', sql.Int, qty)
                    .query(`INSERT INTO Items (seller_id, title, price, listing_type, department_id, status, stock_quantity) OUTPUT INSERTED.item_id VALUES (@seller, @title, @price, 'sos_borrow', @dept, 'available', @qty)`);
                
                const newItemId = itemResult.recordset[0].item_id;

                const txResult = await pool.request()
                    .input('item', sql.Int, newItemId).input('buyer', sql.Int, requesterId).input('seller', sql.Int, lenderId).input('qty', sql.Int, qty)
                    .query(`INSERT INTO Transactions (item_id, buyer_id, seller_id, transaction_type, status, quantity) VALUES (@item, @buyer, @seller, 'borrow', 'pending', @qty); SELECT SCOPE_IDENTITY() AS transaction_id;`);
                
                const newTxId = txResult.recordset[0].transaction_id;

                await pool.request().input('item', sql.Int, newItemId).input('qty', sql.Int, qty).query("UPDATE Items SET stock_quantity = stock_quantity - @qty WHERE item_id = @item");

                await pool.request()
                    .input('lender', sql.Int, lenderId).input('asker', sql.Int, requesterId).input('sos', sql.Int, sosId).input('tx', sql.Int, newTxId).input('item', sql.Int, newItemId)
                    .query(`INSERT INTO Notifications (user_id, sender_id, item_id, transaction_id, sos_id, notification_type, message_text) VALUES (@asker, @lender, @item, @tx, @sos, 'handshake_request', 'I can fulfill this request! Please accept to confirm the borrow.');`);

                res.status(200).json({ message: "Handshake sent to the requester!" });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.delete('/api/sos/:id', authenticateToken, async (req, res) => {
            try {
                const sosId = parseInt(req.params.id, 10);
                const userId = parseInt(req.user.id, 10); 

                if (isNaN(sosId) || isNaN(userId)) return res.status(400).json({ error: "Invalid ID parameters." });

                const check = await pool.request()
                    .input('sosId', sql.Int, sosId).input('userId', sql.Int, userId)
                    .query("SELECT * FROM SOS_Requests WHERE request_id = @sosId AND requester_id = @userId");

                if (check.recordset.length === 0) return res.status(403).json({ error: "Unauthorized." });

                await pool.request().input('sosId', sql.Int, sosId).query("DELETE FROM Notifications WHERE sos_id = @sosId");
                await pool.request().input('sosId', sql.Int, sosId).query("DELETE FROM SOS_Requests WHERE request_id = @sosId");

                res.status(200).json({ message: "SOS completely deleted." });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.get('/', (req, res) => {
            res.set('Content-Type', 'text/plain');
            res.send(`Welcome to the Secured UniThrift Backend API! The vault is locked and loaded.
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡞⠋⠉⠳⡄⠀⠀⠀⠀⢠⠴⠒⠳⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢀⡶⢶⡀⠀⠀⠀⠀⠀⠀⠀⢠⠏⠀⠀⠀⠀⢹⡄⠀⠀⣰⠋⠀⠀⠀⠸⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣀⡼⠀⠀⠛⠒⠒⡦⠀⠀⠀⠀⡟⠀⠀⠀⠀⠀⠀⣷⠀⢰⡏⠀⠀⠀⠀⠀⣹⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣏⠁⠀⠀⠀⠀⠀⣼⠁⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⣹⠀⢸⠀⠀⠀⠀⠀⠀⢸⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠉⡶⠀⠀⠀⠀⠈⡆⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⢽⠀⢸⠀⠀⠀⠀⠀⠀⣽⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢷⡤⠞⠉⠉⠉⠁⠀⠀⠀⠀⣿⠀⠀⠀⠀⠀⠀⢸⡆⢸⠀⠀⠀⠀⠀⢀⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣆⠀⠀⠀⠀⠀⠈⠛⠋⠀⠀⢀⠄⡀⣸⠃⡀⠠⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡤⠆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠴⠀⠀⠠⠀⠀⠀⠀⠘⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡞⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠲⢀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠁⠀⠜⡄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠠⠳⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣧⣠⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠒⠀⠀⠀⠀⠀⣰⠀⠐⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣀⣤⣾⠁⠈⣧⠀⠰⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣄⠀⠀⠀⠀⡿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠐⡇⠀⠘⠁⠀⠘⠲⢤⡀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠈⠉⠀⠀⠀⢠⠇⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠙⢦⣄⠀⣠⠤⠤⠄⠙⡇⠀⠀⢨⠷⢶⡋⠀⠀⠀⠀⠀⢀⣴⠋⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣧⠀⢷⣀⡴⠂⢠⣇⡀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣴⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⠤⣤⣤⡴⠋⠀⠹⣽⣛⣛⣿⠋⠉⠉⢁⡴⢋⣳⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⣄⡀⠀⠀⠉⠁⠀⠀⠀⣠⡞⠓⠚⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⡍⠓⠦⢤⠤⠴⠶⣺⠟⠀⠀⠀⠀⠀⠀⠀⢀⣀⡀⡰⢲⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠓⠒⠛⠲⠶⠚⠁⠀⠀⠀⠀⠀⠀⠀⠀⠘⣏⠉⠁⠈⠲⣤
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡆⣀⡀⠀⡞⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠈⠙⠁⠀`);
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
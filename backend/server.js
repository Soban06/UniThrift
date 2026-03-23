const express = require('express');
const sql = require('mssql'); 
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer'); 
const path = require('path');     
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Make the 'uploads' folder publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Configuration for imagess
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
            if (!email.endsWith('@nu.edu.pk')) {
                return res.status(400).json({ error: 'Only @nu.edu.pk emails are allowed.' });
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
                    : 'https://via.placeholder.com/150/808080/FFFFFF?text=No+Image';

                const insertResult = await pool.request()
                    .input('name', sql.VarChar, name)
                    .input('email', sql.VarChar, email)
                    .input('password', sql.VarChar, hashedPassword)
                    .input('deptId', sql.Int, departmentId) 
                    .input('bio', sql.VarChar, description || '')
                    .input('picUrl', sql.VarChar, finalProfilePic)
                    .query(`
                        INSERT INTO Users (full_name, university_email, password_hash, department_id, role, user_description, profile_pic_url) 
                        OUTPUT INSERTED.user_id, INSERTED.full_name, INSERTED.university_email, INSERTED.profile_pic_url, INSERTED.role
                        VALUES (@name, @email, @password, @deptId, 'student', @bio, @picUrl)
                    `);

                const newUser = insertResult.recordset[0];
                res.status(201).json({ 
                    message: 'User registered successfully!',
                    user: { id: newUser.user_id, name: newUser.full_name, email: newUser.university_email, profilePic: newUser.profile_pic_url, role: newUser.role }
                });
            } catch (err) {
                console.error("Signup error:", err);
                res.status(500).json({ error: 'Server error during registration.' });
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
                // 1. RULE: Check if the new name is already taken by someone ELSE
                const checkName = await pool.request()
                    .input('name', sql.VarChar, name)
                    .input('id', sql.Int, userId)
                    .query('SELECT * FROM Users WHERE full_name = @name AND user_id != @id');

                if (checkName.recordset.length > 0) {
                    return res.status(409).json({ message: 'NAME CLASH: This identifier is already assigned to another subject.' });
                }

                // 2. Build the query dynamically
                let query = `UPDATE Users SET full_name = @name, user_description = @bio, department_id = @deptId`;
                const request = pool.request()
                    .input('id', sql.Int, userId)
                    .input('name', sql.VarChar, name)
                    .input('bio', sql.VarChar, bio || '')
                    .input('deptId', sql.Int, departmentId);

                // 3. RULE: Only update password if user actually typed a new one
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

        // Test route
        app.get('/', (req, res) => {
            res.send("Welcome to the UniThrift Backend API! The server is alive and well  (つ｡˃ ᵕ ˂)つ.");
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

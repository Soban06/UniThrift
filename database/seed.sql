USE UniThrift;
GO

-- Clear existing data and reset IDs
DELETE FROM Users;
DELETE FROM Departments;
DBCC CHECKIDENT ('Departments', RESEED, 0);
DBCC CHECKIDENT ('Users', RESEED, 0);
GO

-- Seed Departments
INSERT INTO Departments (department_name) 
VALUES ('Data Science'), ('Computer Science'), ('Software Engineering'), ('Electrical Engineering');
GO

-- Seed Users (24 Total)
INSERT INTO Users (full_name, university_email, password_hash, department_id, reliability_score, role, is_suspended, user_description, profile_pic_url)
VALUES 
('Muhammad Soban', 'soban.sohail@nu.edu.pk', '$2b$10$hashed_pw_1', 1, 5.00, 'admin', 0, NULL, NULL),
('Saad Jahangir', 'saad.jahangir@nu.edu.pk', '$2b$10$hashed_pw_2', 1, 5.00, 'student', 0, NULL, NULL),
('Mahad Jawad R.', 'mahad.rana@nu.edu.pk', '$2b$10$hashed_pw_3', 1, 5.00, 'student', 0, NULL, NULL),
('saadtyerr', 'l@nu.edu.pk', '$2b$10$ECwyNLshMkn...', 1, 5.00, 'student', 0, 'im a good boyooo >w<', 'http://localhost:5000/uploads/profile.jpg'),
('Saad Jahangir', 'as@nu.edu.pk', '$2b$10$9neMAR1xHTqf...', 1, 5.00, 'student', 0, NULL, 'https://via.placeholder.com/150'),
('monke', 'asd@nu.edu.pk', '$2b$10$GCgreGUmcA9...', 1, 5.00, 'student', 0, 'yo mama', 'http://localhost:5000/uploads/monke.jpg'),
('mando', 'man@nu.edu.pk', '$2b$10$dlr368yVmGjj74...', 1, 5.00, 'student', 0, 'yo mama', 'http://localhost:5000/uploads/mando.jpg'),
('samosa', 'jo@nu.edu.pk', '$2b$10$PJdcyC7dwjXJD...', 1, 5.00, 'student', 0, 'yo mamaaa', 'http://localhost:5000/uploads/samosa.jpg'),

('Areeba Malik', 'areeba@nu.edu.pk', '$2b$10$abc1', 2, 4.80, 'student', 0, 'Looking for a drawing tablet.', NULL),
('Bilal Khan', 'bilal@nu.edu.pk', '$2b$10$abc2', 1, 4.50, 'student', 0, 'Selling my Calculus 2 notes.', NULL),
('Dawood Ibrahim', 'dawood@nu.edu.pk', '$2b$10$abc3', 3, 5.00, 'student', 0, 'Anyone selling a cheap chair for hostel?', NULL),
('Esha Pervez', 'esha@nu.edu.pk', '$2b$10$abc4', 4, 4.90, 'student', 0, 'Selling my old lab coat (Medium).', NULL),
('Faizan Ahmed', 'faizan@nu.edu.pk', '$2b$10$abc5', 2, 4.20, 'student', 0, 'Need a Type-C to HDMI adapter.', NULL),
('Ghufran Ali', 'ghufran@nu.edu.pk', '$2b$10$abc6', 1, 5.00, 'student', 0, 'Selling a 2nd hand monitor. 24 inch.', NULL),
('Hania Amir', 'hania@nu.edu.pk', '$2b$10$abc7', 2, 4.75, 'student', 0, 'Looking for Semester 3 books (CS).', NULL),
('Ibrahim Lodhi', 'ibrahim@nu.edu.pk', '$2b$10$abc8', 3, 4.60, 'student', 0, 'Selling my Logitech mouse.', NULL),
('Jawad Sultan', 'jawad@nu.edu.pk', '$2b$10$abc9', 4, 5.00, 'student', 0, 'Selling a desk lamp.', NULL),
('Khadija Shah', 'khadija@nu.edu.pk', '$2b$10$abc10', 2, 4.30, 'student', 0, 'Need a scientific calculator.', NULL),
('Luqman Sheikh', 'luqman@nu.edu.pk', '$2b$10$abc11', 1, 5.00, 'student', 0, 'Selling my old headphones.', NULL),
('Maryam Nawaz', 'maryam@nu.edu.pk', '$2b$10$abc12', 3, 4.95, 'student', 0, 'Looking for a second-hand cycle.', NULL),
('Nouman Ejaz', 'nouman@nu.edu.pk', '$2b$10$abc13', 4, 4.40, 'student', 0, 'Selling a laptop stand.', NULL),
('Omer Farooq', 'omer@nu.edu.pk', '$2b$10$abc14', 1, 5.00, 'student', 0, 'Need a backpack for uni.', NULL),
('Parveen Bibi', 'parveen@nu.edu.pk', '$2b$10$abc15', 2, 5.00, 'student', 0, 'Selling handmade bookmarks.', NULL),
('Qasim Ali', 'qasim@nu.edu.pk', '$2b$10$abc16', 3, 4.10, 'student', 0, 'Looking for a table fan.', NULL);
GO
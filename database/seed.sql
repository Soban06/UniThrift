DELETE FROM Users;
DELETE FROM Departments;
DBCC CHECKIDENT ('Departments', RESEED, 0);
DBCC CHECKIDENT ('Users', RESEED, 0);
GO

-- 2. Seed Departments
INSERT INTO Departments (department_name) 
VALUES ('Data Science'), ('Computer Science'), ('Software Engineering'), ('Electrical Engineering');
GO

-- 3. Seed Users (24 Total)
INSERT INTO Users (full_name, university_email, password_hash, department_id, reliability_score, role, is_suspended, user_description, profile_pic_url)
VALUES 

('Areeba Malik', 'areeba@nu.edu.pk', '$2b$10$abc1', 2, 4.80, 'student', 0, 'Looking for a drawing tablet.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Bilal Khan', 'bilal@nu.edu.pk', '$2b$10$abc2', 1, 4.50, 'student', 0, 'Selling my Calculus 2 notes.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Dawood Ibrahim', 'dawood@nu.edu.pk', '$2b$10$abc3', 3, 5.00, 'student', 0, 'Anyone selling a cheap chair for hostel?', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Esha Pervez', 'esha@nu.edu.pk', '$2b$10$abc4', 4, 4.90, 'student', 0, 'Selling my old lab coat (Medium).', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Faizan Ahmed', 'faizan@nu.edu.pk', '$2b$10$abc5', 2, 4.20, 'student', 0, 'Need a Type-C to HDMI adapter.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Ghufran Ali', 'ghufran@nu.edu.pk', '$2b$10$abc6', 1, 5.00, 'student', 0, 'Selling a 2nd hand monitor. 24 inch.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Hania Amir', 'hania@nu.edu.pk', '$2b$10$abc7', 2, 4.75, 'student', 0, 'Looking for Semester 3 books (CS).', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Ibrahim Lodhi', 'ibrahim@nu.edu.pk', '$2b$10$abc8', 3, 4.60, 'student', 0, 'Selling my Logitech mouse.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Jawad Sultan', 'jawad@nu.edu.pk', '$2b$10$abc9', 4, 5.00, 'student', 0, 'Selling a desk lamp.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Khadija Shah', 'khadija@nu.edu.pk', '$2b$10$abc10', 2, 4.30, 'student', 0, 'Need a scientific calculator.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Luqman Sheikh', 'luqman@nu.edu.pk', '$2b$10$abc11', 1, 5.00, 'student', 0, 'Selling my old headphones.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Maryam Nawaz', 'maryam@nu.edu.pk', '$2b$10$abc12', 3, 4.95, 'student', 0, 'Looking for a second-hand cycle.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Nouman Ejaz', 'nouman@nu.edu.pk', '$2b$10$abc13', 4, 4.40, 'student', 0, 'Selling a laptop stand.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Omer Farooq', 'omer@nu.edu.pk', '$2b$10$abc14', 1, 5.00, 'student', 0, 'Need a backpack for uni.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Parveen Bibi', 'parveen@nu.edu.pk', '$2b$10$abc15', 2, 5.00, 'student', 0, 'Selling handmade bookmarks.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png'),
('Qasim Ali', 'qasim@nu.edu.pk', '$2b$10$abc16', 3, 4.10, 'student', 0, 'Looking for a table fan.', 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Image-not-found.png');
GO
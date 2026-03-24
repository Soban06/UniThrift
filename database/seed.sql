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

('Areeba Malik', 'areeba@nu.edu.pk', '$2b$10$abc1', 2, 4.80, 'student', 0, 'Looking for a drawing tablet.', @default_img),
('Bilal Khan', 'bilal@nu.edu.pk', '$2b$10$abc2', 1, 4.50, 'student', 0, 'Selling my Calculus 2 notes.', @default_img),
('Dawood Ibrahim', 'dawood@nu.edu.pk', '$2b$10$abc3', 3, 5.00, 'student', 0, 'Anyone selling a cheap chair for hostel?', @default_img),
('Esha Pervez', 'esha@nu.edu.pk', '$2b$10$abc4', 4, 4.90, 'student', 0, 'Selling my old lab coat (Medium).', @default_img),
('Faizan Ahmed', 'faizan@nu.edu.pk', '$2b$10$abc5', 2, 4.20, 'student', 0, 'Need a Type-C to HDMI adapter.', @default_img),
('Ghufran Ali', 'ghufran@nu.edu.pk', '$2b$10$abc6', 1, 5.00, 'student', 0, 'Selling a 2nd hand monitor. 24 inch.', @default_img),
('Hania Amir', 'hania@nu.edu.pk', '$2b$10$abc7', 2, 4.75, 'student', 0, 'Looking for Semester 3 books (CS).', @default_img),
('Ibrahim Lodhi', 'ibrahim@nu.edu.pk', '$2b$10$abc8', 3, 4.60, 'student', 0, 'Selling my Logitech mouse.', @default_img),
('Jawad Sultan', 'jawad@nu.edu.pk', '$2b$10$abc9', 4, 5.00, 'student', 0, 'Selling a desk lamp.', @default_img),
('Khadija Shah', 'khadija@nu.edu.pk', '$2b$10$abc10', 2, 4.30, 'student', 0, 'Need a scientific calculator.', @default_img),
('Luqman Sheikh', 'luqman@nu.edu.pk', '$2b$10$abc11', 1, 5.00, 'student', 0, 'Selling my old headphones.', @default_img),
('Maryam Nawaz', 'maryam@nu.edu.pk', '$2b$10$abc12', 3, 4.95, 'student', 0, 'Looking for a second-hand cycle.', @default_img),
('Nouman Ejaz', 'nouman@nu.edu.pk', '$2b$10$abc13', 4, 4.40, 'student', 0, 'Selling a laptop stand.', @default_img),
('Omer Farooq', 'omer@nu.edu.pk', '$2b$10$abc14', 1, 5.00, 'student', 0, 'Need a backpack for uni.', @default_img),
('Parveen Bibi', 'parveen@nu.edu.pk', '$2b$10$abc15', 2, 5.00, 'student', 0, 'Selling handmade bookmarks.', @default_img),
('Qasim Ali', 'qasim@nu.edu.pk', '$2b$10$abc16', 3, 4.10, 'student', 0, 'Looking for a table fan.', @default_img);
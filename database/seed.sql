USE UniThrift;
GO

-- 1. Departments
INSERT INTO Departments (dept_name) VALUES 
('Computer Science'), 
('Electrical Engineering'), 
('Business Administration'), 
('Social Sciences');

-- 2. Categories
INSERT INTO Categories (category_name) VALUES 
('Textbooks'), 
('Electronics'), 
('Lab Gear'), 
('Stationery'), 
('Furniture');

-- 3. Users
-- (Passwords are just placeholders)
INSERT INTO Users (full_name, university_email, password_hash, department_id, role) VALUES 
('Alice Smith', 'alice@uni.edu', 'hash123', 1, 'student'),
('Bob Jones', 'bob@uni.edu', 'hash456', 3, 'student'),
('Charlie Davis', 'charlie@uni.edu', 'hash789', 1, 'admin'),
('Dana White', 'dana@uni.edu', 'hash000', 2, 'student');

-- 4. Items
INSERT INTO Items (seller_id, title, description, price, listing_type, category_id, department_id, status, is_digital) VALUES 
(1, 'Introduction to Algorithms', 'CLRS 3rd Edition, slightly used.', 45.00, 'resale', 1, 1, 'available', 0),
(2, 'Scientific Calculator', 'Casio FX-991EX, works perfect.', 20.00, 'resale', 2, 2, 'available', 0),
(1, 'Python for Data Science PDF', 'Comprehensive ebook for beginners.', 0.00, 'donation', 1, 1, 'available', 1),
(4, 'Drawing Board', 'A3 size for engineering drawing.', 15.00, 'lending', 3, 2, 'on_loan', 0);

-- 5. Ebook Details (for the Python PDF)
INSERT INTO Ebook_Details (item_id, author, edition, isbn, page_count, file_size_kb) VALUES 
(3, 'Guido van Rossum', '2024 Edition', '978-3-16-148410-0', 450, 12400);

-- 6. Transactions
INSERT INTO Transactions (item_id, buyer_id, seller_id, transaction_type, status) VALUES 
(1, 2, 1, 'purchase', 'completed'),
(4, 1, 4, 'borrow', 'pending');

-- 7. Cart
INSERT INTO Cart (user_id, item_id, quantity) VALUES 
(2, 2, 1),
(4, 1, 1);

-- 8. Messages
INSERT INTO Messages (sender_id, receiver_id, item_id, content) VALUES 
(2, 1, 1, 'Hey Alice, is the algorithm book still available?'),
(1, 2, 1, 'Yeah Bob, it is! Meet me at the cafeteria?');

-- 9. Ratings
INSERT INTO Ratings (reviewer_id, reviewee_id, transaction_id, score, comment) VALUES 
(2, 1, 1, 5, 'Fast response and book was in great condition.');

-- 10. SOS Requests
INSERT INTO SOS_Requests (requester_id, item_needed, priority, department_id, status) VALUES 
(4, 'Soldering Iron', 'high', 2, 'open'),
(2, 'Stapler', 'low', 3, 'fulfilled');

-- 11. Wishlists
INSERT INTO Wishlists (user_id, item_id) VALUES 
(1, 2),
(4, 3);

GO
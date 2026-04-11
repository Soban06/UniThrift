import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import './SignUp.css'; 

const ItemUpload = () => {
    const navigate = useNavigate();
    const [sellerId, setSellerId] = useState(null);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: '', 
        description: '', 
        price: '', 
        listingType: 'sell', 
        departmentId: '1', 
        categoryId: '1',
        quantity: 1 // 🌟 Initialized to 1
    });
    const [itemImage, setItemImage] = useState(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setSellerId(parsedUser.id || parsedUser.user_id);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setItemImage(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); 
        setIsSuccess(false);

        if (!sellerId) {
            setMessage('❌ Authentication error. Please log in again.');
            return;
        }

        const dataToSend = new FormData();
        dataToSend.append('sellerId', sellerId);
        dataToSend.append('title', formData.title);
        dataToSend.append('description', formData.description);
        dataToSend.append('price', formData.price);
        dataToSend.append('listingType', formData.listingType);
        dataToSend.append('categoryId', formData.categoryId);
        dataToSend.append('departmentId', formData.departmentId);
        dataToSend.append('quantity', formData.quantity); // 🌟 Appending quantity
        if (itemImage) dataToSend.append('itemImage', itemImage);

        try {
            await axios.post('http://localhost:5000/api/items/upload', dataToSend);
            setIsSuccess(true);
            setMessage('✅ Item listed successfully!');
            setTimeout(() => navigate('/'), 2000); 
        } catch (error) {
            setMessage('❌ Failed to upload item. Check backend terminal for details.');
        }
    };

    return (
        <div className="auth-page-container">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="unithrift-banner">
                    <h1>UNI-THRIFT</h1>
                </div>
            </Link>

            <div className="unithrift-box form-container">
                <h2>Upload Listing</h2>
                {message && (
                    <div className={isSuccess ? "message-alert success" : "message-alert"} style={isSuccess ? {color: '#4CAF50'} : {}}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="input-group">
                        <label>Item Title:</label>
                        <input type="text" name="title" placeholder="What are you listing?" value={formData.title} onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label>Price (PKR):</label>
                        <input type="number" name="price" placeholder="e.g. 500" value={formData.price} onChange={handleChange} min="0" required />
                    </div>

                    {/* 🌟 NEW QUANTITY INPUT 🌟 */}
                    <div className="input-group">
                        <label>Stock Quantity:</label>
                        <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" required />
                    </div>

                    <div className="input-group">
                        <label>Listing Type:</label>
                        <select name="listingType" value={formData.listingType} onChange={handleChange} required>
                            <option value="sell">Sell</option>
                            <option value="borrow">Lend/Borrow</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Target Department:</label>
                        <select name="departmentId" value={formData.departmentId} onChange={handleChange} required>
                            <option value="1">Data Science</option>
                            <option value="2">Computer Science</option>
                            <option value="3">Software Engineering</option>
                            <option value="4">Electrical Engineering</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Item Category:</label>
                        <select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                            <option value="1">Books & Notes</option>
                            <option value="2">Electronics</option>
                            <option value="3">Stationery</option>
                            <option value="4">Miscellaneous</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Description:</label>
                        <textarea name="description" placeholder="Condition, details, etc." value={formData.description} onChange={handleChange} rows="3" />
                    </div>

                    <div className="input-group">
                        <label>Item Image:</label>
                        <input type="file" name="itemImage" accept="image/*" onChange={handleFileChange} className="file-input" />
                    </div>

                    <button type="submit" className="btn-ribbon" style={{ marginTop: '20px' }}>UPLOAD ITEM</button>
                    
                    <button type="button" className="btn-ribbon" style={{ marginTop: '10px', backgroundColor: '#555' }} onClick={() => navigate('/profile')}>
                        CANCEL
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ItemUpload;
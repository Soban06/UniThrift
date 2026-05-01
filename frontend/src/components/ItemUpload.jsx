import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import './SignUp.css'; 

const ItemUpload = () => {
    const navigate = useNavigate();
    const [sellerId, setSellerId] = useState(null);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [departments, setDepartments] = useState([]);

    const [formData, setFormData] = useState({
        title: '', 
        description: '', 
        price: '', 
        departmentId: '', 
        categoryId: '1',
        listingType: 'sell', 
        quantity: 1,
        borrowDuration: 14, 
        isDigital: false    
    });
    
    const [itemImage, setItemImage] = useState(null);
    const [itemFile, setItemFile] = useState(null); 

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setSellerId(parsedUser.id || parsedUser.user_id);
        } else {
            navigate('/login');
        }

        const fetchDepartments = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/departments');
                setDepartments(response.data);
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, [navigate]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };
    
    const handleImageChange = (e) => setItemImage(e.target.files[0]);
    const handleDocumentChange = (e) => setItemFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); 
        setIsSuccess(false);

        if (!sellerId) return setMessage('❌ Authentication error. Please log in again.');
        if (formData.isDigital && !itemFile) return setMessage('❌ You must upload a PDF for digital items!');

        const dataToSend = new FormData();
        dataToSend.append('sellerId', sellerId);
        dataToSend.append('title', formData.title);
        dataToSend.append('description', formData.description);
        dataToSend.append('price', formData.price);
        dataToSend.append('listingType', formData.isDigital ? 'borrow' : formData.listingType);
        dataToSend.append('categoryId', formData.categoryId);
        dataToSend.append('departmentId', formData.departmentId);
        dataToSend.append('isDigital', formData.isDigital);
        
        if (formData.listingType === 'borrow' || formData.isDigital) {
            dataToSend.append('borrowDuration', formData.borrowDuration);
        }

        // Logic for Digital vs Physical
        if (formData.isDigital) {
            dataToSend.append('quantity', 1); // Default for DB
            dataToSend.append('itemFile', itemFile);
        } else {
            dataToSend.append('quantity', formData.quantity);
            if (itemImage) dataToSend.append('itemImage', itemImage);
        }

        try {
            const token = sessionStorage.getItem('token');
            if (!token) return setMessage("❌ You must be logged in to upload!");

            await axios.post('http://localhost:5000/api/items/upload', dataToSend, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setIsSuccess(true);
            setMessage('✅ Item listed successfully! Redirecting...');
            setTimeout(() => navigate('/'), 2000); 
        } catch (error) {
            console.error(error);
            setMessage('❌ Failed to upload item. Check backend terminal.');
        }
    };

    return (
        <div className="auth-page-container">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="unithrift-banner"><h1>UNI-THRIFT</h1></div>
            </Link>

            <div className="unithrift-box form-container" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                <h2>Upload Listing</h2>
                {message && <div className={isSuccess ? "message-alert success" : "message-alert"} style={isSuccess ? {color: '#4CAF50', fontWeight: 'bold', marginBottom: '15px'} : {}}>{message}</div>}

                <form onSubmit={handleSubmit} className="signup-form">
                    
                    {/* DIGITAL UPLOAD TOGGLE */}
                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginBottom: '15px', padding: '15px', backgroundColor: 'rgba(255, 215, 0, 0.05)', border: '1px solid #FFD700', borderRadius: '4px' }}>
                        <input type="checkbox" name="isDigital" checked={formData.isDigital} onChange={(e) => {
                            handleChange(e);
                            if (e.target.checked) setFormData(prev => ({ ...prev, quantity: 1, listingType: 'borrow' }));
                        }} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <label style={{ margin: 0, color: '#FFD700', fontWeight: 'bold', cursor: 'pointer' }}>This is a Digital E-Book (PDF)</label>
                    </div>

                    <div className="input-group">
                        <label>Item Title:</label>
                        <input type="text" name="title" placeholder="What are you listing?" value={formData.title} onChange={handleChange} required />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Price (PKR):</label>
                            <input type="number" name="price" placeholder="e.g. 500" value={formData.price} onChange={handleChange} min="0" required />
                        </div>
                        
                        {/* HIDE QUANTITY IF DIGITAL */}
                        {!formData.isDigital && (
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Stock Quantity:</label>
                                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" required />
                            </div>
                        )}
                    </div>
                    
                    <div className="input-group">
                        <label>Listing Type:</label>
                        <select name="listingType" value={formData.listingType} onChange={handleChange} required disabled={formData.isDigital} style={{ opacity: formData.isDigital ? 0.5 : 1 }}>
                            <option value="sell">Sell</option>
                            <option value="borrow">Lend/Borrow</option>
                        </select>
                    </div>

                    {(formData.listingType === 'borrow' || formData.isDigital) && (
                        <div className="input-group" style={{ padding: '10px', border: '1px solid #4A90E2', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
                            <label style={{ color: '#4A90E2' }}>Borrow Duration (Days):</label>
                            <input type="number" name="borrowDuration" value={formData.borrowDuration} onChange={handleChange} min="1" max="90" required />
                            <small style={{ color: '#aaa', display: 'block', marginTop: '5px' }}>The item must be returned (or access expires) after this many days.</small>
                        </div>
                    )}

                    {/* DYNAMIC UPLOAD FIELD (PDF vs IMAGE) */}
                    {formData.isDigital ? (
                        <div className="input-group" style={{ padding: '15px', border: '2px dashed #FFD700', backgroundColor: '#1a1a1a', marginTop: '10px' }}>
                            <label style={{ color: '#FFD700', fontWeight: 'bold' }}>Upload Secure PDF:</label>
                            <input type="file" name="itemFile" accept="application/pdf" onChange={handleDocumentChange} className="file-input" required style={{ border: 'none', padding: 0 }} />
                            <small style={{ color: '#aaa', display: 'block', marginTop: '5px' }}>This file will be locked in the digital vault. Users cannot download or copy it.</small>
                        </div>
                    ) : (
                        <div className="input-group">
                            <label>Cover Image (Required):</label>
                            <input type="file" name="itemImage" accept="image/*" onChange={handleImageChange} className="file-input" required />
                        </div>
                    )}

                    <div className="input-group" style={{ marginTop: '15px' }}>
                        <label>Target Department:</label>
                        <select name="departmentId" value={formData.departmentId} onChange={handleChange} required>
                            <option value="" disabled>Select Department...</option>
                            {departments.map(dept => <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>)}
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

                    <button type="submit" className="btn-ribbon" style={{ marginTop: '20px' }}>UPLOAD ITEM</button>
                    <button type="button" className="btn-ribbon" style={{ marginTop: '10px', backgroundColor: '#555' }} onClick={() => navigate('/profile')}>CANCEL</button>
                </form>
            </div>
        </div>
    );
};

export default ItemUpload;
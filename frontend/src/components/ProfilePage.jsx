import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({ name: '', bio: '', department: 'Computer Science', password: '' });
    const [error, setError] = useState("");

    // --- SELLING HISTORY STATE ---
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [sellingHistory, setSellingHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // --- WISHLIST STATE ---
    const [showWishlistModal, setShowWishlistModal] = useState(false);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    const deptMapping = {
        "Computer Science": 1,
        "Software Engineering": 2,
        "Data Science": 3,
        "Electrical Engineering": 4
    };

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setFormData({
                name: parsedUser.name || parsedUser.full_name || "",
                bio: parsedUser.bio || parsedUser.user_description || "",
                department: parsedUser.department || "Computer Science",
                password: ""
            });
        }
    }, []);

    const handleSave = async () => {
        setError("");
        try {
            const dataToSubmit = {
                ...formData,
                departmentId: deptMapping[formData.department]
            };

            const userId = user.id || user.user_id;
            await axios.put(`http://localhost:5000/api/users/update/${userId}`, dataToSubmit);

            const updatedUser = {
                ...user,
                name: formData.name,
                bio: formData.bio,
                department: formData.department
            };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));

            alert("Profile Synced Successfully.");
            window.location.reload(); 
        } catch (err) {
            setError("System Error: Could not update profile.");
        }
    };

    // --- FETCH SELLING HISTORY ---
    const handleOpenHistory = async () => {
        setShowHistoryModal(true);
        setHistoryLoading(true);
        try {
            const userId = user.id || user.user_id;
            const response = await axios.get(`http://localhost:5000/api/users/${userId}/history`);
            setSellingHistory(response.data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    // --- FETCH WISHLIST ---
    const handleOpenWishlist = async () => {
        setShowWishlistModal(true);
        setWishlistLoading(true);
        try {
            const userId = user.id || user.user_id;
            const response = await axios.get(`http://localhost:5000/api/users/${userId}/wishlist`);
            setWishlistItems(response.data);
        } catch (error) {
            console.error("Failed to load wishlist", error);
        } finally {
            setWishlistLoading(false);
        }
    };

    const displayName = user?.name || user?.full_name;
    const displayPic = user?.profilePic || user?.profile_pic_url || "https://via.placeholder.com/400/333332/white?text=No+Image";
    const displayBio = (user?.bio || user?.user_description) ? (user.bio || user.user_description).split('\n') : [];

    return (
        <div className="profile-page-wrapper">
            <header className="profile-header">
                <div className="profile-banner">
                    <div className="profile-banner-inner"><h1>USER-PAGE</h1></div>
                </div>
                <div className="header-deco" />
                <div className="back-ribbon" onClick={() => navigate('/')}>
                    <div className="back-ribbon-inner"><span>BACK TO HOME PAGE</span></div>
                </div>
            </header>

            <div className="profile-content-grid">
                
                {/* LEFT COLUMN */}
                <div className="profile-left-col">
                    <h2 className="profile-username">{displayName}</h2>
                    <div className="profile-pic-frame">
                        <img src={displayPic} alt="Profile" />
                    </div>
                    <div className="profile-description">
                        <h3>Description</h3>
                        <ul>
                            {displayBio.map((line, i) => <li key={i}>{line}</li>)}
                        </ul>
                    </div>
                </div>

                {/* MIDDLE COLUMN */}
                <div className="profile-mid-col">
                    <div className="history-container">
                        <div className="history-box">
                            <h4>PURCHASE HISTORY</h4>
                            <span style={{ color: '#aaa' }}>Coming Soon</span>
                        </div>
                        
                        <div className="history-box">
                            <h4>BORROW HISTORY</h4>
                            <span style={{ color: '#aaa' }}>Coming Soon</span>
                        </div>

                        {/* SELLING HISTORY BOX */}
                        <div className="history-box" onClick={handleOpenHistory} style={{ cursor: 'pointer', transition: '0.2s' }}>
                            <h4>SELLING HISTORY</h4>
                            <span style={{ color: '#FF4500', textDecoration: 'underline', fontWeight: 'bold' }}>
                                View All Listings
                            </span>
                        </div>

                        {/*  NEW WISHLIST BOX  */}
                        <div className="history-box" onClick={handleOpenWishlist} style={{ cursor: 'pointer', transition: '0.2s' }}>
                            <h4>MY WISHLIST</h4>
                            <span style={{ color: '#FF4500', textDecoration: 'underline', fontWeight: 'bold' }}>
                                View Saved Items
                            </span>
                        </div>
                    </div>

                    <div className="edit-trigger-box" onClick={() => setIsModalOpen(true)}>
                        <span>EDIT PROFILE</span>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="stats-col">
                    <div className="stats-container">
                        <h3>Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-card"><img src="/stats-sold.png" alt="" /><span>Sold: 20</span></div>
                            <div className="stat-card"><img src="/stats-bought.png" alt="" /><span>Bought: 50</span></div>
                            <div className="stat-card"><img src="/stats-rating.png" alt="" /><span>Rating: 9/10</span></div>
                            <div className="stat-card"><img src="/stats-borrowed.png" alt="" /><span>Borrowed: 5</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- EDIT PROFILE MODAL --- */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="edit-playcard" onClick={(e) => e.stopPropagation()}>
                        <div className="playcard-header"><h2>UPDATE PROFILE</h2></div>
                        <div className="playcard-body">
                            {error && <div className="error-message-box">![ERROR]: {error}</div>}
                            <div className="edit-field">
                                <label>NAME</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="edit-field">
                                <label>DESCRIPTION</label>
                                <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows="3" />
                            </div>
                            <div className="edit-field">
                                <label>DEPARTMENT</label>
                                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                                    <option>Computer Science</option>
                                    <option>Software Engineering</option>
                                    <option>Data Science</option>
                                    <option>Electrical Engineering</option>
                                </select>
                            </div>
                            <div className="edit-field">
                                <label>NEW PASSWORD</label>
                                <input type="password" placeholder="Enter new password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                        </div>
                        <div className="playcard-footer">
                            <button className="p-btn save" onClick={handleSave}>SAVE</button>
                            <button className="p-btn cancel" onClick={() => setIsModalOpen(false)}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SELLING HISTORY MODAL --- */}
            {showHistoryModal && (
                <div className="modal-overlay">
                    <div className="edit-playcard">
                        <div className="playcard-header"><h2>YOUR LISTINGS</h2></div>
                        <div className="playcard-body">
                            {historyLoading ? (
                                <p style={{ textAlign: 'center' }}>Loading history...</p>
                            ) : sellingHistory.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'gray' }}>You haven't listed any items yet.</p>
                            ) : (
                                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                    {sellingHistory.map((item) => (
                                        <li key={item.item_id} style={{ padding: '10px 0', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {item.status === 'deleted' ? (
                                                <span style={{ color: '#777', textDecoration: 'line-through' }}>
                                                    {item.title} <span style={{ fontSize: '0.8em' }}>(deleted)</span>
                                                </span>
                                            ) : (
                                                <Link to={`/item/${item.item_id}`} style={{ color: '#FF4500', textDecoration: 'none', fontWeight: 'bold' }}>
                                                    {item.title}
                                                </Link>
                                            )}
                                            <span style={{ color: '#aaa', fontSize: '0.8em' }}>{item.status.toUpperCase()}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="playcard-footer" style={{ marginTop: '20px' }}>
                            <button style={{ width: '100%', backgroundColor: '#555', border: 'none', padding: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setShowHistoryModal(false)}>CLOSE</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- WISHLIST MODAL --- */}
            {showWishlistModal && (
                <div className="modal-overlay">
                    <div className="edit-playcard">
                        <div className="playcard-header"><h2>YOUR WISHLIST</h2></div>
                        <div className="playcard-body">
                            {wishlistLoading ? (
                                <p style={{ textAlign: 'center' }}>Loading wishlist...</p>
                            ) : wishlistItems.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'gray' }}>You haven't saved any items yet.</p>
                            ) : (
                                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                    {wishlistItems.map((item) => (
                                        <li key={item.item_id} style={{ padding: '10px 0', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Link to={`/item/${item.item_id}`} style={{ color: '#FF4500', textDecoration: 'none', fontWeight: 'bold' }}>
                                                {item.title}
                                            </Link>
                                            <span style={{ color: '#aaa', fontSize: '0.8em', backgroundColor: '#222', padding: '3px 6px', borderRadius: '4px' }}>
                                                PKR {item.price}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="playcard-footer" style={{ marginTop: '20px' }}>
                            <button style={{ width: '100%', backgroundColor: '#555', border: 'none', padding: '10px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setShowWishlistModal(false)}>CLOSE</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProfilePage;

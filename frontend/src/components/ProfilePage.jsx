import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import './ProfilePage.css';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({ name: '', bio: '', department: 'Computer Science', password: '' });
    const [error, setError] = useState("");

    // Mapping for your SQL Foreign Keys
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
                name: parsedUser.name || "",
                bio: parsedUser.bio || "",
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

            await axios.put(`http://localhost:5000/api/users/update/${user.id}`, dataToSubmit);
            
            // Update local session
            const updatedUser = { 
                ...user, 
                name: formData.name, 
                bio: formData.bio, 
                department: formData.department 
            };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            
            alert("Profile Synced Successfully.");
            window.location.reload(); // Force reload as requested
            
        } catch (err) {
            if (err.response && err.response.data.message) {
                setError(err.response.data.message); 
            } else {
                setError("System Error: Could not update profile.");
            }
        }
    };

    const displayName = user?.name;
    const displayPic = user?.profilePic || "https://via.placeholder.com/400/333332/white?text=No+Image";
    const displayBio = user?.bio ? user.bio.split('\n') : [];

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
                <div className="profile-left-col">
                    <h2 className="profile-username">{displayName}</h2>
                    <div className="profile-pic-frame">
                        <img src={displayPic} alt="Profile" />
                    </div>
                    <div className="profile-description">
                        <h3>Description</h3>
                        <ul>{displayBio.map((line, i) => <li key={i}>{line}</li>)}</ul>
                    </div>
                </div>

                <div className="profile-mid-col">
                    <div className="history-container">
                        <div className="history-box">
                            <h4>PURCHASE HISTORY</h4>
                            <a href="#">Uni-Thrift/Bought</a>
                        </div>
                        <div className="history-box">
                            <h4>BORROW HISTORY</h4>
                            <a href="#">Uni-Thrift/Borrowed</a>
                        </div>
                        <div className="history-box">
                            <h4>SELLING HISTORY</h4>
                            <a href="#">Uni-Thrift/Sold</a>
                        </div>
                    </div>

                    <div className="edit-trigger-box" onClick={() => setIsModalOpen(true)}>
                        <span>EDIT PROFILE</span>
                    </div>
                </div>

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

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="edit-playcard" onClick={(e) => e.stopPropagation()}>
                        <div className="playcard-header"><h2>UPDATE PROFILE</h2></div>
                        <div className="playcard-body">
                            {error && <div className="error-message-box">![ERROR]: {error}</div>}
                            <div className="edit-field">
                                <label>NAME</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                />
                            </div>
                            <div className="edit-field">
                                <label>DESCRIPTION</label>
                                <textarea 
                                    value={formData.bio} 
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                                    rows="3" 
                                />
                            </div>
                            <div className="edit-field">
                                <label>DEPARTMENT</label>
                                <select 
                                    value={formData.department} 
                                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                                >
                                    <option>Computer Science</option>
                                    <option>Software Engineering</option>
                                    <option>Data Science</option>
                                    <option>Electrical Engineering</option>
                                </select>
                            </div>
                            <div className="edit-field">
                                <label>NEW PASSWORD</label>
                                <input 
                                    type="password" 
                                    placeholder="Enter new password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="playcard-footer">
                            <button className="p-btn save" onClick={handleSave}>SAVE</button>
                            <button className="p-btn cancel" onClick={() => setIsModalOpen(false)}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
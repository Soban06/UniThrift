import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import NotificationCenter from './NotificationCenter'; 
import './ProfilePage.css'; 

const ProfilePage = () => {
    const navigate = useNavigate();
    const { userId: urlUserId } = useParams(); 

    const [profileUser, setProfileUser] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null); 
    const [loading, setLoading] = useState(true);

    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [borrowHistory, setBorrowHistory] = useState([]);
    const [sellingHistory, setSellingHistory] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [activeModal, setActiveModal] = useState(null); 
    
    // 🌟 EDIT PROFILE STATES
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editProfileData, setEditProfileData] = useState({
        name: '', bio: '', departmentId: '', password: ''
    });

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const storedUserStr = sessionStorage.getItem('user');
                const token = sessionStorage.getItem('token');
                let loggedInUserId = null;
                
                if (storedUserStr) {
                    const storedUser = JSON.parse(storedUserStr);
                    loggedInUserId = storedUser.id || storedUser.user_id;
                    setCurrentUserId(loggedInUserId); 
                }

                const targetUserId = urlUserId || loggedInUserId;

                if (!targetUserId) {
                    navigate('/login');
                    return;
                }

                const isOwn = String(targetUserId) === String(loggedInUserId);
                setIsOwnProfile(isOwn);

                // Fetch User & Departments
                const [userRes, deptRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/users/${targetUserId}/public`),
                    axios.get('http://localhost:5000/api/departments')
                ]);

                setProfileUser(userRes.data);
                setDepartments(deptRes.data);
                
                // Pre-fill the edit form
                setEditProfileData(prev => ({
                    ...prev,
                    name: userRes.data.full_name || userRes.data.name || '',
                    bio: userRes.data.user_description || ''
                }));

                const sellRes = await axios.get(`http://localhost:5000/api/users/${targetUserId}/listings`);
                setSellingHistory(sellRes.data);

                if (isOwn && token) {
                    const headers = { headers: { Authorization: `Bearer ${token}` } };
                    const [purchases, borrows, wishes] = await Promise.all([
                        axios.get(`http://localhost:5000/api/users/${targetUserId}/purchases`, headers),
                        axios.get(`http://localhost:5000/api/users/${targetUserId}/borrows`, headers),
                        axios.get(`http://localhost:5000/api/users/${targetUserId}/wishlist`, headers)
                    ]);

                    setPurchaseHistory(purchases.data);
                    setBorrowHistory(borrows.data);
                    setWishlist(wishes.data);
                }

            } catch (error) {
                console.error("Error fetching profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [urlUserId, navigate]);

    // INITIATE PHYSICAL RETURN HANDSHAKE
    const initiateReturn = async (item) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.post('http://localhost:5000/api/transactions/return/initiate', {
                transactionId: item.transaction_id,
                sellerId: item.seller_id,
                itemId: item.item_id
            }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Return handshake sent to the lender! Waiting for them to confirm.");
        } catch (e) {
            console.error(e);
            alert("Failed to initiate return.");
        }
    }

    // 🌟 SAVE EDITED PROFILE
    const handleSaveProfile = async () => {
        if (!editProfileData.departmentId) return alert("Please select a department!");
        
        try {
            const token = sessionStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/users/update/${currentUserId}`, editProfileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Profile updated successfully!");
            setIsEditProfileOpen(false);
            window.location.reload(); // Refresh to show new data
        } catch (err) {
            console.error(err);
            alert("Failed to update profile. " + (err.response?.data?.message || ""));
        }
    };

    if (loading) return <div className="profile-page-wrapper"><h1 style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Loading...</h1></div>;
    if (!profileUser) return <div className="profile-page-wrapper"><h1 style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>User Not Found</h1></div>;

    const getLinkStyle = (isClickable) => ({
        color: isClickable ? '#FF4500' : '#555',
        cursor: isClickable ? 'pointer' : 'not-allowed',
        textDecoration: isClickable ? 'underline' : 'none',
        fontSize: '1rem',
        fontWeight: 'bold',
        display: 'inline-block'
    });

    const renderHistoryModal = () => {
        let data = [];
        let title = "";
        
        if (activeModal === 'purchases') { data = purchaseHistory; title = "Purchase History"; }
        else if (activeModal === 'borrows') { data = borrowHistory; title = "Borrow History"; }
        else if (activeModal === 'selling') { data = sellingHistory; title = "Selling History"; }
        else if (activeModal === 'wishlist') { data = wishlist; title = "My Wishlist"; }

        return (
            <div className="modal-overlay" onClick={() => setActiveModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '650px', maxHeight: '80vh', backgroundColor: '#121212', border: '4px solid #ffffff', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#ffffff', color: '#000000', borderBottom: '4px solid #000000' }}>
                        <h2 style={{ margin: 0, textTransform: 'uppercase' }}>{title}</h2>
                        <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: '#000', fontSize: '2rem', cursor: 'pointer', lineHeight: '1' }}>&times;</button>
                    </div>
                    
                    <div style={{ padding: '20px', overflowY: 'auto', flex: 1, color: 'white' }}>
                        {data.length === 0 ? (
                            <p style={{ color: '#aaa', textAlign: 'center', fontStyle: 'italic', marginTop: '20px' }}>No records found.</p>
                        ) : (
                            data.map((item, idx) => {
                                const status = item.item_status || item.status; 
                                const isDeleted = status === 'deleted';
                                const itemId = item.item_id;
                                const formattedDate = new Date(item.transaction_date).toLocaleString();
                                const isPhysicalBorrow = activeModal === 'borrows' && !item.is_digital && item.tx_status === 'completed' && !isDeleted;

                                return (
                                    <div key={idx} 
                                        onClick={() => !isDeleted && navigate(`/item/${itemId}`)}
                                        style={{
                                            padding: '15px', border: '2px solid #444', marginBottom: '10px', backgroundColor: '#1a1a1a',
                                            cursor: isDeleted ? 'not-allowed' : 'pointer', opacity: isDeleted ? 0.4 : 1, transition: 'border-color 0.2s',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => !isDeleted && (e.currentTarget.style.borderColor = '#FF4500')}
                                        onMouseLeave={(e) => !isDeleted && (e.currentTarget.style.borderColor = '#444')}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.2rem', marginBottom: '5px' }}>
                                                {item.title} {item.quantity ? `(x${item.quantity})` : ''}
                                            </div>
                                            <div style={{ color: '#aaa', fontSize: '0.95rem' }}>
                                                {activeModal === 'purchases' || activeModal === 'borrows' ? `Acquired: ${formattedDate}` : `Status: ${status.toUpperCase()}`}
                                                {activeModal === 'borrows' && item.return_date && item.tx_status !== 'returned' && (
                                                    <div style={{ color: '#FF4500', marginTop: '5px', fontWeight: 'bold' }}>
                                                        Must Return By: {new Date(item.return_date).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {isDeleted && <span style={{ color: '#f44336', fontWeight: 'bold', fontSize: '1rem', border: '1px solid #f44336', padding: '5px 10px' }}>DELETED</span>}
                                            {item.tx_status === 'returned' && <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1rem', border: '1px solid #4CAF50', padding: '5px 10px' }}>RETURNED</span>}
                                            
                                            {isPhysicalBorrow && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); initiateReturn(item); }} 
                                                    style={{ padding: '8px 15px', backgroundColor: '#FF9800', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
                                                >
                                                    RETURN ITEM
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="profile-page-wrapper">
            
            <header className="profile-header">
                <div className="profile-banner">
                    <div className="profile-banner-inner">
                        <h1>USER-PAGE</h1>
                    </div>
                </div>
                <div className="header-deco" />
                <div className="back-ribbon" onClick={() => navigate('/')}>
                    <div className="back-ribbon-inner"><span>BACK TO HOME PAGE</span></div>
                </div>
            </header>

            <div className="profile-content-grid">
                
                {/* LEFT COLUMN */}
                <div className="profile-left-col">
                    <h2 className="profile-username" style={{ fontSize: '2.2rem', margin: '0 0 15px 0', lineHeight: '1' }}>
                        {profileUser.full_name || profileUser.name || 'User'}
                    </h2>
                    
                    <div className="profile-pic-frame" style={{ backgroundColor: '#ccc', border: '2px solid #555', marginBottom: '20px', aspectRatio: '1/1' }}>
                        <img src={profileUser.profile_pic_url || '/default-avatar.png'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    
                    <div className="profile-description" style={{ border: '1px solid #555', padding: '15px', backgroundColor: '#1a1a1a' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', textTransform: 'uppercase' }}>Description</h3>
                        <p style={{ color: '#aaa', margin: 0, fontSize: '1rem' }}>{profileUser.user_description || 'No description provided.'}</p>
                    </div>
                </div>

                {/* MIDDLE COLUMN (Interactive History Links) */}
                <div className="profile-mid-col">
                    <div className="history-container" style={{ border: '1px solid #555', borderRadius: '8px', backgroundColor: '#222', padding: '25px', marginTop: '12px' }}>
                        
                        <div style={{ borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#ffff', textTransform: 'uppercase' }}>Purchase History</h4>
                            <span style={getLinkStyle(isOwnProfile)} onClick={() => isOwnProfile && setActiveModal('purchases')}>
                                {isOwnProfile ? 'View Purchase History' : 'Private History'}
                            </span>
                        </div>

                        <div style={{ borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#ffff', textTransform: 'uppercase' }}>Borrow History</h4>
                            <span style={getLinkStyle(isOwnProfile)} onClick={() => isOwnProfile && setActiveModal('borrows')}>
                                {isOwnProfile ? 'View Borrow History' : 'Private History'}
                            </span>
                        </div>

                        <div style={{ borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#ffff', textTransform: 'uppercase' }}>Selling History</h4>
                            <span style={getLinkStyle(true)} onClick={() => setActiveModal('selling')}>
                                View All Listings
                            </span>
                        </div>

                        <div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#ffff', textTransform: 'uppercase' }}>Wishlist</h4>
                            <span style={getLinkStyle(isOwnProfile)} onClick={() => isOwnProfile && setActiveModal('wishlist')}>
                                {isOwnProfile ? 'View Saved Items' : 'Private Wishlist'}
                            </span>
                        </div>

                    </div>

                    {/* 🌟 THE FIXED EDIT PROFILE BUTTON */}
                    {isOwnProfile && (
                        <button 
                            onClick={() => setIsEditProfileOpen(true)}
                            style={{ width: '100%', marginTop: '20px', backgroundColor: '#333', color: 'white', padding: '15px', border: '1px solid #555', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1.1rem' }}
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* RIGHT COLUMN (Dynamic Statistics) */}
                <div className="profile-right-col" style={{ flex: 1 }}>
                    <div style={{ border: '1px solid #ffff', borderRadius: '8px', backgroundColor: '#1a1a1a', padding: '25px', marginTop: '12px' }}>
                        <h3 style={{ margin: '0 0 25px 0', fontSize: '1.4rem' }}>Statistics</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>🏷️</span>
                                    <span>Sold: {profileUser.total_sold}</span>
                                </div>
                            </div>
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>🧾</span>
                                    <span>Bought: {profileUser.total_bought}</span>
                                </div>
                            </div>
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '200px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>⭐</span>
                                    {profileUser.reliability_score ? (
                                        <span>Rating: {Number(profileUser.reliability_score).toFixed(2)} / 5.00</span>
                                    ) : (
                                        <span style={{ fontStyle: 'italic', fontSize: '1rem', color: '#666' }}>No rating yet</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>🤝</span>
                                    <span>Borrowed: {profileUser.total_borrowed}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isOwnProfile && currentUserId && (
                        <div style={{ marginTop: '20px' }}>
                            <NotificationCenter currentUserId={currentUserId} />
                        </div>
                    )}
                </div>

            </div>

            {/* MOUNT THE MODALS HERE */}
            {activeModal && renderHistoryModal()}

            {/* 🌟 EDIT PROFILE MODAL */}
            {isEditProfileOpen && (
                <div className="modal-overlay" onClick={() => setIsEditProfileOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '500px', backgroundColor: '#121212', border: '4px solid #ffffff', padding: '25px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        
                        <h2 style={{ color: '#fff', borderBottom: '2px solid #555', paddingBottom: '10px', marginTop: 0, textTransform: 'uppercase' }}>Edit Profile</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>FULL NAME</label>
                                <input type="text" value={editProfileData.name} onChange={e => setEditProfileData({...editProfileData, name: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', marginTop: '5px', fontSize: '1rem', boxSizing: 'border-box' }} />
                            </div>
                            
                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>BIO / DESCRIPTION</label>
                                <textarea value={editProfileData.bio} onChange={e => setEditProfileData({...editProfileData, bio: e.target.value})} rows="3" style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', marginTop: '5px', fontSize: '1rem', boxSizing: 'border-box' }} />
                            </div>
                            
                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>DEPARTMENT</label>
                                <select value={editProfileData.departmentId} onChange={e => setEditProfileData({...editProfileData, departmentId: e.target.value})} style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', marginTop: '5px', fontSize: '1rem', boxSizing: 'border-box' }}>
                                    <option value="" disabled>Select a department...</option>
                                    {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>NEW PASSWORD</label>
                                <input type="password" value={editProfileData.password} onChange={e => setEditProfileData({...editProfileData, password: e.target.value})} placeholder="Leave blank to keep current password" style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', marginTop: '5px', fontSize: '1rem', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                            <button onClick={handleSaveProfile} style={{ flex: 1, padding: '12px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}>SAVE CHANGES</button>
                            <button onClick={() => setIsEditProfileOpen(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#f44336', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProfilePage;
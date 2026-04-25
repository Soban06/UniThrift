import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import NotificationCenter from './NotificationCenter'; // 🌟 Restored the import!
import './ProfilePage.css'; 

const ProfilePage = () => {
    const navigate = useNavigate();
    const { userId: urlUserId } = useParams(); 

    const [profileUser, setProfileUser] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null); // 🌟 Restored currentUserId state
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const storedUserStr = sessionStorage.getItem('user');
                let loggedInUserId = null;
                if (storedUserStr) {
                    const storedUser = JSON.parse(storedUserStr);
                    loggedInUserId = storedUser.id || storedUser.user_id;
                    setCurrentUserId(loggedInUserId); // 🌟 Set it so we can pass it to Notifications
                }

                const targetUserId = urlUserId || loggedInUserId;

                if (!targetUserId) {
                    navigate('/login');
                    return;
                }

                setIsOwnProfile(String(targetUserId) === String(loggedInUserId));

                const userRes = await axios.get(`http://localhost:5000/api/users/${targetUserId}/public`);
                setProfileUser(userRes.data);

            } catch (error) {
                console.error("Error fetching profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [urlUserId, navigate]);

    if (loading) return <div className="profile-page-wrapper"><h1 style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Loading...</h1></div>;
    if (!profileUser) return <div className="profile-page-wrapper"><h1 style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>User Not Found</h1></div>;

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

                {/* 🌟 MIDDLE COLUMN */}
                <div className="profile-mid-col">
                    <div className="history-container" style={{ border: '1px solid #555', borderRadius: '8px', backgroundColor: '#222', padding: '25px', marginTop: '12px' }}>
                        
                        <div style={{ borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px', opacity: isOwnProfile ? 1 : 0.5 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#ffff', textTransform: 'uppercase' }}>Purchase History</h4>
                            {isOwnProfile ? (
                                <p style={{ margin: 0, color: '#888', fontSize: '1rem' }}>Coming Soon</p>
                            ) : (
                                <p style={{ margin: 0, color: '#888', fontSize: '1rem', fontStyle: 'italic' }}>
                                    (You can only view your own buying history)
                                </p>
                            )}
                        </div>

                        <div style={{ borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px', opacity: isOwnProfile ? 1 : 0.5 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#ffff', textTransform: 'uppercase' }}>Borrow History</h4>
                            {isOwnProfile ? (
                                <p style={{ margin: 0, color: '#888', fontSize: '1rem' }}>Coming Soon</p>
                            ) : (
                                <p style={{ margin: 0, color: '#888', fontSize: '1rem', fontStyle: 'italic' }}>
                                    (You can only view your own borrowing history)
                                </p>
                            )}
                        </div>

                        <div style={{ borderBottom: isOwnProfile ? '1px solid #444' : 'none', paddingBottom: isOwnProfile ? '15px' : '0', marginBottom: isOwnProfile ? '20px' : '0' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#ffff', textTransform: 'uppercase' }}>Selling History</h4>
                            <p style={{ margin: 0, color: '#FF4500', fontSize: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                View All Listings
                            </p>
                        </div>

                        {isOwnProfile && (
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#ffff', textTransform: 'uppercase' }}>My Wishlist</h4>
                                <p style={{ margin: 0, color: '#FF4500', fontSize: '1rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                    View Saved Items
                                </p>
                            </div>
                        )}
                    </div>

                    {isOwnProfile && (
                        <button style={{ width: '100%', marginTop: '20px', backgroundColor: '#333', color: 'white', padding: '15px', border: '1px solid #555', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1.1rem' }}>
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* 🌟 RIGHT COLUMN */}
                <div className="profile-right-col" style={{ flex: 1 }}>
                    <div style={{ border: '1px solid #ffff', borderRadius: '8px', backgroundColor: '#1a1a1a', padding: '25px', marginTop: '12px' }}>
                        <h3 style={{ margin: '0 0 25px 0', fontSize: '1.4rem' }}>Statistics</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>🏷️</span>
                                    <span>Sold: 20</span>
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>🧾</span>
                                    <span>Bought: 50</span>
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>⭐</span>
                                    <span>Rating: {profileUser.reliability_score || '5'}</span>
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>🤝</span>
                                    <span>Borrowed: 5</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* 🌟 RESTORED NOTIFICATIONS BLOCK */}
                    {isOwnProfile && currentUserId && (
                        <div style={{ marginTop: '20px' }}>
                            <NotificationCenter currentUserId={currentUserId} />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProfilePage;
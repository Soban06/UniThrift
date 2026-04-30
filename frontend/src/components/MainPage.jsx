import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import './MainPage.css';

const MainPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // --- SOS MODAL STATES ---
    const [isSosModalOpen, setIsSosModalOpen] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [sosMessage, setSosMessage] = useState('');
    
    //  NEW: The UI Lock State
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [sosForm, setSosForm] = useState({
        title: '',
        description: '',
        qty: 1,
        price: 0,
        deptId: '',
        priority: 'high' 
    });

    const leftRef = useRef(null);
    const rightRef = useRef(null);
    const headerRef = useRef(null);
    const [dividerStyle, setDividerStyle] = useState({});

    const SLANT_PX = 60;

    const calcDivider = () => {
        if (!leftRef.current || !rightRef.current || !headerRef.current) return;

        const headerRect = headerRef.current.getBoundingClientRect();
        const leftRect = leftRef.current.getBoundingClientRect();
        const rightRect = rightRef.current.getBoundingClientRect();

        const leftTopRightX = leftRect.right - headerRect.left;
        const leftTopRightY = leftRect.top - headerRect.top;

        const rightTopLeftX = rightRect.left - headerRect.left + SLANT_PX;
        const rightTopLeftY = rightRect.top - headerRect.top;

        const midX = (leftTopRightX + rightTopLeftX) / 2;
        const midY = (leftTopRightY + rightTopLeftY) / 2;

        const leftH = leftRect.height;
        const angleRad = Math.atan((SLANT_PX * 1.2) / leftH);
        const angleDeg = angleRad * (180 / Math.PI);
        const lineH = leftH + 10;

        setDividerStyle({
            position: 'absolute',
            left: `${midX}px`,
            top: `${midY}px`,
            height: `${lineH}px`,
            transform: `rotate(${angleDeg}deg)`,
        });
    };

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchDepts = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/departments');
                setDepartments(res.data);
            } catch (err) {
                console.error("Failed to fetch departments", err);
            }
        };
        fetchDepts();
    }, []);

    useEffect(() => {
        calcDivider();
        window.addEventListener('resize', calcDivider);
        return () => window.removeEventListener('resize', calcDivider);
    }, []);

    const handleLogout = (e) => {
        e.stopPropagation();
        sessionStorage.removeItem('user');
        setUser(null);
        setShowDropdown(false);
    };

    // ---  SOS SUBMIT LOGIC (NOW WITH UI LOCK AND INSTANT REDIRECT) ---
    const handleSosSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return; // Prevent double clicks
        
        setSosMessage('');

        if (!user) {
            setSosMessage('❌ You must be logged in.');
            return;
        }

        setIsSubmitting(true); // Lock the UI instantly!

        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/sos', {
                requesterId: user.id || user.user_id,
                deptId: sosForm.deptId,
                title: sosForm.title,
                description: sosForm.description,
                qty: sosForm.qty,
                price: sosForm.price,
                priority: sosForm.priority
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Instant Redirect to the new SOS Page
            navigate(`/sos/${response.data.requestId}`);

        } catch (error) {
            console.error("SOS Submit Error", error);
            setSosMessage('❌ Failed to broadcast SOS.');
            setIsSubmitting(false); // Only unlocking if it fails so they can try again
        }
    };

    return (
        <div className="main-page-wrapper">
            <header className="top-nav-container" ref={headerRef}>
                <div className="mechanical-panel main-block" ref={leftRef}>
                    <div className="panel-inner">
                        <h1 className="nav-title" style={{ pointerEvents: "none", userSelect: "none" }}>UNI-THRIFT</h1>
                        <img src="/logo.png" alt="Logo" className="nav-logo-img" />
                    </div>
                </div>

                <div className="nav-divider" style={dividerStyle} />

                <div className="mechanical-panel auth-block" ref={rightRef} onClick={() => !user && navigate('/login')}>
                    <div className="panel-inner">
                        {user ? (
                            <div className="user-profile-widget" onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}>
                                <span className="header-username">{user.name.split(' ')[0]}</span>
                                <img src={user.profilePic || "https://via.placeholder.com/150/ffffff/000000?text=U"} alt="PFP" className="header-pfp" />
                            </div>
                        ) : (
                            <h2 className="login-trigger">LOGIN/SIGNUP</h2>
                        )}
                    </div>
                </div>

                {user && showDropdown && (
                    <div className="header-dropdown">
                        <button onClick={(e) => { e.stopPropagation(); navigate('/profile'); setShowDropdown(false); }}>
                            VIEW PROFILE
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleLogout(e); }}>
                            LOG OUT
                        </button>
                    </div>
                )}
            </header>

            <div className="cards-container">
                <div className="action-card" onClick={() => navigate('/marketplace')}>
                    <img src="/buy.png" alt="Buy" className="card-img" />
                    <h2>BUY</h2>
                </div>

                <div
                    className="action-card"
                    onClick={() => {
                        if (user) {
                            navigate('/upload-item');
                        } else {
                            alert('You must be logged in to list items for sale!');
                        }
                    }}
                >
                    <img src="/sell.png" alt="Sell" className="card-img" />
                    <h2>SELL</h2>
                </div>

                <div 
                    className="action-card" 
                    onClick={() => {
                        if (user) {
                            setIsSosModalOpen(true);
                        } else {
                            alert('You must be logged in to create an emergency borrow request!');
                        }
                    }}
                >
                    <img src="/borrow.png" alt="Borrow" className="card-img" />
                    <h2>BORROW</h2>
                </div>
            </div>

            {isSosModalOpen && (
                <div className="modal-overlay" onClick={() => !isSubmitting && setIsSosModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    
                    <div className="sos-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '600px', backgroundColor: '#121212', border: '4px solid #ffffff', padding: '30px', color: 'white' }}>
                        
                        <h2 style={{ margin: '0 0 20px 0', borderBottom: '4px solid #fff', paddingBottom: '10px', textTransform: 'uppercase', color: '#FF4500' }}>
                            CREATE S.O.S BORROW REQUEST
                        </h2>
                        
                        <p style={{ color: '#aaa', marginBottom: '20px' }}>
                            Need something urgently? Broadcast a request to your department. Lenders will be notified immediately.
                        </p>

                        {sosMessage && (
                            <div style={{ padding: '10px', marginBottom: '20px', backgroundColor: sosMessage.includes('✅') ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)', border: `2px solid ${sosMessage.includes('✅') ? '#4CAF50' : '#f44336'}`, color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                                {sosMessage}
                            </div>
                        )}

                        <form onSubmit={handleSosSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>WHAT DO YOU NEED?</label>
                                <input type="text" value={sosForm.title} onChange={(e) => setSosForm({...sosForm, title: e.target.value})} disabled={isSubmitting} required style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: 'white', border: '2px solid #555', boxSizing: 'border-box' }} placeholder="e.g. Engineering Drawing Kit" />
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>TARGET DEPARTMENT</label>
                                    <select value={sosForm.deptId} onChange={(e) => setSosForm({...sosForm, deptId: e.target.value})} disabled={isSubmitting} required style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: 'white', border: '2px solid #555', boxSizing: 'border-box' }}>
                                        <option value="" disabled>Select Dept...</option>
                                        {departments.map(d => (
                                            <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>PRIORITY</label>
                                    <select value={sosForm.priority} onChange={(e) => setSosForm({...sosForm, priority: e.target.value})} disabled={isSubmitting} style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: 'white', border: '2px solid #555', boxSizing: 'border-box' }}>
                                        <option value="low">Low (Next few days)</option>
                                        <option value="high">High (Tomorrow)</option>
                                        <option value="emergency">EMERGENCY (Today!)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>WILLING TO PAY (PKR)</label>
                                    <input type="number" value={sosForm.price} onChange={(e) => setSosForm({...sosForm, price: e.target.value})} disabled={isSubmitting} min="0" required style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: 'white', border: '2px solid #555', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>QUANTITY NEEDED</label>
                                    <input type="number" value={sosForm.qty} onChange={(e) => setSosForm({...sosForm, qty: e.target.value})} disabled={isSubmitting} min="1" required style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: 'white', border: '2px solid #555', boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>EXTRA DETAILS</label>
                                <textarea value={sosForm.description} onChange={(e) => setSosForm({...sosForm, description: e.target.value})} disabled={isSubmitting} rows="3" style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: 'white', border: '2px solid #555', boxSizing: 'border-box' }} placeholder="Specify condition needed, time you need it by, etc." />
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: '15px', backgroundColor: isSubmitting ? '#555' : '#FF4500', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                                    {isSubmitting ? 'BROADCASTING...' : 'BROADCAST S.O.S'}
                                </button>
                                <button type="button" disabled={isSubmitting} onClick={() => setIsSosModalOpen(false)} style={{ flex: 1, padding: '15px', backgroundColor: '#333', color: isSubmitting ? '#888' : 'white', border: '2px solid #fff', fontWeight: 'bold', fontSize: '1.1rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                                    CANCEL
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MainPage;

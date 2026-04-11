import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const leftRef = useRef(null);
    const rightRef = useRef(null);
    const headerRef = useRef(null);
    const [dividerStyle, setDividerStyle] = useState({});

    const SLANT_PX = 60; // must match CSS --clip polygon offset

    const calcDivider = () => {
        if (!leftRef.current || !rightRef.current || !headerRef.current) return;

        const headerRect = headerRef.current.getBoundingClientRect();
        const leftRect = leftRef.current.getBoundingClientRect();
        const rightRect = rightRef.current.getBoundingClientRect();

        // Top-right of left panel
        const leftTopRightX = leftRect.right - headerRect.left;
        const leftTopRightY = leftRect.top - headerRect.top;

        // Top-left of right panel
        const rightTopLeftX = rightRect.left - headerRect.left + SLANT_PX;
        const rightTopLeftY = rightRect.top - headerRect.top;

        // Midpoint
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

    return (
        <div className="main-page-wrapper">
            <header className="top-nav-container" ref={headerRef}>

                {/* --- LEFT PANEL: Title + Logo --- */}
                {/* Removed the onClick navigation from this block */}
                <div className="mechanical-panel main-block" ref={leftRef}>
                    <div className="panel-inner">
                        <h1 className="nav-title" style={{ pointerEvents: "none", userSelect: "none" }}>UNI-THRIFT</h1>
                        <img src="/logo.png" alt="Logo" className="nav-logo-img" />
                    </div>
                </div>

                {/* --- THE SLANTED DIVIDER --- */}
                <div className="nav-divider" style={dividerStyle} />

                {/* --- RIGHT PANEL: Auth / Profile --- */}
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

                {/* --- THE DROPDOWN (Outside clip-path panels) --- */}
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
                {/* BUY CARD */}
                <div className="action-card" onClick={() => navigate('/marketplace')}>
                    <img src="/buy.png" alt="Buy" className="card-img" />
                    <h2>BUY</h2>
                </div>

                {/* SELL CARD (No Redirect) */}
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

                {/* BORROW CARD */}
                <div className="action-card" onClick={() => alert('Borrowing Feature Coming Soon!')}>
                    <img src="/borrow.png" alt="Borrow" className="card-img" />
                    <h2>BORROW</h2>
                </div>
            </div>
        </div>
    );
};

export default MainPage;
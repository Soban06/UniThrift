import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = ({ currentUserId }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    
    const [groupedMessages, setGroupedMessages] = useState([]);
    const [handshakes, setHandshakes] = useState([]);
    const [sosAlerts, setSosAlerts] = useState([]);
    const [myActiveSos, setMyActiveSos] = useState([]); 
    
    // 🌟 NEW STATES FOR RATINGS
    const [ratingRequests, setRatingRequests] = useState([]);
    const [selectedRatings, setSelectedRatings] = useState({}); // Tracks { transactionId: score }

    const fetchNotifications = useCallback(async () => {
        if (!currentUserId) return;
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/notifications/${currentUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const data = res.data;

            setHandshakes(data.filter(n => n.notification_type === 'handshake_request'));
            
            setMyActiveSos(data.filter(n => n.notification_type === 'sos_alert' && n.user_id === n.sender_id));
            setSosAlerts(data.filter(n => n.notification_type === 'sos_alert' && n.user_id !== n.sender_id));

            // 🌟 Capture rating requests
            setRatingRequests(data.filter(n => n.notification_type === 'rating_request'));

            const msgs = data.filter(n => n.notification_type === 'message' || n.notification_type.includes('rejected'));
            const grouped = msgs.reduce((acc, curr) => {
                if (!acc[curr.sender_id]) {
                    acc[curr.sender_id] = { sender_id: curr.sender_id, sender_name: curr.sender_name || 'System', count: 0, latest_msg: curr.message_text };
                }
                acc[curr.sender_id].count += 1;
                return acc;
            }, {});
            setGroupedMessages(Object.values(grouped));

        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    }, [currentUserId]); 

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications, isOpen]);

    // --- ACTIONS ---
    const handleReadAllDMs = async () => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/notifications/${currentUserId}/read-dms`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications(); 
        } catch (error) {
            console.error("Error clearing DMs", error);
        }
    };

    const handleResolveHandshake = async (transactionId, action, sosId = null) => {
        try {
            const token = sessionStorage.getItem('token');
            await axios.post('http://localhost:5000/api/transactions/handshake/resolve', {
                transactionId,
                userId: currentUserId,
                action, 
                sosId   
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications(); 
        } catch (error) {
            console.error("Error resolving handshake", error);
            alert("Failed to resolve handshake.");
        }
    };

    const handleTakeDownSos = async (sosId) => {
        const confirm = window.confirm("Are you sure you want to take down this S.O.S request?");
        if (!confirm) return;
        try {
            const token = sessionStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/sos/${sosId}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { userId: currentUserId }
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error taking down SOS", error);
            alert("Failed to take down the request.");
        }
    };

    // 🌟 NEW: Submit Rating Function
    const handleSubmitRating = async (transactionId) => {
        const score = selectedRatings[transactionId];
        if (!score) return alert("Please select a star rating first!");

        try {
            const token = sessionStorage.getItem('token');
            await axios.post('http://localhost:5000/api/ratings', {
                transactionId,
                score
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            fetchNotifications(); // Refresh list to remove the rating notification
        } catch (error) {
            console.error("Failed to submit rating", error);
            alert("Error submitting rating.");
        }
    };

    // Include rating requests in the red pending badge
    const totalPending = handshakes.length + groupedMessages.length + sosAlerts.length + myActiveSos.length + ratingRequests.length;

    return (
        <>
            <div onClick={() => setIsOpen(true)} style={{ width: '100%', padding: '15px', backgroundColor: '#ffffff', color: '#000000', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', textTransform: 'uppercase', fontSize: '1.1rem', borderRadius: '8px' }}>
                <span>OPEN NOTIFICATIONS</span>
                {totalPending > 0 && <span style={{ backgroundColor: '#FF4500', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>{totalPending} PENDING</span>}
            </div>

            {isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setIsOpen(false)}>
                    <div style={{ width: '800px', backgroundColor: '#121212', border: '4px solid #ffffff', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#ffffff', color: '#000000', borderBottom: '4px solid #000000' }}>
                            <h2 style={{ margin: 0, textTransform: 'uppercase' }}>Notification Center</h2>
                            <button onClick={handleReadAllDMs} style={{ padding: '8px 15px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>READ ALL DMs</button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, color: 'white' }}>
                            {totalPending === 0 && <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '40px' }}>No pending notifications.</p>}

                            {/* 🌟 RATINGS TABLE (Displays pending reviews) */}
                            {ratingRequests.length > 0 && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{ borderBottom: '2px solid #555', paddingBottom: '10px', color: '#FFD700' }}>PENDING REVIEWS</h3>
                                    {ratingRequests.map(r => (
                                        <div key={r.notification_id} style={{ padding: '20px', border: '2px solid #FFD700', marginBottom: '10px', backgroundColor: '#1a1a1a', textAlign: 'center' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff', marginBottom: '5px' }}>Rate: {r.item_name}</div>
                                            <div style={{ color: '#aaa', fontStyle: 'italic', marginBottom: '15px' }}>Seller: {r.sender_name}</div>
                                            
                                            {/* Interactive Stars */}
                                            <div style={{ fontSize: '3rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                                                {[1, 2, 3, 4, 5].map(star => {
                                                    const currentScore = selectedRatings[r.transaction_id] || 0;
                                                    return (
                                                        <span 
                                                            key={star}
                                                            onClick={() => setSelectedRatings({ ...selectedRatings, [r.transaction_id]: star })}
                                                            style={{ color: star <= currentScore ? '#FFD700' : '#444', transition: 'color 0.2s', userSelect: 'none' }}
                                                        >
                                                            ★
                                                        </span>
                                                    );
                                                })}
                                            </div>

                                            <button 
                                                onClick={() => handleSubmitRating(r.transaction_id)}
                                                style={{ padding: '12px 30px', backgroundColor: '#FFD700', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '1.1rem' }}
                                            >
                                                SUBMIT RATING
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* MY ACTIVE S.O.S (Control Panel) */}
                            {myActiveSos.length > 0 && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{ borderBottom: '2px solid #555', paddingBottom: '10px', color: '#FFD700' }}>MY ACTIVE S.O.S</h3>
                                    {myActiveSos.map(s => (
                                        <div key={s.notification_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '2px solid #FFD700', marginBottom: '10px', backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px', color: '#FFD700' }}>{s.sos_name || 'My S.O.S Request'}</div>
                                                <div style={{ color: '#ccc' }}>{s.message_text}</div>
                                            </div>
                                            <button onClick={() => handleTakeDownSos(s.sos_id)} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>TAKE DOWN</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 1. HANDSHAKES TABLE */}
                            {handshakes.length > 0 && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{ borderBottom: '2px solid #555', paddingBottom: '10px', color: '#FF4500' }}>PENDING HANDSHAKES</h3>
                                    {handshakes.map(h => {
                                        const isSos = h.sos_id !== null && h.sos_id !== undefined;
                                        const isWaitingBorrower = !isSos && h.message_text.includes('Waiting');

                                        return (
                                            <div key={h.notification_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '2px solid #333', marginBottom: '10px', backgroundColor: '#1a1a1a' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px' }}>{isSos ? `S.O.S Offer: ${h.sos_name || h.item_name}` : h.item_name} (Qty: {h.quantity})</div>
                                                    <div style={{ color: '#aaa', fontStyle: 'italic', marginBottom: '8px', fontSize: '0.95rem' }}>"{h.message_text}"</div>
                                                    <div style={{ color: '#888' }}>{isSos ? 'Offered by:' : (isWaitingBorrower ? 'Requested from:' : 'Requested by:')} <span style={{ color: '#fff' }}>{h.sender_name}</span></div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {isWaitingBorrower ? (
                                                        <button onClick={() => handleResolveHandshake(h.transaction_id, 'reject')} style={{ padding: '10px 20px', backgroundColor: '#FF9800', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>CANCEL REQUEST</button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleResolveHandshake(h.transaction_id, 'accept', h.sos_id)} style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>ACCEPT</button>
                                                            <button onClick={() => handleResolveHandshake(h.transaction_id, 'reject', h.sos_id)} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>REJECT</button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* 2. MESSAGES TABLE */}
                            {groupedMessages.length > 0 && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{ borderBottom: '2px solid #555', paddingBottom: '10px', color: '#4A90E2' }}>NEW MESSAGES & ALERTS</h3>
                                    {groupedMessages.map(m => (
                                        <div key={m.sender_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '2px solid #333', marginBottom: '10px', backgroundColor: '#1a1a1a' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px' }}>{m.sender_name}</div>
                                                <div style={{ color: '#aaa', fontStyle: 'italic' }}>"{m.latest_msg}"</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {m.sender_name !== 'System' && <button onClick={() => { setIsOpen(false); navigate(`/chat/null/${m.sender_id}`); }} style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', border: '1px solid #fff', fontWeight: 'bold', cursor: 'pointer' }}>VIEW CHAT</button>}
                                                <button onClick={handleReadAllDMs} style={{ padding: '10px 20px', backgroundColor: '#222', color: '#888', border: '1px solid #555', cursor: 'pointer' }}>CLEAR</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 3. SOS ALERTS */}
                            {sosAlerts.length > 0 && (
                                <div>
                                    <h3 style={{ borderBottom: '2px solid #555', paddingBottom: '10px', color: '#f44336' }}>COMMUNITY S.O.S</h3>
                                    {sosAlerts.map(s => (
                                        <div key={s.notification_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '2px solid #f44336', marginBottom: '10px', backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px', color: '#f44336' }}>EMERGENCY REQUEST</div>
                                                <div style={{ color: '#ccc' }}>{s.message_text}</div>
                                            </div>
                                            <button onClick={() => { setIsOpen(false); navigate(`/sos/${s.sos_id}`); }} style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>VIEW SOS</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '15px', backgroundColor: '#ffffff', textAlign: 'center' }}>
                            <button onClick={() => setIsOpen(false)} style={{ padding: '10px 30px', backgroundColor: '#000', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>CLOSE</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NotificationCenter;
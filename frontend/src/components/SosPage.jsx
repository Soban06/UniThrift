import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

const SosPage = () => {
    const { sosId } = useParams();
    const navigate = useNavigate();

    const [sos, setSos] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    // 🌟 NEW: UI Lock state to prevent double-clicks or navigating away mid-request
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSosData = async () => {
            try {
                const storedUser = JSON.parse(sessionStorage.getItem('user'));
                if (storedUser) setCurrentUserId(storedUser.id || storedUser.user_id);

                const response = await axios.get('http://localhost:5000/api/sos/' + sosId);
                setSos(response.data);
            } catch (error) {
                console.error("Error fetching SOS details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSosData();
    }, [sosId]);

    // 🌟 SEND S.O.S HANDSHAKE OFFER
    const handleAcceptLend = async () => {
        if (!currentUserId) return alert("You must be logged in to help!");
        if (isSubmitting) return; // Prevent double-clicks

        setIsSubmitting(true); // Lock the UI

        try {
            const token = sessionStorage.getItem('token');
            
            await axios.post('http://localhost:5000/api/sos/offer', {
                sosId: sos.request_id,
                lenderId: currentUserId,
                requesterId: sos.requester_id,
                title: sos.title,
                price: sos.price_willing_to_pay,
                qty: sos.quantity_needed,
                deptId: sos.department_id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage("✅ Offer sent! The requester has received a handshake notification to approve.");
        } catch (error) {
            console.error("Failed to send SOS offer", error);
            setMessage("❌ Error sending the offer.");
        } finally {
            setIsSubmitting(false); // Unlock the UI
        }
    };

    // 🌟 CANCEL S.O.S LOGIC (For the Owner)
    const handleCancelRequest = async () => {
        if (isSubmitting) return; // Prevent double-clicks

        const confirmCancel = window.confirm("Are you sure you want to cancel this emergency request?");
        if (!confirmCancel) return;

        setIsSubmitting(true); // Lock the UI

        try {
            const token = sessionStorage.getItem('token');
            
            await axios.delete(`http://localhost:5000/api/sos/${sos.request_id}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { userId: currentUserId }
            });

            alert("S.O.S Request cancelled successfully.");
            navigate('/'); // Kick them back to the home page feed
        } catch (error) {
            console.error("Failed to cancel SOS", error);
            alert("Error cancelling request. Please try again.");
            setIsSubmitting(false); // Unlock ONLY if it fails (otherwise they are navigating away anyway)
        }
    };

    if (loading) return <div className="profile-page-wrapper"><h1 style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading S.O.S...</h1></div>;
    if (!sos) return <div className="profile-page-wrapper"><h1 style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>SOS Request Not Found</h1></div>;

    const isOwner = currentUserId === sos.requester_id;

    return (
        <div className="profile-page-wrapper">
            <header className="profile-header">
                <div className="profile-banner" style={{ borderRight: '80px solid #f44336' }}>
                    <div className="profile-banner-inner" style={{ backgroundColor: '#f44336' }}>
                        <h1>S.O.S REQUEST</h1>
                    </div>
                </div>
                <div className="header-deco" />
                <div className="back-ribbon" onClick={() => navigate('/')}>
                    <div className="back-ribbon-inner"><span>BACK TO HOME</span></div>
                </div>
            </header>

            <div className="profile-content-grid" style={{ maxWidth: '900px', margin: '0 auto', display: 'block' }}>
                
                {/* 🌟 MAIN SOS BLOCK */}
                <div className="history-container" style={{ border: '2px solid #f44336', borderRadius: '8px', backgroundColor: '#1a1a1a', padding: '30px', marginTop: '30px' }}>
                    
                    <h2 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: 'white', textTransform: 'uppercase' }}>
                        {sos.title}
                    </h2>
                    
                    <p onClick={() => navigate(`/profile/${sos.requester_id}`)} style={{ color: '#aaa', margin: '0 0 30px 0', fontSize: '1.2rem', cursor: 'pointer', textDecoration: 'underline' }}>
                        Requested by: <span style={{ color: 'white', fontWeight: 'bold' }}>{sos.requester_name}</span>
                    </p>

                    <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', borderBottom: '1px solid #444', paddingBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#aaa', textTransform: 'uppercase' }}>Willing to Pay</h4>
                            <p style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.8rem', margin: 0 }}>PKR {sos.price_willing_to_pay}</p>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#aaa', textTransform: 'uppercase' }}>Amount Needed</h4>
                            <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.8rem', margin: 0 }}>{sos.quantity_needed}</p>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#aaa', textTransform: 'uppercase' }}>Priority</h4>
                            <p style={{ color: sos.priority === 'emergency' ? '#f44336' : '#FF4500', fontWeight: 'bold', fontSize: '1.8rem', margin: 0, textTransform: 'uppercase' }}>{sos.priority}</p>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#aaa', textTransform: 'uppercase' }}>Details & Requirements</h4>
                        <p style={{ color: 'white', fontSize: '1.2rem', margin: 0, backgroundColor: '#111', padding: '20px', border: '1px solid #333' }}>
                            {sos.description || "No extra details provided."}
                        </p>
                    </div>

                    {message && (
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', border: '1px solid #4CAF50', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {message}
                        </div>
                    )}

                    {/* BUTTONS */}
                    {!isOwner ? (
                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                            <button 
                                onClick={handleAcceptLend} 
                                disabled={isSubmitting}
                                style={{ flex: 2, backgroundColor: isSubmitting ? '#555' : '#f44336', color: 'white', padding: '15px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
                            >
                                {isSubmitting ? 'SENDING OFFER...' : 'I CAN LEND THIS'}
                            </button>
                            <button 
                                onClick={() => navigate(`/chat/null/${sos.requester_id}`)} 
                                disabled={isSubmitting}
                                style={{ flex: 1, backgroundColor: '#333', color: isSubmitting ? '#555' : 'white', padding: '15px', border: '2px solid #fff', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
                            >
                                MESSAGE REQUESTER
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                            <button 
                                disabled={isSubmitting}
                                style={{ flex: 1, backgroundColor: isSubmitting ? '#aaa' : '#ffffff', color: '#000', padding: '15px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
                            >
                                EDIT REQUEST
                            </button>
                            <button 
                                onClick={handleCancelRequest} 
                                disabled={isSubmitting}
                                style={{ flex: 1, backgroundColor: '#333', color: isSubmitting ? '#555' : '#f44336', padding: '15px', border: '2px solid #f44336', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}
                            >
                                {isSubmitting ? 'CANCELLING...' : 'CANCEL REQUEST'}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default SosPage;
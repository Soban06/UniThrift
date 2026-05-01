import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChatPage.css';

const ChatPage = () => {
    // Look for multiple parameter names just in case they differ in App.js!
    const params = useParams();
    const passedItemId = params.initialItemId || params.itemId;
    const passedSellerId = params.initialSellerId || params.sellerId;
    
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    const [currentUser, setCurrentUser] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // 🌟 1. WRAPPED IN USECALLBACK
    const handleSelectContact = useCallback(async (contact, activeUser) => {
        if (!activeUser) return;
        
        setSelectedContact(contact);
        try {
            const token = sessionStorage.getItem('token');
            const activeItemId = contact.item_id || passedItemId || 0; 
            
            const response = await axios.get(`http://localhost:5000/api/messages/${activeItemId}/${activeUser.id}/${contact.contact_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data);
        } catch (error) {
            console.error("Failed to load chat history", error);
        }
    }, [passedItemId]); // Only depends on passedItemId

    // 🌟 2. WRAPPED IN USECALLBACK
    const fetchContacts = useCallback(async (user) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/users/${user.id}/chats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setLoading(false);

            if (passedSellerId) {
                // Check if we've already chatted with this seller
                const existingContact = response.data.find(c => String(c.contact_id) === String(passedSellerId));
                
                if (existingContact) {
                    setContacts(response.data);
                    handleSelectContact(existingContact, user);
                } else {
                    // It's a new conversation here so we force them into the list
                    const newTempContact = {
                        contact_id: passedSellerId,
                        full_name: "New Conversation",
                        item_id: passedItemId,
                        last_message: "Start a conversation!"
                    };
                    setContacts([newTempContact, ...response.data]);
                    handleSelectContact(newTempContact, user);
                }
            } else {
                setContacts(response.data);
                if (response.data.length > 0) {
                    handleSelectContact(response.data[0], user); 
                }
            }
        } catch (error) {
            console.error("Failed to fetch contacts", error);
            setLoading(false);
        }
    }, [passedSellerId, passedItemId, handleSelectContact]); // Proper dependencies

    // 🌟 3. PROPER DEPENDENCY ARRAY ADDED
    useEffect(() => {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const userObj = { id: storedUser.id || storedUser.user_id, name: storedUser.name || storedUser.full_name || "You" };
        setCurrentUser(userObj);
        
        fetchContacts(userObj);

    }, [navigate, fetchContacts]); // ESLint is finally happy!

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        try {
            const token = sessionStorage.getItem('token');
            const activeItemId = selectedContact.item_id || passedItemId || null;

            await axios.post('http://localhost:5000/api/messages', {
                senderId: currentUser.id,
                receiverId: selectedContact.contact_id,
                itemId: activeItemId,
                content: newMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [...prev, {
                sender_id: currentUser.id,
                content: newMessage,
                sent_at: new Date().toISOString()
            }]);
            
            setNewMessage('');
            fetchContacts(currentUser); 
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message.");
        }
    };

    if (loading) return <div className="chat-loading">Loading Messages...</div>;

    return (
        <div className="chat-page-container">
            <header className="profile-header" style={{ marginBottom: '0' }}>
                <div className="profile-banner" style={{ width: '30%' }}>
                    <div className="profile-banner-inner"><h1>CHAT</h1></div>
                </div>
                <div className="header-deco" />
                <div className="back-ribbon" onClick={() => navigate('/')}>
                    <div className="back-ribbon-inner"><span>BACK TO HOME</span></div>
                </div>
            </header>

            <div className="chat-layout">
                {/* LEFT SIDEBAR */}
                <div className="chat-sidebar">
                    <h3 className="sidebar-title">Recent Conversations</h3>
                    <div className="contact-list">
                        {contacts.length === 0 && <p className="no-contacts">No messages yet.</p>}
                        {contacts.map(contact => (
                            <div 
                                key={contact.contact_id} 
                                className={`contact-card ${selectedContact?.contact_id === contact.contact_id ? 'active' : ''}`}
                                onClick={() => handleSelectContact(contact, currentUser)}
                            >
                                <img src={contact.profile_pic_url || '/default-avatar.png'} alt={contact.full_name} className="contact-avatar" />
                                <div className="contact-info">
                                    <span className="contact-name">{contact.full_name}</span>
                                    <span className="contact-last-msg">{contact.last_message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDE: MAIN CHAT AREA */}
                <div className="chat-main-area">
                    {selectedContact ? (
                        <div className="mockup-chat-box">
                            <div className="mockup-header-row">
                                <div className="mockup-header-cell left">
                                    FROM: {currentUser?.name?.toUpperCase()}
                                </div>
                                <div className="mockup-header-cell right">
                                    TO: {selectedContact.full_name.toUpperCase()}
                                </div>
                            </div>

                            <div className="mockup-message-display">
                                {messages.length === 0 ? (
                                    <div className="empty-chat-msg">Send a message to start the conversation!</div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMe = msg.sender_id === currentUser.id;
                                        return (
                                            <div key={index} className={`message-line ${isMe ? 'me' : 'them'}`}>
                                                <span className="message-sender-name">
                                                    {isMe ? currentUser.name.toUpperCase() : selectedContact.full_name.toUpperCase()}:
                                                </span>
                                                <span className="message-content">{msg.content}</span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="mockup-input-row">
                                <input 
                                    type="text" 
                                    className="mockup-input-field" 
                                    placeholder="Write a message..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="mockup-send-btn">SEND</button>
                            </form>
                        </div>
                    ) : (
                        <div className="no-chat-selected">
                            Select a conversation to start chatting
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
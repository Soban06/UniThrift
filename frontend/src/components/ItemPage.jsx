import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

const ItemPage = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [buyQuantity, setBuyQuantity] = useState(1);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '', item_description: '', price: 0, stock_quantity: 0
    });

    const [purchaseMessage, setPurchaseMessage] = useState('');
    const [isPurchaseSuccess, setIsPurchaseSuccess] = useState(false);

    useEffect(() => {
        const fetchItemData = async () => {
            try {
                let userId = null;
                const storedUser = JSON.parse(sessionStorage.getItem('user'));
                if (storedUser) {
                    userId = storedUser.id || storedUser.user_id;
                    setCurrentUserId(userId);
                }

                const response = await axios.get('http://localhost:5000/api/items/' + itemId);
                setItem(response.data);

                setEditFormData({
                    title: response.data.title,
                    item_description: response.data.item_description,
                    price: response.data.price,
                    stock_quantity: response.data.stock_quantity
                });

                if (userId) {
                    const token = sessionStorage.getItem('token');
                    const wishListRes = await axios.get('http://localhost:5000/api/users/' + userId + '/wishlist', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const alreadyLiked = wishListRes.data.some(wItem => wItem.item_id.toString() === itemId.toString());
                    setIsWishlisted(alreadyLiked);
                }
            } catch (error) {
                console.error("Error fetching item details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchItemData();
    }, [itemId]);

    const toggleWishlist = async () => {
        if (!currentUserId) return alert('Please log in to add items to your wishlist!');

        const newWishlistState = !isWishlisted;
        setIsWishlisted(newWishlistState);

        setItem(prevItem => ({
            ...prevItem,
            wishlist_count: newWishlistState
                ? (prevItem.wishlist_count || 0) + 1
                : (prevItem.wishlist_count || 0) - 1
        }));

        try {
            const token = sessionStorage.getItem('token');
            await axios.post('http://localhost:5000/api/wishlist/toggle', {
                userId: currentUserId,
                itemId: itemId
            }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            console.error("Failed to toggle wishlist", err);
            setIsWishlisted(!newWishlistState);
            setItem(prevItem => ({
                ...prevItem,
                wishlist_count: !newWishlistState
                    ? (prevItem.wishlist_count || 0) + 1
                    : (prevItem.wishlist_count || 0) - 1
            }));
            if (err.response && err.response.status === 401) alert("Session expired. Please log in again.");
        }
    };

    const handleSaveEdit = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return alert("You must be logged in to edit!");

            await axios.put(`http://localhost:5000/api/items/update/${itemId}`, {
                ...editFormData,
                userId: currentUserId
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert("Listing updated successfully!");
            setIsEditModalOpen(false);
            window.location.reload();
        } catch (error) {
            console.error("Failed to update item", error);
            if (error.response && error.response.status === 401) alert("Session expired. Please log in again.");
            else alert("Error updating item.");
        }
    };

    const handleDelete = async () => {
        const isConfirmed = window.confirm("Are you sure you want to permanently delete this listing?");
        if (isConfirmed) {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) return alert("You must be logged in to delete!");

                await axios.delete(`http://localhost:5000/api/items/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { userId: currentUserId }
                });

                alert("Listing deleted successfully!");
                navigate('/');
            } catch (error) {
                console.error("Failed to delete item", error);
                if (error.response && error.response.status === 401) alert("Session expired. Please log in again.");
                else alert("Error deleting item.");
            }
        }
    };

    const handlePurchase = async () => {
        if (!currentUserId) {
            setIsPurchaseSuccess(false);
            setPurchaseMessage('❌ You must be logged in!');
            setTimeout(() => setPurchaseMessage(''), 3000);
            return;
        }

        // Bypass stock check if it's digital
        if (!item.is_digital && buyQuantity > item.stock_quantity) {
            setIsPurchaseSuccess(false);
            setPurchaseMessage("❌ You cannot request more than the available stock!");
            setTimeout(() => setPurchaseMessage(''), 3000);
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const qtyToSend = item.is_digital ? 1 : Number(buyQuantity); 

            if (item.listing_type === 'borrow') {
                await axios.post('http://localhost:5000/api/transactions/borrow', { 
                    itemId: item.item_id, 
                    buyerId: currentUserId, 
                    sellerId: item.seller_id,
                    qty: qtyToSend
                }, { headers: { Authorization: `Bearer ${token}` } });
                
                setIsPurchaseSuccess(true);
                setPurchaseMessage("⏳ Borrow request sent! Waiting for lender to approve.");
            } else {
                await axios.post('http://localhost:5000/api/transactions/purchase', { 
                    itemId: item.item_id, 
                    buyerId: currentUserId, 
                    sellerId: item.seller_id,
                    qty: qtyToSend
                }, { headers: { Authorization: `Bearer ${token}` } });
                
                setIsPurchaseSuccess(true);
                setPurchaseMessage("✅ Purchase successful!");
            }
            
            setItem(prevItem => ({
                ...prevItem,
                stock_quantity: prevItem.stock_quantity - qtyToSend,
                // 🌟 THE FIX: Update the correct state variable name here too
                item_sold_count: item.listing_type !== 'borrow' ? (prevItem.item_sold_count || 0) + qtyToSend : prevItem.item_sold_count
            }));

            setBuyQuantity(1); 
            setTimeout(() => setPurchaseMessage(''), 4000);
            
        } catch (error) {
            console.error(error);
            setIsPurchaseSuccess(false);
            if (error.response && error.response.status === 401) {
                setPurchaseMessage("❌ Session expired. Please log in again.");
            } else if (error.response && error.response.data && error.response.data.error) {
                setPurchaseMessage(`❌ ${error.response.data.error}`); 
            } else {
                setPurchaseMessage("❌ Error processing request. It might be out of stock!");
            }
            setTimeout(() => setPurchaseMessage(''), 4000);
        }
    };

    const handleMessageSeller = () => {
        if (!currentUserId) return alert('You must be logged in to send a message!');
        navigate(`/chat/${item.item_id}/${item.seller_id}`);
    };

    if (loading) return <div className="profile-page-wrapper"><h1 style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading Item...</h1></div>;
    if (!item) return <div className="profile-page-wrapper"><h1 style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Item Not Found</h1></div>;

    const isOwner = currentUserId === item.seller_id;
    const isOutOfStock = !item.is_digital && item.stock_quantity <= 0;

    return (
        <div className="profile-page-wrapper">
            <header className="profile-header">
                <div className="profile-banner">
                    <div className="profile-banner-inner"><h1>ITEM-DETAILS</h1></div>
                </div>
                <div className="header-deco" />
                <div className="back-ribbon" onClick={() => navigate('/')}>
                    <div className="back-ribbon-inner"><span>BACK TO MARKETPLACE</span></div>
                </div>
            </header>

            <div className="profile-content-grid">
                
                {/* LEFT COLUMN */}
                <div className="profile-left-col">
                    <h2 className="profile-username" style={{ fontSize: '2.2rem', margin: '0 0 15px 0', lineHeight: '0.8' }}>
                        {item.title}
                    </h2>
                    
                    <div className="profile-pic-frame" style={{ backgroundColor: item.is_digital ? '#0a0a0a' : '#ccc', border: '2px solid #555', marginBottom: '20px', aspectRatio: '1/1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {item.is_digital && (item.image_url.includes('default.png') || !item.image_url) ? (
                            <div style={{ textAlign: 'center', color: '#4A90E2' }}>
                                <div style={{ fontSize: '6rem', marginBottom: '15px' }}>📄</div>
                                <h3 style={{ margin: 0, letterSpacing: '2px' }}>SECURE E-BOOK</h3>
                            </div>
                        ) : (
                            <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                    </div>
                    
                    <div className="profile-description" style={{ border: '1px solid #555', padding: '15px', backgroundColor: '#1a1a1a' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', textTransform: 'uppercase' }}>Description</h3>
                        <p style={{ color: '#aaa', margin: '0 0 20px 0', fontSize: '1rem' }}>{item.item_description || "No description provided."}</p>
                        
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', textTransform: 'uppercase' }}>Listing Info</h3>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#aaa', fontSize: '1rem' }}>
                            <li style={{ marginBottom: '5px' }}><strong>Type:</strong> {item.listing_type ? item.listing_type.toUpperCase() : 'SELL'}</li>
                            <li style={{ marginBottom: '5px' }}><strong>Department:</strong> {item.dept_name}</li>
                            <li><strong>Category:</strong> {item.category_name}</li>
                        </ul>
                    </div>
                </div>

                {/* MIDDLE COLUMN */}
                <div className="profile-mid-col" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="history-container" style={{ border: '1px solid #555', borderRadius: '8px', backgroundColor: '#222', padding: '25px', marginTop: '12px' }}>
                        
                        <div style={{ borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#aaa', textTransform: 'uppercase' }}>
                                {item.listing_type === 'borrow' ? 'Lender' : 'Seller'}
                            </h4>
                            <p 
                                onClick={() => navigate(`/profile/${item.seller_id}`)}
                                style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.3rem', margin: 0, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {item.seller_name}
                            </p>
                        </div>

                        <div style={{ borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#aaa', textTransform: 'uppercase' }}>Price</h4>
                            <p style={{ color: '#FF4500', fontWeight: 'bold', fontSize: '1.3rem', margin: 0 }}>PKR {item.price}</p>
                        </div>
                        
                        <div style={{ borderBottom: (!isOwner && !isOutOfStock && !item.is_digital) ? '1px solid #444' : 'none', paddingBottom: (!isOwner && !isOutOfStock && !item.is_digital) ? '15px' : '0', marginBottom: (!isOwner && !isOutOfStock && !item.is_digital) ? '20px' : '0' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#aaa', textTransform: 'uppercase' }}>Availability</h4>
                            <p style={{ color: item.is_digital ? '#4A90E2' : (!isOutOfStock ? '#4CAF50' : '#f44336'), fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>
                                {item.is_digital ? '♾️ UNLIMITED (DIGITAL)' : (!isOutOfStock ? item.stock_quantity + ' IN STOCK' : 'UNAVAILABLE')}
                            </p>
                        </div>

                        {!isOwner && !isOutOfStock && !item.is_digital && (
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#aaa', textTransform: 'uppercase' }}>Quantity Needed</h4>
                                <input type="number" value={buyQuantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setBuyQuantity(val > item.stock_quantity ? item.stock_quantity : val);
                                    }}
                                    min="1" max={item.stock_quantity}
                                    style={{ width: '100%', padding: '12px', backgroundColor: '#1a1a1a', color: 'white', border: '1px solid #444', borderRadius: '4px', fontSize: '1.1rem', fontWeight: 'bold' }}
                                />
                                <small style={{ color: '#888', display: 'block', marginTop: '8px' }}>Max available: {item.stock_quantity}</small>
                            </div>
                        )}

                        {item.listing_type === 'borrow' && (
                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#aaa', textTransform: 'uppercase' }}>Borrow Period</h4>
                                <p style={{ color: '#4A90E2', fontWeight: 'bold', fontSize: '1.2rem', margin: 0 }}>
                                    {item.borrow_duration ? `${item.borrow_duration} DAYS` : '14 DAYS'}
                                </p>
                            </div>
                        )}
                    </div>

                    {!isOwner ? (
                        <>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', alignItems: 'center' }}>
                                <button disabled={isOutOfStock} onClick={handlePurchase}
                                    style={{ flex: 1, backgroundColor: isOutOfStock ? '#333' : '#FF4500', color: 'white', padding: '15px', border: '1px solid #555', cursor: isOutOfStock ? 'not-allowed' : 'pointer', opacity: isOutOfStock ? 0.6 : 1, fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                                    {isOutOfStock ? 'UNAVAILABLE' : (item.listing_type === 'borrow' ? 'ASK TO BORROW' : 'BUY NOW')}
                                </button>

                                <button onClick={handleMessageSeller} 
                                    style={{ flex: 1, backgroundColor: '#1a1a1a', color: 'white', padding: '15px', border: '1px solid #555', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                                    {item.listing_type === 'borrow' ? 'MESSAGE LENDER' : 'MESSAGE SELLER'}
                                </button>

                                <div onClick={toggleWishlist} style={{ fontSize: '2rem', cursor: 'pointer', transition: '0.2s', filter: isWishlisted ? 'drop-shadow(0 0 5px #FF4500)' : 'none', padding: '0 10px' }}>
                                    {isWishlisted ? '❤️' : '🤍'}
                                </div>
                            </div>

                            {purchaseMessage && (
                                <div style={{
                                    marginTop: '15px', padding: '15px', borderRadius: '4px',
                                    backgroundColor: isPurchaseSuccess ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                    color: isPurchaseSuccess ? '#4CAF50' : '#f44336',
                                    border: `1px solid ${isPurchaseSuccess ? '#4CAF50' : '#f44336'}`,
                                    textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem'
                                }}>
                                    {purchaseMessage}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button onClick={() => setIsEditModalOpen(true)} 
                                style={{ flex: 1, backgroundColor: '#ffffff', color: '#000', padding: '15px', border: '1px solid #555', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                                EDIT LISTING
                            </button>
                            <button onClick={handleDelete} 
                                style={{ flex: 1, backgroundColor: '#f44336', color: 'white', padding: '15px', border: '1px solid #555', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                                DELETE
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN (Item Statistics) */}
                <div className="profile-right-col" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ border: '2px solid #ffffff', borderRadius: '8px', backgroundColor: '#1a1a1a', padding: '25px', flex: 1, display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
                        <h3 style={{ margin: '0 0 25px 0', fontSize: '1.4rem' }}>Item Statistics</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', flex: 1 }}>
                            
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>🏷️</span>
                                    {/* 🌟 THE FIX: Render the correct variable name */}
                                    <span>Sold: {item.item_sold_count || 0}</span>
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '220px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>📦</span>
                                    {item.item_rating > 0 ? (
                                        <span>Item: {Number(item.item_rating).toFixed(2)} / 5.00</span>
                                    ) : (
                                        <span style={{ fontStyle: 'italic', fontSize: '1rem', color: '#666' }}>Item: Unrated</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '220px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>⭐</span>
                                    {item.seller_rating ? (
                                        <span>Seller: {Number(item.seller_rating).toFixed(2)} / 5.00</span>
                                    ) : (
                                        <span style={{ fontStyle: 'italic', fontSize: '1rem', color: '#666' }}>Seller: Unrated</span>
                                    )}
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>🤝</span>
                                    <span>Borrowed: {item.borrowed_count || 0}</span>
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: 'white', color: 'black', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid #000' }}>
                                <div style={{ display: 'flex', width: '180px', alignItems: 'center' }}>
                                    <span style={{ width: '35px', textAlign: 'center', marginRight: '15px', fontSize: '1.4rem' }}>❤️</span>
                                    <span>Wishlisted: {item.wishlist_count || 0}</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="edit-playcard" onClick={(e) => e.stopPropagation()}>
                        <div className="playcard-header"><h2>EDIT LISTING</h2></div>
                        <div className="playcard-body">
                            <div className="edit-field"><label>TITLE</label><input type="text" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} /></div>
                            <div className="edit-field"><label>DESCRIPTION</label><textarea value={editFormData.item_description} onChange={(e) => setEditFormData({ ...editFormData, item_description: e.target.value })} rows="3" /></div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="edit-field" style={{ flex: 1 }}><label>PRICE (PKR)</label><input type="number" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} /></div>
                                {!item.is_digital && (
                                    <div className="edit-field" style={{ flex: 1 }}><label>STOCK QUANTITY</label><input type="number" value={editFormData.stock_quantity} onChange={(e) => setEditFormData({ ...editFormData, stock_quantity: e.target.value })} /></div>
                                )}
                            </div>
                        </div>
                        <div className="playcard-footer">
                            <button className="p-btn save" onClick={handleSaveEdit}>SAVE CHANGES</button>
                            <button className="p-btn cancel" onClick={() => setIsEditModalOpen(false)}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemPage;
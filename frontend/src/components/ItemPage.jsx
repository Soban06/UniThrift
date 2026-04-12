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

    // Tracks if someone is logged in
    const [currentUserId, setCurrentUserId] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '', item_description: '', price: 0, stock_quantity: 0
    });

    useEffect(() => {
        const fetchItemData = async () => {
            try {
                let userId = null;
                const storedUser = JSON.parse(sessionStorage.getItem('user'));
                if (storedUser) {
                    userId = storedUser.id || storedUser.user_id;
                    setCurrentUserId(userId);
                }

                // 1. Fetch the item details
                const response = await axios.get('http://localhost:5000/api/items/' + itemId);
                setItem(response.data);

                // Pre-fill the edit form with the current data
                setEditFormData({
                    title: response.data.title,
                    item_description: response.data.item_description,
                    price: response.data.price,
                    stock_quantity: response.data.stock_quantity
                });

                // 2. Fetch wishlist state to see if the heart should be red on load
                if (userId) {
                    const wishListRes = await axios.get('http://localhost:5000/api/users/' + userId + '/wishlist');
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

    // --- WISHLIST LOGIC ---
    const toggleWishlist = async () => {
        if (!currentUserId) {
            alert('Please log in to add items to your wishlist!');
            return; 
        }

        try {
            setIsWishlisted(!isWishlisted);
            await axios.post('http://localhost:5000/api/wishlist/toggle', {
                userId: currentUserId,
                itemId: itemId
            });
        } catch (err) {
            console.error("Failed to toggle wishlist", err);
            setIsWishlisted(!isWishlisted);
        }
    };

    // --- EDIT LOGIC ---
    const handleSaveEdit = async () => {
        try {
            await axios.put(`http://localhost:5000/api/items/update/${itemId}`, {
                ...editFormData,
                userId: currentUserId 
            });
            alert("Listing updated successfully!");
            setIsEditModalOpen(false);
            window.location.reload(); 
        } catch (error) {
            console.error("Failed to update item", error);
            alert("Error updating item.");
        }
    };

    // --- DELETE LOGIC ---
    const handleDelete = async () => {
        const isConfirmed = window.confirm("Are you sure you want to permanently delete this listing?");
        if (isConfirmed) {
            try {
                await axios.delete(`http://localhost:5000/api/items/${itemId}`, {
                    data: { userId: currentUserId } 
                });
                alert("Listing deleted successfully!");
                navigate('/'); 
            } catch (error) {
                console.error("Failed to delete item", error);
                alert("Error deleting item.");
            }
        }
    };

    // --- PURCHASE LOGIC (FIXED) ---
    const handlePurchase = async () => {
        if (!currentUserId) {
            alert('You must be logged in to make a purchase!');
            return;
        }

        if (buyQuantity > item.stock_quantity) {
            alert("You cannot buy more than the available stock!");
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/checkout', { 
                itemId: item.item_id, 
                userId: currentUserId, 
                qty: Number(buyQuantity) // 🌟 Forces input into a strict Math Number
            });
            
            alert("Purchase successful!");
            
            // 🌟 Instantly drop the stock on the screen
            setItem(prevItem => ({
                ...prevItem,
                stock_quantity: prevItem.stock_quantity - Number(buyQuantity)
            }));

            setBuyQuantity(1); // Reset input box
            
        } catch (error) {
            console.error(error);
            alert("Error purchasing item. It might be out of stock!");
        }
    };


    if (loading) return <div className="profile-page-wrapper"><h1 style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading Item...</h1></div>;
    if (!item) return <div className="profile-page-wrapper"><h1 style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Item Not Found</h1></div>;

    const isOwner = currentUserId === item.seller_id;
    const isOutOfStock = item.stock_quantity <= 0;

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

                {/* --- LEFT COLUMN --- */}
                <div className="profile-left-col">
                    <h2 className="profile-username">{item.title}</h2>
                    <div className="profile-pic-frame">
                        <img src={item.image_url} alt={item.title} style={{ objectFit: 'cover' }} />
                    </div>

                    <div className="profile-description">
                        <h3>Description</h3>
                        <p style={{ color: '#ccc', marginBottom: '20px' }}>
                            {item.item_description || "No description provided."}
                        </p>

                        <h3>Listing Info</h3>
                        <ul>
                            <li><strong>Seller:</strong> {item.seller_name}</li>
                            <li><strong>Type:</strong> {item.listing_type ? item.listing_type.toUpperCase() : 'SELL'}</li>
                            <li><strong>Department:</strong> {item.dept_name}</li>
                            <li><strong>Category:</strong> {item.category_name}</li>
                        </ul>
                    </div>
                </div>

                {/* --- MIDDLE COLUMN --- */}
                <div className="profile-mid-col">
                    <div className="history-container">

                        <div className="history-box">
                            <h4>PRICE</h4>
                            <p style={{ color: '#FF4500', fontWeight: 'bold', fontSize: '1.4rem', margin: '5px 0' }}>
                                PKR {item.price}
                            </p>
                        </div>

                        <div className="history-box">
                            <h4>AVAILABILITY</h4>
                            <p style={{ color: !isOutOfStock ? '#4CAF50' : '#f44336', fontWeight: 'bold' }}>
                                {!isOutOfStock ? item.stock_quantity + ' IN STOCK' : 'OUT OF STOCK'}
                            </p>
                        </div>

                        {!isOwner && !isOutOfStock && (
                            <div className="history-box">
                                <h4>QUANTITY</h4>
                                <input
                                    type="number"
                                    value={buyQuantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setBuyQuantity(val > item.stock_quantity ? item.stock_quantity : val);
                                    }}
                                    min="1"
                                    max={item.stock_quantity}
                                    style={{
                                        width: '100%', padding: '8px', marginTop: '5px',
                                        backgroundColor: '#222', color: 'white',
                                        border: '1px solid #444', borderRadius: '4px'
                                    }}
                                />
                                <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>
                                    Max available: {item.stock_quantity}
                                </small>
                            </div>
                        )}
                    </div>

                    {!isOwner ? (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
                            <button
                                className="edit-trigger-box"
                                disabled={isOutOfStock}
                                style={{
                                    flex: 1,
                                    backgroundColor: isOutOfStock ? '#333' : '#FF4500',
                                    margin: 0,
                                    border: 'none',
                                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                    opacity: isOutOfStock ? 0.6 : 1
                                }}
                                onClick={handlePurchase} // 🌟 Wired up the new function here!
                            >
                                <span>{isOutOfStock ? 'SOLD OUT' : 'BUY NOW'}</span>
                            </button>

                            <div
                                onClick={toggleWishlist}
                                style={{
                                    fontSize: '2rem',
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    filter: isWishlisted ? 'drop-shadow(0 0 5px #FF4500)' : 'none'
                                }}
                            >
                                {isWishlisted ? '❤️' : '🤍'}
                            </div>
                        </div>
                  ) : (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <div 
                                className="edit-trigger-box" 
                                style={{ flex: 1, backgroundColor: '#ffffff', cursor: 'pointer', margin: 0 }}
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <span style={{ color: '#000' }}>EDIT LISTING</span>
                            </div>
                            
                            <div 
                                className="edit-trigger-box" 
                                style={{ flex: 1, backgroundColor: '#f44336', cursor: 'pointer', margin: 0 }}
                                onClick={handleDelete}
                            >
                                <span>DELETE</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="stats-col">
                    <div className="stats-container">
                        <h3>Seller Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <img src="/stats-sold.png" alt="Sold" />
                                <span>Sold: 15</span>
                            </div>
                            <div className="stat-card">
                                <img src="/stats-rating.png" alt="Rating" />
                                <span>Rating: 8.5/10</span>
                            </div>
                            <div className="stat-card">
                                <img src="/stats-borrowed.png" alt="Borrowed" />
                                <span>Borrowed: 4</span>
                            </div>

                            <div className="stat-card">
                                <img src="/stats-wishlist.png" alt="Wishlist" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
                                <span style={{ display: 'none', fontSize: '1.5rem', marginRight: '10px' }}>❤️</span>
                                <span>Wishlisted: {item.wishlist_count || 0}</span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* --- EDIT ITEM MODAL --- */}
            {isEditModalOpen && (
                <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="edit-playcard" onClick={(e) => e.stopPropagation()}>
                        <div className="playcard-header"><h2>EDIT LISTING</h2></div>
                        <div className="playcard-body">
                            
                            <div className="edit-field">
                                <label>TITLE</label>
                                <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} />
                            </div>
                            
                            <div className="edit-field">
                                <label>DESCRIPTION</label>
                                <textarea value={editFormData.item_description} onChange={(e) => setEditFormData({ ...editFormData, item_description: e.target.value })} rows="3" />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="edit-field" style={{ flex: 1 }}>
                                    <label>PRICE (PKR)</label>
                                    <input type="number" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} />
                                </div>
                                <div className="edit-field" style={{ flex: 1 }}>
                                    <label>STOCK QUANTITY</label>
                                    <input type="number" value={editFormData.stock_quantity} onChange={(e) => setEditFormData({ ...editFormData, stock_quantity: e.target.value })} />
                                </div>
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
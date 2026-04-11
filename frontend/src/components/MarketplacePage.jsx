import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css'; // Still needed for the header/banner
import './MarketplacePage.css'; // 🌟 The new dedicated CSS!

const MarketplacePage = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [visibleCount, setVisibleCount] = useState(16);
    
    const [filters, setFilters] = useState({
        departmentId: '',
        sortOrder: ''
    });

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/items');
                setItems(response.data);
            } catch (error) {
                console.error("Error fetching marketplace:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const filteredItems = useMemo(() => {
        let result = items;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(item => 
                item.title.toLowerCase().includes(lowerQuery) || 
                (item.item_description && item.item_description.toLowerCase().includes(lowerQuery))
            );
        }

        if (filters.departmentId) {
            result = result.filter(item => item.department_id.toString() === filters.departmentId);
        }

        if (filters.sortOrder === 'lowToHigh') {
            result = [...result].sort((a, b) => a.price - b.price);
        } else if (filters.sortOrder === 'highToLow') {
            result = [...result].sort((a, b) => b.price - a.price);
        }

        return result;
    }, [items, searchQuery, filters]);

    const displayedItems = filteredItems.slice(0, visibleCount);

    return (
        <div className="profile-page-wrapper" style={{ minHeight: '100vh', paddingBottom: '50px' }}>
            
            <header className="profile-header">
                <div className="profile-banner">
                    <div className="profile-banner-inner"><h1>MARKETPLACE</h1></div>
                </div>
                <div className="header-deco" />
                <div className="back-ribbon" onClick={() => navigate('/')}>
                    <div className="back-ribbon-inner"><span>BACK TO HOME</span></div>
                </div>
            </header>

            <div className="marketplace-container">
                
                {/* --- SEARCH BAR --- */}
                <div className="search-filter-row">
                    <input 
                        type="text" 
                        className="market-search-bar"
                        placeholder="Search for notes, books, electronics..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button 
                        className={`filter-toggle-btn ${showFilters ? 'active' : 'inactive'}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? '−' : '+'}
                    </button>
                </div>

                {/* --- PREFERENCES DROPDOWN --- */}
                {showFilters && (
                    <div className="preferences-dropdown">
                        <div className="pref-group">
                            <label>Department</label>
                            <select 
                                className="pref-select"
                                value={filters.departmentId} 
                                onChange={(e) => setFilters({...filters, departmentId: e.target.value})}
                            >
                                <option value="">All Departments</option>
                                <option value="1">Data Science</option>
                                <option value="2">Computer Science</option>
                                <option value="3">Software Engineering</option>
                                <option value="4">Electrical Engineering</option>
                            </select>
                        </div>

                        <div className="pref-group">
                            <label>Price Sort</label>
                            <select 
                                className="pref-select"
                                value={filters.sortOrder} 
                                onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
                            >
                                <option value="">Default (Newest First)</option>
                                <option value="lowToHigh">Lowest to Highest</option>
                                <option value="highToLow">Highest to Lowest</option>
                            </select>
                        </div>

                        <div className="pref-group">
                            <label>Rating (Coming Soon)</label>
                            <select className="pref-select" disabled>
                                <option>Any Rating</option>
                                <option>4+ Stars</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* --- ITEMS GRID --- */}
                {loading ? (
                    <h2 style={{ textAlign: 'center', color: 'white', marginTop: '50px' }}>Loading Marketplace...</h2>
                ) : displayedItems.length === 0 ? (
                    <div className="empty-state">
                        <h2 style={{ color: '#FF4500' }}>No items found</h2>
                        <p style={{ color: '#aaa' }}>Try adjusting your search or preferences.</p>
                    </div>
                ) : (
                    <>
                        <div className="items-grid">
                            {displayedItems.map((item) => (
                                <div 
                                    key={item.item_id} 
                                    className="market-card"
                                    onClick={() => navigate('/item/' + item.item_id)}
                                >
                                    <div className="card-image-box">
                                        <img src={item.image_url} alt={item.title} />
                                    </div>
                                    <div className="card-info">
                                        <h3>{item.title}</h3>
                                        <div className="card-footer">
                                            <span className="card-price">PKR {item.price}</span>
                                            <span className="card-dept">{item.dept_name.split(' ')[0]}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* --- PAGINATION BUTTONS --- */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '40px', marginBottom: '40px' }}>
                            
                            {/* Only show EXPAND MORE if there are hidden items left */}
                            {filteredItems.length > visibleCount && (
                                <div 
                                    className="edit-trigger-box" 
                                    style={{ width: '200px', backgroundColor: '#FF4500', margin: 0, cursor: 'pointer' }}
                                    onClick={() => setVisibleCount(prev => prev + 16)}
                                >
                                    <span>EXPAND MORE</span>
                                </div>
                            )}

                            {/* Only show SHOW LESS if the user has expanded past the initial 16 */}
                            {visibleCount > 16 && (
                                <div 
                                    className="edit-trigger-box" 
                                    style={{ width: '200px', backgroundColor: '#444', margin: 0, cursor: 'pointer' }}
                                    onClick={() => {
                                        setVisibleCount(16);
                                        // Smoothly scroll back to the top of the list!
                                        window.scrollTo({ top: 0, behavior: 'smooth' }); 
                                    }}
                                >
                                    <span>SHOW LESS</span>
                                </div>
                            )}
                            
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MarketplacePage;
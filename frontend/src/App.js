import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import ProfilePage from './components/ProfilePage';
import ItemUpload from './components/ItemUpload';
import ItemPage from './components/ItemPage';
import MarketplacePage from './components/MarketplacePage';
import ChatPage from './components/ChatPage';
import SosPage from './components/SosPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        
        {/* Profile Routes */}
        <Route path="/profile" element={<ProfilePage />} />        
        <Route path="/profile/:userId" element={<ProfilePage />} />
        
        {/* Marketplace & Items */}
        <Route path="/upload-item" element={<ItemUpload />} />
        <Route path="/item/:itemId" element={<ItemPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        
        {/* Chat Routes */}
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:itemId/:sellerId" element={<ChatPage />} />
        
        {/* SOS Route */}
        <Route path="/sos/:sosId" element={<SosPage />} />
      </Routes>
    </Router>
  );
}

export default App;
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './SignUp.css'; 

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const response = await axios.post('http://localhost:5000/api/login', credentials);
            sessionStorage.setItem('user', JSON.stringify(response.data.user));
            //  Save the JWT Token here
            sessionStorage.setItem('token', response.data.token);
            navigate('/');
        } catch (error) {
            if (error.response && error.response.data.error) {
                setMessage('❌ ' + error.response.data.error);
            } else {
                setMessage('❌ Server error. Is the backend running?');
            }
        }
    };

    return (
        <div className="auth-page-container">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="unithrift-banner">
                    <h1>UNI-THRIFT</h1>
                </div>
            </Link>

            <div className="unithrift-box form-container">
                <h2>Login</h2>
                {message && <div className="message-alert">{message}</div>}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="input-group">
                        <label>University Email:</label>
                        <input type="email" name="email" placeholder="e.g. lxxxxxx@lhr.nu.edu.pk" value={credentials.email} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label>Password:</label>
                        <input type="password" name="password" placeholder="Enter your password" value={credentials.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn-ribbon" style={{ marginTop: '20px' }}>GO</button>
                </form>
                
                <div className="login-link">
                    No account? <Link to="/signup">Sign up here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;

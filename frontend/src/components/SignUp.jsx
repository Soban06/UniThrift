import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import './SignUp.css'; 

const SignUp = () => {
    const navigate = useNavigate(); 
    const [departments, setDepartments] = useState([]); 
    
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', departmentId: '', description: '',
    });
    const [profilePic, setProfilePic] = useState(null); 
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/departments');
                setDepartments(response.data);
            } catch (error) {
                console.error("Failed to fetch departments", error);
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setProfilePic(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); 
        
        if (!formData.email.endsWith('nu.edu.pk')) {
            setMessage('❌ Error: You must use a valid university email address (e.g., @lhr.nu.edu.pk).');
            return;
        }

        const dataToSend = new FormData();
        dataToSend.append('name', formData.name);
        dataToSend.append('email', formData.email);
        dataToSend.append('password', formData.password);
        dataToSend.append('departmentId', formData.departmentId);
        dataToSend.append('description', formData.description);
        if (profilePic) dataToSend.append('profilePic', profilePic); 

        try {
            const response = await axios.post('http://localhost:5000/api/signup', dataToSend);
            sessionStorage.setItem('user', JSON.stringify(response.data.user));
            // 🌟 Save the JWT Token!
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
                <h2>Create Account</h2>
                {message && <div className="message-alert">{message}</div>}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="input-group">
                        <label>Full Name:</label>
                        <input type="text" name="name" placeholder="Enter your name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label>University Email:</label>
                        <input type="email" name="email" placeholder="e.g. lxxxxxx@lhr.nu.edu.pk" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label>Password:</label>
                        <input type="password" name="password" placeholder="Create a password" value={formData.password} onChange={handleChange} required />
                    </div>
                    
                    <div className="input-group">
                        <label>Department:</label>
                        <select name="departmentId" value={formData.departmentId} onChange={handleChange} required>
                            <option value="" disabled>Select your department...</option>
                            {departments.map(dept => (
                                <option key={dept.department_id} value={dept.department_id}>
                                    {dept.department_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Bio (Optional):</label>
                        <textarea name="description" placeholder="Tell us about yourself..." value={formData.description} onChange={handleChange} rows="3" />
                    </div>
                    <div className="input-group">
                        <label>Profile Picture:</label>
                        <input type="file" name="profilePic" accept="image/*" onChange={handleFileChange} className="file-input" />
                    </div>
                    <button type="submit" className="btn-ribbon" style={{ marginTop: '20px' }}>SIGN UP</button>
                </form>
                
                <div className="login-link">Already have an account? <Link to="/login">Login here</Link></div>
            </div>
        </div>
    );
};

export default SignUp;
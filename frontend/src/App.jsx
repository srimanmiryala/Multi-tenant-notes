import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);

  // API URL from environment variable
  const API_URL = import.meta.env.VITE_API_URL || 'https://multi-tenant-notes-6kmv.vercel.app/api';

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const tenantData = localStorage.getItem('tenant');

    if (token && userData && tenantData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
      setTenant(JSON.parse(tenantData));
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Attempting login with:', { tenantSlug, email, API_URL });
      
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { email, password },
        { 
          headers: { 
            'X-Tenant-ID': tenantSlug,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('Login response:', response.data);
      
      // Store authentication data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
      
      // Update state
      setUser(response.data.user);
      setTenant(response.data.tenant);
      setIsLoggedIn(true);
      setMessage(`✅ Welcome back, ${response.data.user.email}!`);
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = '❌ Login failed';
      if (error.response?.data?.error) {
        errorMessage = `❌ ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setIsLoggedIn(false);
    setUser(null);
    setTenant(null);
    setMessage('');
    setTenantSlug('');
    setEmail('');
    setPassword('');
  };

  // Dashboard component for logged-in users
  const Dashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 fade-in">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to {tenant?.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Logged in as: <span className="font-medium">{user?.email}</span> ({user?.role})
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Tenant Information</h3>
              <div className="space-y-2 text-blue-800">
                <p><strong>Name:</strong> {tenant?.name}</p>
                <p><strong>Slug:</strong> {tenant?.slug}</p>
                <p><strong>Plan:</strong> <span className="capitalize bg-blue-200 px-2 py-1 rounded">{tenant?.plan}</span></p>
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-green-900 mb-4">User Profile</h3>
              <div className="space-y-2 text-green-800">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> <span className="capitalize bg-green-200 px-2 py-1 rounded">{user?.role}</span></p>
                <p><strong>Status:</strong> <span className="bg-green-200 px-2 py-1 rounded">Active</span></p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🎉 Success!</h3>
            <p className="text-gray-700 mb-4">
              Your multi-tenant SaaS application is working perfectly! You have successfully:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>✅ Deployed a complete full-stack application</li>
              <li>✅ Implemented multi-tenant architecture</li>
              <li>✅ Set up JWT authentication</li>
              <li>✅ Connected to MongoDB Atlas</li>
              <li>✅ Deployed on Vercel with proper configuration</li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>API Endpoint:</strong> {API_URL}<br/>
                <strong>Frontend URL:</strong> {window.location.origin}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Return dashboard if logged in, otherwise show login form
  if (isLoggedIn) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multi-Tenant Notes
          </h1>
          <p className="text-gray-600">Enter your tenant credentials to continue</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant Slug
            </label>
            <input
              type="text"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="testco"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="admin@testco.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        {message && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm">{message}</p>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">Test Credentials:</p>
          <div className="text-sm text-blue-800">
            <p><strong>Tenant:</strong> testco</p>
            <p><strong>Email:</strong> admin@testco.com</p>
            <p><strong>Password:</strong> Test123!</p>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Backend API: {API_URL}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;




import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

// Configure Axios Global Defaults
// If VITE_API_URL is set (e.g. in Vercel), use it. Otherwise use relative path (local proxy)
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl && apiUrl !== '/') {
  axios.defaults.baseURL = apiUrl;
} else {
    // Default to empty (relative path) for proxy
    axios.defaults.baseURL = ''; 
}

// Configure Axios Request Interceptor to include JWT token & active simulated role
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed?.role) {
        config.headers['x-active-role'] = parsed.role;
      }
    } catch (e) {}
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

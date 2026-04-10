import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import './index.css';

const isAdmin = window.location.pathname === '/admin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? <AdminDashboard /> : <App />}
  </StrictMode>,
);

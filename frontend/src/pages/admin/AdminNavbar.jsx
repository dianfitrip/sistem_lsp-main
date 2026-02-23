import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './adminstyles/AdminDashboard.css'; 

const AdminNavbar = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: 'Admin', role: 'Administrator' });

  // 1. Ambil Data User dari LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          name: parsedUser.name || parsedUser.username || 'Admin',
          role: parsedUser.role || 'Administrator'
        });
      } catch (e) {
        console.error("Gagal parsing data user", e);
      }
    }
  }, []);

  return (
    <header className="top-header">
      {/* BAGIAN KIRI: SAPAAN */}
      <div className="header-title">
        <h3>Selamat datang, {userData.name}!</h3>
        <p className="subtitle">Semoga harimu menyenangkan di sistem ini.</p>
      </div>
      
      {/* BAGIAN KANAN: PROFIL ONLY */}
      <div className="header-actions">
        
        {/* Area Profil (Klik langsung ke halaman profil) */}
        <div 
          className="user-profile clickable" 
          onClick={() => navigate('/admin/profil')}
          title="Ke Halaman Profil"
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '6px 12px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div className="text-right">
            <span className="name" style={{ display: 'block', fontWeight: '600', fontSize: '14px' }}>{userData.name}</span>
            <span className="role" style={{ fontSize: '12px', color: '#64748b' }}>{userData.role}</span>
          </div>
          
          <div className="avatar">
            {userData.name.charAt(0).toUpperCase()}
          </div>
        </div>

      </div>
    </header>
  );
};

export default AdminNavbar;
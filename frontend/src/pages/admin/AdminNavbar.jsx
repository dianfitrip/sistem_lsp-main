import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './adminstyles/AdminDashboard.css'; // Sesuaikan path css jika diperlukan

const AdminNavbar = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: 'Admin', role: 'Administrator' });

  // Ambil Data User yang sedang login
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
      <div className="header-title">
        {/* Judul diubah menjadi sapaan selamat datang */}
        <h3>Selamat datang, {userData.name}! </h3>
        <p className="subtitle">Semoga harimu menyenangkan di sistem ini.</p>
      </div>
      
      <div className="header-actions">
        {/* Tombol Profile (tetap dibiarkan seperti permintaanmu) */}
        <div 
          className="user-profile clickable" 
          onClick={() => navigate('/admin/profile')}
          title="Lihat Profil"
          style={{ cursor: 'pointer' }}
        >
          <div className="text-right">
            <span className="name">{userData.name}</span>
            <span className="role">{userData.role}</span>
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
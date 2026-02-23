import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./index.css"; 

// --- IMPORTS PUBLIC PAGES ---
import Login from "./pages/public/Login";
import PendaftaranAsesi from "./pages/public/Registration";
// Halaman Public lain (Home, FAQ, dll) bisa diimport di sini jika sudah ada komponennya

// --- IMPORTS AUTH PAGES ---
import LoginAdmin from "./pages/auth/LoginAdmin";

// --- IMPORTS ADMIN PAGES ---
import AdminDashboard from "./pages/admin/AdminDashboard"; // Ini bertindak sebagai LAYOUT
import VerifikasiPendaftaran from "./pages/admin/VerifikasiPendaftaran";
import TempatUji from "./pages/admin/TempatUji";
import Skema from "./pages/admin/Skema"; 
import Skkni from "./pages/admin/Skkni"; 
import Asesor from "./pages/admin/Asesor"; 
import JadwalUji from "./pages/admin/JadwalUji";
import Pengaduan from "./pages/admin/Pengaduan";
import Banding from "./pages/admin/Banding";
import DokumenMutu from "./pages/admin/DokumenMutu";
import NotifikasiAdmin from "./pages/admin/Notifikasi"; 
import ProfileAdmin from "./pages/admin/ProfileAdmin"; // <-- NEW: Halaman Profil

// --- IMPORTS USER PAGES ---
import DashboardAsesi from "./pages/public/Profile"; // Asumsi ini dashboard user

function App() {

  // Fungsi Cek Token (Sederhana)
  const isAuthenticated = () => {
    return localStorage.getItem("token") !== null; 
  };

  // Guard: Hanya izinkan akses jika login
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />; // Redirect ke login umum
    }
    return children;
  };

  // Guard Khusus Admin (Opsional: Cek Role)
  const AdminRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token) {
      return <Navigate to="/admin/login" replace />;
    }
    // Jika ingin lebih ketat: if (user.role !== 'admin') ...
    return children;
  };

  return (
    <Router>
      <Routes>

        {/* =========================================
            PUBLIC ROUTES (Bisa diakses siapa saja)
           ========================================= */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pendaftaran" element={<PendaftaranAsesi />} />
        
        {/* Login Khusus Admin */}
        <Route path="/admin/login" element={<LoginAdmin />} />


        {/* =========================================
            ADMIN ROUTES (Butuh Login Admin)
           ========================================= */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              {/* AdminDashboard harus punya <Outlet/> di dalamnya untuk merender child routes */}
              <AdminDashboard /> 
            </AdminRoute>
          }
        >
          {/* Redirect /admin ke /admin/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard Home (Isi konten dashboard di sini, misal statistik) */}
          <Route path="dashboard" element={<div className="p-6"><h2>Selamat Datang di Dashboard Admin</h2></div>} /> 
          
          {/* -- MODUL SERTIFIKASI -- */}
          <Route path="verifikasi-pendaftaran" element={<VerifikasiPendaftaran />} />
          <Route path="skema" element={<Skema />} />
          <Route path="skkni" element={<Skkni />} />
          <Route path="asesor" element={<Asesor />} />
          <Route path="tuk" element={<TempatUji />} />
          <Route path="jadwal/uji-kompetensi" element={<JadwalUji />} />

          {/* -- MODUL LAYANAN -- */}
          <Route path="pengaduan" element={<Pengaduan />} />
          <Route path="banding" element={<Banding />} />
          <Route path="dokumen-mutu" element={<DokumenMutu />} />
          <Route path="notifikasi" element={<NotifikasiAdmin />} />

          {/* -- MODUL AKUN -- */}
          <Route path="profil" element={<ProfileAdmin />} /> {/* Route Profil Baru */}
          
          {/* Placeholder Halaman Belum Ada */}
          <Route path="asesi/list" element={<div className="p-6">Halaman Daftar Asesi (Coming Soon)</div>} /> 

        </Route>


        {/* =========================================
            USER / ASESI ROUTES (Butuh Login User)
           ========================================= */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardAsesi />
            </ProtectedRoute>
          }
        />


        {/* =========================================
            404 PAGE NOT FOUND
           ========================================= */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>
            <p className="text-xl text-gray-600 mt-2">Halaman tidak ditemukan.</p>
            <a href="/" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Kembali ke Beranda</a>
          </div>
        } />

      </Routes>
    </Router>
  );
}

export default App;
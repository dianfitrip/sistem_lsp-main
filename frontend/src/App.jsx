import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./index.css"; 

// --- IMPORTS PAGES ---
// Public Pages
import Login from "./pages/public/Login";
import PendaftaranAsesi from "./pages/public/Registration";
import DashboardAsesi from "./pages/public/Profile"; 

// Auth Pages
import LoginAdmin from "./pages/auth/LoginAdmin";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import VerifikasiPendaftaran from "./pages/admin/VerifikasiPendaftaran";
import TempatUji from "./pages/admin/TempatUji";
import Skema from "./pages/admin/Skema"; 
import Skkni from "./pages/admin/Skkni"; // <-- IMPORT SKKNI
import Asesor from "./pages/admin/Asesor"; 
import JadwalUji from "./pages/admin/JadwalUji";
import Pengaduan from "./pages/admin/Pengaduan";
import Banding from "./pages/admin/Banding";
import DokumenMutu from "./pages/admin/DokumenMutu";
import NotifikasiAdmin from "./pages/admin/Notifikasi"; 

function App() {

  // Fungsi sederhana cek token
  const isAuthenticated = () => {
    return localStorage.getItem("token") !== null; 
  };

  // Wrapper untuk proteksi route (Guard)
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      // Redirect ke login admin jika belum login
      return <Navigate to="/admin/login" replace />; 
    }
    return children;
  };

  return (
    <Router>
      <Routes>

        {/* --- PUBLIC ROUTES --- */}
        {/* Redirect root ke login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route path="/pendaftaran" element={<PendaftaranAsesi />} />
      

        {/* --- ADMIN ROUTES --- */}
        {/* Semua route di dalam sini diawali dengan /admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          {/* Default redirect jika buka /admin saja -> ke dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Halaman Dashboard Utama */}
          <Route path="dashboard" element={null} /> 
          
          {/* Menu Verifikasi */}
          <Route path="verifikasi-pendaftaran" element={<VerifikasiPendaftaran />} />
          
          {/* Menu Asesi (Placeholder) */}
          <Route path="asesi/list" element={<div className="p-6">Halaman Daftar Asesi (Coming Soon)</div>} /> 
          
          {/* Menu TUK (Tempat Uji Kompetensi) */}
          <Route path="tuk" element={<TempatUji />} />

          {/* Menu SKEMA SERTIFIKASI */}
          <Route path="skema" element={<Skema />} />

          {/* Menu DATA SKKNI (BARU) */}
          <Route path="skkni" element={<Skkni />} />

          {/* Menu DAFTAR ASESOR */}
          <Route path="asesor" element={<Asesor />} />

          {/* Menu JADWAL UJI KOMPETENSI */}
          <Route path="jadwal/uji-kompetensi" element={<JadwalUji />} />

          {/* Menu Log & Layanan */}
          <Route path="pengaduan" element={<Pengaduan />} />
          <Route path="banding" element={<Banding />} />
          <Route path="dokumen-mutu" element={<DokumenMutu />} />
          <Route path="notifikasi" element={<NotifikasiAdmin />} />

        </Route>


        {/* --- USER / ASESI ROUTES --- */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardAsesi />
            </ProtectedRoute>
          }
        />

        {/* --- 404 NOT FOUND --- */}
        <Route path="*" element={
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-gray-600 mt-2">Halaman tidak ditemukan.</p>
          </div>
        } />

      </Routes>
    </Router>
  );
}

export default App;
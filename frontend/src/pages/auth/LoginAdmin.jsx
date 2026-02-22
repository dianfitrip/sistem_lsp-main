import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaUserShield, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../services/api"; 
import "./LoginAdmin.css";

const LoginAdmin = () => {
  const navigate = useNavigate();

  // State form login
  const [formData, setFormData] = useState({
    username: "", 
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mengirim request login ke backend
      const response = await api.post("/auth/login", formData);
      const resData = response.data;

      console.log("Respon Login Server:", resData); // Debugging

      // --- LOGIKA PENYIMPANAN TOKEN (PERBAIKAN UTAMA) ---
      // Ambil token dari respon. Cek berbagai kemungkinan struktur respon backend
      const token = resData.token || (resData.data && resData.data.token);
      const user = resData.user || (resData.data && resData.data.user);

      if (token) { 
        // 1. Simpan Token ke LocalStorage (Kunci harus "token" agar terbaca di api.js)
        localStorage.setItem("token", token);
        
        // 2. Simpan data user (opsional, untuk tampilan nama di dashboard)
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }

        // 3. Tampilkan notifikasi sukses
        Swal.fire({
          icon: "success",
          title: "Login Berhasil",
          text: `Selamat datang, ${user?.username || 'Admin'}!`,
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          // 4. Redirect ke Dashboard
          navigate("/admin/dashboard");
        });

      } else {
        throw new Error("Token tidak ditemukan dalam respon server");
      }

    } catch (error) {
      console.error("Login Error:", error);
      
      // Hapus token lama jika login gagal
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text: error.response?.data?.message || error.message || "Username atau password salah",
        confirmButtonColor: "#FF8A00",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-admin-container">
      <div className="login-admin-card">
        <div className="login-admin-header">
          <div className="admin-icon-circle">
            <FaUserShield />
          </div>
          <h2>Administrator</h2>
          <p>Login to access LSP Control Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="login-admin-form">
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <FaUserShield className="input-icon" />
              <input
                type="text" 
                name="username" 
                placeholder="Masukkan username admin"
                value={formData.username} 
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-admin-login"
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "LOGIN TO DASHBOARD"}
          </button>
        </form>

        <div className="login-admin-footer">
          <button
            onClick={() => navigate("/login")}
            className="back-link"
          >
            &larr; Back to User Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;
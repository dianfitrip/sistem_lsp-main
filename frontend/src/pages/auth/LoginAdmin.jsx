import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaUserShield, FaLock, FaEye, FaEyeSlash, FaUser } from "react-icons/fa";
import { Loader2 } from "lucide-react"; // Pastikan install lucide-react atau ganti dengan icon loading lain
import api from "../../services/api"; 
import "./LoginAdmin.css";

const LoginAdmin = () => {
  const navigate = useNavigate();

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
      const response = await api.post("/auth/login", formData);
      const resData = response.data;

      // Ambil token & user
      const token = resData.token || (resData.data && resData.data.token);
      const user = resData.user || (resData.data && resData.data.user);

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Cek Role Admin
        if (user.role === "admin") {
          Swal.fire({
            icon: 'success',
            title: 'Login Berhasil',
            text: 'Selamat datang di Administrator Portal',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            navigate("/admin/dashboard");
          });
        } else {
          Swal.fire("Akses Ditolak", "Akun Anda bukan Administrator.", "error");
          localStorage.clear();
        }
      } else {
        throw new Error("Token tidak ditemukan");
      }
    } catch (error) {
      console.error("Login Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: error.response?.data?.message || "Username atau password salah.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-admin-container">
      <div className="login-admin-card">
        
        {/* Header Section */}
        <div className="login-header">
          <div className="icon-badge">
            <FaUserShield size={32} />
          </div>
          <h2 className="title">Admin Portal</h2>
          <p className="subtitle">Silakan login untuk mengelola sistem.</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="login-form">
          
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="username"
                placeholder="Masukkan username admin"
                value={formData.username} 
                onChange={handleChange}
                required
                autoComplete="off"
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
                placeholder="Masukkan password"
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
            className="btn-login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} /> Memproses...
              </span>
            ) : (
              "MASUK KE DASHBOARD"
            )}
          </button>
        </form>

        <div className="login-footer">
          <button onClick={() => navigate("/login")} className="link-back">
            &larr; Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;
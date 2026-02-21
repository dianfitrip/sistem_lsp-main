import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaUserShield, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../services/api"; 
import "./LoginAdmin.css";

const LoginAdmin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
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

      console.log("Respon Login Server:", resData); // Cek ini di Console Browser (F12)

      // --- PERBAIKAN UTAMA DI SINI ---
      // Kita cari token di 'resData.token' ATAU 'resData.data.token'
      // Ini mengantisipasi struktur respon backend yang berbeda-beda
      const token = resData.token || (resData.data && resData.data.token);
      const user = resData.user || (resData.data && resData.data.user);

      if (token) { 
        // Simpan Token yang BENAR (Bukan undefined)
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        Swal.fire({
          icon: "success",
          title: "Login Berhasil",
          text: `Selamat datang, ${user?.username || 'Admin'}!`,
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate("/admin/dashboard");
        });

      } else {
        // Jika token tetap tidak ketemu, tampilkan pesan error dari server
        throw new Error(resData.message || "Token tidak ditemukan dalam respon server");
      }

    } catch (error) {
      console.error("Login Error:", error);
      Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text: error.response?.data?.message || error.message || "Terjadi kesalahan server",
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
            <label>Email Address</label>
            <div className="input-wrapper">
              <FaUserShield className="input-icon" />
              <input
                type="text" 
                name="email"
                placeholder="admin@lsp.com"
                value={formData.email}
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
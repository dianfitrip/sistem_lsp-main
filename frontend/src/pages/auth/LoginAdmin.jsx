import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaUserShield, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../services/api"; 
import "./LoginAdmin.css";

const LoginAdmin = () => {
  const navigate = useNavigate();

  // 1. UBAH STATE: Ganti 'email' menjadi 'username'
  const [formData, setFormData] = useState({
    username: "", 
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    // Ini akan otomatis mengisi formData.username jika input name="username"
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sekarang yang dikirim adalah { username: "...", password: "..." }
      // Ini COCOK dengan backend asli Anda yang meminta req.body.username
      const response = await api.post("/auth/login", formData);
      const resData = response.data;

      console.log("Respon Login Server:", resData);

      const token = resData.token || (resData.data && resData.data.token);
      const user = resData.user || (resData.data && resData.data.user);

      if (token) { 
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
            {/* 2. UBAH LABEL & INPUT */}
            <label>Username</label>
            <div className="input-wrapper">
              <FaUserShield className="input-icon" />
              <input
                type="text" 
                name="username" // PENTING: name harus 'username'
                placeholder="Masukkan username admin"
                value={formData.username} // Bind ke state username
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
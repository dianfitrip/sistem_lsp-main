const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user.model");
const Role = require("../../models/role.model");
const { secret, expiresIn } = require("../../config/jwt");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      where: { username },
      include: Role
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Password salah"
      });
    }

    const token = jwt.sign(
      {
        id_user: user.id_user,
        role: user.role.role_name
      },
      secret,
      { expiresIn }
    );

    return res.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id_user,
          username: user.username,
          role: user.role.role_name
        }
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });
  }
};

exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: "Logout berhasil (client hapus token)"
  });
};


// Tambahkan di backend/src/controllers/auth/auth.controller.js

exports.register = async (req, res) => {
  try {
    const { username, password, email, id_role, no_hp } = req.body;

    // 1. Cek apakah username sudah ada
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username sudah digunakan" });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Buat User Baru
    const newUser = await User.create({
      username,
      password_hash: passwordHash, // Simpan password yang sudah di-hash
      email,
      id_role, // Pastikan ID Role ini sudah ada di tabel 'roles'
      no_hp,
      status_user: 'aktif'
    });

    res.status(201).json({
      success: true,
      message: "User Admin berhasil dibuat",
      data: {
        id: newUser.id_user,
        username: newUser.username
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal membuat user", error: error.message });
  }
};
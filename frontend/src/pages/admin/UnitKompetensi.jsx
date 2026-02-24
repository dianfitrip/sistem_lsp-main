import React, { useState, useEffect } from "react";
import api from "../../services/api";

const UnitKompetensi = () => {
  const [dataList, setDataList] = useState([]);
  const [skkniList, setSkkniList] = useState([]); // State untuk dropdown SKKNI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Sesuaikan persis dengan field di database unit_kompetensi
  const [formData, setFormData] = useState({
    id_skkni: "",
    kode_unit: "",
    judul_unit: ""
  });

  // Load Data Unit & Data SKKNI (untuk dropdown) pertama kali halaman dibuka
  useEffect(() => {
    fetchData();
    fetchSkkni();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/unit-kompetensi");
      setDataList(response.data.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal mengambil data Unit Kompetensi" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSkkni = async () => {
    try {
      const response = await api.get("/admin/skkni");
      setSkkniList(response.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil data SKKNI", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id_unit);
    setFormData({
      id_skkni: item.id_skkni || "",
      kode_unit: item.kode_unit || "",
      judul_unit: item.judul_unit || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll ke atas saat klik edit
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ id_skkni: "", kode_unit: "", judul_unit: "" });
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validasi agar tidak ada input wajib yang kosong
    if (!formData.id_skkni || !formData.kode_unit || !formData.judul_unit) {
      return alert("Semua kolom (SKKNI, Kode Unit, Judul Unit) wajib diisi!");
    }

    try {
      setLoading(true);
      
      // Konversi tipe data agar sesuai dengan model database
      const payload = {
        id_skkni: parseInt(formData.id_skkni, 10), // INTEGER NOT NULL
        kode_unit: formData.kode_unit, // VARCHAR NOT NULL
        judul_unit: formData.judul_unit // VARCHAR NOT NULL
      };

      if (isEditing) {
        // Mode Update / Edit
        await api.put(`/admin/unit-kompetensi/${editId}`, payload);
        setMessage({ type: "success", text: "Unit Kompetensi berhasil diperbarui!" });
      } else {
        // Mode Tambah Baru
        await api.post("/admin/unit-kompetensi", payload);
        setMessage({ type: "success", text: "Unit Kompetensi berhasil ditambahkan!" });
      }

      handleCancelEdit(); // Reset form
      fetchData(); // Refresh list data di tabel
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Gagal menyimpan data" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus unit kompetensi ini? Peringatan: Menghapus data ini akan ikut menghapus data Observasi dan Pertanyaan yang terhubung dengan unit ini!")) return;

    try {
      setLoading(true);
      await api.delete(`/admin/unit-kompetensi/${id}`);
      setMessage({ type: "success", text: "Unit Kompetensi berhasil dihapus!" });
      fetchData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Gagal menghapus data" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manajemen Unit Kompetensi</h2>

      {message.text && (
        <div className={`p-4 mb-4 text-white rounded ${message.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM TAMBAH / EDIT */}
        <div className="bg-white p-4 rounded shadow col-span-1 h-fit">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">
            {isEditing ? "Edit Unit Kompetensi" : "Tambah Unit Baru"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field: ID SKKNI (Dibuat Dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Standar (SKKNI/SKK)</label>
              <select
                name="id_skkni"
                value={formData.id_skkni}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:ring-blue-200"
                required
              >
                <option value="">-- Pilih Data Standar --</option>
                {skkniList.map((skkni) => (
                  <option key={skkni.id_skkni} value={skkni.id_skkni}>
                    {skkni.jenis_standar} - {skkni.judul_skkni}
                  </option>
                ))}
              </select>
            </div>

            {/* Field: Kode Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Unit</label>
              <input 
                type="text" 
                name="kode_unit" 
                value={formData.kode_unit} 
                onChange={handleChange} 
                placeholder="Contoh: J.620100.004.02" 
                className="w-full border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200" 
                required 
              />
            </div>

            {/* Field: Judul Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Unit</label>
              <textarea 
                name="judul_unit" 
                value={formData.judul_unit} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200" 
                rows="3" 
                required
                placeholder="Contoh: Menggunakan Struktur Data"
              ></textarea>
            </div>
            
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                {isEditing ? "Simpan Perubahan" : "Simpan Data"}
              </button>
              
              {isEditing && (
                <button type="button" onClick={handleCancelEdit} className="w-full bg-gray-400 text-white py-2 rounded hover:bg-gray-500 transition">
                  Batal
                </button>
              )}
            </div>

          </form>
        </div>

        {/* TABEL LIST DATA */}
        <div className="bg-white p-4 rounded shadow col-span-1 lg:col-span-2 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Daftar Unit Kompetensi</h3>
          <table className="w-full text-sm text-left border text-gray-600">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3 border w-12 text-center">No.</th>
                <th className="px-4 py-3 border">Standar (SKKNI ID)</th>
                <th className="px-4 py-3 border">Kode Unit</th>
                <th className="px-4 py-3 border">Judul Unit</th>
                <th className="px-4 py-3 border text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataList.length > 0 ? (
                dataList.map((item, index) => (
                  <tr key={item.id_unit} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 border text-center">{index + 1}</td>
                    {/* Mengambil judul_skkni dari objek asosiasi jika backend mengirimkannya, atau cukup tampilkan ID */}
                    <td className="px-4 py-3 border">{item.skkni?.judul_skkni || `ID: ${item.id_skkni}`}</td>
                    <td className="px-4 py-3 border">{item.kode_unit}</td>
                    <td className="px-4 py-3 border">{item.judul_unit}</td>
                    <td className="px-4 py-3 border text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(item)} className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600">Edit</button>
                        <button onClick={() => handleDelete(item.id_unit)} className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">Belum ada data unit kompetensi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnitKompetensi;
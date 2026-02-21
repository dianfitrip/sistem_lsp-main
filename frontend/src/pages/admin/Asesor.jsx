import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import { 
  Search, Plus, Eye, Edit2, Trash2, X, Save, 
  User, Loader2, ChevronLeft, ChevronRight, MapPin, 
  Lock, BookOpen, Briefcase, Key
} from 'lucide-react';
import './adminstyles/Asesor.css'; 

// URL API Wilayah Indonesia (Sesuai file wilayah.controller.js)
const WILAYAH_API_BASE_URL = "https://emsifa.github.io/api-wilayah-indonesia/api";

const Asesor = () => {
  // --- STATE DATA UTAMA ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); 
  
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // --- STATE WILAYAH (Untuk Opsi Dropdown) ---
  const [provinsiList, setProvinsiList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [kelurahanList, setKelurahanList] = useState([]);

  // --- STATE ID WILAYAH (PENTING: Untuk Trigger API selanjutnya) ---
  // Kita pisahkan ID ini dari formData karena formData menyimpan "Nama" (String)
  const [selectedWilayahId, setSelectedWilayahId] = useState({
    provinsi: '',
    kota: '',
    kecamatan: ''
  });

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    // User Account
    username: '',
    password: '',

    // Profile Data
    nik: '', 
    gelar_depan: '', 
    nama_lengkap: '', 
    gelar_belakang: '', 
    jenis_kelamin: 'laki-laki', 
    tempat_lahir: '',
    tanggal_lahir: '',
    kebangsaan: 'Indonesia',

    pendidikan_terakhir: '',
    tahun_lulus: '',
    institut_asal: '',

    alamat: '',
    rt: '',
    rw: '',
    provinsi: '', // Disimpan sebagai String (Nama)
    kota: '',     // Disimpan sebagai String (Nama)
    kecamatan: '',// Disimpan sebagai String (Nama)
    kelurahan: '',// Disimpan sebagai String (Nama)
    kode_pos: '',

    bidang_keahlian: '',
    no_reg_asesor: '',
    no_lisensi: '',
    masa_berlaku: '',
    status_asesor: 'aktif'
  });

  // --- 1. FETCH DATA ASESOR DARI BACKEND ---
  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/asesor', {
        params: { page, limit: pagination.limit, search: searchTerm }
      });
      const result = response.data.data; 
      
      const rows = result.rows || result;
      const total = result.totalItems || result.length || 0;
      const pages = result.totalPages || 1;

      setData(rows); 
      setPagination(prev => ({ ...prev, page, total, totalPages: pages }));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(pagination.page); }, [pagination.page]);

  // --- 2. LOGIKA API WILAYAH (CASCADING) ---
  
  // A. Ambil Provinsi saat Modal Dibuka
  useEffect(() => {
    if (showModal) {
      // Reset list saat modal buka baru
      if (modalType === 'create') {
        setKotaList([]);
        setKecamatanList([]);
        setKelurahanList([]);
      }
      
      fetch(`${WILAYAH_API_BASE_URL}/provinces.json`)
        .then(res => res.json())
        .then(data => {
          setProvinsiList(data);
        })
        .catch(err => console.error("Gagal ambil provinsi:", err));
    }
  }, [showModal]);

  // B. Ambil Kota saat ID Provinsi Berubah
  useEffect(() => {
    if (selectedWilayahId.provinsi) {
      fetch(`${WILAYAH_API_BASE_URL}/regencies/${selectedWilayahId.provinsi}.json`)
        .then(res => res.json())
        .then(data => setKotaList(data))
        .catch(err => console.error("Gagal ambil kota:", err));
    } else {
      setKotaList([]);
    }
  }, [selectedWilayahId.provinsi]);

  // C. Ambil Kecamatan saat ID Kota Berubah
  useEffect(() => {
    if (selectedWilayahId.kota) {
      fetch(`${WILAYAH_API_BASE_URL}/districts/${selectedWilayahId.kota}.json`)
        .then(res => res.json())
        .then(data => setKecamatanList(data))
        .catch(err => console.error("Gagal ambil kecamatan:", err));
    } else {
      setKecamatanList([]);
    }
  }, [selectedWilayahId.kota]);

  // D. Ambil Kelurahan saat ID Kecamatan Berubah
  useEffect(() => {
    if (selectedWilayahId.kecamatan) {
      fetch(`${WILAYAH_API_BASE_URL}/villages/${selectedWilayahId.kecamatan}.json`)
        .then(res => res.json())
        .then(data => setKelurahanList(data))
        .catch(err => console.error("Gagal ambil kelurahan:", err));
    } else {
      setKelurahanList([]);
    }
  }, [selectedWilayahId.kecamatan]);


  // --- HANDLERS ---
  const handleSearch = (e) => { 
    e.preventDefault(); 
    setPagination(prev => ({ ...prev, page: 1 })); 
    fetchData(1); 
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler Khusus Wilayah: Simpan NAMA ke DB, Simpan ID ke State untuk API
  const handleWilayahChange = (e, level) => {
    const selectedId = e.target.value;
    const selectedIndex = e.target.selectedIndex;
    // Ambil teks (Nama Wilayah) dari option yang dipilih
    const selectedName = e.target.options[selectedIndex].text;

    // 1. Update Form Data (Simpan Nama)
    setFormData(prev => ({ ...prev, [level]: selectedName }));

    // 2. Update ID & Reset Anak Wilayah
    if (level === 'provinsi') {
      setSelectedWilayahId({ provinsi: selectedId, kota: '', kecamatan: '' });
      // Reset form bawahnya
      setFormData(prev => ({ ...prev, provinsi: selectedName, kota: '', kecamatan: '', kelurahan: '' }));
    } else if (level === 'kota') {
      setSelectedWilayahId(prev => ({ ...prev, kota: selectedId, kecamatan: '' }));
      setFormData(prev => ({ ...prev, kota: selectedName, kecamatan: '', kelurahan: '' }));
    } else if (level === 'kecamatan') {
      setSelectedWilayahId(prev => ({ ...prev, kecamatan: selectedId }));
      setFormData(prev => ({ ...prev, kecamatan: selectedName, kelurahan: '' }));
    } else if (level === 'kelurahan') {
      setFormData(prev => ({ ...prev, kelurahan: selectedName }));
    }
  };

  const resetForm = () => {
    setFormData({
      username: '', password: '',
      nik: '', gelar_depan: '', nama_lengkap: '', gelar_belakang: '',
      jenis_kelamin: 'laki-laki', tempat_lahir: '', tanggal_lahir: '', kebangsaan: 'Indonesia',
      pendidikan_terakhir: '', tahun_lulus: '', institut_asal: '',
      alamat: '', rt: '', rw: '', provinsi: '', kota: '', kecamatan: '', kelurahan: '', kode_pos: '',
      bidang_keahlian: '', no_reg_asesor: '', no_lisensi: '', masa_berlaku: '', status_asesor: 'aktif'
    });
    setSelectedWilayahId({ provinsi: '', kota: '', kecamatan: '' });
  };

  const handleCreate = () => {
    setModalType('create');
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalType('edit');
    // Load data item ke form
    setFormData({ ...item, password: '' });
    // Note: Untuk edit, dropdown wilayah tidak akan otomatis ter-select ID-nya 
    // karena kita hanya menyimpan Nama di database. User harus pilih ulang jika ingin ganti alamat.
    setShowModal(true);
  };

  const handleDetail = (item) => {
    setModalType('detail');
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Asesor?', text: "Data user & profil akan dihapus permanen.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/asesor/${id}`);
        Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
        fetchData(pagination.page);
      } catch (error) {
        Swal.fire('Gagal!', error.response?.data?.message || 'Gagal menghapus data.', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'create') {
        await api.post('/admin/asesor', formData);
        Swal.fire('Berhasil!', 'Asesor baru berhasil ditambahkan.', 'success');
      } else {
        const updatePayload = { ...formData };
        if (!updatePayload.password) delete updatePayload.password;
        await api.put(`/admin/asesor/${formData.id_asesor || formData.id_user}`, updatePayload);
        Swal.fire('Berhasil!', 'Data asesor diperbarui.', 'success');
      }
      setShowModal(false);
      fetchData(pagination.page);
    } catch (error) {
      console.error(error);
      Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
    }
  };

  const isDetailMode = modalType === 'detail';

  return (
    <div className="asesor-container">
      {/* HEADER & FILTER SECTION */}
      <div className="header-section">
        <div className="title-box">
          <h2>Manajemen Asesor</h2>
          <p>Kelola data akun dan profil asesor LSP.</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>
          <Plus size={18} /> Tambah Asesor
        </button>
      </div>

      <div className="filter-section">
        <form onSubmit={handleSearch} className="search-box">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Cari Nama, NIK, atau Username..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="table-container">
        {loading ? <div className="loading-state"><Loader2 className="animate-spin"/> Memuat...</div> : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>No</th><th>Nama Lengkap</th><th>NIK</th><th>Username</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.id_user || index}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar"><User size={16}/></div>
                        <div>
                          <span className="font-medium">{item.gelar_depan} {item.nama_lengkap} {item.gelar_belakang}</span>
                          <div className="text-xs text-gray-500">{item.bidang_keahlian}</div>
                        </div>
                      </div>
                    </td>
                    <td>{item.nik}</td>
                    <td>{item.user?.username || item.username || '-'}</td>
                    <td>
                      <span className={`status-badge ${item.status_asesor === 'aktif' ? 'success' : 'inactive'}`}>
                        {item.status_asesor ? item.status_asesor.toUpperCase() : 'NONAKTIF'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action view" onClick={() => handleDetail(item)}><Eye size={16}/></button>
                        <button className="btn-action edit" onClick={() => handleEdit(item)}><Edit2 size={16}/></button>
                        <button className="btn-action delete" onClick={() => handleDelete(item.id_user)}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (<tr><td colSpan="6" className="empty-state">Data tidak ditemukan.</td></tr>)}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className="pagination-section">
        <span>Halaman {pagination.page} dari {pagination.totalPages}</span>
        <div className="pagination-controls">
          <button disabled={pagination.page===1} onClick={() => setPagination(p=>({...p, page: p.page-1}))}><ChevronLeft size={16}/></button>
          <button disabled={pagination.page===pagination.totalPages} onClick={() => setPagination(p=>({...p, page: p.page+1}))}><ChevronRight size={16}/></button>
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>{modalType === 'create' ? 'Tambah Asesor Baru' : modalType === 'edit' ? 'Edit Data Asesor' : 'Detail Asesor'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body scrollable">
                
                {/* 1. DATA AKUN */}
                {modalType !== 'detail' && (
                  <>
                    <h4 className="section-title"><Lock size={16} /> Data Akun Login</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Username <span className="text-red-500">*</span></label>
                        <div className="input-with-icon">
                          <User size={14} className="input-icon-left"/>
                          <input type="text" name="username" className="pl-8" value={formData.username} onChange={handleInputChange} disabled={modalType === 'edit'} required placeholder="Buat username unik"/>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Password {modalType === 'create' && <span className="text-red-500">*</span>}</label>
                        <div className="input-with-icon">
                          <Key size={14} className="input-icon-left"/>
                          <input type="password" name="password" className="pl-8" value={formData.password} onChange={handleInputChange} required={modalType === 'create'} placeholder={modalType === 'create' ? "Password akun" : "Kosongkan jika tidak diganti"}/>
                        </div>
                      </div>
                    </div>
                    <hr className="divider"/>
                  </>
                )}

                {/* 2. DATA PRIBADI */}
                <h4 className="section-title"><User size={16} /> Data Pribadi</h4>
                <div className="form-row">
                  <div className="form-group"><label>NIK <span className="text-red-500">*</span></label><input type="text" name="nik" value={formData.nik} onChange={handleInputChange} disabled={isDetailMode} required maxLength="16"/></div>
                  <div className="form-group"><label>Nama Lengkap <span className="text-red-500">*</span></label><input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} disabled={isDetailMode} required/></div>
                </div>
                
                <div className="form-row three-col">
                  <div className="form-group"><label>Gelar Depan</label><input name="gelar_depan" value={formData.gelar_depan} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group"><label>Gelar Belakang</label><input name="gelar_belakang" value={formData.gelar_belakang} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group"><label>Jenis Kelamin</label>
                    <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} disabled={isDetailMode}>
                      <option value="laki-laki">Laki-laki</option>
                      <option value="perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="form-row three-col">
                  <div className="form-group"><label>Tempat Lahir</label><input name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group"><label>Tanggal Lahir</label><input type="date" name="tanggal_lahir" value={formData.tanggal_lahir ? formData.tanggal_lahir.split('T')[0] : ''} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group"><label>Kebangsaan</label><input name="kebangsaan" value={formData.kebangsaan} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>

                {/* 3. PENDIDIKAN */}
                <h4 className="section-title"><BookOpen size={16} /> Pendidikan</h4>
                <div className="form-row">
                  <div className="form-group"><label>Pendidikan Terakhir</label><input name="pendidikan_terakhir" value={formData.pendidikan_terakhir} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group"><label>Tahun Lulus</label><input type="number" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width"><label>Institut Asal</label><input name="institut_asal" value={formData.institut_asal} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>

                {/* 4. ALAMAT (WILAYAH API) */}
                <h4 className="section-title"><MapPin size={16} /> Alamat Domisili</h4>
                <div className="form-row">
                   <div className="form-group full-width"><label>Jalan / Nama Tempat</label><textarea name="alamat" value={formData.alamat} onChange={handleInputChange} disabled={isDetailMode} rows="2"/></div>
                </div>
                <div className="form-row three-col">
                   <div className="form-group"><label>RT</label><input name="rt" value={formData.rt} onChange={handleInputChange} disabled={isDetailMode} maxLength="3"/></div>
                   <div className="form-group"><label>RW</label><input name="rw" value={formData.rw} onChange={handleInputChange} disabled={isDetailMode} maxLength="3"/></div>
                   <div className="form-group"><label>Kode Pos</label><input name="kode_pos" value={formData.kode_pos} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>
                
                {/* --- INPUT WILAYAH BERTINGKAT --- */}
                <div className="form-row">
                    <div className="form-group">
                      <label>Provinsi</label>
                      {isDetailMode ? (
                        <input type="text" value={formData.provinsi} disabled />
                      ) : (
                        <select 
                          onChange={(e) => handleWilayahChange(e, 'provinsi')} 
                          value={selectedWilayahId.provinsi}
                        >
                          <option value="">Pilih Provinsi</option>
                          {provinsiList.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Kota/Kabupaten</label>
                      {isDetailMode ? (
                        <input type="text" value={formData.kota} disabled />
                      ) : (
                        <select 
                          onChange={(e) => handleWilayahChange(e, 'kota')} 
                          value={selectedWilayahId.kota}
                          disabled={!selectedWilayahId.provinsi} // Disable jika provinsi belum dipilih
                        >
                          <option value="">Pilih Kota/Kab</option>
                          {kotaList.map(k => (
                            <option key={k.id} value={k.id}>{k.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                      <label>Kecamatan</label>
                      {isDetailMode ? (
                        <input type="text" value={formData.kecamatan} disabled />
                      ) : (
                        <select 
                          onChange={(e) => handleWilayahChange(e, 'kecamatan')} 
                          value={selectedWilayahId.kecamatan}
                          disabled={!selectedWilayahId.kota} // Disable jika kota belum dipilih
                        >
                          <option value="">Pilih Kecamatan</option>
                          {kecamatanList.map(k => (
                            <option key={k.id} value={k.id}>{k.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Kelurahan/Desa</label>
                      {isDetailMode ? (
                        <input type="text" value={formData.kelurahan} disabled />
                      ) : (
                        <select 
                          onChange={(e) => handleWilayahChange(e, 'kelurahan')} 
                          disabled={!selectedWilayahId.kecamatan} // Disable jika kecamatan belum dipilih
                        >
                          <option value="">Pilih Kelurahan</option>
                          {kelurahanList.map(k => (
                            <option key={k.id} value={k.id}>{k.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                </div>

                {/* 5. DATA PROFESI */}
                <h4 className="section-title"><Briefcase size={16} /> Data Profesi</h4>
                <div className="form-row">
                   <div className="form-group"><label>Bidang Keahlian</label><input name="bidang_keahlian" value={formData.bidang_keahlian} onChange={handleInputChange} disabled={isDetailMode}/></div>
                   <div className="form-group"><label>Status</label>
                      <select name="status_asesor" value={formData.status_asesor} onChange={handleInputChange} disabled={isDetailMode}>
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                   </div>
                </div>
                <div className="form-row">
                   <div className="form-group"><label>No. Registrasi (MET)</label><input name="no_reg_asesor" value={formData.no_reg_asesor} onChange={handleInputChange} disabled={isDetailMode}/></div>
                   <div className="form-group"><label>No. Lisensi (BNSP)</label><input name="no_lisensi" value={formData.no_lisensi} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>
                <div className="form-row">
                   <div className="form-group"><label>Masa Berlaku Lisensi</label><input type="date" name="masa_berlaku" value={formData.masa_berlaku ? formData.masa_berlaku.split('T')[0] : ''} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>{isDetailMode ? 'Tutup' : 'Batal'}</button>
                {!isDetailMode && <button type="submit" className="btn-save"><Save size={16}/> Simpan Data</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asesor;
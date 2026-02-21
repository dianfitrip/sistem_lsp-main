import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api"; 
import { 
  Search, Plus, Eye, EyeOff, Edit2, Trash2, X, Save, 
  User, Loader2, ChevronLeft, ChevronRight, MapPin, 
  Lock, BookOpen, Briefcase, Key
} from 'lucide-react';
import './adminstyles/Asesor.css'; 

const Asesor = () => {
  // --- STATE UTAMA ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // --- FITUR UI ---
  const [showPassword, setShowPassword] = useState(false);

  // --- STATE WILAYAH ---
  const [provinsiList, setProvinsiList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [kelurahanList, setKelurahanList] = useState([]);
  const [selectedWilayahId, setSelectedWilayahId] = useState({ provinsi: '', kota: '', kecamatan: '' });

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    // Fields untuk Tabel User (Dibutuhkan Backend)
    username: '', 
    password: '',
    email: '',    // PENTING: allowNull false di tabel users
    no_hp: '',    // PENTING: allowNull false di tabel users

    // Fields untuk Tabel Profile Asesor (profileAsesor.model.js)
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
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    kode_pos: '',
    bidang_keahlian: '',
    no_reg_asesor: '',
    no_lisensi: '',
    masa_berlaku: '',
    status_asesor: 'aktif'
  });

  // --- 1. FETCH DATA ASESOR ---
  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/asesor', {
        params: { page, limit: pagination.limit, search: searchTerm }
      });
      const result = response.data.data; 
      const rows = result.rows || result;
      
      setData(rows); 
      setPagination(prev => ({
        ...prev,
        page: result.currentPage || page,
        total: result.totalItems || 0,
        totalPages: result.totalPages || 1
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(pagination.page); }, [pagination.page]);

  // --- 2. LOGIKA WILAYAH (BACKEND PROXY) ---
  useEffect(() => {
    if (showModal) {
      api.get('/public/provinsi')
        .then(res => setProvinsiList(res.data))
        .catch(err => console.error("Gagal ambil provinsi:", err));
    }
  }, [showModal]);

  useEffect(() => {
    if (selectedWilayahId.provinsi) {
      api.get(`/public/kota/${selectedWilayahId.provinsi}`)
        .then(res => setKotaList(res.data))
        .catch(err => console.error("Gagal ambil kota:", err));
    } else { setKotaList([]); }
  }, [selectedWilayahId.provinsi]);

  useEffect(() => {
    if (selectedWilayahId.kota) {
      api.get(`/public/kecamatan/${selectedWilayahId.kota}`)
        .then(res => setKecamatanList(res.data))
        .catch(err => console.error("Gagal ambil kecamatan:", err));
    } else { setKecamatanList([]); }
  }, [selectedWilayahId.kota]);

  useEffect(() => {
    if (selectedWilayahId.kecamatan) {
      api.get(`/public/kelurahan/${selectedWilayahId.kecamatan}`)
        .then(res => setKelurahanList(res.data))
        .catch(err => console.error("Gagal ambil kelurahan:", err));
    } else { setKelurahanList([]); }
  }, [selectedWilayahId.kecamatan]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWilayahChange = (e, level) => {
    const selectedId = e.target.value;
    const selectedName = e.target.options[e.target.selectedIndex].text;

    setFormData(prev => ({ ...prev, [level]: selectedName }));

    if (level === 'provinsi') {
      setSelectedWilayahId({ provinsi: selectedId, kota: '', kecamatan: '' });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'create') {
        // Mengirim data lengkap sesuai alur backend Anda
        await api.post('/admin/asesor', formData);
        Swal.fire('Berhasil!', 'Asesor dan Akun berhasil dibuat.', 'success');
      } else {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/admin/asesor/${formData.id_user}`, payload);
        Swal.fire('Berhasil!', 'Data diperbarui.', 'success');
      }
      setShowModal(false);
      fetchData(pagination.page);
    } catch (error) {
      Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setShowPassword(false);
    if (item) {
      setFormData({ ...item, password: '' });
    } else {
      setFormData({
        username: '', password: '', email: '', no_hp: '',
        nik: '', gelar_depan: '', nama_lengkap: '', gelar_belakang: '',
        jenis_kelamin: 'laki-laki', tempat_lahir: '', tanggal_lahir: '', kebangsaan: 'Indonesia',
        pendidikan_terakhir: '', tahun_lulus: '', institut_asal: '',
        alamat: '', rt: '', rw: '', provinsi: '', kota: '', kecamatan: '', kelurahan: '', kode_pos: '',
        bidang_keahlian: '', no_reg_asesor: '', no_lisensi: '', masa_berlaku: '', status_asesor: 'aktif'
      });
      setSelectedWilayahId({ provinsi: '', kota: '', kecamatan: '' });
    }
    setShowModal(true);
  };

  const isDetailMode = modalType === 'detail';

  return (
    <div className="asesor-container">
      <div className="header-section">
        <div className="title-box">
          <h2>Manajemen Asesor</h2>
          <p>Kelola data akun login dan informasi profil lengkap asesor.</p>
        </div>
        <button className="btn-create" onClick={() => openModal('create')}>
          <Plus size={18} /> Tambah Asesor
        </button>
      </div>

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
                    <td>{item.nama_lengkap}</td>
                    <td>{item.nik}</td>
                    <td>{item.user?.username || '-'}</td>
                    <td><span className={`status-badge ${item.status_asesor === 'aktif' ? 'success' : 'inactive'}`}>{item.status_asesor}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action view" onClick={() => openModal('detail', item)}><Eye size={16}/></button>
                        <button className="btn-action edit" onClick={() => openModal('edit', item)}><Edit2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (<tr><td colSpan="6" className="empty-state">Data tidak ditemukan.</td></tr>)}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>{modalType === 'create' ? 'Tambah Asesor' : modalType === 'edit' ? 'Edit Asesor' : 'Detail Asesor'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body scrollable">
                
                {/* 1. DATA AKUN (Wajib diisi karena tabel users NOT NULL) */}
                <h4 className="section-title"><Lock size={16} /> Data Akun Login</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username <span className="text-red-500">*</span></label>
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} disabled={modalType === 'edit' || isDetailMode} required placeholder="Username untuk login"/>
                  </div>
                  <div className="form-group">
                    <label>Password {modalType === 'create' && <span className="text-red-500">*</span>}</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                      <Key size={14} className="input-icon-left"/>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        className="pl-8 pr-10"
                        value={formData.password} 
                        onChange={handleInputChange} 
                        required={modalType === 'create'} 
                        disabled={isDetailMode}
                        placeholder={modalType === 'create' ? "Password akun" : "Kosongkan jika tidak diganti"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email Utama <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={isDetailMode} placeholder="Contoh: asesor@gmail.com"/>
                  </div>
                  <div className="form-group">
                    <label>No. HP (WhatsApp) <span className="text-red-500">*</span></label>
                    <input type="text" name="no_hp" value={formData.no_hp} onChange={handleInputChange} required disabled={isDetailMode} placeholder="08xxxxxxxxxx"/>
                  </div>
                </div>

                <hr className="divider"/>

                {/* 2. DATA PRIBADI (profile_asesor) */}
                <h4 className="section-title"><User size={16} /> Profil Pribadi</h4>
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
                <h4 className="section-title"><BookOpen size={16} /> Pendidikan Terakhir</h4>
                <div className="form-row">
                  <div className="form-group"><label>Jenjang Pendidikan</label><input name="pendidikan_terakhir" value={formData.pendidikan_terakhir} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group"><label>Tahun Lulus</label><input type="number" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width"><label>Institut Asal</label><input name="institut_asal" value={formData.institut_asal} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>

                {/* 4. ALAMAT */}
                <h4 className="section-title"><MapPin size={16} /> Alamat Domisili</h4>
                <div className="form-row">
                   <div className="form-group full-width"><label>Jalan / Alamat Lengkap</label><textarea name="alamat" value={formData.alamat} onChange={handleInputChange} disabled={isDetailMode} rows="2"/></div>
                </div>
                <div className="form-row three-col">
                   <div className="form-group"><label>RT</label><input name="rt" value={formData.rt} onChange={handleInputChange} disabled={isDetailMode} maxLength="3"/></div>
                   <div className="form-group"><label>RW</label><input name="rw" value={formData.rw} onChange={handleInputChange} disabled={isDetailMode} maxLength="3"/></div>
                   <div className="form-group"><label>Kode Pos</label><input name="kode_pos" value={formData.kode_pos} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                      <label>Provinsi</label>
                      {isDetailMode ? <input value={formData.provinsi} disabled /> : (
                        <select onChange={(e) => handleWilayahChange(e, 'provinsi')} value={selectedWilayahId.provinsi}>
                          <option value="">-- Pilih Provinsi --</option>
                          {provinsiList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Kota/Kabupaten</label>
                      {isDetailMode ? <input value={formData.kota} disabled /> : (
                        <select onChange={(e) => handleWilayahChange(e, 'kota')} value={selectedWilayahId.kota} disabled={!selectedWilayahId.provinsi}>
                          <option value="">-- Pilih Kota/Kab --</option>
                          {kotaList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </select>
                      )}
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                      <label>Kecamatan</label>
                      {isDetailMode ? <input value={formData.kecamatan} disabled /> : (
                        <select onChange={(e) => handleWilayahChange(e, 'kecamatan')} value={selectedWilayahId.kecamatan} disabled={!selectedWilayahId.kota}>
                          <option value="">-- Pilih Kecamatan --</option>
                          {kecamatanList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Kelurahan/Desa</label>
                      {isDetailMode ? <input value={formData.kelurahan} disabled /> : (
                        <select onChange={(e) => handleWilayahChange(e, 'kelurahan')} disabled={!selectedWilayahId.kecamatan}>
                          <option value="">-- Pilih Kelurahan --</option>
                          {kelurahanList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </select>
                      )}
                    </div>
                </div>

                {/* 5. DATA PROFESI */}
                <h4 className="section-title"><Briefcase size={16} /> Data Profesi Asesor</h4>
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
                {!isDetailMode && <button type="submit" className="btn-save"><Save size={16}/> Simpan Asesor</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asesor;
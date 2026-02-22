import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Eye, EyeOff, Edit2, Trash2, X, Save, Download, Upload,
  MapPin, User, Building2, Loader2, ChevronLeft, ChevronRight, Lock, Key, FileText
} from 'lucide-react';
import './adminstyles/TempatUji.css';

const TempatUji = () => {
  // --- STATE UTAMA ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, total: 0, totalPages: 1
  });

  // State Wilayah
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedIds, setSelectedIds] = useState({ prov: '', city: '', dist: '' });

  // --- FORM STATE (SESUAI TUK.MODEL.JS) ---
  const [formData, setFormData] = useState({
    // Akun User
    username: '',
    password: '',
    // Data Profil TUK
    kode_tuk: '',
    nama_tuk: '',
    jenis_tuk: 'sewaktu', // ENUM: mandiri, sewaktu, tempat_kerja
    penanggung_jawab: '',
    institusi_induk: '',
    telepon: '',
    email: '',
    alamat: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    kode_pos: '',
    no_lisensi: '',
    masa_berlaku_lisensi: '',
    status: 'aktif' // ENUM: aktif, nonaktif
  });

  // --- FETCH DATA ---
  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/tuk', {
        params: { page, limit: pagination.limit, search: searchTerm }
      });
      const result = response.data.data;
      setData(result.rows || []);
      setPagination(prev => ({
        ...prev,
        page: result.currentPage || page,
        total: result.totalItems || 0,
        totalPages: result.totalPages || 1
      }));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(pagination.page); }, [pagination.page]);

  // --- LOGIKA WILAYAH (Proxy Backend) ---
  useEffect(() => {
    if (showModal) {
      api.get('/public/provinsi').then(res => setProvinces(res.data)).catch(console.error);
    }
  }, [showModal]);

  const handleProvinceChange = async (e) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, provinsi: name, kota: '', kecamatan: '', kelurahan: '' });
    setSelectedIds({ prov: id, city: '', dist: '' });
    if (id) api.get(`/public/kota/${id}`).then(res => setCities(res.data));
  };

  const handleCityChange = async (e) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, kota: name, kecamatan: '', kelurahan: '' });
    setSelectedIds(prev => ({ ...prev, city: id, dist: '' }));
    if (id) api.get(`/public/kecamatan/${id}`).then(res => setDistricts(res.data));
  };

  const handleDistrictChange = async (e) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, kecamatan: name, kelurahan: '' });
    setSelectedIds(prev => ({ ...prev, dist: id }));
    if (id) api.get(`/public/kelurahan/${id}`).then(res => setVillages(res.data));
  };

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'create') {
        await api.post('/admin/tuk', formData);
        Swal.fire('Berhasil!', 'Akun dan profil TUK berhasil dibuat', 'success');
      } else {
        const { username, password, ...updateData } = formData;
        await api.put(`/admin/tuk/${formData.id_tuk}`, updateData);
        Swal.fire('Berhasil!', 'Data TUK berhasil diperbarui', 'success');
      }
      setShowModal(false);
      fetchData(pagination.page);
    } catch (error) {
      Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus TUK?', text: "Data akan dihapus permanen!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/tuk/${id}`);
        Swal.fire('Dihapus!', 'Data telah dihapus', 'success');
        fetchData(pagination.page);
      } catch (err) { Swal.fire('Gagal!', 'Terjadi kesalahan', 'error'); }
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setShowPassword(false);
    if (item) {
      setFormData({ ...item, masa_berlaku_lisensi: item.masa_berlaku_lisensi?.split('T')[0] || '' });
    } else {
      setFormData({
        username: '', password: '', kode_tuk: '', nama_tuk: '', jenis_tuk: 'sewaktu',
        penanggung_jawab: '', institusi_induk: '', telepon: '', email: '',
        alamat: '', provinsi: '', kota: '', kecamatan: '', kelurahan: '',
        kode_pos: '', no_lisensi: '', masa_berlaku_lisensi: '', status: 'aktif'
      });
      setSelectedIds({ prov: '', city: '', dist: '' });
    }
    setShowModal(true);
  };

  const isDetailMode = modalType === 'detail';

  return (
    <div className="tuk-container">
      {/* HEADER */}
      <div className="header-section">
        <div className="title-box">
          <h2>Tempat Uji Kompetensi (TUK)</h2>
          <p>Kelola profil dan akun akses operasional TUK.</p>
        </div>
        <button className="btn-create" onClick={() => openModal('create')}>
          <Plus size={18} /> Tambah TUK
        </button>
      </div>

      {/* SEARCH */}
      <div className="filter-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input 
            type="text" placeholder="Cari nama atau kode TUK..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>No</th><th>Kode</th><th>Nama TUK</th><th>Jenis</th><th>PJ / Telepon</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.id_tuk}>
                  <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                  <td><span className="font-mono font-bold text-orange-600">{item.kode_tuk}</span></td>
                  <td>{item.nama_tuk}</td>
                  <td className="capitalize">{item.jenis_tuk.replace('_', ' ')}</td>
                  <td>
                    <div className="pj-cell">
                      <span>{item.penanggung_jawab}</span>
                      <small>{item.telepon}</small>
                    </div>
                  </td>
                  <td><span className={`status-badge ${item.status}`}>{item.status.toUpperCase()}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action view" onClick={() => openModal('detail', item)}><Eye size={16}/></button>
                      <button className="btn-action edit" onClick={() => openModal('edit', item)}><Edit2 size={16}/></button>
                      <button className="btn-action delete" onClick={() => handleDelete(item.id_tuk)}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>{modalType.toUpperCase()} TUK</h3>
              <button onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body scrollable">
                
                {/* 1. SEKSI AKUN */}
                {modalType === 'create' && (
                  <>
                    <h4 className="section-title"><Lock size={16} /> Data Akun Login</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Username *</label>
                        <input name="username" value={formData.username} onChange={handleInputChange} required placeholder="Username TUK" />
                      </div>
                      <div className="form-group">
                        <label>Password *</label>
                        <div className="input-with-icon" style={{ position: 'relative' }}>
                          <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" value={formData.password} onChange={handleInputChange} required 
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none' }}>
                            {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                          </button>
                        </div>
                      </div>
                    </div>
                    <hr className="divider" />
                  </>
                )}

                {/* 2. PROFIL TUK */}
                <h4 className="section-title"><Building2 size={16} /> Informasi Profil TUK</h4>
                <div className="form-row">
                  <div className="form-group"><label>Nama TUK *</label><input name="nama_tuk" value={formData.nama_tuk} onChange={handleInputChange} required disabled={isDetailMode} /></div>
                  <div className="form-group"><label>Kode TUK</label><input name="kode_tuk" value={formData.kode_tuk} onChange={handleInputChange} disabled={isDetailMode} /></div>
                </div>

                <div className="form-row three-col">
                  <div className="form-group">
                    <label>Jenis TUK</label>
                    <select name="jenis_tuk" value={formData.jenis_tuk} onChange={handleInputChange} disabled={isDetailMode}>
                      <option value="sewaktu">Sewaktu</option>
                      <option value="mandiri">Mandiri</option>
                      <option value="tempat_kerja">Tempat Kerja</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Penanggung Jawab</label><input name="penanggung_jawab" value={formData.penanggung_jawab} onChange={handleInputChange} disabled={isDetailMode} /></div>
                  <div className="form-group"><label>Institusi Induk</label><input name="institusi_induk" value={formData.institusi_induk} onChange={handleInputChange} disabled={isDetailMode} /></div>
                </div>

                <div className="form-row">
                  <div className="form-group"><label>Email TUK</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={isDetailMode} /></div>
                  <div className="form-group"><label>Telepon / WhatsApp</label><input name="telepon" value={formData.telepon} onChange={handleInputChange} disabled={isDetailMode} /></div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width"><label>Alamat Lengkap</label><textarea name="alamat" value={formData.alamat} onChange={handleInputChange} disabled={isDetailMode} rows="2" /></div>
                </div>

                {/* WILAYAH */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Provinsi</label>
                    <select onChange={handleProvinceChange} disabled={isDetailMode} value={selectedIds.prov}>
                      <option value="">{formData.provinsi || '-- Pilih Provinsi --'}</option>
                      {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Kota/Kabupaten</label>
                    <select onChange={handleCityChange} disabled={isDetailMode || !selectedIds.prov} value={selectedIds.city}>
                      <option value="">{formData.kota || '-- Pilih Kota --'}</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row three-col">
                  <div className="form-group">
                    <label>Kecamatan</label>
                    <select onChange={handleDistrictChange} disabled={isDetailMode || !selectedIds.city} value={selectedIds.dist}>
                      <option value="">{formData.kecamatan || '-- Pilih Kecamatan --'}</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Kelurahan</label>
                    <select name="kelurahan" onChange={handleInputChange} disabled={isDetailMode || !selectedIds.dist}>
                      <option value="">{formData.kelurahan || '-- Pilih Kelurahan --'}</option>
                      {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Kode Pos</label><input name="kode_pos" value={formData.kode_pos} onChange={handleInputChange} disabled={isDetailMode} /></div>
                </div>

                {/* LISENSI */}
                <h4 className="section-title"><FileText size={16} /> Lisensi & Status</h4>
                <div className="form-row">
                  <div className="form-group"><label>No. Lisensi</label><input name="no_lisensi" value={formData.no_lisensi} onChange={handleInputChange} disabled={isDetailMode} /></div>
                  <div className="form-group"><label>Masa Berlaku Lisensi</label><input type="date" name="masa_berlaku_lisensi" value={formData.masa_berlaku_lisensi} onChange={handleInputChange} disabled={isDetailMode} /></div>
                  <div className="form-group">
                    <label>Status Operasional</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} disabled={isDetailMode}>
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
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

export default TempatUji;
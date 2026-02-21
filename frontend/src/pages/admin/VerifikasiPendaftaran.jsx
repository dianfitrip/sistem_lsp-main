import React, { useState, useEffect } from 'react';

import Swal from 'sweetalert2';
import api from "../../services/api";
import { 
  Search, Plus, Eye, Edit2, Trash2, CheckCircle, X, Save, 
  User, Mail, Phone, MapPin, Briefcase, Calendar, Layers 
} from 'lucide-react';
import './adminstyles/VerifikasiPendaftaran.css';


const VerifikasiPendaftaran = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create', 'edit', 'detail'
  const [selectedItem, setSelectedItem] = useState(null);
  
  // State Form Lengkap
  const [formData, setFormData] = useState({
    nama_lengkap: '', 
    nik: '', 
    email: '', 
    no_hp: '', 
    program_studi: '', 
    id_tuk: '',
    provinsi: '', 
    kota: '', 
    kecamatan: '', 
    kelurahan: '', 
    alamat_lengkap: ''
  });

  // --- HELPER: FORMAT TANGGAL ---
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/pendaftaran');
      const result = response.data.data || response.data;
      setData(result);
      setFilteredData(result);
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Gagal memuat data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredData(data.filter(item => 
      item.nama_lengkap?.toLowerCase().includes(lower) ||
      item.email?.toLowerCase().includes(lower) ||
      item.program_studi?.toLowerCase().includes(lower)
    ));
  }, [searchTerm, data]);

  // --- HANDLERS MODAL ---
  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);

    if (type === 'create') {
      // Reset Form untuk Create
      setFormData({ 
        nama_lengkap: '', nik: '', email: '', no_hp: '', 
        program_studi: '', id_tuk: '',
        provinsi: '', kota: '', kecamatan: '', kelurahan: '', alamat_lengkap: '' 
      });
    } else if (item) {
      // Isi Form untuk Edit (Map semua field)
      setFormData({
        nama_lengkap: item.nama_lengkap || '',
        nik: item.nik || '',
        email: item.email || '',
        no_hp: item.no_hp || '',
        program_studi: item.program_studi || '',
        id_tuk: item.id_tuk || '',
        provinsi: item.provinsi || '',
        kota: item.kota || '',
        kecamatan: item.kecamatan || '',
        kelurahan: item.kelurahan || '',
        alamat_lengkap: item.alamat_lengkap || ''
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // --- CRUD ACTIONS ---
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'create') {
        await api.post('/admin/pendaftaran', formData);
        Swal.fire("Sukses", "Data berhasil ditambahkan", "success");
      } else if (modalType === 'edit') {
        await api.put(`/admin/pendaftaran/${selectedItem.id_pendaftaran}`, formData);
        Swal.fire("Sukses", "Data berhasil diperbarui", "success");
      }
      closeModal();
      fetchData(); 
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Terjadi kesalahan", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Data?', text: "Data tidak bisa dikembalikan!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/pendaftaran/${id}`);
        setData(data.filter(i => i.id_pendaftaran !== id));
        Swal.fire('Terhapus!', 'Data telah dihapus.', 'success');
      } catch (err) { Swal.fire('Gagal', 'Gagal menghapus data.', 'error'); }
    }
  };

  const handleVerifikasi = async (asesi) => {
    const result = await Swal.fire({
      title: 'Verifikasi Akun?', text: `Buatkan akun untuk ${asesi.nama_lengkap}?`,
      icon: 'question', showCancelButton: true, confirmButtonColor: '#10B981'
    });
    if (result.isConfirmed) {
      try {
        await api.post(`/admin/pendaftaran/${asesi.id_pendaftaran}/verifikasi`);
        Swal.fire('Berhasil!', 'Akun aktif.', 'success');
        fetchData();
      } catch (err) { Swal.fire('Gagal', err.response?.data?.message, 'error'); }
    }
  };

  // --- RENDER MODAL CONTENT ---
  const renderModalContent = () => {
    // 1. TAMPILAN DETAIL
    if (modalType === 'detail') {
      return (
        <div className="detail-view">
          <div className="detail-header-card">
            <div className="avatar-circle">{selectedItem?.nama_lengkap?.charAt(0)}</div>
            <div>
              <h3>{selectedItem?.nama_lengkap}</h3>
              <p className="text-muted">{selectedItem?.email}</p>
            </div>
            {selectedItem?.user_id ? (
              <span className="badge-verified"><CheckCircle size={14}/> Terverifikasi</span>
            ) : (
              <span className="badge-pending">Menunggu</span>
            )}
          </div>
          
          <div className="detail-grid">
            <div className="detail-section-title">Data Pribadi</div>
            <div className="detail-item"><User size={16}/> <label>NIK</label> <p>{selectedItem?.nik || '-'}</p></div>
            <div className="detail-item"><Phone size={16}/> <label>No HP</label> <p>{selectedItem?.no_hp || '-'}</p></div>
            
            <div className="detail-section-title">Kompetensi</div>
            <div className="detail-item"><Briefcase size={16}/> <label>Prodi</label> <p>{selectedItem?.program_studi || '-'}</p></div>
            <div className="detail-item"><Layers size={16}/> <label>ID TUK</label> <p>{selectedItem?.id_tuk || '-'}</p></div>
            <div className="detail-item"><Calendar size={16}/> <label>Tanggal Daftar</label> <p>{formatDate(selectedItem?.tanggal_daftar)}</p></div>
            
            <div className="detail-section-title">Alamat & Domisili</div>
            <div className="detail-item"><MapPin size={16}/> <label>Provinsi</label> <p>{selectedItem?.provinsi || '-'}</p></div>
            <div className="detail-item"><MapPin size={16}/> <label>Kota/Kab</label> <p>{selectedItem?.kota || '-'}</p></div>
            <div className="detail-item"><MapPin size={16}/> <label>Kecamatan</label> <p>{selectedItem?.kecamatan || '-'}</p></div>
            <div className="detail-item"><MapPin size={16}/> <label>Kelurahan</label> <p>{selectedItem?.kelurahan || '-'}</p></div>
            <div className="detail-item full"><MapPin size={16}/> <label>Alamat Lengkap</label> <p>{selectedItem?.alamat_lengkap || '-'}</p></div>
          </div>
        </div>
      );
    }

    // 2. FORM CREATE / EDIT LENGKAP
    return (
      <form onSubmit={handleSave} className="form-modal">
        {/* Section 1: Data Pribadi */}
        <div className="form-section-label">Data Pribadi</div>
        <div className="form-group">
          <label>Nama Lengkap</label>
          <input type="text" value={formData.nama_lengkap} onChange={e => setFormData({...formData, nama_lengkap: e.target.value})} required placeholder="Sesuai KTP"/>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>NIK</label>
            <input type="text" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} required maxLength="16" placeholder="16 Digit"/>
          </div>
          <div className="form-group">
            <label>No HP</label>
            <input type="text" value={formData.no_hp} onChange={e => setFormData({...formData, no_hp: e.target.value})} required placeholder="08..."/>
          </div>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="email@domain.com"/>
        </div>

        {/* Section 2: Kompetensi */}
        <div className="form-section-label">Kompetensi & Lokasi</div>
        <div className="form-row">
          <div className="form-group">
            <label>Program Studi</label>
            <input type="text" value={formData.program_studi} onChange={e => setFormData({...formData, program_studi: e.target.value})} required placeholder="Contoh: Teknik Mesin"/>
          </div>
          <div className="form-group">
            <label>ID TUK (Tempat Uji)</label>
            <input type="number" value={formData.id_tuk} onChange={e => setFormData({...formData, id_tuk: e.target.value})} placeholder="ID TUK"/>
          </div>
        </div>

        {/* Section 3: Data Wilayah */}
        <div className="form-section-label">Alamat Domisili</div>
        <div className="form-row">
          <div className="form-group">
            <label>Provinsi</label>
            <input type="text" value={formData.provinsi} onChange={e => setFormData({...formData, provinsi: e.target.value})} placeholder="Provinsi"/>
          </div>
          <div className="form-group">
            <label>Kota / Kabupaten</label>
            <input type="text" value={formData.kota} onChange={e => setFormData({...formData, kota: e.target.value})} placeholder="Kota"/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Kecamatan</label>
            <input type="text" value={formData.kecamatan} onChange={e => setFormData({...formData, kecamatan: e.target.value})} placeholder="Kecamatan"/>
          </div>
          <div className="form-group">
            <label>Kelurahan</label>
            <input type="text" value={formData.kelurahan} onChange={e => setFormData({...formData, kelurahan: e.target.value})} placeholder="Kelurahan"/>
          </div>
        </div>
        <div className="form-group">
          <label>Alamat Lengkap</label>
          <textarea rows="2" value={formData.alamat_lengkap} onChange={e => setFormData({...formData, alamat_lengkap: e.target.value})} placeholder="Jalan, RT/RW, Kode Pos"></textarea>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={closeModal}>Batal</button>
          <button type="submit" className="btn-save"><Save size={16}/> Simpan Data</button>
        </div>
      </form>
    );
  };

  return (
    <div className="verifikasi-container">
      {/* HEADER */}
      <div className="header-section">
        <div className="title-box">
          <h2>Verifikasi Pendaftaran</h2>
          <p>Kelola data calon asesi LSP</p>
        </div>
        <div className="action-bar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Cari data..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn-create" onClick={() => openModal('create')}><Plus size={18} /> Buat Baru</button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>No</th><th>Nama Lengkap</th><th>Email</th><th>Prodi</th><th>Status</th><th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center p-5">Loading...</td></tr> : 
             filteredData.map((item, idx) => (
              <tr key={item.id_pendaftaran}>
                <td>{idx + 1}</td>
                <td><span className="fw-bold">{item.nama_lengkap}</span><br/><small className="text-muted">{item.nik}</small></td>
                <td>{item.email}</td>
                <td>{item.program_studi}</td>
                <td>{item.user_id ? <span className="status-badge verified">Verified</span> : <span className="status-badge pending">Pending</span>}</td>
                <td className="text-center">
                  <div className="action-buttons">
                    <button className="btn-icon detail" onClick={() => openModal('detail', item)} title="Detail"><Eye size={16}/></button>
                    <button className="btn-icon edit" onClick={() => openModal('edit', item)} title="Edit"><Edit2 size={16}/></button>
                    {!item.user_id && <button className="btn-icon verify" onClick={() => handleVerifikasi(item)} title="Verifikasi"><CheckCircle size={16}/></button>}
                    <button className="btn-icon delete" onClick={() => handleDelete(item.id_pendaftaran)} title="Hapus"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL OVERLAY --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{modalType === 'create' ? 'Tambah Data Baru' : modalType === 'edit' ? 'Edit Data Asesi' : 'Detail Pendaftaran'}</h3>
              <button className="btn-close" onClick={closeModal}><X size={20}/></button>
            </div>
            <div className="modal-body">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifikasiPendaftaran;
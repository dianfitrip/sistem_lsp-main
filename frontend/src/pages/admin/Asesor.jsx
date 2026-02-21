import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import { 
  Search, Plus, Eye, Edit2, Trash2, X, Save, Download, Upload,
  User, Loader2, ChevronLeft, ChevronRight, Camera
} from 'lucide-react';
import './Asesor.css'; 

const Asesor = () => {
  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create', 'edit', 'detail'
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Data Wilayah
  const [provinsiList, setProvinsiList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [kelurahanList, setKelurahanList] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    email: '', password: '', 
    nik: '', nama_lengkap: '', gelar_depan: '', gelar_belakang: '',
    jenis_kelamin: 'laki-laki', tempat_lahir: '', tanggal_lahir: '', kebangsaan: 'Indonesia',
    pendidikan_terakhir: '', tahun_lulus: '', institut_asal: '',
    alamat: '', rt: '', rw: '', kode_pos: '',
    provinsi: '', kota: '', kecamatan: '', kelurahan: '',
    bidang_keahlian: '', no_reg_asesor: '', no_lisensi: '', masa_berlaku: '',
    status_asesor: 'aktif'
  });
  
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  // Helper untuk mengecek apakah mode detail (read-only)
  const isDetailMode = modalType === 'detail';

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/asesor', {
        params: { search: searchTerm, page: pagination.page, limit: pagination.limit }
      });
      if (response.data.success) {
        setData(response.data.data.data || []);
        setPagination(prev => ({
          ...prev, 
          total: response.data.data.total, 
          totalPages: response.data.data.totalPages
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Provinsi on Load
  useEffect(() => {
    fetchData();
    api.get('/admin/wilayah/provinsi').then(res => setProvinsiList(res.data)).catch(console.error);
  }, [pagination.page, searchTerm]);

  // --- HANDLER WILAYAH ---
  const handleProvinsiChange = async (e) => {
    const id = e.target.value;
    const nama = e.target.options[e.target.selectedIndex].text;
    setFormData(p => ({ ...p, provinsi: nama, kota: '', kecamatan: '', kelurahan: '' }));
    
    if (id) {
      const res = await api.get(`/admin/wilayah/kota/${id}`);
      setKotaList(res.data);
    } else { setKotaList([]); }
  };

  const handleKotaChange = async (e) => {
    const id = e.target.value;
    const nama = e.target.options[e.target.selectedIndex].text;
    setFormData(p => ({ ...p, kota: nama, kecamatan: '', kelurahan: '' }));

    if (id) {
      const res = await api.get(`/admin/wilayah/kecamatan/${id}`);
      setKecamatanList(res.data);
    } else { setKecamatanList([]); }
  };

  const handleKecamatanChange = async (e) => {
    const id = e.target.value;
    const nama = e.target.options[e.target.selectedIndex].text;
    setFormData(p => ({ ...p, kecamatan: nama, kelurahan: '' }));

    if (id) {
      const res = await api.get(`/admin/wilayah/kelurahan/${id}`);
      setKelurahanList(res.data);
    } else { setKelurahanList([]); }
  };

  const handleKelurahanChange = (e) => {
    const nama = e.target.options[e.target.selectedIndex].text;
    setFormData(p => ({ ...p, kelurahan: nama }));
  };

  // --- HANDLERS FORM ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDetailMode) return; // Prevent submit on detail mode

    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) payload.append(key, formData[key]);
    });
    if (fotoFile) payload.append('foto', fotoFile);

    try {
      if (modalType === 'create') {
        await api.post('/admin/asesor', payload);
        Swal.fire('Sukses', 'Asesor berhasil ditambahkan', 'success');
      } else {
        await api.put(`/admin/asesor/${selectedItem.id_user}`, payload);
        Swal.fire('Sukses', 'Asesor berhasil diperbarui', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Asesor?', text: "Data user dan profil akan dihapus permanen.", icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#d33'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/asesor/${id}`);
        Swal.fire('Terhapus!', 'Data telah dihapus.', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus data', 'error');
      }
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setFotoFile(null);
    setFotoPreview(null);
    
    if (type === 'create') {
      setFormData({
        email: '', password: '', nik: '', nama_lengkap: '', gelar_depan: '', gelar_belakang: '',
        jenis_kelamin: 'laki-laki', tempat_lahir: '', tanggal_lahir: '', kebangsaan: 'Indonesia',
        pendidikan_terakhir: '', tahun_lulus: '', institut_asal: '',
        alamat: '', rt: '', rw: '', kode_pos: '',
        provinsi: '', kota: '', kecamatan: '', kelurahan: '',
        bidang_keahlian: '', no_reg_asesor: '', no_lisensi: '', masa_berlaku: '', status_asesor: 'aktif'
      });
    } else if (item) {
      setFormData({
        ...item,
        email: item.User?.email || '', 
        password: '', 
        tanggal_lahir: item.tanggal_lahir ? item.tanggal_lahir.split('T')[0] : '',
        masa_berlaku: item.masa_berlaku ? item.masa_berlaku.split('T')[0] : ''
      });
      if (item.foto) setFotoPreview(`http://localhost:3000/uploads/${item.foto}`);
    }
    setShowModal(true);
  };

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/admin/asesor/export?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `data_asesor.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) { Swal.fire('Error', 'Gagal export', 'error'); }
  };

  // Helper untuk Judul Modal
  const getModalTitle = () => {
    if (modalType === 'create') return 'Tambah Asesor Baru';
    if (modalType === 'edit') return 'Edit Data Asesor';
    return 'Detail Data Asesor';
  };

  return (
    <div className="asesor-container">
      {/* Header */}
      <div className="header-section">
        <div className="title-box">
          <h2>Data Asesor</h2>
          <p>Kelola data dan profil asesor kompetensi</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn-create" onClick={() => openModal('create')}><Plus size={18} /> Tambah</button>
          <button className="btn-export" onClick={() => handleExport('csv')}><Download size={18} /> Export</button>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input type="text" placeholder="Cari Nama, NIK, No Reg..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state"><Loader2 className="animate-spin" size={32} /><p>Memuat data...</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Lengkap</th>
                <th>NIK</th>
                <th>Bidang Keahlian</th>
                <th>No. Registrasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.id_user}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td className="font-medium flex items-center gap-2">
                      <div className="avatar-small">
                        {item.foto ? <img src={`http://localhost:3000/uploads/${item.foto}`} alt="avatar" /> : <User size={16}/>}
                      </div>
                      {item.gelar_depan} {item.nama_lengkap} {item.gelar_belakang}
                    </td>
                    <td>{item.nik}</td>
                    <td>{item.bidang_keahlian}</td>
                    <td>{item.no_reg_asesor}</td>
                    <td>
                      <span className={`status-badge ${item.status_asesor === 'aktif' ? 'status-active' : 'status-inactive'}`}>
                        {item.status_asesor}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* TOMBOL DETAIL DITAMBAHKAN */}
                        <button className="btn-action view" onClick={() => openModal('detail', item)} title="Lihat Detail"><Eye size={18} /></button>
                        <button className="btn-action edit" onClick={() => openModal('edit', item)} title="Edit"><Edit2 size={18} /></button>
                        <button className="btn-action delete" onClick={() => handleDelete(item.id_user)} title="Hapus"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Data tidak ditemukan</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination-section">
        <div className="pagination-info">Menampilkan {data.length} dari {pagination.total} data</div>
        <div className="pagination-controls">
          <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}><ChevronLeft size={18}/></button>
          <span>Hal {pagination.page} / {pagination.totalPages}</span>
          <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}><ChevronRight size={18}/></button>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>{getModalTitle()}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body scrollable-body">
                
                {/* Section Foto */}
                <div className="form-section center-section">
                  <div className="image-upload-wrapper">
                    <div className="image-preview">
                      {fotoPreview ? <img src={fotoPreview} alt="Preview" /> : <User size={48} className="text-gray-300"/>}
                    </div>
                    {/* Hide Button Upload if Detail Mode */}
                    {!isDetailMode && (
                      <label className="btn-upload-foto">
                        <Camera size={16} /> Ganti Foto
                        <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Section Akun */}
                <h4 className="section-title">Informasi Akun</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={modalType!=='create'} />
                  </div>
                  {!isDetailMode && (
                    <div className="form-group">
                      <label>Password {modalType==='edit' && '(Kosongkan jika tidak ubah)'}</label>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={modalType==='create'} />
                    </div>
                  )}
                </div>

                {/* Section Data Diri */}
                <h4 className="section-title">Data Pribadi</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>NIK</label>
                    <input type="text" name="nik" value={formData.nik} onChange={handleInputChange} disabled={isDetailMode} required />
                  </div>
                  <div className="form-group">
                    <label>Nama Lengkap</label>
                    <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} disabled={isDetailMode} required />
                  </div>
                </div>
                <div className="form-row three-col">
                  <div className="form-group"><label>Gelar Depan</label><input type="text" name="gelar_depan" value={formData.gelar_depan} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group"><label>Gelar Belakang</label><input type="text" name="gelar_belakang" value={formData.gelar_belakang} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group">
                    <label>Jenis Kelamin</label>
                    <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} disabled={isDetailMode}>
                      <option value="laki-laki">Laki-laki</option>
                      <option value="perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* Section Alamat & Wilayah */}
                <h4 className="section-title">Alamat & Domisili</h4>
                <div className="form-group">
                  <label>Alamat Lengkap</label>
                  <textarea name="alamat" value={formData.alamat} onChange={handleInputChange} rows="2" disabled={isDetailMode}></textarea>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Provinsi</label>
                    {isDetailMode ? (
                        <input type="text" value={formData.provinsi} disabled />
                    ) : (
                        <select name="provinsi" onChange={handleProvinsiChange}>
                            <option value="">{formData.provinsi || '-- Pilih Provinsi --'}</option>
                            {provinsiList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Kota/Kab</label>
                    {isDetailMode ? (
                        <input type="text" value={formData.kota} disabled />
                    ) : (
                        <select name="kota" onChange={handleKotaChange}>
                            <option value="">{formData.kota || '-- Pilih Kota --'}</option>
                            {kotaList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                        <select name="kecamatan" onChange={handleKecamatanChange}>
                            <option value="">{formData.kecamatan || '-- Pilih --'}</option>
                            {kecamatanList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                        </select>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Kelurahan</label>
                    {isDetailMode ? (
                        <input type="text" value={formData.kelurahan} disabled />
                    ) : (
                        <select name="kelurahan" onChange={handleKelurahanChange}>
                            <option value="">{formData.kelurahan || '-- Pilih --'}</option>
                            {kelurahanList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    )}
                  </div>
                </div>

                {/* Section Sertifikasi */}
                <h4 className="section-title">Data Asesor</h4>
                <div className="form-row">
                  <div className="form-group"><label>No. Registrasi</label><input type="text" name="no_reg_asesor" value={formData.no_reg_asesor} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group"><label>No. Lisensi</label><input type="text" name="no_lisensi" value={formData.no_lisensi} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Bidang Keahlian</label><input type="text" name="bidang_keahlian" value={formData.bidang_keahlian} onChange={handleInputChange} disabled={isDetailMode}/></div>
                  <div className="form-group"><label>Masa Berlaku</label><input type="date" name="masa_berlaku" value={formData.masa_berlaku} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    {isDetailMode ? 'Tutup' : 'Batal'}
                </button>
                {/* Tampilkan Tombol Simpan HANYA jika BUKAN mode detail */}
                {!isDetailMode && (
                    <button type="submit" className="btn-save"><Save size={16}/> Simpan Data</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asesor;
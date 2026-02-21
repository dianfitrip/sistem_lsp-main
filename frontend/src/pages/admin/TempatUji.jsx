import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Eye, Edit2, Trash2, X, Save, Download, Upload,
  MapPin, CheckCircle, XCircle, User, Phone, Mail, Calendar,
  Building2, FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import './adminstyles/TempatUji.css';

const TempatUji = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);

  // Wilayah Data & Loading
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loadingWilayah, setLoadingWilayah] = useState({
    provinsi: false,
    kota: false,
    kecamatan: false,
    kelurahan: false
  });

  // Form Initial State
  const initialForm = {
    id_tuk: '',
    kode_tuk: '',
    nama_tuk: '',
    jenis_tuk: 'sewaktu',
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
    status: 'aktif'
  };
  
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  // --- FUNGSI PENTING: AMBIL TOKEN SECARA MANUAL ---
  // Fungsi ini memastikan token selalu terambil dari penyimpanan browser
  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch Data Utama
  const fetchData = async (page = pagination.page, search = searchTerm) => {
    setLoading(true);
    try {
      // PERBAIKAN: Menambahkan 'headers: getHeaders()' untuk memaksa kirim token
      const response = await api.get('/admin/tuk-tempat', {
        params: {
          search,
          page,
          limit: pagination.limit
        },
        headers: getHeaders() 
      });
      
      if (response.data.success) {
        setData(response.data.data.data || []);
        setPagination({
          page: response.data.data.page,
          limit: response.data.data.limit,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Deteksi jika token invalid/expired (403/401)
      if (error.response && (error.response.status === 403 || error.response.status === 401)) {
        Swal.fire({
          icon: 'warning',
          title: 'Sesi Berakhir',
          text: 'Mohon login ulang untuk mengakses data ini.'
        });
      } else {
        Swal.fire('Error', 'Gagal mengambil data TUK', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProvinces();
  }, []);

  // --- BAGIAN WILAYAH (Juga ditambahkan headers untuk keamanan) ---
  const fetchProvinces = async () => {
    setLoadingWilayah(prev => ({ ...prev, provinsi: true }));
    try {
      const res = await api.get('/public/provinsi', { headers: getHeaders() });
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setProvinces(data);
    } catch (err) { 
      console.error('Error fetching provinces:', err);
    } finally {
      setLoadingWilayah(prev => ({ ...prev, provinsi: false }));
    }
  };

  const fetchCities = async (provId) => {
    if (!provId) return;
    setLoadingWilayah(prev => ({ ...prev, kota: true }));
    try {
      const res = await api.get(`/public/kota/${provId}`, { headers: getHeaders() });
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setCities(data);
    } catch (err) { 
      console.error('Error fetching cities:', err);
    } finally {
      setLoadingWilayah(prev => ({ ...prev, kota: false }));
    }
  };

  const fetchDistricts = async (cityId) => {
    if (!cityId) return;
    setLoadingWilayah(prev => ({ ...prev, kecamatan: true }));
    try {
      const res = await api.get(`/public/kecamatan/${cityId}`, { headers: getHeaders() });
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setDistricts(data);
    } catch (err) { 
      console.error('Error fetching districts:', err);
    } finally {
      setLoadingWilayah(prev => ({ ...prev, kecamatan: false }));
    }
  };

  const fetchVillages = async (districtId) => {
    if (!districtId) return;
    setLoadingWilayah(prev => ({ ...prev, kelurahan: true }));
    try {
      const res = await api.get(`/public/kelurahan/${districtId}`, { headers: getHeaders() });
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setVillages(data);
    } catch (err) { 
      console.error('Error fetching villages:', err);
    } finally {
      setLoadingWilayah(prev => ({ ...prev, kelurahan: false }));
    }
  };

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle Wilayah Change
  const handleWilayahChange = async (e, level) => {
    const selectedId = e.target.value;
    const selectedName = e.target.options[e.target.selectedIndex]?.text || '';

    if (level === 'provinsi') {
      setFormData(prev => ({ 
        ...prev, 
        provinsi: selectedName, 
        kota: '', 
        kecamatan: '', 
        kelurahan: '' 
      }));
      setCities([]);
      setDistricts([]);
      setVillages([]);
      if (selectedId) fetchCities(selectedId);
    } else if (level === 'kota') {
      setFormData(prev => ({ 
        ...prev, 
        kota: selectedName, 
        kecamatan: '', 
        kelurahan: '' 
      }));
      setDistricts([]);
      setVillages([]);
      if (selectedId) fetchDistricts(selectedId);
    } else if (level === 'kecamatan') {
      setFormData(prev => ({ 
        ...prev, 
        kecamatan: selectedName, 
        kelurahan: '' 
      }));
      setVillages([]);
      if (selectedId) fetchVillages(selectedId);
    } else if (level === 'kelurahan') {
      setFormData(prev => ({ ...prev, kelurahan: selectedName }));
    }
  };

  // Validate Form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.kode_tuk?.trim()) newErrors.kode_tuk = 'Kode TUK wajib diisi';
    if (!formData.nama_tuk?.trim()) newErrors.nama_tuk = 'Nama TUK wajib diisi';
    if (!formData.jenis_tuk) newErrors.jenis_tuk = 'Jenis TUK wajib dipilih';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Format email tidak valid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Modal Operations
  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setErrors({});
    
    if (type === 'create') {
      setFormData(initialForm);
      setSelectedItem(null);
      setCities([]);
      setDistricts([]);
      setVillages([]);
    } else if (type === 'import') {
      setImportFile(null);
      setImportPreview([]);
    } else if (item) {
      setSelectedItem(item);
      setFormData(item);
      
      if (item.provinsi) {
        const province = provinces.find(p => p.name === item.provinsi);
        if (province) {
          fetchCities(province.id);
        }
      }
    }
    
    setShowModal(true);
  };

  // PERBAIKAN: handleSave dengan Token Manual
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire('Error', 'Mohon lengkapi data dengan benar', 'warning');
      return;
    }

    try {
      if (modalType === 'create') {
        // Create Data
        await api.post('/admin/tuk-tempat', formData, { headers: getHeaders() });
        Swal.fire('Sukses', 'Data TUK berhasil ditambahkan', 'success');
      } else {
        // Update Data
        await api.put(`/admin/tuk-tempat/${formData.id_tuk}`, formData, { headers: getHeaders() });
        Swal.fire('Sukses', 'Data TUK berhasil diperbarui', 'success');
      }
      
      setShowModal(false);
      fetchData(1, searchTerm);
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menyimpan data';
      Swal.fire('Error', msg, 'error');
    }
  };

  // PERBAIKAN: handleDelete dengan Token Manual
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Data TUK?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/tuk-tempat/${id}`, { headers: getHeaders() });
        Swal.fire('Terhapus!', 'Data TUK berhasil dihapus', 'success');
        fetchData(1, searchTerm);
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Gagal menghapus data', 'error');
      }
    }
  };

  const handleView = async (id) => {
    try {
      const response = await api.get(`/admin/tuk-tempat/${id}`, { headers: getHeaders() });
      if (response.data.success) {
        handleOpenModal('view', response.data.data);
      }
    } catch (error) {
      Swal.fire('Error', 'Gagal mengambil detail TUK', 'error');
    }
  };

  // PERBAIKAN: handleExportExcel dengan Token Manual
  const handleExportExcel = async () => {
    try {
      Swal.fire({
        title: 'Menyiapkan file Excel...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await api.get('/admin/tuk-tempat/export', { 
        params: { format: 'json' },
        headers: getHeaders() 
      });

      const data = response.data;
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "TUK");
      const fileName = `tuk_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      Swal.close();
      Swal.fire('Sukses', 'Data berhasil diekspor', 'success');
    } catch (error) {
      Swal.fire('Error', 'Gagal mengekspor data', 'error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setImportPreview(jsonData.slice(0, 5));
        setImportFile(jsonData);
      } catch (error) {
        Swal.fire('Error', 'Gagal membaca file', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  // PERBAIKAN: handleImport dengan Token Manual
  const handleImport = async () => {
    if (!importFile || importFile.length === 0) {
      Swal.fire('Error', 'Pilih file terlebih dahulu', 'warning');
      return;
    }

    try {
      Swal.fire({
        title: 'Mengimpor data...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await api.post('/admin/tuk-tempat/import', { data: importFile }, { headers: getHeaders() });
      
      Swal.close();
      Swal.fire({
        title: 'Import Selesai',
        text: 'Data berhasil diimport',
        icon: 'success'
      });
        
      setShowModal(false);
      fetchData(1, searchTerm);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal mengimpor data', 'error');
    }
  };

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1, searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage, searchTerm);
    }
  };

  return (
    <div className="tuk-container">
      {/* Header */}
      <div className="header-section">
        <div className="title-box">
          <h2>Data Tempat Uji Kompetensi (TUK)</h2>
          <p>Kelola data TUK, informasi lengkap, dan skema yang tersedia</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn-export" onClick={handleExportExcel} title="Export ke Excel">
            <Download size={16}/> Export
          </button>
          <button className="btn-import" onClick={() => handleOpenModal('import')} title="Import Data">
            <Upload size={16}/> Import
          </button>
          <button className="btn-create" onClick={() => handleOpenModal('create')}>
            <Plus size={18}/> Tambah TUK
          </button>
        </div>
      </div>

      {/* Search Bar & Info */}
      <div className="filter-section">
        <div className="info-text">
          Total: <strong>{pagination.total}</strong> data
        </div>
        <div className="search-wrapper">
          <Search className="search-icon" size={20}/>
          <input
            type="text"
            placeholder="Cari kode, nama, PJ, atau kota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Kode</th>
              <th>Nama TUK</th>
              <th>Jenis</th>
              <th>Penanggung Jawab</th>
              <th>Kontak</th>
              <th>Lokasi</th>
              <th>Lisensi</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center">
                  <Loader2 className="spinner" size={24}/>
                  <span>Memuat data...</span>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">
                  <AlertCircle size={24}/>
                  <span>Tidak ada data</span>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id_tuk}>
                  <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                  <td><span className="badge-code">{item.kode_tuk}</span></td>
                  <td className="fw-bold">{item.nama_tuk}</td>
                  <td>
                    <span className={`badge-jenis ${item.jenis_tuk?.replace(' ', '_')}`}>
                      {item.jenis_tuk}
                    </span>
                  </td>
                  <td>
                    <div className="contact-info">
                      <User size={12}/>
                      <span>{item.penanggung_jawab || '-'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <Phone size={12}/>
                      <span>{item.telepon || '-'}</span>
                    </div>
                    <div className="contact-info">
                      <Mail size={12}/>
                      <span className="email">{item.email || '-'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="location-info">
                      <MapPin size={12}/>
                      <span>{item.kota || '-'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="license-info">
                      <FileText size={12}/>
                      <span>{item.no_lisensi || '-'}</span>
                    </div>
                    {item.masa_berlaku_lisensi && (
                      <div className="license-expiry">
                        <Calendar size={12}/>
                        <span>Exp: {new Date(item.masa_berlaku_lisensi).toLocaleDateString('id-ID')}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {item.status === 'aktif' ? (
                      <span className="badge-status active">
                        <CheckCircle size={12}/> Aktif
                      </span>
                    ) : (
                      <span className="badge-status inactive">
                        <XCircle size={12}/> Nonaktif
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action view" onClick={() => handleView(item.id_tuk)} title="Lihat Detail">
                        <Eye size={16}/>
                      </button>
                      <button className="btn-action edit" onClick={() => handleOpenModal('edit', item)} title="Edit">
                        <Edit2 size={16}/>
                      </button>
                      <button className="btn-action delete" onClick={() => handleDelete(item.id_tuk)} title="Hapus">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="page-btn"
          >
            <ChevronLeft size={16}/>
          </button>
          
          {[...Array(pagination.totalPages).keys()].map(num => (
            <button
              key={num + 1}
              onClick={() => handlePageChange(num + 1)}
              className={`page-btn ${pagination.page === num + 1 ? 'active' : ''}`}
            >
              {num + 1}
            </button>
          ))}
          
          <button 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="page-btn"
          >
            <ChevronRight size={16}/>
          </button>
        </div>
      )}

      {/* Modal Create/Edit/View */}
      {showModal && (modalType !== 'import') && (
        <div className="modal-overlay">
          <div className={`modal-card ${modalType === 'view' ? 'modal-view' : ''}`}>
            <div className="modal-header">
              <h3>
                {modalType === 'create' && 'Tambah Data TUK'}
                {modalType === 'edit' && 'Edit Data TUK'}
                {modalType === 'view' && 'Detail Data TUK'}
              </h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="modal-body">
              {/* Profil TUK */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <Building2 size={18}/>
                  Profil TUK
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Kode TUK <span className="required">*</span></label>
                    <input
                      type="text"
                      name="kode_tuk"
                      value={formData.kode_tuk || ''}
                      onChange={handleInputChange}
                      className={`form-input ${errors.kode_tuk ? 'error' : ''}`}
                      disabled={modalType === 'view'}
                      placeholder="Masukkan kode TUK"
                    />
                    {errors.kode_tuk && <span className="error-message">{errors.kode_tuk}</span>}
                  </div>

                  <div className="form-group">
                    <label>Nama TUK <span className="required">*</span></label>
                    <input
                      type="text"
                      name="nama_tuk"
                      value={formData.nama_tuk || ''}
                      onChange={handleInputChange}
                      className={`form-input ${errors.nama_tuk ? 'error' : ''}`}
                      disabled={modalType === 'view'}
                      placeholder="Masukkan nama TUK"
                    />
                    {errors.nama_tuk && <span className="error-message">{errors.nama_tuk}</span>}
                  </div>

                  <div className="form-group">
                    <label>Jenis TUK <span className="required">*</span></label>
                    <select
                      name="jenis_tuk"
                      value={formData.jenis_tuk || 'sewaktu'}
                      onChange={handleInputChange}
                      className={`form-select ${errors.jenis_tuk ? 'error' : ''}`}
                      disabled={modalType === 'view'}
                    >
                      <option value="sewaktu">Sewaktu</option>
                      <option value="mandiri">Mandiri</option>
                      <option value="tempat kerja">Tempat Kerja</option>
                    </select>
                    {errors.jenis_tuk && <span className="error-message">{errors.jenis_tuk}</span>}
                  </div>

                  <div className="form-group">
                    <label>Institusi Induk</label>
                    <input
                      type="text"
                      name="institusi_induk"
                      value={formData.institusi_induk || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={modalType === 'view'}
                      placeholder="Masukkan institusi induk"
                    />
                  </div>
                </div>
              </div>

              {/* Penanggung Jawab & Kontak */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <User size={18}/>
                  Penanggung Jawab & Kontak
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Penanggung Jawab</label>
                    <input
                      type="text"
                      name="penanggung_jawab"
                      value={formData.penanggung_jawab || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={modalType === 'view'}
                      placeholder="Nama penanggung jawab"
                    />
                  </div>

                  <div className="form-group">
                    <label>Telepon</label>
                    <input
                      type="tel"
                      name="telepon"
                      value={formData.telepon || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={modalType === 'view'}
                      placeholder="Nomor telepon"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      disabled={modalType === 'view'}
                      placeholder="Email TUK"
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                </div>
              </div>

              {/* Alamat & Wilayah */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <MapPin size={18}/>
                  Alamat & Wilayah
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Provinsi</label>
                    <select
                      className="form-select"
                      onChange={(e) => handleWilayahChange(e, 'provinsi')}
                      disabled={modalType === 'view' || loadingWilayah.provinsi}
                      value={provinces.find(p => p.name === formData.provinsi)?.id || ''}
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinces.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {loadingWilayah.provinsi && <Loader2 className="spinner-small" size={14}/>}
                  </div>

                  <div className="form-group">
                    <label>Kota/Kabupaten</label>
                    <select
                      className="form-select"
                      onChange={(e) => handleWilayahChange(e, 'kota')}
                      disabled={modalType === 'view' || loadingWilayah.kota || cities.length === 0}
                      value={cities.find(c => c.name === formData.kota)?.id || ''}
                    >
                      <option value="">Pilih Kota</option>
                      {cities.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {loadingWilayah.kota && <Loader2 className="spinner-small" size={14}/>}
                  </div>

                  <div className="form-group">
                    <label>Kecamatan</label>
                    <select
                      className="form-select"
                      onChange={(e) => handleWilayahChange(e, 'kecamatan')}
                      disabled={modalType === 'view' || loadingWilayah.kecamatan || districts.length === 0}
                      value={districts.find(d => d.name === formData.kecamatan)?.id || ''}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {loadingWilayah.kecamatan && <Loader2 className="spinner-small" size={14}/>}
                  </div>

                  <div className="form-group">
                    <label>Kelurahan</label>
                    <select
                      className="form-select"
                      onChange={(e) => handleWilayahChange(e, 'kelurahan')}
                      disabled={modalType === 'view' || loadingWilayah.kelurahan || villages.length === 0}
                      value={villages.find(v => v.name === formData.kelurahan)?.id || ''}
                    >
                      <option value="">Pilih Kelurahan</option>
                      {villages.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    {loadingWilayah.kelurahan && <Loader2 className="spinner-small" size={14}/>}
                  </div>

                  <div className="form-group">
                    <label>Kode Pos</label>
                    <input
                      type="text"
                      name="kode_pos"
                      value={formData.kode_pos || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={modalType === 'view'}
                      placeholder="Kode pos"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Alamat Lengkap</label>
                  <textarea
                    name="alamat"
                    value={formData.alamat || ''}
                    onChange={handleInputChange}
                    className="form-textarea"
                    disabled={modalType === 'view'}
                    rows="3"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>
              </div>

              {/* Informasi Lisensi */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <FileText size={18}/>
                  Informasi Lisensi
                </h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>No. Lisensi</label>
                    <input
                      type="text"
                      name="no_lisensi"
                      value={formData.no_lisensi || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={modalType === 'view'}
                      placeholder="Nomor lisensi"
                    />
                  </div>

                  <div className="form-group">
                    <label>Masa Berlaku Lisensi</label>
                    <input
                      type="date"
                      name="masa_berlaku_lisensi"
                      value={formData.masa_berlaku_lisensi || ''}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={modalType === 'view'}
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status || 'aktif'}
                      onChange={handleInputChange}
                      className="form-select"
                      disabled={modalType === 'view'}
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  {modalType === 'view' ? 'Tutup' : 'Batal'}
                </button>
                {modalType !== 'view' && (
                  <button type="submit" className="btn-save">
                    <Save size={16}/> Simpan
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {showModal && modalType === 'import' && (
        <div className="modal-overlay">
          <div className="modal-card modal-import">
            <div className="modal-header">
              <h3>Import Data TUK</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <X size={20}/>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="import-instructions">
                <h4>Petunjuk Import:</h4>
                <ul>
                  <li>File harus berformat Excel (.xlsx, .xls) atau CSV</li>
                  <li>Kolom yang diperlukan: kode_tuk, nama_tuk</li>
                  <li>Kolom opsional: jenis_tuk, penanggung_jawab, institusi_induk, telepon, email, alamat, provinsi, kota, kecamatan, kelurahan, kode_pos, no_lisensi, masa_berlaku_lisensi, status</li>
                  <li>Status: 'aktif' atau 'nonaktif' (default: aktif)</li>
                  <li>Jenis TUK: 'sewaktu', 'mandiri', atau 'tempat kerja' (default: sewaktu)</li>
                </ul>
              </div>

              <div className="file-upload-area">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="file-input"
                />
                <p className="file-hint">Klik atau drag file ke sini</p>
              </div>

              {importPreview.length > 0 && (
                <div className="import-preview">
                  <h4>Preview Data (5 baris pertama):</h4>
                  <div className="preview-table">
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(importPreview[0]).map(key => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, i) => (
                              <td key={i}>{String(val).substring(0, 30)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                Batal
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={handleImport}
                disabled={!importFile}
              >
                <Upload size={16}/> Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TempatUji;
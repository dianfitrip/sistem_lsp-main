import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api"; 
import { 
  Search, Plus, Eye, Edit2, Trash2, X, Save, 
  User, Loader2, ChevronLeft, ChevronRight, Upload, FileSpreadsheet,
  MapPin, BookOpen, Briefcase, GraduationCap, Home
} from 'lucide-react';
import './adminstyles/Asesor.css'; 

const Asesor = () => {
  // --- STATE UTAMA ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create', 'detail'
  const [selectedItem, setSelectedItem] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // --- STATE WILAYAH (DROPDOWN LIST) ---
  const [provinsiList, setProvinsiList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [kelurahanList, setKelurahanList] = useState([]);
  
  // State ID Wilayah (Digunakan untuk trigger fetch API anak, tidak disimpan ke DB)
  const [selectedWilayahId, setSelectedWilayahId] = useState({
    provinsi: '',
    kota: '',
    kecamatan: ''
  });

  // --- FORM STATE (Sesuai Model Database) ---
  const initialFormState = {
    // 1. Data Akun (User Model - Wajib)
    nik: '',          
    email: '',        
    no_hp: '',        

    // 2. Data Pribadi (ProfileAsesor Model)
    gelar_depan: '',
    nama_lengkap: '',
    gelar_belakang: '',
    jenis_kelamin: 'laki-laki', 
    tempat_lahir: '',
    tanggal_lahir: '',
    kebangsaan: 'Indonesia',

    // 3. Pendidikan
    pendidikan_terakhir: '',
    tahun_lulus: '',
    institut_asal: '',

    // 4. Alamat
    alamat: '',
    rt: '',
    rw: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    kode_pos: '',

    // 5. Kompetensi & Status
    bidang_keahlian: '',
    no_reg_asesor: '',
    no_lisensi: '',
    masa_berlaku: '',
    status_asesor: 'aktif' 
  };

  const [formData, setFormData] = useState(initialFormState);
  const [importFile, setImportFile] = useState(null);

  // --- FETCH DATA LIST ASESOR ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/asesor'); 
      if (response.data.success) {
        let resultData = response.data.data || [];
        
        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          resultData = resultData.filter(item => 
            (item.ProfileAsesor?.nama_lengkap?.toLowerCase().includes(lowerSearch)) ||
            (item.username?.toLowerCase().includes(lowerSearch)) ||
            (item.email?.toLowerCase().includes(lowerSearch))
          );
        }

        const totalItems = resultData.length;
        const totalPages = Math.ceil(totalItems / pagination.limit);
        const startIndex = (pagination.page - 1) * pagination.limit;
        const paginatedData = resultData.slice(startIndex, startIndex + pagination.limit);

        setData(paginatedData);
        setPagination(prev => ({ ...prev, total: totalItems, totalPages: totalPages || 1 }));
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Gagal mengambil data asesor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, pagination.page]);

  // --- FETCH API WILAYAH (Chain Logic) ---
  
  // Ambil Provinsi saat modal 'create' dibuka
  useEffect(() => {
    if (showModal && modalType === 'create') {
      api.get('/public/provinsi')
        .then(res => setProvinsiList(res.data || []))
        .catch(err => console.error("Gagal load provinsi", err));
    }
  }, [showModal, modalType]);

  const fetchKota = async (provId) => {
    try {
      const res = await api.get(`/public/kota/${provId}`);
      setKotaList(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchKecamatan = async (kotaId) => {
    try {
      const res = await api.get(`/public/kecamatan/${kotaId}`);
      setKecamatanList(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchKelurahan = async (kecId) => {
    try {
      const res = await api.get(`/public/kelurahan/${kecId}`);
      setKelurahanList(res.data || []);
    } catch (err) { console.error(err); }
  };

  // --- HANDLERS WILAYAH ---
  const handleProvinsiChange = (e) => {
    const id = e.target.value;
    const name = provinsiList.find(p => p.id === id)?.name || '';
    
    // Simpan Nama ke formData, Simpan ID ke selectedWilayahId
    setFormData(prev => ({ ...prev, provinsi: name, kota: '', kecamatan: '', kelurahan: '' }));
    setSelectedWilayahId(prev => ({ ...prev, provinsi: id, kota: '', kecamatan: '' }));
    
    setKotaList([]); setKecamatanList([]); setKelurahanList([]); // Reset anak
    if (id) fetchKota(id);
  };

  const handleKotaChange = (e) => {
    const id = e.target.value;
    const name = kotaList.find(k => k.id === id)?.name || '';

    setFormData(prev => ({ ...prev, kota: name, kecamatan: '', kelurahan: '' }));
    setSelectedWilayahId(prev => ({ ...prev, kota: id, kecamatan: '' }));
    
    setKecamatanList([]); setKelurahanList([]);
    if (id) fetchKecamatan(id);
  };

  const handleKecamatanChange = (e) => {
    const id = e.target.value;
    const name = kecamatanList.find(k => k.id === id)?.name || '';

    setFormData(prev => ({ ...prev, kecamatan: name, kelurahan: '' }));
    setSelectedWilayahId(prev => ({ ...prev, kecamatan: id }));
    
    setKelurahanList([]);
    if (id) fetchKelurahan(id);
  };

  const handleKelurahanChange = (e) => {
    const id = e.target.value;
    const name = kelurahanList.find(k => k.id === id)?.name || '';
    setFormData(prev => ({ ...prev, kelurahan: name }));
  };

  // --- GENERAL HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'create') {
        await api.post('/admin/asesor', formData);
        Swal.fire('Sukses', 'Asesor berhasil ditambahkan', 'success');
      } else {
        // Logika edit nanti disesuaikan dengan endpoint update
        Swal.fire('Info', 'Fitur simpan perubahan belum tersedia di backend', 'info');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan data', 'error');
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      Swal.fire('Warning', 'Pilih file Excel terlebih dahulu', 'warning');
      return;
    }
    const fd = new FormData();
    fd.append('file', importFile);

    try {
      Swal.fire({ title: 'Mengimport...', didOpen: () => Swal.showLoading() });
      const response = await api.post('/admin/asesor/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire('Sukses', response.data.message, 'success');
      setShowImportModal(false);
      fetchData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal import data', 'error');
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    
    if (type === 'create') {
      setFormData(initialFormState);
      setSelectedWilayahId({ provinsi: '', kota: '', kecamatan: '' });
      // Fetch provinsi awal dilakukan via useEffect
    } else if (item && item.ProfileAsesor) {
      const p = item.ProfileAsesor;
      // Mapping data lengkap dari DB ke Form
      setFormData({
        nik: p.nik || '',
        email: item.email || '',
        no_hp: item.no_hp || '',
        gelar_depan: p.gelar_depan || '',
        nama_lengkap: p.nama_lengkap || '',
        gelar_belakang: p.gelar_belakang || '',
        jenis_kelamin: p.jenis_kelamin || 'laki-laki',
        tempat_lahir: p.tempat_lahir || '',
        tanggal_lahir: p.tanggal_lahir ? p.tanggal_lahir.split('T')[0] : '',
        kebangsaan: p.kebangsaan || 'Indonesia',
        pendidikan_terakhir: p.pendidikan_terakhir || '',
        tahun_lulus: p.tahun_lulus || '',
        institut_asal: p.institut_asal || '',
        alamat: p.alamat || '',
        rt: p.rt || '',
        rw: p.rw || '',
        provinsi: p.provinsi || '',
        kota: p.kota || '',
        kecamatan: p.kecamatan || '',
        kelurahan: p.kelurahan || '',
        kode_pos: p.kode_pos || '',
        bidang_keahlian: p.bidang_keahlian || '',
        no_reg_asesor: p.no_reg_asesor || '',
        no_lisensi: p.no_lisensi || '',
        masa_berlaku: p.masa_berlaku ? p.masa_berlaku.split('T')[0] : '',
        status_asesor: p.status_asesor || 'aktif'
      });
    }
    setShowModal(true);
  };

  const isDetailMode = modalType === 'detail';

  return (
    <div className="asesor-container">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Asesor</h1>
          <p className="page-subtitle">Kelola data asesor kompetensi dan sertifikasi</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn-action-primary" onClick={() => setShowImportModal(true)}>
            <FileSpreadsheet size={18}/> Import Excel
          </button>
          <button className="btn-action-create" onClick={() => openModal('create')}>
            <Plus size={18}/> Tambah Asesor
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar-section">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Cari Nama, NIK, atau Email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state"><Loader2 className="animate-spin text-blue-500" size={40} /><p>Memuat data...</p></div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th width="5%">No</th>
                <th width="25%">Nama Lengkap</th>
                <th width="15%">No. Registrasi</th>
                <th width="20%">Kontak</th>
                <th width="20%">Bidang Keahlian</th>
                <th width="10%">Status</th>
                <th width="5%" className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => {
                  const profile = item.ProfileAsesor || {};
                  return (
                    <tr key={item.id_user || index} className="table-row">
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td>
                        <div className="font-semibold text-gray-800">
                          {profile.gelar_depan} {profile.nama_lengkap} {profile.gelar_belakang}
                        </div>
                        <div className="text-xs text-gray-500">{profile.nik}</div>
                      </td>
                      <td className="font-mono text-sm">{profile.no_reg_asesor || '-'}</td>
                      <td>
                        <div className="text-sm">{item.email}</div>
                        <div className="text-xs text-gray-500">{item.no_hp}</div>
                      </td>
                      <td className="text-sm">{profile.bidang_keahlian || '-'}</td>
                      <td>
                        <span className={`status-pill ${profile.status_asesor === 'aktif' ? 'terkirim' : 'gagal'}`}>
                          {profile.status_asesor || 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-text">
                          <button className="btn-icon-small detail" onClick={() => openModal('detail', item)} title="Detail"><Eye size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="7" className="empty-state"><p>Tidak ada data asesor ditemukan.</p></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className="pagination-section">
        <div className="pagination-info">Menampilkan {data.length} dari {pagination.total} data</div>
        <div className="pagination-controls">
          <button disabled={pagination.page === 1} onClick={() => setPagination(p=>({...p, page: p.page-1}))}><ChevronLeft size={18}/></button>
          <span>Hal {pagination.page} / {pagination.totalPages}</span>
          <button disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0} onClick={() => setPagination(p=>({...p, page: p.page+1}))}><ChevronRight size={18}/></button>
        </div>
      </div>

      {/* --- MODAL FORM LENGKAP --- */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card wide">
            <div className="modal-header-modern">
              <h3>{modalType === 'create' ? 'Tambah Asesor Baru' : 'Detail Data Asesor'}</h3>
              <button className="btn-close-modern" onClick={() => setShowModal(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body-scroll">
              
              {/* 1. INFORMASI AKUN */}
              <div className="form-section-title"><User size={16} className="inline mr-2"/> Informasi Akun (Wajib)</div>
              <div className="grid-3-col">
                <div className="form-group">
                  <label>NIK (Username) <span className="text-red-500">*</span></label>
                  <input type="text" name="nik" value={formData.nik} onChange={handleInputChange} required disabled={isDetailMode} placeholder="16 digit NIK"/>
                </div>
                <div className="form-group">
                  <label>Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={isDetailMode}/>
                </div>
                <div className="form-group">
                  <label>No HP <span className="text-red-500">*</span></label>
                  <input type="text" name="no_hp" value={formData.no_hp} onChange={handleInputChange} required disabled={isDetailMode}/>
                </div>
              </div>

              {/* 2. DATA PRIBADI */}
              <div className="form-section-title mt-4"><User size={16} className="inline mr-2"/> Data Pribadi</div>
              <div className="grid-3-col">
                <div className="form-group">
                  <label>Gelar Depan</label>
                  <input type="text" name="gelar_depan" value={formData.gelar_depan} onChange={handleInputChange} disabled={isDetailMode} placeholder="Contoh: Dr."/>
                </div>
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} disabled={isDetailMode}/>
                </div>
                <div className="form-group">
                  <label>Gelar Belakang</label>
                  <input type="text" name="gelar_belakang" value={formData.gelar_belakang} onChange={handleInputChange} disabled={isDetailMode} placeholder="Contoh: S.Kom"/>
                </div>
              </div>

              <div className="grid-3-col">
                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} disabled={isDetailMode}>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tempat Lahir</label>
                  <input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} disabled={isDetailMode}/>
                </div>
                <div className="form-group">
                  <label>Tanggal Lahir</label>
                  <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} disabled={isDetailMode}/>
                </div>
              </div>
              <div className="form-group">
                <label>Kebangsaan</label>
                <input type="text" name="kebangsaan" value={formData.kebangsaan} onChange={handleInputChange} disabled={isDetailMode}/>
              </div>

              {/* 3. PENDIDIKAN */}
              <div className="form-section-title mt-4"><GraduationCap size={16} className="inline mr-2"/> Riwayat Pendidikan</div>
              <div className="grid-3-col">
                <div className="form-group">
                  <label>Pendidikan Terakhir</label>
                  <input type="text" name="pendidikan_terakhir" value={formData.pendidikan_terakhir} onChange={handleInputChange} disabled={isDetailMode} placeholder="S1/S2/S3"/>
                </div>
                <div className="form-group">
                  <label>Tahun Lulus</label>
                  <input type="number" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleInputChange} disabled={isDetailMode}/>
                </div>
                <div className="form-group">
                  <label>Institut Asal</label>
                  <input type="text" name="institut_asal" value={formData.institut_asal} onChange={handleInputChange} disabled={isDetailMode}/>
                </div>
              </div>

              {/* 4. ALAMAT DOMISILI (DENGAN DROPDOWN WILAYAH) */}
              <div className="form-section-title mt-4"><Home size={16} className="inline mr-2"/> Alamat Domisili</div>
              <div className="form-group">
                <label>Alamat Lengkap (Jalan/Gang)</label>
                <textarea name="alamat" value={formData.alamat} onChange={handleInputChange} disabled={isDetailMode} rows="2" className="w-full p-2 border rounded"></textarea>
              </div>
              
              <div className="grid-4-col">
                {/* PROVINSI */}
                <div className="form-group">
                  <label>Provinsi</label>
                  {isDetailMode ? (
                    <input type="text" value={formData.provinsi} disabled />
                  ) : (
                    <select name="provinsi" onChange={handleProvinsiChange} value={selectedWilayahId.provinsi} disabled={isDetailMode}>
                      <option value="">Pilih Provinsi</option>
                      {provinsiList.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                  )}
                </div>

                {/* KOTA */}
                <div className="form-group">
                  <label>Kota/Kab</label>
                  {isDetailMode ? (
                    <input type="text" value={formData.kota} disabled />
                  ) : (
                    <select name="kota" onChange={handleKotaChange} value={selectedWilayahId.kota} disabled={!selectedWilayahId.provinsi}>
                      <option value="">Pilih Kota</option>
                      {kotaList.map(k => (<option key={k.id} value={k.id}>{k.name}</option>))}
                    </select>
                  )}
                </div>

                {/* KECAMATAN */}
                <div className="form-group">
                  <label>Kecamatan</label>
                  {isDetailMode ? (
                    <input type="text" value={formData.kecamatan} disabled />
                  ) : (
                    <select name="kecamatan" onChange={handleKecamatanChange} value={selectedWilayahId.kecamatan} disabled={!selectedWilayahId.kota}>
                      <option value="">Pilih Kecamatan</option>
                      {kecamatanList.map(k => (<option key={k.id} value={k.id}>{k.name}</option>))}
                    </select>
                  )}
                </div>

                {/* KELURAHAN */}
                <div className="form-group">
                  <label>Kelurahan</label>
                  {isDetailMode ? (
                    <input type="text" value={formData.kelurahan} disabled />
                  ) : (
                    <select name="kelurahan" onChange={handleKelurahanChange} value={kelurahanList.find(k => k.name === formData.kelurahan)?.id || ''} disabled={!selectedWilayahId.kecamatan}>
                      <option value="">Pilih Kelurahan</option>
                      {kelurahanList.map(k => (<option key={k.id} value={k.id}>{k.name}</option>))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid-3-col">
                <div className="form-group"><label>RT</label><input type="text" name="rt" value={formData.rt} onChange={handleInputChange} disabled={isDetailMode}/></div>
                <div className="form-group"><label>RW</label><input type="text" name="rw" value={formData.rw} onChange={handleInputChange} disabled={isDetailMode}/></div>
                <div className="form-group"><label>Kode Pos</label><input type="text" name="kode_pos" value={formData.kode_pos} onChange={handleInputChange} disabled={isDetailMode}/></div>
              </div>

              {/* 5. KOMPETENSI */}
              <div className="form-section-title mt-4"><Briefcase size={16} className="inline mr-2"/> Kompetensi & Lisensi</div>
              <div className="grid-2-col">
                <div className="form-group">
                  <label>No. Registrasi Asesor (MET)</label>
                  <input type="text" name="no_reg_asesor" value={formData.no_reg_asesor} onChange={handleInputChange} disabled={isDetailMode}/>
                </div>
                <div className="form-group">
                  <label>No. Lisensi (BNSP)</label>
                  <input type="text" name="no_lisensi" value={formData.no_lisensi} onChange={handleInputChange} disabled={isDetailMode}/>
                </div>
              </div>
              <div className="grid-3-col">
                <div className="form-group">
                  <label>Bidang Keahlian</label>
                  <input type="text" name="bidang_keahlian" value={formData.bidang_keahlian} onChange={handleInputChange} disabled={isDetailMode}/>
                </div>
                <div className="form-group">
                  <label>Masa Berlaku Lisensi</label>
                  <input type="date" name="masa_berlaku" value={formData.masa_berlaku} onChange={handleInputChange} disabled={isDetailMode}/>
                </div>
                <div className="form-group">
                  <label>Status Asesor</label>
                  <select name="status_asesor" value={formData.status_asesor} onChange={handleInputChange} disabled={isDetailMode}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer-modern">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  {isDetailMode ? 'Tutup' : 'Batal'}
                </button>
                {!isDetailMode && (
                  <button type="submit" className="btn-primary">
                    <Save size={16} className="mr-2"/> Simpan Asesor
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header-modern">
              <h3>Import Data Asesor</h3>
              <button className="btn-close-modern" onClick={() => setShowImportModal(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleImportSubmit} className="modal-body-scroll">
              <div className="import-box">
                <Upload size={48} className="text-gray-300 mb-2"/>
                <p>Upload file Excel (.xlsx) berisi data asesor.</p>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="mt-4"/>
              </div>
              <div className="modal-footer-modern">
                <button type="button" className="btn-secondary" onClick={() => setShowImportModal(false)}>Batal</button>
                <button type="submit" className="btn-primary"><Upload size={16} className="mr-2"/> Upload & Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asesor;
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api"; 
import { getProvinsi, getKota, getKecamatan, getKelurahan } from "../../services/wilayah.service";
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
  const [modalType, setModalType] = useState(''); // 'create', 'edit', 'detail'
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // --- STATE WILAYAH (DROPDOWN) ---
  const [provinsiList, setProvinsiList] = useState([]);
  const [kotaList, setKotaList] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [kelurahanList, setKelurahanList] = useState([]);

  // State bantuan untuk ID Wilayah (karena API Butuh ID, tapi DB butuh NAMA)
  const [selectedRegionIds, setSelectedRegionIds] = useState({
    provinsi: '', kota: '', kecamatan: ''
  });

  // --- STATE FORM ---
  const initialFormState = {
    email: '', no_hp: '',
    nik: '', nama_lengkap: '', gelar_depan: '', gelar_belakang: '',
    jenis_kelamin: 'laki-laki', tempat_lahir: '', tanggal_lahir: '', kebangsaan: 'Indonesia',
    pendidikan_terakhir: '', tahun_lulus: '', institut_asal: '',
    alamat: '', rt: '', rw: '', provinsi: '', kota: '', kecamatan: '', kelurahan: '', kode_pos: '',
    bidang_keahlian: '', no_reg_asesor: '', no_lisensi: '', masa_berlaku: '', status_asesor: 'aktif'
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- FETCH DATA ASESOR ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/asesor');
      if (response.data.success) {
        let resultData = response.data.data || [];
        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          resultData = resultData.filter(item => 
            (item.nama_lengkap && item.nama_lengkap.toLowerCase().includes(lowerTerm)) ||
            (item.nik && item.nik.includes(lowerTerm)) ||
            (item.user?.email && item.user.email.toLowerCase().includes(lowerTerm))
          );
        }
        setData(resultData);
        setPagination(prev => ({
          ...prev, total: resultData.length, totalPages: Math.ceil(resultData.length / prev.limit)
        }));
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal mengambil data asesor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // --- LOAD PROVINSI PERTAMA KALI ---
  useEffect(() => {
    const loadProvinsi = async () => {
      try {
        const res = await getProvinsi();
        // Berdasarkan controller, data EMSIFA langsung me-return Array
        if (Array.isArray(res)) setProvinsiList(res);
      } catch (error) {
        console.error("Gagal memuat provinsi:", error);
      }
    };
    loadProvinsi();
  }, []);

  // --- HANDLERS WILAYAH ---
  const handleProvinsiChange = async (e) => {
    const id = e.target.value;
    if (!id) return;
    
    const index = e.target.selectedIndex;
    const text = e.target.options[index].text;

    setFormData(prev => ({ ...prev, provinsi: text, kota: '', kecamatan: '', kelurahan: '' }));
    setSelectedRegionIds(prev => ({ ...prev, provinsi: id, kota: '', kecamatan: '' }));
    setKotaList([]); setKecamatanList([]); setKelurahanList([]);

    try {
      const res = await getKota(id);
      if (Array.isArray(res)) setKotaList(res);
    } catch (error) { console.error(error); }
  };

  const handleKotaChange = async (e) => {
    const id = e.target.value;
    if (!id) return;

    const index = e.target.selectedIndex;
    const text = e.target.options[index].text;

    setFormData(prev => ({ ...prev, kota: text, kecamatan: '', kelurahan: '' }));
    setSelectedRegionIds(prev => ({ ...prev, kota: id, kecamatan: '' }));
    setKecamatanList([]); setKelurahanList([]);

    try {
      const res = await getKecamatan(id);
      if (Array.isArray(res)) setKecamatanList(res);
    } catch (error) { console.error(error); }
  };

  const handleKecamatanChange = async (e) => {
    const id = e.target.value;
    if (!id) return;

    const index = e.target.selectedIndex;
    const text = e.target.options[index].text;

    setFormData(prev => ({ ...prev, kecamatan: text, kelurahan: '' }));
    setSelectedRegionIds(prev => ({ ...prev, kecamatan: id }));
    setKelurahanList([]);

    try {
      const res = await getKelurahan(id);
      if (Array.isArray(res)) setKelurahanList(res);
    } catch (error) { console.error(error); }
  };

  const handleKelurahanChange = (e) => {
    const id = e.target.value;
    if (!id) return;
    const index = e.target.selectedIndex;
    const text = e.target.options[index].text;
    setFormData(prev => ({ ...prev, kelurahan: text }));
  };

  // --- HANDLERS FORM UMUM ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'create') {
        await api.post('/admin/asesor', formData);
        Swal.fire('Sukses', 'Data Asesor berhasil ditambahkan', 'success');
      } else if (modalType === 'edit') {
        const id = selectedItem.id_user; 
        await api.put(`/admin/asesor/${id}`, formData);
        Swal.fire('Sukses', 'Data Asesor berhasil diperbarui', 'success');
      }
      setShowModal(false);
      fetchData(); 
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan data', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Asesor?', 
      text: "Data user dan profil akan dihapus permanen!", 
      icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#d33'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/asesor/${id}`);
        Swal.fire('Terhapus!', 'Data asesor telah dihapus.', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Gagal menghapus data', 'error');
      }
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);

    // Reset Dropdown ID setiap kali modal dibuka
    setSelectedRegionIds({ provinsi: '', kota: '', kecamatan: '' });
    setKotaList([]); setKecamatanList([]); setKelurahanList([]);

    if (type === 'create') {
      setFormData(initialFormState);
    } else if (item) {
      setFormData({
        email: item.user?.email || '', no_hp: item.user?.no_hp || '',
        nik: item.nik || '', nama_lengkap: item.nama_lengkap || '', gelar_depan: item.gelar_depan || '',
        gelar_belakang: item.gelar_belakang || '', jenis_kelamin: item.jenis_kelamin || 'laki-laki',
        tempat_lahir: item.tempat_lahir || '', tanggal_lahir: item.tanggal_lahir ? item.tanggal_lahir.split('T')[0] : '', 
        kebangsaan: item.kebangsaan || 'Indonesia', pendidikan_terakhir: item.pendidikan_terakhir || '',
        tahun_lulus: item.tahun_lulus || '', institut_asal: item.institut_asal || '',
        alamat: item.alamat || '', rt: item.rt || '', rw: item.rw || '', 
        provinsi: item.provinsi || '', kota: item.kota || '', kecamatan: item.kecamatan || '', kelurahan: item.kelurahan || '', 
        kode_pos: item.kode_pos || '', bidang_keahlian: item.bidang_keahlian || '',
        no_reg_asesor: item.no_reg_asesor || '', no_lisensi: item.no_lisensi || '',
        masa_berlaku: item.masa_berlaku ? item.masa_berlaku.split('T')[0] : '', status_asesor: item.status_asesor || 'aktif'
      });
    }
    setShowModal(true);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    const fileInput = e.target.querySelector('input[type="file"]');
    if (fileInput && fileInput.files[0]) {
      const formDataImport = new FormData();
      formDataImport.append('file', fileInput.files[0]);
      try {
        await api.post('/admin/asesor/import', formDataImport);
        Swal.fire('Sukses', 'Import data berhasil', 'success');
        setShowImportModal(false);
        fetchData();
      } catch (error) {
         Swal.fire('Error', 'Gagal import data', 'error');
      }
    }
  };

  const getPaginatedData = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    return data.slice(startIndex, startIndex + pagination.limit);
  };

  const isDetailMode = modalType === 'detail';

  return (
    <div className="asesor-container">
      {/* HEADER & FILTER BAGIAN ATAS (TETAP SAMA) */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Data Asesor</h2>
          <p className="page-subtitle">Kelola data asesor LSP, kompetensi, dan lisensi.</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn-action-secondary" onClick={() => setShowImportModal(true)}>
            <FileSpreadsheet size={18} /> Import Excel
          </button>
          <button className="btn-action-primary" onClick={() => openModal('create')}>
            <Plus size={18} /> Tambah Asesor
          </button>
        </div>
      </div>

      <div className="filter-container">
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" placeholder="Cari NIK, Nama, atau Email..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p>Memuat data asesor...</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th width="5%">No</th>
                <th width="25%">Informasi Asesor</th>
                <th width="20%">Kontak & Wilayah</th>
                <th width="20%">Kompetensi</th>
                <th width="15%">Status</th>
                <th width="15%">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                getPaginatedData().map((item, index) => (
                  <tr key={item.id_user}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>
                      <div className="user-info">
                        <div className="avatar-placeholder"><User size={20} /></div>
                        <div>
                          <div className="font-bold text-gray-800">{item.gelar_depan} {item.nama_lengkap} {item.gelar_belakang}</div>
                          <div className="text-sm text-gray-500">NIK: {item.nik}</div>
                          <div className="text-xs text-gray-400 mt-1">Reg: {item.no_reg_asesor || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="text-sm text-gray-700">{item.user?.email}</div>
                        <div className="text-xs text-gray-500">{item.user?.no_hp}</div>
                        <div className="location-badge mt-1"><MapPin size={10} /> {item.kota || 'Kota -'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-gray-700">{item.bidang_keahlian}</div>
                      <div className="text-xs text-gray-500 mt-1">Lisensi: {item.no_lisensi || '-'}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status_asesor === 'aktif' ? 'active' : 'inactive'}`}>
                        {item.status_asesor === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon view" onClick={() => openModal('detail', item)} title="Detail"><Eye size={18} /></button>
                        <button className="btn-icon edit" onClick={() => openModal('edit', item)} title="Edit"><Edit2 size={18} /></button>
                        <button className="btn-icon delete" onClick={() => handleDelete(item.id_user)} title="Hapus"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <User size={48} className="mb-2 opacity-20" />
                      <p>Tidak ada data asesor ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination-container">
        <div className="text-sm text-gray-500">
          Menampilkan {getPaginatedData().length} dari {pagination.total} data
        </div>
        <div className="pagination-buttons">
          <button disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}><ChevronLeft size={16} /></button>
          <span>{pagination.page}</span>
          <button disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* MAIN MODAL FORM */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card large">
            <div className="modal-header-modern">
              <h3>{modalType === 'create' ? 'Tambah Asesor Baru' : modalType === 'edit' ? 'Edit Data Asesor' : 'Detail Asesor'}</h3>
              <button className="btn-close-modern" onClick={() => setShowModal(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body-scroll">
              
              {/* SECTION 1: Identitas Pribadi */}
              <div className="form-section-title"><User size={18} /> Identitas Pribadi</div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>NIK <span className="text-red-500">*</span></label>
                  <input type="text" name="nik" value={formData.nik} onChange={handleInputChange} required disabled={isDetailMode} placeholder="16 digit NIK" />
                </div>
                <div className="form-group">
                  <label>Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} required disabled={isDetailMode} />
                </div>
                <div className="form-group">
                  <label>Gelar Depan</label>
                  <input type="text" name="gelar_depan" value={formData.gelar_depan} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
                <div className="form-group">
                  <label>Gelar Belakang</label>
                  <input type="text" name="gelar_belakang" value={formData.gelar_belakang} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} disabled={isDetailMode}>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Kebangsaan</label>
                  <input type="text" name="kebangsaan" value={formData.kebangsaan} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Tempat Lahir</label>
                  <input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
                <div className="form-group">
                  <label>Tanggal Lahir</label>
                  <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
              </div>

              {/* SECTION 2: Kontak & Akun */}
              <div className="form-section-title mt-6"><Home size={18} /> Kontak & Akun</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={isDetailMode || modalType === 'edit'} placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label>No. HP / WA <span className="text-red-500">*</span></label>
                  <input type="text" name="no_hp" value={formData.no_hp} onChange={handleInputChange} required disabled={isDetailMode} />
                </div>
              </div>

              {/* SECTION 3: Alamat Domisili (DROPDOWN WILAYAH API) */}
              <div className="form-section-title mt-6"><MapPin size={18} /> Alamat Domisili</div>
              <div className="form-group">
                <label>Alamat Lengkap</label>
                <textarea name="alamat" rows="2" value={formData.alamat} onChange={handleInputChange} disabled={isDetailMode} className="w-full border p-2 rounded"></textarea>
              </div>
              
              <div className="form-grid-4">
                {/* PROVINSI */}
                <div className="form-group">
                  <label>Provinsi</label>
                  {isDetailMode ? (
                    <input type="text" value={formData.provinsi} disabled />
                  ) : (
                    <select onChange={handleProvinsiChange} value={selectedRegionIds.provinsi}>
                      <option value="">Pilih Provinsi</option>
                      {provinsiList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  {!isDetailMode && formData.provinsi && !selectedRegionIds.provinsi && (
                    <small className="text-gray-500 block mt-1">Tersimpan: {formData.provinsi}</small>
                  )}
                </div>

                {/* KOTA */}
                <div className="form-group">
                  <label>Kota/Kab</label>
                  {isDetailMode ? (
                    <input type="text" value={formData.kota} disabled />
                  ) : (
                    <select onChange={handleKotaChange} value={selectedRegionIds.kota} disabled={!selectedRegionIds.provinsi}>
                      <option value="">Pilih Kota</option>
                      {kotaList.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  )}
                  {!isDetailMode && formData.kota && !selectedRegionIds.kota && (
                    <small className="text-gray-500 block mt-1">Tersimpan: {formData.kota}</small>
                  )}
                </div>

                {/* KECAMATAN */}
                <div className="form-group">
                  <label>Kecamatan</label>
                  {isDetailMode ? (
                    <input type="text" value={formData.kecamatan} disabled />
                  ) : (
                    <select onChange={handleKecamatanChange} value={selectedRegionIds.kecamatan} disabled={!selectedRegionIds.kota}>
                      <option value="">Pilih Kecamatan</option>
                      {kecamatanList.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  )}
                  {!isDetailMode && formData.kecamatan && !selectedRegionIds.kecamatan && (
                    <small className="text-gray-500 block mt-1">Tersimpan: {formData.kecamatan}</small>
                  )}
                </div>

                {/* KELURAHAN */}
                <div className="form-group">
                  <label>Kelurahan</label>
                  {isDetailMode ? (
                    <input type="text" value={formData.kelurahan} disabled />
                  ) : (
                    <select onChange={handleKelurahanChange} disabled={!selectedRegionIds.kecamatan}>
                      <option value="">Pilih Kelurahan</option>
                      {kelurahanList.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  )}
                  {!isDetailMode && formData.kelurahan && !selectedRegionIds.kecamatan && (
                    <small className="text-gray-500 block mt-1">Tersimpan: {formData.kelurahan}</small>
                  )}
                </div>
              </div>

              <div className="form-grid-3">
                 <div className="form-group">
                  <label>RT</label>
                  <input type="text" name="rt" value={formData.rt} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
                <div className="form-group">
                  <label>RW</label>
                  <input type="text" name="rw" value={formData.rw} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
                <div className="form-group">
                  <label>Kode Pos</label>
                  <input type="text" name="kode_pos" value={formData.kode_pos} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
              </div>

              {/* SECTION 4: Pendidikan */}
              <div className="form-section-title mt-6"><GraduationCap size={18} /> Pendidikan Terakhir</div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Jenjang</label>
                  <select name="pendidikan_terakhir" value={formData.pendidikan_terakhir} onChange={handleInputChange} disabled={isDetailMode}>
                    <option value="">Pilih Jenjang</option>
                    <option value="D3">D3</option><option value="D4">D4</option><option value="S1">S1</option>
                    <option value="S2">S2</option><option value="S3">S3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tahun Lulus</label>
                  <input type="number" name="tahun_lulus" value={formData.tahun_lulus} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
                <div className="form-group">
                  <label>Institut Asal</label>
                  <input type="text" name="institut_asal" value={formData.institut_asal} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
              </div>

              {/* SECTION 5: Data Asesor */}
              <div className="form-section-title mt-6"><Briefcase size={18} /> Data Profesi Asesor</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Bidang Keahlian</label>
                  <input type="text" name="bidang_keahlian" value={formData.bidang_keahlian} onChange={handleInputChange} disabled={isDetailMode} placeholder="Contoh: Teknik Informatika" />
                </div>
                <div className="form-group">
                  <label>Status Asesor</label>
                  <select name="status_asesor" value={formData.status_asesor} onChange={handleInputChange} disabled={isDetailMode}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-Aktif</option>
                  </select>
                </div>
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>No. Registrasi MET</label>
                  <input type="text" name="no_reg_asesor" value={formData.no_reg_asesor} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
                <div className="form-group">
                  <label>No. Lisensi BNSP</label>
                  <input type="text" name="no_lisensi" value={formData.no_lisensi} onChange={handleInputChange} disabled={isDetailMode} />
                </div>
                 <div className="form-group">
                  <label>Masa Berlaku</label>
                  <input type="date" name="masa_berlaku" value={formData.masa_berlaku} onChange={handleInputChange} disabled={isDetailMode} />
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
                <input type="file" accept=".xlsx, .xls" className="mt-4"/>
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
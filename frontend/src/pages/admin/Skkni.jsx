import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import { 
  Search, Plus, Edit2, Trash2, X, Save, 
  Loader2, ChevronLeft, ChevronRight, BookOpen, FileText 
} from 'lucide-react';
import './adminstyles/Skkni.css'; 

const Skkni = () => {
  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, total: 0, totalPages: 1
  });

  // State Form (Sesuai Model Sequelize: users table modifikasi)
  const [formData, setFormData] = useState({
    jenis_standar: 'SKKNI', // Default ENUM
    no_skkni: '',
    judul_skkni: '',
    legalitas: '',
    sektor: '',
    sub_sektor: '',
    penerbit: ''
  });

  // State khusus untuk file upload
  const [dokumenFile, setDokumenFile] = useState(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/skkni');
      if (response.data.success) {
        let resultData = response.data.data || [];
        
        // Filter Client-side
        if (searchTerm) {
          resultData = resultData.filter(item => 
            item.judul_skkni.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.no_skkni && item.no_skkni.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        setData(resultData);
        setPagination(prev => ({
          ...prev, 
          total: resultData.length, 
          totalPages: Math.ceil(resultData.length / prev.limit)
        }));
      }
    } catch (error) {
      console.error(error);
      // Handle Error Auth (401/403) dengan pesan yang jelas
      const message = error.response?.data?.message || 'Gagal mengambil data SKKNI';
      Swal.fire('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDokumenFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Gunakan FormData untuk support File Upload
    const payload = new FormData();
    payload.append('jenis_standar', formData.jenis_standar);
    payload.append('no_skkni', formData.no_skkni);
    payload.append('judul_skkni', formData.judul_skkni);
    payload.append('legalitas', formData.legalitas);
    payload.append('sektor', formData.sektor);
    payload.append('sub_sektor', formData.sub_sektor);
    payload.append('penerbit', formData.penerbit);

    if (dokumenFile) {
      payload.append('dokumen', dokumenFile);
    }

    try {
      if (modalType === 'create') {
        // Content-Type multipart/form-data otomatis dihandle oleh axios/browser
        await api.post('/admin/skkni', payload);
        Swal.fire('Sukses', 'Standar Kompetensi berhasil ditambahkan', 'success');
      } else {
        const id = selectedItem.id_skkni;
        // PERBAIKAN: Menggunakan backticks (`) untuk template literal
        await api.put(`/admin/skkni/${id}`, payload);
        Swal.fire('Sukses', 'Standar Kompetensi berhasil diperbarui', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("Submit Error:", error);
      Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan data', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Data?', 
      text: "Data ini akan dihapus permanen beserta filenya!", 
      icon: 'warning',
      showCancelButton: true, 
      confirmButtonText: 'Hapus', 
      cancelButtonText: 'Batal', 
      confirmButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        // PERBAIKAN: Menggunakan backticks (`) untuk template literal
        await api.delete(`/admin/skkni/${id}`);
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
    setDokumenFile(null); // Reset file input

    if (type === 'create') {
      setFormData({
        jenis_standar: 'SKKNI',
        no_skkni: '',
        judul_skkni: '',
        legalitas: '',
        sektor: '',
        sub_sektor: '',
        penerbit: ''
      });
    } else if (type === 'edit' && item) {
      setFormData({
        jenis_standar: item.jenis_standar || 'SKKNI',
        no_skkni: item.no_skkni || '',
        judul_skkni: item.judul_skkni || '',
        legalitas: item.legalitas || '',
        sektor: item.sektor || '',
        sub_sektor: item.sub_sektor || '',
        penerbit: item.penerbit || ''
      });
    }
    setShowModal(true);
  };

  // Helper Pagination Slicing
  const getPaginatedData = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return data.slice(startIndex, endIndex);
  };

  return (
    <div className="skkni-container">
      {/* Header Section */}
      <div className="header-section">
        <div className="title-box">
          <h2>Data Standar Kompetensi</h2>
          <p>Kelola Data SKKNI, SKK, dan Standar Internasional</p>
        </div>
        <button className="btn-create" onClick={() => openModal('create')}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Cari Nomor atau Judul..." 
            value={searchTerm} 
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }} 
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Memuat data...</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th width="5%">No</th>
                <th width="15%">Jenis & Nomor</th>
                <th width="25%">Judul Standar</th>
                <th width="20%">Sektor / Sub</th>
                <th width="20%">Legalitas & Penerbit</th>
                <th width="5%">File</th>
                <th width="10%">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                getPaginatedData().map((item, index) => (
                  <tr key={item.id_skkni}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>
                      {/* PERBAIKAN: Menggunakan backticks untuk dynamic className */}
                      <span className={`badge-jenis ${item.jenis_standar.toLowerCase()}`}>
                        {item.jenis_standar}
                      </span>
                      <div className="mt-1 text-sm font-medium text-gray-700">
                        {item.no_skkni || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-800">{item.judul_skkni}</div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-700">{item.sektor || '-'}</div>
                      <div className="text-xs text-gray-500">{item.sub_sektor}</div>
                    </td>
                    <td>
                      <div className="text-sm font-medium">{item.legalitas || '-'}</div>
                      <div className="text-xs text-gray-500 italic">{item.penerbit}</div>
                    </td>
                    <td className="text-center">
                      {item.dokumen ? (
                        <a 
                          /* PERBAIKAN: Menggunakan backticks untuk URL string */
                          href={`http://localhost:3000/uploads/skkni/${item.dokumen}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-icon-download"
                          title="Download Dokumen"
                        >
                          <FileText size={18} className="text-blue-600"/>
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action edit" onClick={() => openModal('edit', item)} title="Edit">
                          <Edit2 size={18} />
                        </button>
                        <button className="btn-action delete" onClick={() => handleDelete(item.id_skkni)} title="Hapus">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen size={40} className="text-gray-300"/>
                      <span>Tidak ada data ditemukan</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination-section">
        <div className="pagination-info">
          Menampilkan {getPaginatedData().length} dari {pagination.total} data
        </div>
        <div className="pagination-controls">
          <button 
            disabled={pagination.page === 1} 
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            <ChevronLeft size={18} />
          </button>
          <span>Hal {pagination.page} dari {pagination.totalPages}</span>
          <button 
            disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0} 
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalType === 'create' ? 'Tambah Data Standar' : 'Edit Data Standar'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                
                <div className="form-row">
                  <div className="form-group" style={{ flex: '0 0 30%' }}>
                    <label>Jenis Standar <span className="text-red-500">*</span></label>
                    <select 
                      name="jenis_standar" 
                      value={formData.jenis_standar} 
                      onChange={handleInputChange}
                      required
                    >
                      <option value="SKKNI">SKKNI</option>
                      <option value="SKK">SKK (Khusus)</option>
                      <option value="SI">SI (Internasional)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Nomor Standar</label>
                    <input 
                      type="text" 
                      name="no_skkni" 
                      value={formData.no_skkni} 
                      onChange={handleInputChange} 
                      placeholder="Contoh: 123 Tahun 2024" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Judul Standar Kompetensi <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="judul_skkni" 
                    value={formData.judul_skkni} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="Masukkan judul standar kompetensi..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Sektor</label>
                    <input 
                      type="text" 
                      name="sektor" 
                      value={formData.sektor} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Sub Sektor</label>
                    <input 
                      type="text" 
                      name="sub_sektor" 
                      value={formData.sub_sektor} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Penerbit</label>
                    <input 
                      type="text" 
                      name="penerbit" 
                      value={formData.penerbit} 
                      onChange={handleInputChange} 
                      placeholder="Contoh: Kemenaker RI"
                    />
                  </div>
                  <div className="form-group">
                    <label>Legalitas (SK/Peraturan)</label>
                    <input 
                      type="text" 
                      name="legalitas" 
                      value={formData.legalitas} 
                      onChange={handleInputChange} 
                      placeholder="Contoh: Keputusan Menteri No..."
                    />
                  </div>
                </div>

                {/* Upload Dokumen */}
                <div className="form-group">
                  <label>Upload Dokumen (PDF)</label>
                  <div className="file-input-wrapper">
                    <input 
                      type="file" 
                      onChange={handleFileChange} 
                      className="w-full border p-2 rounded" 
                      accept=".pdf,.doc,.docx" 
                    />
                    {modalType === 'edit' && selectedItem?.dokumen && (
                      <small className="text-gray-500 block mt-1">
                        File saat ini: {selectedItem.dokumen} (Upload baru untuk mengganti)
                      </small>
                    )}
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn-save">
                  <Save size={16}/> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Skkni;
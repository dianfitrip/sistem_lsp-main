import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import { 
  Search, Plus, Eye, Edit2, Trash2, X, Save, FileText, 
  Filter, Download, Loader2, ChevronLeft, ChevronRight 
} from 'lucide-react';
import './DokumenMutu.css'; 

const DokumenMutu = () => {
  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState(''); // State filter
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Form State
  const [formData, setFormData] = useState({
    jenis_dokumen: 'kebijakan_mutu',
    kategori: '',
    nama_dokumen: '',
    deskripsi: '',
    nomor_dokumen: '',
    nomor_revisi: '',
    penyusun: '',
    disahkan_oleh: '',
    tanggal_dokumen: ''
  });
  
  // File States
  const [fileDokumen, setFileDokumen] = useState(null);
  const [filePendukung, setFilePendukung] = useState(null);

  const isDetailMode = modalType === 'detail';

  // --- OPTIONS ---
  const jenisDokumenOptions = [
    { value: 'kebijakan_mutu', label: 'Kebijakan Mutu' },
    { value: 'manual_mutu', label: 'Manual Mutu' },
    { value: 'standar_mutu', label: 'Standar Mutu' },
    { value: 'formulir_mutu', label: 'Formulir Mutu' },
    { value: 'referensi', label: 'Referensi' },
  ];

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dokumen-mutu', {
        params: { 
            search: searchTerm, 
            jenis: filterJenis, // Kirim parameter filter ke backend
            page: pagination.page, 
            limit: pagination.limit 
        }
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

  useEffect(() => {
    fetchData();
  }, [pagination.page, searchTerm, filterJenis]); // Refresh saat filter berubah

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'utama') setFileDokumen(file);
    if (type === 'pendukung') setFilePendukung(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDetailMode) return;

    const payload = new FormData();
    Object.keys(formData).forEach(key => {
        if(formData[key]) payload.append(key, formData[key]);
    });
    if (fileDokumen) payload.append('file_dokumen', fileDokumen);
    if (filePendukung) payload.append('file_pendukung', filePendukung);

    try {
      if (modalType === 'create') {
        await api.post('/admin/dokumen-mutu', payload);
        Swal.fire('Sukses', 'Dokumen berhasil ditambahkan', 'success');
      } else {
        await api.put(`/admin/dokumen-mutu/${selectedItem.id_dokumen}`, payload);
        Swal.fire('Sukses', 'Dokumen berhasil diperbarui', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Dokumen?', text: "File fisik juga akan dihapus.", icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#d33'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/dokumen-mutu/${id}`);
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
    setFileDokumen(null);
    setFilePendukung(null);
    
    if (type === 'create') {
      setFormData({
        jenis_dokumen: 'kebijakan_mutu', kategori: '', nama_dokumen: '', deskripsi: '',
        nomor_dokumen: '', nomor_revisi: '', penyusun: '', disahkan_oleh: '', tanggal_dokumen: ''
      });
    } else if (item) {
      setFormData({
        jenis_dokumen: item.jenis_dokumen,
        kategori: item.kategori || '',
        nama_dokumen: item.nama_dokumen,
        deskripsi: item.deskripsi || '',
        nomor_dokumen: item.nomor_dokumen || '',
        nomor_revisi: item.nomor_revisi || '',
        penyusun: item.penyusun || '',
        disahkan_oleh: item.disahkan_oleh || '',
        tanggal_dokumen: item.tanggal_dokumen || ''
      });
    }
    setShowModal(true);
  };

  return (
    <div className="dokumen-container">
      {/* Header */}
      <div className="header-section">
        <div className="title-box">
          <h2>Dokumen Mutu</h2>
          <p>Manajemen dokumen sistem manajemen mutu LSP</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn-create" onClick={() => openModal('create')}>
            <Plus size={18} /> Tambah Dokumen
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="filter-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input type="text" placeholder="Cari Dokumen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {/* DROPDOWN FILTER JENIS DOKUMEN */}
        <div className="filter-dropdown">
            <Filter size={18} className="filter-icon"/>
            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
                <option value="">Semua Jenis Dokumen</option>
                {jenisDokumenOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
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
                <th>Nama Dokumen</th>
                <th>Jenis</th>
                <th>Nomor / Revisi</th>
                <th>Tgl Berlaku</th>
                <th>File</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.id_dokumen}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td className="font-medium">
                        {item.nama_dokumen}
                        {item.kategori && <div className="text-xs text-gray-500 mt-1">{item.kategori}</div>}
                    </td>
                    <td>
                        <span className="badge-jenis">
                            {jenisDokumenOptions.find(o => o.value === item.jenis_dokumen)?.label || item.jenis_dokumen}
                        </span>
                    </td>
                    <td>
                        <div>{item.nomor_dokumen || '-'}</div>
                        <small className="text-gray-500">Rev: {item.nomor_revisi || '0'}</small>
                    </td>
                    <td>{item.tanggal_dokumen || '-'}</td>
                    <td>
                        {item.file_dokumen ? (
                            <a href={`http://localhost:3000/uploads/${item.file_dokumen}`} target="_blank" className="btn-file" title="Download">
                                <FileText size={16}/>
                            </a>
                        ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action view" onClick={() => openModal('detail', item)}><Eye size={18} /></button>
                        <button className="btn-action edit" onClick={() => openModal('edit', item)}><Edit2 size={18} /></button>
                        <button className="btn-action delete" onClick={() => handleDelete(item.id_dokumen)}><Trash2 size={18} /></button>
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
              <h3>{isDetailMode ? 'Detail Dokumen' : (modalType === 'create' ? 'Tambah Dokumen Mutu' : 'Edit Dokumen')}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body scrollable-body">
                
                <h4 className="section-title">Informasi Dasar</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label>Jenis Dokumen <span className="text-red-500">*</span></label>
                        <select name="jenis_dokumen" value={formData.jenis_dokumen} onChange={handleInputChange} disabled={isDetailMode} required>
                            {jenisDokumenOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Kategori (Opsional)</label>
                        <input type="text" name="kategori" value={formData.kategori} onChange={handleInputChange} disabled={isDetailMode} placeholder="Misal: SOP Keuangan"/>
                    </div>
                </div>

                <div className="form-group">
                    <label>Nama Dokumen <span className="text-red-500">*</span></label>
                    <input type="text" name="nama_dokumen" value={formData.nama_dokumen} onChange={handleInputChange} disabled={isDetailMode} required />
                </div>

                <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} disabled={isDetailMode} rows="2"></textarea>
                </div>

                <h4 className="section-title">Detail & Validasi</h4>
                <div className="form-row">
                    <div className="form-group"><label>Nomor Dokumen</label><input type="text" name="nomor_dokumen" value={formData.nomor_dokumen} onChange={handleInputChange} disabled={isDetailMode}/></div>
                    <div className="form-group"><label>Nomor Revisi</label><input type="text" name="nomor_revisi" value={formData.nomor_revisi} onChange={handleInputChange} disabled={isDetailMode}/></div>
                    <div className="form-group"><label>Tanggal Dokumen</label><input type="date" name="tanggal_dokumen" value={formData.tanggal_dokumen} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>

                <div className="form-row">
                    <div className="form-group"><label>Penyusun</label><input type="text" name="penyusun" value={formData.penyusun} onChange={handleInputChange} disabled={isDetailMode}/></div>
                    <div className="form-group"><label>Disahkan Oleh</label><input type="text" name="disahkan_oleh" value={formData.disahkan_oleh} onChange={handleInputChange} disabled={isDetailMode}/></div>
                </div>

                <h4 className="section-title">Upload File</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label>File Dokumen Utama (PDF/Doc)</label>
                        {!isDetailMode && <input type="file" onChange={(e) => handleFileChange(e, 'utama')} className="file-input-base" />}
                        {selectedItem?.file_dokumen && <small className="block text-blue-600 mt-1">File saat ini: {selectedItem.file_dokumen}</small>}
                    </div>
                    <div className="form-group">
                        <label>File Pendukung (Lampiran)</label>
                        {!isDetailMode && <input type="file" onChange={(e) => handleFileChange(e, 'pendukung')} className="file-input-base" />}
                        {selectedItem?.file_pendukung && <small className="block text-blue-600 mt-1">File saat ini: {selectedItem.file_pendukung}</small>}
                    </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>{isDetailMode ? 'Tutup' : 'Batal'}</button>
                {!isDetailMode && <button type="submit" className="btn-save"><Save size={16}/> Simpan</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DokumenMutu;
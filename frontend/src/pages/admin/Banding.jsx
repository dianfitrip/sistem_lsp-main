import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import { 
  Search, Eye, Trash2, X, Save, 
  Gavel, User, FileText, Calendar, CheckCircle, XCircle, Clock, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import './Banding.css'; 

const Banding = () => {
  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Form State untuk Update
  const [formUpdate, setFormUpdate] = useState({
    status_progress: '',
    keputusan: '',
    catatan_komite: ''
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/banding', {
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

  useEffect(() => {
    fetchData();
  }, [pagination.page, searchTerm]);

  // --- HANDLERS ---
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Data Banding?', 
      text: "Data akan dihapus permanen.", 
      icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/banding/${id}`);
        Swal.fire('Terhapus!', 'Data telah dihapus.', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus data', 'error');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
        await api.put(`/admin/banding/${selectedItem.id_banding}`, formUpdate);
        Swal.fire('Sukses', 'Keputusan banding diperbarui', 'success');
        setShowModal(false);
        fetchData();
    } catch (error) {
        Swal.fire('Error', 'Gagal update data', 'error');
    }
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setFormUpdate({
        status_progress: item.status_progress || 'diajukan',
        keputusan: item.keputusan || 'belum_diputus',
        catatan_komite: item.catatan_komite || ''
    });
    setShowModal(true);
  };

  // Helper Format
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '-';

  const getStatusBadge = (status) => {
    if(status === 'diajukan') return <span className="badge-status diajukan"><Clock size={12}/> Diajukan</span>;
    if(status === 'tindak_lanjut') return <span className="badge-status proses"><Loader2 size={12}/> Proses</span>;
    if(status === 'pleno_komite') return <span className="badge-status pleno"><Gavel size={12}/> Pleno Komite</span>;
    return status;
  };

  const getKeputusanBadge = (keputusan) => {
    if(keputusan === 'diterima') return <span className="badge-keputusan diterima"><CheckCircle size={12}/> Diterima</span>;
    if(keputusan === 'ditolak') return <span className="badge-keputusan ditolak"><XCircle size={12}/> Ditolak</span>;
    return <span className="badge-keputusan pending">Belum Diputus</span>;
  };

  return (
    <div className="banding-container">
      {/* Header */}
      <div className="header-section">
        <div className="title-box">
          <h2>Layanan Banding Asesmen</h2>
          <p>Kelola pengajuan banding dari peserta sertifikasi</p>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input type="text" placeholder="Cari isi banding..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                <th>Tanggal</th>
                <th>Nama Asesi</th>
                <th>Skema</th>
                <th>Status</th>
                <th>Keputusan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.id_banding}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>{formatDate(item.tanggal_ajukan)}</td>
                    <td className="font-medium">{item.nama_asesi}</td>
                    <td>{item.judul_skema}</td>
                    <td>{getStatusBadge(item.status_progress)}</td>
                    <td>{getKeputusanBadge(item.keputusan)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action view" onClick={() => openModal(item)} title="Proses Banding">
                          <Gavel size={18} />
                        </button>
                        <button className="btn-action delete" onClick={() => handleDelete(item.id_banding)} title="Hapus">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Tidak ada pengajuan banding</td></tr>
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

      {/* Modal Proses */}
      {showModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>Proses Banding Asesmen</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdate}>
                <div className="modal-body scrollable-body">
                    
                    {/* Info Pengaju */}
                    <div className="detail-card mb-4">
                        <h4 className="detail-title"><User size={16}/> Informasi Pengaju</h4>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <label>Nama Asesi</label>
                                <p>{selectedItem.nama_asesi}</p>
                            </div>
                            <div className="detail-item">
                                <label>Tanggal Ajukan</label>
                                <p>{formatDate(selectedItem.tanggal_ajukan)}</p>
                            </div>
                            <div className="detail-item full-width">
                                <label>Skema Sertifikasi</label>
                                <p>{selectedItem.judul_skema}</p>
                            </div>
                        </div>
                    </div>

                    {/* Isi Banding */}
                    <div className="detail-card mb-4">
                        <h4 className="detail-title"><FileText size={16}/> Isi Pengajuan Banding</h4>
                        <div className="content-box">
                            {selectedItem.isi_banding}
                        </div>
                    </div>

                    {/* Form Keputusan */}
                    <div className="status-update-section">
                        <h4 className="font-semibold mb-3 flex items-center gap-2"><Gavel size={16}/> Keputusan Komite</h4>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Status Progress</label>
                                <select 
                                    value={formUpdate.status_progress} 
                                    onChange={(e) => setFormUpdate(p => ({...p, status_progress: e.target.value}))}
                                >
                                    <option value="diajukan">Diajukan</option>
                                    <option value="tindak_lanjut">Tindak Lanjut</option>
                                    <option value="pleno_komite">Pleno Komite</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Keputusan Akhir</label>
                                <select 
                                    value={formUpdate.keputusan} 
                                    onChange={(e) => setFormUpdate(p => ({...p, keputusan: e.target.value}))}
                                    className={formUpdate.keputusan === 'diterima' ? 'text-green-600 font-bold' : formUpdate.keputusan === 'ditolak' ? 'text-red-600 font-bold' : ''}
                                >
                                    <option value="belum_diputus">Belum Diputus</option>
                                    <option value="diterima">Diterima</option>
                                    <option value="ditolak">Ditolak</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group mt-3">
                            <label>Catatan Komite / Pleno</label>
                            <textarea 
                                rows="3" 
                                className="w-full border p-2 rounded"
                                placeholder="Masukkan catatan hasil pleno komite..."
                                value={formUpdate.catatan_komite}
                                onChange={(e) => setFormUpdate(p => ({...p, catatan_komite: e.target.value}))}
                            ></textarea>
                        </div>
                    </div>

                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                    <button type="submit" className="btn-save"><Save size={16}/> Simpan Keputusan</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banding;
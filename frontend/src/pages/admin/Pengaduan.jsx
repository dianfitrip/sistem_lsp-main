import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import { 
  Search, Eye, Trash2, X, Save, 
  MessageSquare, User, Calendar, Mail, Phone, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import './adminstyles/Pengaduan.css'; 

const Pengaduan = () => {
  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusEdit, setStatusEdit] = useState(''); // State untuk ubah status di modal

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/pengaduan', {
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
  const handleStatusChange = async () => {
    if (!selectedItem) return;
    
    try {
      await api.put(`/admin/pengaduan/${selectedItem.id_pengaduan}/status`, {
        status_pengaduan: statusEdit
      });
      Swal.fire('Sukses', 'Status pengaduan diperbarui', 'success');
      setShowModal(false);
      fetchData();
    } catch (error) {
      Swal.fire('Error', 'Gagal memperbarui status', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Pengaduan?', 
      text: "Data akan dihapus permanen.", 
      icon: 'warning',
      showCancelButton: true, 
      confirmButtonText: 'Hapus', 
      cancelButtonText: 'Batal', 
      confirmButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/pengaduan/${id}`);
        Swal.fire('Terhapus!', 'Data telah dihapus.', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus data', 'error');
      }
    }
  };

  const openDetailModal = (item) => {
    setSelectedItem(item);
    setStatusEdit(item.status_pengaduan);
    setShowModal(true);
  };

  // Helper Warna Status
  const getStatusBadge = (status) => {
    switch(status) {
      case 'masuk': return <span className="badge-status masuk">Baru Masuk</span>;
      case 'tindak_lanjut': return <span className="badge-status proses">Tindak Lanjut</span>;
      case 'selesai': return <span className="badge-status selesai">Selesai</span>;
      default: return <span className="badge-status">{status}</span>;
    }
  };

  // Helper Format Tanggal
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  return (
    <div className="pengaduan-container">
      {/* Header */}
      <div className="header-section">
        <div className="title-box">
          <h2>Layanan Pengaduan</h2>
          <p>Daftar keluhan dan masukan dari masyarakat/asesi</p>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Cari Nama, Email, atau Isi..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
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
                <th>Pengirim</th>
                <th>Sebagai</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.id_pengaduan}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>{formatDate(item.tanggal_pengaduan)}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.nama_pengadu}</span>
                        <span className="text-xs text-gray-500">{item.email_pengadu}</span>
                      </div>
                    </td>
                    <td className="capitalize">{item.sebagai_siapa}</td>
                    <td>{getStatusBadge(item.status_pengaduan)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action view" onClick={() => openDetailModal(item)} title="Lihat & Ubah Status">
                          <Eye size={18} />
                        </button>
                        <button className="btn-action delete" onClick={() => handleDelete(item.id_pengaduan)} title="Hapus">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Tidak ada pengaduan masuk</td></tr>
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

      {/* Modal Detail & Update Status */}
      {showModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>Detail Pengaduan</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <div className="modal-body scrollable-body">
              {/* Info Pengirim */}
              <div className="detail-card">
                <h4 className="detail-title"><User size={16}/> Informasi Pengirim</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Nama Lengkap</label>
                    <p>{selectedItem.nama_pengadu}</p>
                  </div>
                  <div className="detail-item">
                    <label>Sebagai</label>
                    <p className="capitalize">{selectedItem.sebagai_siapa}</p>
                  </div>
                  <div className="detail-item">
                    <label><Mail size={14}/> Email</label>
                    <p>{selectedItem.email_pengadu || '-'}</p>
                  </div>
                  <div className="detail-item">
                    <label><Phone size={14}/> No. HP</label>
                    <p>{selectedItem.no_hp_pengadu || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Isi Pengaduan */}
              <div className="detail-card mt-4">
                <h4 className="detail-title"><MessageSquare size={16}/> Isi Laporan</h4>
                <div className="detail-item full-width">
                  <label><Calendar size={14}/> Tanggal Masuk: {formatDate(selectedItem.tanggal_pengaduan)}</label>
                  <div className="content-box">
                    {selectedItem.isi_pengaduan}
                  </div>
                </div>
              </div>

              {/* Update Status Section */}
              <div className="status-update-section">
                <label className="font-semibold mb-2 block">Update Status Penanganan:</label>
                <select 
                  className="status-select"
                  value={statusEdit} 
                  onChange={(e) => setStatusEdit(e.target.value)}
                >
                  <option value="masuk">Masuk (Belum dibaca)</option>
                  <option value="tindak_lanjut">Sedang Ditindak Lanjuti</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Tutup</button>
              <button type="button" className="btn-save" onClick={handleStatusChange}>
                <Save size={16}/> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pengaduan;
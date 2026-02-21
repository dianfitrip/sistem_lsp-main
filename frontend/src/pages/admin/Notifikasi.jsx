import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import { 
  Search, Bell, Mail, MessageSquare, Filter, 
  CheckCircle, XCircle, Clock, Eye, Trash2, 
  Loader2, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import './adminstyles/Notifikasi.css'; // Pastikan membuat file CSS ini

const NotifikasiAdmin = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(''); // pendaftaran, pengaduan, akun
  const [filterChannel, setFilterChannel] = useState(''); // email, wa
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/notifikasi', {
        params: { 
          page, 
          limit: pagination.limit, 
          search: searchTerm,
          ref_type: filterType,
          channel: filterChannel
        }
      });
      const result = response.data.data;
      setData(result.rows || []);
      setPagination(prev => ({
        ...prev,
        page: parseInt(result.currentPage) || page,
        total: result.totalItems || 0,
        totalPages: result.totalPages || 1
      }));
    } catch (error) {
      console.error("Gagal mengambil data notifikasi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page);
  }, [pagination.page, filterType, filterChannel]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchData(1);
  };

  const handleViewDetail = (notif) => {
    setSelectedNotif(notif);
    setShowDetailModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Riwayat?',
      text: "Data notifikasi akan dihapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/notifikasi/${id}`);
        Swal.fire('Dihapus!', 'Riwayat notifikasi berhasil dihapus.', 'success');
        fetchData(pagination.page);
      } catch (error) {
        Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus.', 'error');
      }
    }
  };

  return (
    <div className="notifikasi-admin-container">
      {/* HEADER */}
      <div className="header-section">
        <div className="title-box">
          <h2>Log Notifikasi</h2>
          <p>Riwayat pengiriman pesan otomatis melalui Email dan WhatsApp.</p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="filter-wrapper">
        <form onSubmit={handleSearch} className="search-box-notif">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Cari tujuan atau pesan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <div className="filter-actions">
          <div className="select-group">
            <Filter size={16} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Semua Tipe</option>
              <option value="pendaftaran">Pendaftaran</option>
              <option value="pengaduan">Pengaduan</option>
              <option value="akun">Akun</option>
            </select>
          </div>

          <div className="select-group">
            <Bell size={16} />
            <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
              <option value="">Semua Channel</option>
              <option value="email">Email</option>
              <option value="wa">WhatsApp</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state"><Loader2 className="animate-spin" /> Memuat riwayat...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Channel</th>
                <th>Tujuan</th>
                <th>Tipe Ref</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (data.map((item) => (
                <tr key={item.id_notifikasi}>
                  <td>
                    <div className="time-cell">
                      <Clock size={14} />
                      {new Date(item.waktu_kirim).toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td>
                    <span className={`channel-badge ${item.channel}`}>
                      {item.channel === 'email' ? <Mail size={14}/> : <MessageSquare size={14}/>}
                      {item.channel.toUpperCase()}
                    </span>
                  </td>
                  <td><span className="font-medium">{item.tujuan}</span></td>
                  <td><span className="ref-type-text">{item.ref_type}</span></td>
                  <td>
                    <span className={`status-pill ${item.status_kirim}`}>
                      {item.status_kirim === 'terkirim' ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                      {item.status_kirim}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view" onClick={() => handleViewDetail(item)}><Eye size={16}/></button>
                      <button className="btn-delete" onClick={() => handleDelete(item.id_notifikasi)}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))) : (
                <tr><td colSpan="6" className="empty-state">Belum ada riwayat notifikasi.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className="pagination-notif">
        <p>Total: {pagination.total} Notifikasi</p>
        <div className="page-btns">
          <button disabled={pagination.page === 1} onClick={() => setPagination(p=>({...p, page: p.page-1}))}><ChevronLeft/></button>
          <span>Halaman {pagination.page} / {pagination.totalPages}</span>
          <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p=>({...p, page: p.page+1}))}><ChevronRight/></button>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedNotif && (
        <div className="modal-notif-overlay">
          <div className="modal-notif-content">
            <div className="modal-notif-header">
              <h3>Detail Pesan</h3>
              <button onClick={() => setShowDetailModal(false)}><X /></button>
            </div>
            <div className="modal-notif-body">
              <div className="detail-row">
                <label>Isi Pesan:</label>
                <div className="pesan-box">{selectedNotif.pesan}</div>
              </div>
              <div className="detail-grid">
                <div>
                  <label>Ref Type:</label>
                  <p>{selectedNotif.ref_type}</p>
                </div>
                <div>
                  <label>Ref ID:</label>
                  <p>#{selectedNotif.ref_id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotifikasiAdmin;
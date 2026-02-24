import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from "../../services/api";
import { 
  Search, Eye, Trash2, X, Save, 
  Gavel, User, FileText, Calendar, CheckCircle, XCircle, Clock, Loader2, AlertCircle
} from 'lucide-react';
import './adminstyles/Banding.css'; 

const Banding = () => {
  // --- STATE ---
  const [data, setData] = useState([]); // Data mentah dari API
  const [filteredData, setFilteredData] = useState([]); // Data setelah disearch
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form State untuk Update
  const [formUpdate, setFormUpdate] = useState({
    status_progress: '',
    keputusan: '',
    catatan_komite: ''
  });

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  // Filter data setiap kali search term atau data berubah
  useEffect(() => {
    if (!data) return;
    
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = data.filter(item => {
      const noPendaftaran = item.no_pendaftaran?.toLowerCase() || '';
      const emailUser = item.user?.email?.toLowerCase() || '';
      const ket = item.keterangan_banding?.toLowerCase() || '';
      
      return noPendaftaran.includes(lowerTerm) || 
             emailUser.includes(lowerTerm) || 
             ket.includes(lowerTerm);
    });
    
    setFilteredData(filtered);
  }, [searchTerm, data]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Backend: bandingController.getAllBanding
      const response = await api.get('/admin/banding');
      
      // Backend mengembalikan { status: true, message: "...", data: [ARRAY] }
      const result = response.data.data || [];
      
      setData(result);
      setFilteredData(result);
    } catch (error) {
      console.error("Error fetching banding:", error);
      Swal.fire("Error", "Gagal memuat data banding", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  
  const handleDetailClick = (item) => {
    setSelectedItem(item);
    setFormUpdate({
      status_progress: item.status_progress || 'diterima_admin',
      keputusan: item.keputusan || 'belum_diputus',
      catatan_komite: item.catatan_komite || ''
    });
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await api.put(`/admin/banding/${selectedItem.id_banding}`, formUpdate);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Status banding telah diperbarui',
        timer: 1500
      });
      
      setShowModal(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Update error:", error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat update', 'error');
    }
  };

  // Helper untuk warna badge status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'selesai': return 'bg-green-100 text-green-800';
      case 'on_review': return 'bg-blue-100 text-blue-800';
      case 'ditolak': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getKeputusanBadge = (keputusan) => {
    if (keputusan === 'diterima') return <span className="flex items-center text-green-600 gap-1"><CheckCircle size={14}/> Diterima</span>;
    if (keputusan === 'ditolak') return <span className="flex items-center text-red-600 gap-1"><XCircle size={14}/> Ditolak</span>;
    return <span className="flex items-center text-gray-500 gap-1"><Clock size={14}/> Belum Diputus</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="banding-container">
      {/* HEADER */}
      <div className="header-section">
        <div className="title-box">
          <h2>Data Banding Asesmen</h2>
          <p>Kelola pengajuan banding dari asesi.</p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="content-card">
        <div className="search-bar-wrapper">
          <Search size={20} className="text-gray-400" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Cari No Pendaftaran atau Email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="p-8 text-center flex justify-center">
            <Loader2 className="animate-spin text-orange-500" size={40} />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tgl Ajukan</th>
                  <th>Asesi (User)</th>
                  <th>Perihal Banding</th>
                  <th>Status Progress</th>
                  <th>Keputusan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={item.id_banding}>
                      <td>{index + 1}</td>
                      <td>{formatDate(item.tanggal_ajukan)}</td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{item.user?.username || 'User'}</span>
                          <span className="text-xs text-gray-500">{item.user?.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="max-w-xs truncate" title={item.keterangan_banding}>
                          <span className="font-mono text-xs block text-gray-500 mb-1">{item.no_pendaftaran}</span>
                          {item.keterangan_banding}
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status_progress)}`}>
                          {item.status_progress?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>{getKeputusanBadge(item.keputusan)}</td>
                      <td>
                        <button 
                          className="btn-icon view" 
                          onClick={() => handleDetailClick(item)}
                          title="Proses Banding"
                        >
                          <Gavel size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      Tidak ada data banding ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PROSES BANDING */}
      {showModal && selectedItem && (
        <div className="modal-backdrop">
          <div className="modal-card wide-modal">
            <div className="modal-header-modern">
              <h3><Gavel size={20} className="inline mr-2"/> Proses Banding Asesmen</h3>
              <button onClick={() => setShowModal(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleUpdate} className="modal-body-scroll">
              
              {/* INFO DETAIL */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <FileText size={16} className="mr-2"/> Detail Pengajuan
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-500 text-xs">No Pendaftaran</label>
                    <p className="font-medium">{selectedItem.no_pendaftaran}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs">Tanggal Ajukan</label>
                    <p className="font-medium">{formatDate(selectedItem.tanggal_ajukan)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-500 text-xs">Keterangan / Alasan Banding</label>
                    <div className="bg-white p-3 border rounded mt-1 text-gray-700">
                      {selectedItem.keterangan_banding}
                    </div>
                  </div>
                  
                  {/* Tampilkan Bukti jika ada */}
                  {selectedItem.file_bukti && (
                    <div className="col-span-2 mt-2">
                      <label className="text-gray-500 text-xs">File Bukti</label>
                      <a 
                        href={`http://localhost:3000/uploads/${selectedItem.file_bukti}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <Eye size={14}/> Lihat Bukti Pendukung
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* FORM UPDATE */}
              <div className="status-update-section">
                <h4 className="section-title text-orange-600 mb-4">Update Status & Keputusan</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Status Progress</label>
                    <select 
                      value={formUpdate.status_progress}
                      onChange={(e) => setFormUpdate(p => ({...p, status_progress: e.target.value}))}
                    >
                      <option value="diterima_admin">Diterima Admin</option>
                      <option value="on_review">Sedang Direview Pleno</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Keputusan Akhir</label>
                    <select 
                      value={formUpdate.keputusan}
                      onChange={(e) => setFormUpdate(p => ({...p, keputusan: e.target.value}))}
                      className={formUpdate.keputusan === 'diterima' ? 'border-green-500 text-green-700 font-bold' : formUpdate.keputusan === 'ditolak' ? 'border-red-500 text-red-700 font-bold' : ''}
                    >
                      <option value="belum_diputus">Belum Diputus</option>
                      <option value="diterima">Banding Diterima (Kompeten)</option>
                      <option value="ditolak">Banding Ditolak (Tetap BK)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group mt-4">
                  <label>Catatan Komite / Hasil Pleno</label>
                  <textarea 
                    rows="4" 
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none"
                    placeholder="Masukkan catatan hasil rapat pleno komite..."
                    value={formUpdate.catatan_komite}
                    onChange={(e) => setFormUpdate(p => ({...p, catatan_komite: e.target.value}))}
                  ></textarea>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer-modern mt-6">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn-primary">
                  <Save size={16} className="mr-2"/> Simpan Keputusan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banding;
import { LayoutGrid, List, Search, Filter, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';

// Slot component
function SlotCard({ slot, onSlotClick }) {
  const statusStyles = {
    available: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', color: '#10b981' },
    occupied: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' },
    reserved: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' },
    maintenance: { bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.3)', color: '#94a3b8' }
  };
  
  const s = statusStyles[slot.status] || statusStyles.available;

  return (
    <div
      onClick={() => onSlotClick(slot)}
      style={{
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        height: '100px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{slot.slotCode}</span>
      {slot.vehicle ? (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
          {slot.vehicle}
        </span>
      ) : (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, textTransform: 'capitalize' }}>
          {slot.status === 'available' ? 'Trống' : slot.status === 'occupied' ? 'Có xe' : slot.status === 'maintenance' ? 'Bảo trì' : 'Đã đặt'}
        </span>
      )}
    </div>
  );
}

export default function SlotManagement() {
  const [zonesData, setZonesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [filterFloor, setFilterFloor] = useState('Tất cả tầng');
  const [filterType, setFilterType] = useState('Tất cả loại xe');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesRes, slotsRes, bookingsRes] = await Promise.all([
        api.get('/api/v1/zones'),
        api.get('/api/v1/parking-slots'),
        api.get('/api/v1/bookings').catch(() => ({ data: { data: [] } }))
      ]);
      const zones = zonesRes.data.data || zonesRes.data || [];
      const slots = slotsRes.data.data || slotsRes.data || [];
      const bookings = bookingsRes.data?.data ?? bookingsRes.data ?? [];

      // Lấy danh sách slotCode có đặt chỗ active (PENDING hoặc CONFIRMED)
      const bookedSlotCodes = new Set(
        bookings
          .filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED')
          .map(b => b.slotCode)
          .filter(Boolean)
      );

      const mappedZones = zones.map(z => {
        const zoneSlots = slots.filter(s => s.zoneId === z.id).map(s => {
          const isOccupied = !!s.currentSessionId;
          const isMaintenance = s.maintenanceStatus === 'MAINTENANCE';
          const isReserved = !isOccupied && !isMaintenance && bookedSlotCodes.has(s.slotCode);
          
          return {
            ...s,
            status: isMaintenance ? 'maintenance' : (isOccupied ? 'occupied' : (isReserved ? 'reserved' : 'available')),
            vehicle: s.licensePlate || null,
          };
        });
        return { ...z, slots: zoneSlots };
      });
      setZonesData(mappedZones);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statusCounts = useMemo(() => {
    let available = 0, occupied = 0, reserved = 0, maintenance = 0;
    zonesData.forEach(z => {
      z.slots.forEach(s => {
        if (s.status === 'available') available++;
        else if (s.status === 'occupied') occupied++;
        else if (s.status === 'reserved') reserved++;
        else if (s.status === 'maintenance') maintenance++;
      });
    });
    return { available, occupied, reserved, maintenance };
  }, [zonesData]);

  const stats = [
    { label: 'Trống', value: statusCounts.available, color: '#10b981', icon: CheckCircle2 },
    { label: 'Đang đỗ', value: statusCounts.occupied, color: '#ef4444', icon: CarFront },
    { label: 'Đã đặt', value: statusCounts.reserved, color: '#8b5cf6', icon: Clock },
    { label: 'Bảo trì', value: statusCounts.maintenance, color: '#94a3b8', icon: AlertTriangle },
  ];

  function CarFront({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 17 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7l2 2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11h14"/></svg>; }
  function Clock({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; }

  const filteredZones = useMemo(() => {
    return zonesData.map(z => {
      if (filterFloor !== 'Tất cả tầng' && z.floorName !== filterFloor) return null;
      
      const typeMap = {
        'Ô tô': 'CAR',
        'Xe máy': 'MOTORBIKE',
        'Xe tải': 'TRUCK'
      };
      if (filterType !== 'Tất cả loại xe' && z.vehicleType !== typeMap[filterType]) return null;

      const filteredSlots = z.slots.filter(s => {
        if (search) {
          const q = search.toLowerCase();
          return s.slotCode.toLowerCase().includes(q) || (s.vehicle && s.vehicle.toLowerCase().includes(q));
        }
        return true;
      });

      if (filteredSlots.length === 0 && search) return null;
      return { ...z, slots: filteredSlots };
    }).filter(Boolean);
  }, [zonesData, search, filterFloor, filterType]);

  const uniqueFloors = [...new Set(zonesData.map(z => z.floorName))];

  const handleSlotClick = (zone, slot) => {
    setSelectedSlot({ ...slot, zoneId: zone.id, zoneName: zone.name, floor: zone.floorName });
    setShowStatusModal(true);
  };

  const handleStatusChange = async (newStatus) => {
    if (selectedSlot.status === 'occupied' && newStatus !== 'occupied') {
      alert("Không thể chuyển trạng thái chỗ đang có xe. Phải cho xe ra trước.");
      return;
    }
    
    try {
      const maintenanceStatus = newStatus === 'maintenance' ? 'MAINTENANCE' : 'AVAILABLE';
      await api.patch(`/api/v1/parking-slots/${selectedSlot.id}/maintenance-status?maintenanceStatus=${maintenanceStatus}`);
      setShowStatusModal(false);
      loadData(); // reload
    } catch (err) {
      console.error(err);
      alert("Cập nhật thất bại");
    }
  };

  const selectStyle = {
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border-color)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    fontFamily: 'inherit',
    outline: 'none',
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className="page-full-width">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h2>Giám sát Chỗ đỗ</h2>
        <p>Theo dõi và quản lý chỗ đỗ xe tại các khu vực theo thời gian thực</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="stat-card-header">
                <span className="stat-card-label">{s.label}</span>
                <Icon size={20} className="stat-card-icon" style={{ color: s.color }} />
              </div>
              <div className="stat-card-value">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div className="form-input-wrapper" style={{ flex: 1 }}>
            <Search className="input-icon" size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm chỗ đỗ hoặc biển số..."
              style={{ padding: '10px 14px 10px 40px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select style={selectStyle} value={filterFloor} onChange={e => setFilterFloor(e.target.value)}>
            <option>Tất cả tầng</option>
            {uniqueFloors.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option>Tất cả loại xe</option>
            <option>Ô tô</option>
            <option>Xe máy</option>
            <option>Xe tải</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              background: viewMode === 'grid' ? 'var(--bg-card-hover)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LayoutGrid size={16} /> Lưới
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              background: viewMode === 'list' ? 'var(--bg-card-hover)' : 'transparent',
              color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <List size={16} /> Danh sách
          </button>
        </div>
      </div>

      {filteredZones.map(zone => {
        const zoneStats = {
          available: zone.slots.filter(s => s.status === 'available').length,
          occupied: zone.slots.filter(s => s.status === 'occupied').length,
          reserved: zone.slots.filter(s => s.status === 'reserved').length,
          maintenance: zone.slots.filter(s => s.status === 'maintenance').length,
        };

        return (
          <div key={zone.id} style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {zone.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {zone.floorName} • Sức chứa: {zone.slots.length} slots
                  {' • '}<span style={{ color: '#10b981', fontWeight: 600 }}>{zoneStats.available} trống</span>
                  {' • '}<span style={{ color: '#ef4444', fontWeight: 600 }}>{zoneStats.occupied} đang đỗ</span>
                  {' • '}<span style={{ color: '#8b5cf6', fontWeight: 600 }}>{zoneStats.reserved} đã đặt</span>
                  {zoneStats.maintenance > 0 && (
                    <>
                      {' • '}<span style={{ color: '#94a3b8', fontWeight: 600 }}>{zoneStats.maintenance} bảo trì</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '12px',
              }}>
              {zone.slots.map(slot => (
                <SlotCard key={slot.id} slot={slot} onSlotClick={(s) => handleSlotClick(zone, s)} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Mã chỗ đỗ</th>
                    <th>Trạng thái</th>
                    <th>Biển số xe</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {zone.slots.map(slot => (
                    <tr key={slot.id}>
                      <td style={{ fontWeight: 600 }}>{slot.slotCode}</td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          textTransform: 'capitalize',
                          background: slot.status === 'available' ? 'rgba(16,185,129,0.15)' : slot.status === 'occupied' ? 'rgba(239,68,68,0.15)' : slot.status === 'reserved' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                          color: slot.status === 'available' ? '#10b981' : slot.status === 'occupied' ? '#ef4444' : slot.status === 'reserved' ? '#f59e0b' : '#94a3b8',
                        }}>
                          {slot.status === 'available' ? 'Trống' : slot.status === 'occupied' ? 'Có xe' : slot.status === 'maintenance' ? 'Bảo trì' : 'Đã đặt'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{slot.vehicle || '—'}</td>
                      <td>
                        <button className="btn-sm btn-sm-primary" onClick={() => handleSlotClick(zone, slot)}>
                          Cập nhật
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        );
      })}
      
      {filteredZones.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <h3>Không tìm thấy chỗ đỗ</h3>
          <p>Thử điều chỉnh lại bộ lọc tìm kiếm.</p>
        </div>
      )}

      {showStatusModal && selectedSlot && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Cập nhật chỗ {selectedSlot.slotCode}</h3>
              <button onClick={() => setShowStatusModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Khu vực</span>
                <span style={{ fontWeight: 600 }}>{selectedSlot.zoneName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tầng</span>
                <span style={{ fontWeight: 600 }}>{selectedSlot.floor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Trạng thái hiện tại</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {selectedSlot.status === 'available' ? 'Trống' : selectedSlot.status === 'occupied' ? 'Có xe' : selectedSlot.status === 'maintenance' ? 'Bảo trì' : 'Đã đặt'}
                </span>
              </div>
              {selectedSlot.vehicle && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Biển số xe</span>
                  <span style={{ fontWeight: 600 }}>{selectedSlot.vehicle}</span>
                </div>
              )}
            </div>

            <h4 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Chuyển sang trạng thái:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <button 
                onClick={() => handleStatusChange('available')}
                disabled={selectedSlot.status === 'occupied'}
                style={{
                  padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#10b981', fontWeight: 600, cursor: selectedSlot.status === 'occupied' ? 'not-allowed' : 'pointer', opacity: selectedSlot.status === 'occupied' ? 0.5 : 1
                }}
              >
                Trống
              </button>
              <button 
                onClick={() => handleStatusChange('maintenance')}
                disabled={selectedSlot.status === 'occupied'}
                style={{
                  padding: '12px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: 'var(--radius-md)', color: '#94a3b8', fontWeight: 600, cursor: selectedSlot.status === 'occupied' ? 'not-allowed' : 'pointer', opacity: selectedSlot.status === 'occupied' ? 0.5 : 1
                }}
              >
                Bảo trì
              </button>
            </div>
            
            {selectedSlot.status === 'occupied' && (
              <div style={{ display: 'flex', gap: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <Info size={16} />
                <span>Chỗ đang có xe chỉ có thể được làm trống thông qua luồng "Cho xe ra".</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

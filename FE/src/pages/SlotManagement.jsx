import { LayoutGrid, List, Search, Filter, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useParkingStore } from '../store/parkingStore';

// Slot component
function SlotCard({ slot, onSlotClick }) {
  const statusStyles = {
    available: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', color: '#10b981' },
    occupied: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' },
    reserved: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' },
    maintenance: { bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.3)', color: '#94a3b8' }
  };
  
  const s = statusStyles[slot.status];

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
      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{slot.id}</span>
      {slot.vehicle ? (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
          {slot.vehicle}
        </span>
      ) : (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, textTransform: 'capitalize' }}>
          {slot.status}
        </span>
      )}
    </div>
  );
}

export default function SlotManagement() {
  const store = useParkingStore();
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [filterFloor, setFilterFloor] = useState('All Floors');
  const [filterType, setFilterType] = useState('All Types');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Status counters from live data
  const statusCounts = useMemo(() => {
    let available = 0, occupied = 0, reserved = 0, maintenance = 0;
    store.zones.forEach(z => {
      z.slots.forEach(s => {
        if (s.status === 'available') available++;
        else if (s.status === 'occupied') occupied++;
        else if (s.status === 'reserved') reserved++;
        else if (s.status === 'maintenance') maintenance++;
      });
    });
    return { available, occupied, reserved, maintenance };
  }, [store.zones]);

  const stats = [
    { label: 'Available', value: statusCounts.available, color: '#10b981', icon: CheckCircle2 },
    { label: 'Occupied', value: statusCounts.occupied, color: '#ef4444', icon: CarFront },
    { label: 'Reserved', value: statusCounts.reserved, color: '#f59e0b', icon: Clock },
    { label: 'Maintenance', value: statusCounts.maintenance, color: '#94a3b8', icon: AlertTriangle },
  ];

  // Component local icons for stats
  function CarFront({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 17 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7l2 2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11h14"/></svg>; }
  function Clock({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>; }

  // Filter logic
  const filteredZones = useMemo(() => {
    return store.zones.map(z => {
      // Filter out zones entirely if floor/type don't match
      if (filterFloor !== 'All Floors' && z.floor !== filterFloor) return null;
      if (filterType !== 'All Types' && z.vehicleType !== (filterType === 'Cars' ? 'Car' : filterType === 'Motorbikes' ? 'Motorbike' : 'Bicycle')) return null;

      // Filter slots within the zone based on search
      const filteredSlots = z.slots.filter(s => {
        if (search) {
          const q = search.toLowerCase();
          return s.id.toLowerCase().includes(q) || (s.vehicle && s.vehicle.toLowerCase().includes(q));
        }
        return true;
      });

      if (filteredSlots.length === 0 && search) return null; // Hide zone if no slots match search

      return { ...z, slots: filteredSlots };
    }).filter(Boolean);
  }, [store.zones, search, filterFloor, filterType]);

  const handleSlotClick = (zone, slot) => {
    setSelectedSlot({ ...slot, zoneId: zone.id, zoneName: zone.name, floor: zone.floor });
    setShowStatusModal(true);
  };

  const handleStatusChange = (newStatus) => {
    if (selectedSlot.status === 'occupied' && newStatus !== 'occupied') {
      store.showToast("Cannot manually clear occupied slot. Must process exit.", "error");
      return;
    }
    
    store.updateSlotStatus(selectedSlot.zoneId, selectedSlot.id, newStatus);
    setShowStatusModal(false);
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

  return (
    <div className="page-full-width">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h2>Slot Management</h2>
        <p>Monitor and manage parking slots across all zones</p>
      </div>

      {/* Stats Overview */}
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

      {/* Controls Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div className="form-input-wrapper" style={{ flex: 1 }}>
            <Search className="input-icon" size={18} />
            <input
              type="text"
              className="form-input"
              placeholder="Search slot ID or license plate..."
              style={{ padding: '10px 14px 10px 40px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select style={selectStyle} value={filterFloor} onChange={e => setFilterFloor(e.target.value)}>
            <option>All Floors</option>
            <option>Basement 1</option>
            <option>Basement 2</option>
            <option>Floor 1</option>
            <option>Floor 2</option>
          </select>
          <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option>All Types</option>
            <option>Cars</option>
            <option>Motorbikes</option>
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
            <LayoutGrid size={16} /> Grid
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
            <List size={16} /> List
          </button>
        </div>
      </div>

      {/* Slots Display */}
      {filteredZones.map(zone => (
        <div key={zone.id} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {zone.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {zone.floor} • Capacity: {zone.slots.length} / {zone.total}
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
                    <th>Slot ID</th>
                    <th>Status</th>
                    <th>Vehicle</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {zone.slots.map(slot => (
                    <tr key={slot.id}>
                      <td style={{ fontWeight: 600 }}>{slot.id}</td>
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
                          {slot.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{slot.vehicle || '—'}</td>
                      <td>
                        <button className="btn-sm btn-sm-primary" onClick={() => handleSlotClick(zone, slot)}>
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      
      {filteredZones.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <h3>No slots found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedSlot && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Update Slot {selectedSlot.id}</h3>
              <button onClick={() => setShowStatusModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Zone</span>
                <span style={{ fontWeight: 600 }}>{selectedSlot.zoneName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Floor</span>
                <span style={{ fontWeight: 600 }}>{selectedSlot.floor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Status</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedSlot.status}</span>
              </div>
              {selectedSlot.vehicle && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vehicle</span>
                  <span style={{ fontWeight: 600 }}>{selectedSlot.vehicle}</span>
                </div>
              )}
            </div>

            <h4 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Set New Status:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <button 
                onClick={() => handleStatusChange('available')}
                disabled={selectedSlot.status === 'occupied'}
                style={{
                  padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#10b981', fontWeight: 600, cursor: selectedSlot.status === 'occupied' ? 'not-allowed' : 'pointer', opacity: selectedSlot.status === 'occupied' ? 0.5 : 1
                }}
              >
                Available
              </button>
              <button 
                onClick={() => handleStatusChange('reserved')}
                disabled={selectedSlot.status === 'occupied'}
                style={{
                  padding: '12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', color: '#f59e0b', fontWeight: 600, cursor: selectedSlot.status === 'occupied' ? 'not-allowed' : 'pointer', opacity: selectedSlot.status === 'occupied' ? 0.5 : 1
                }}
              >
                Reserved
              </button>
              <button 
                onClick={() => handleStatusChange('maintenance')}
                disabled={selectedSlot.status === 'occupied'}
                style={{
                  padding: '12px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: 'var(--radius-md)', color: '#94a3b8', fontWeight: 600, cursor: selectedSlot.status === 'occupied' ? 'not-allowed' : 'pointer', opacity: selectedSlot.status === 'occupied' ? 0.5 : 1
                }}
              >
                Maintenance
              </button>
            </div>
            
            {selectedSlot.status === 'occupied' && (
              <div style={{ display: 'flex', gap: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <Info size={16} />
                <span>Occupied slots must be cleared via the Vehicle Exit process.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

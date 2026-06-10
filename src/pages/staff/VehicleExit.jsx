import { LogOut, Search, MapPin, Clock, DollarSign, CheckCircle, Printer, RotateCcw } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useParkingStore } from '../../store/parkingStore';

// Helper function to calculate duration between two dates
const calculateDuration = (entryDate, currentDate = new Date()) => {
  const entry = entryDate instanceof Date ? entryDate : new Date(entryDate);
  const diffMs = currentDate - entry;
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hours === 0) {
    return { display: `${mins} min`, total: mins };
  } else if (mins === 0) {
    return { display: `${hours} hr`, total: hours * 60 };
  } else {
    return { display: `${hours} hr ${mins} min`, total: diffMins };
  }
};

// Statistics component
function Statistics({ vehicles, exitedVehicles }) {
  const overstayCount = vehicles.filter(v => v.overstay).length;
  const withFaceData = vehicles.filter(v => v.faceRegistered).length;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '22px',
    }}>
      <h3 style={{
        fontSize: '1.05rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '20px',
      }}>Today's Statistics</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Vehicles Exited</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{exitedVehicles.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Currently Parked</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{vehicles.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>With Face Data</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{withFaceData}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Overstay</span>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'white',
            background: '#ef4444',
            padding: '4px 12px',
            borderRadius: '4px',
            minWidth: '28px',
            textAlign: 'center',
          }}>{overstayCount}</span>
        </div>
      </div>
    </div>
  );
}

// Instructions component
function Instructions() {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '22px',
      marginTop: '20px',
    }}>
      <h3 style={{
        fontSize: '1.05rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '16px',
      }}>Instructions</h3>
      
      <ol style={{
        listStyle: 'none',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <li style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>1. Enter license plate or select from list</span>
        </li>
        <li style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>2. Verify identity (if face registered)</span>
        </li>
        <li style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>3. Review information and parking fee</span>
        </li>
        <li style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>4. Collect payment and confirm</span>
        </li>
      </ol>
    </div>
  );
}

// Lost ticket card
function LostTicketCard() {
  return (
    <div style={{
      border: '2px solid rgba(255, 165, 0, 0.3)',
      borderRadius: 'var(--radius-lg)',
      padding: '22px',
      marginTop: '20px',
      background: 'rgba(255, 165, 0, 0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '1.2rem' }}>🎫</span>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Lost Ticket</h4>
      </div>
      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        For lost tickets, a surcharge of ₫50,000 applies. If the vehicle owner registered their face during entry, they can verify their identity to waive the surcharge.
      </p>
    </div>
  );
}

// Vehicle list item
function VehicleListItem({ vehicle, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(vehicle)}
      style={{
        padding: '18px',
        borderBottom: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'var(--accent-primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '1.2rem',
          }}>
            {vehicle.type === 'Car' ? '🚗' : vehicle.type === 'Truck' ? '🚚' : '🏍️'}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {vehicle.plate}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {vehicle.slot} - Entered at {vehicle.entryTime instanceof Date ? vehicle.entryTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : vehicle.entryTime}
            </p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{vehicle.type}</span>
              <span>•</span>
              <span>{vehicle.duration.display}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textAlign: 'right',
          }}>
            {vehicle.duration.display}
          </span>
          {vehicle.hasPass && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#00c8c8',
              background: 'rgba(0, 200, 200, 0.12)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(0, 200, 200, 0.3)',
            }}>
              Monthly Pass
            </span>
          )}
          {vehicle.overstay && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#ff6b6b',
              background: 'rgba(255, 107, 107, 0.12)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 107, 107, 0.3)',
            }}>
              Overstay
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehicleExit() {
  const store = useParkingStore();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isLostTicket, setIsLostTicket] = useState(false);
  const [lostTicketQuery, setLostTicketQuery] = useState('');
  const [isLostTicketPayment, setIsLostTicketPayment] = useState(false);
  const [timeRefresh, setTimeRefresh] = useState(0);
  const [showMonthlyPassMessage, setShowMonthlyPassMessage] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Update time every second to refresh duration display
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Map store vehicles and add duration
  const parkedVehicles = useMemo(() => {
    return store.vehicles.map(v => ({
      ...v,
      duration: calculateDuration(v.entryTime, new Date())
    }));
  }, [store.vehicles, timeRefresh]);

  // Update selectedVehicle with latest duration information
  useEffect(() => {
    if (selectedVehicle) {
      const updatedVehicle = parkedVehicles.find(v => v.plate === selectedVehicle.plate);
      if (updatedVehicle) {
        setSelectedVehicle(updatedVehicle);
      }
    }
  }, [timeRefresh, parkedVehicles]);

  const handleVehicleSelect = (vehicle) => {
    const vehicleWithDuration = parkedVehicles.find(v => v.plate === vehicle.plate);
    
    // Check if vehicle has monthly pass
    if (vehicleWithDuration.hasPass || store.passes.some(p => p.plate.toLowerCase() === vehicleWithDuration.plate.toLowerCase() && p.status === 'Active')) {
      setSelectedVehicle(vehicleWithDuration);
      setShowMonthlyPassMessage(true);
      return;
    }
    
    setSelectedVehicle(vehicleWithDuration);
    setStep(3);
  };

  const handleSearch = () => {
    const found = parkedVehicles.find(v => v.plate.toLowerCase().includes(searchQuery.toLowerCase()));
    if (found) {
      handleVehicleSelect(found);
    } else {
      store.showToast(`Vehicle ${searchQuery} not found`);
    }
  };

  const currentFee = selectedVehicle ? store.calculateFee(selectedVehicle) : 0;
  const overstayPenalty = selectedVehicle ? store.getOverstayPenalty(selectedVehicle) : 0;
  const lostTicketSurcharge = isLostTicketPayment ? 50000 : 0;
  const totalAmount = currentFee + overstayPenalty + lostTicketSurcharge;

  const handleProcessPayment = () => {
    if (isLostTicketPayment) {
      store.addException({
        type: 'Lost Ticket',
        desc: `Processed exit with lost ticket for ${selectedVehicle.plate}`,
        surcharge: 50000,
        plate: selectedVehicle.plate
      });
    }

    const result = store.exitVehicle(selectedVehicle.plate, totalAmount, isLostTicketPayment);
    if (result.success) {
      setReceipt(result.receipt);
      setStep(4);
    } else {
      store.showToast(result.error);
    }
  };

  const handleProcessNext = () => {
    setStep(1);
    setSelectedVehicle(null);
    setSearchQuery('');
    setIsLostTicketPayment(false);
    setShowMonthlyPassMessage(false);
    setReceipt(null);
  };

  const handlePassProcessNext = () => {
    const result = store.exitVehicle(selectedVehicle.plate, 0, false);
    if (result.success) {
      handleProcessNext();
    } else {
      store.showToast(result.error);
    }
  };

  const handleReportLostTicket = () => {
    setIsLostTicket(true);
    setLostTicketQuery('');
  };

  const handleBackToNormalExit = () => {
    setIsLostTicket(false);
    setStep(1);
    setSelectedVehicle(null);
    setSearchQuery('');
    setLostTicketQuery('');
    setIsLostTicketPayment(false);
    setShowMonthlyPassMessage(false);
  };

  const handleLostTicketSearch = () => {
    const found = parkedVehicles.find(v => v.plate.toLowerCase().includes(lostTicketQuery.toLowerCase()));
    if (found) {
      // Check if vehicle has monthly pass
      if (found.hasPass || store.passes.some(p => p.plate.toLowerCase() === found.plate.toLowerCase() && p.status === 'Active')) {
        setSelectedVehicle(found);
        setShowMonthlyPassMessage(true);
        setIsLostTicket(false);
        return;
      }
      
      setSelectedVehicle(found);
      setIsLostTicketPayment(true);
      setStep(3);
      setIsLostTicket(false);
    } else {
      store.showToast(`Vehicle ${lostTicketQuery} not found`);
    }
  };

  return (
    <>
      <div>
        {/* Monthly Pass Message */}
        {showMonthlyPassMessage && selectedVehicle && (
          <>
            <div className="page-header">
              <h2>Monthly Pass Holder</h2>
              <p>No payment required</p>
            </div>
            <div className="card animate-slide-up">
              {/* Success Icon */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(0, 200, 200, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '3rem' }}>🎫</span>
                </div>
              </div>

              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                textAlign: 'center',
                marginBottom: '12px',
              }}>
                {selectedVehicle.plate}
              </h3>

              <p style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginBottom: '28px',
                lineHeight: '1.6',
              }}>
                {selectedVehicle.owner}
              </p>

              {/* Message Card */}
              <div style={{
                padding: '20px',
                background: 'rgba(0, 200, 200, 0.08)',
                border: '1.5px solid rgba(0, 200, 200, 0.3)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#00c8c8',
                  margin: '0 0 8px 0',
                }}>
                  ✓ Monthly Pass Active
                </h4>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: '1.6',
                }}>
                  This vehicle has a valid Monthly Pass. No parking fee is required. Vehicle can proceed.
                </p>
              </div>

              {/* Vehicle Details */}
              <div style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>License Plate</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedVehicle.plate}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Parking Location</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedVehicle.slot}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Parking Duration</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedVehicle.duration.display}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowMonthlyPassMessage(false);
                    setSelectedVehicle(null);
                    setStep(1);
                  }}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handlePassProcessNext}
                  style={{ flex: 1, background: 'var(--accent-gradient)' }}
                >
                  <RotateCcw size={18} />
                  <span>Process Exit</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Normal Flow */}
        {!showMonthlyPassMessage && (
          <>
        {/* Lost Ticket Flow */}
        {isLostTicket && (
          <>
            <div className="page-header">
              <h2>🎫 Lost Ticket - Find Vehicle</h2>
              <p>Enter the vehicle license plate to verify ownership</p>
            </div>
            <div className="card animate-slide-up">
              {/* Warning Note */}
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 165, 0, 0.15)',
                border: '1px solid rgba(255, 165, 0, 0.4)',
                marginBottom: '24px',
                display: 'flex',
                gap: '12px',
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
                <div>
                  <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: '0 0 4px 0',
                  }}>Note:</h4>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: '1.5',
                  }}>
                    A surcharge of ₫50,000 will be applied for lost tickets. If face verification is successful, the surcharge will be waived.
                  </p>
                </div>
              </div>

              {/* License Plate Input */}
              <div className="form-group">
                <label className="form-label">License Plate Number <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                <div className="form-input-wrapper">
                  <Search className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter license plate (e.g., 30A-123.45)"
                    value={lostTicketQuery}
                    onChange={(e) => setLostTicketQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLostTicketSearch()}
                  />
                </div>
              </div>

              {/* Search Button */}
              <button 
                className="btn-primary"
                onClick={handleLostTicketSearch}
                disabled={!lostTicketQuery.trim()}
                style={{
                  opacity: !lostTicketQuery.trim() ? 0.45 : 1,
                  cursor: !lostTicketQuery.trim() ? 'not-allowed' : 'pointer',
                  pointerEvents: !lostTicketQuery.trim() ? 'none' : 'auto',
                  marginBottom: '20px',
                }}
              >
                <Search size={18} />
                <span>Find</span>
              </button>

              {/* Back Link */}
              <button
                onClick={handleBackToNormalExit}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                Back to Normal Exit
              </button>
            </div>
          </>
        )}

        {/* Normal Exit Flow */}
        {!isLostTicket && (
          <>
        {/* Step 1: Find Vehicle */}
        {step === 1 && (
          <>
            <div className="page-header">
              <h2>Step 1: Find Vehicle</h2>
              <p>Enter license plate or select from list</p>
            </div>
            <div className="card animate-slide-up">
              <h3 style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <Search size={20} style={{ color: 'var(--accent-primary)' }} />
                Search
              </h3>
              <div className="form-group">
                <label className="form-label">Enter license plate (e.g., 30A-123.45)</label>
                <div className="form-input-wrapper">
                  <Search className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter license plate (e.g., 30A-123.45)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <button 
                className="btn-primary"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                style={{
                  opacity: !searchQuery.trim() ? 0.45 : 1,
                  cursor: !searchQuery.trim() ? 'not-allowed' : 'pointer',
                  pointerEvents: !searchQuery.trim() ? 'none' : 'auto',
                }}
              >
                <Search size={18} />
                <span>Search</span>
              </button>

              {/* Lost Ticket Alert */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 165, 0, 0.08)',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🎫</span>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Lost Ticket?</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Use face verification or pay surcharge</p>
                  </div>
                </div>
                <button 
                  onClick={handleReportLostTicket}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 165, 0, 0.5)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 165, 0, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255, 165, 0, 0.5)';
                  }}
                >
                  Report Lost Ticket
                </button>
              </div>

              {/* Parked Vehicles List */}
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '28px',
                marginBottom: '12px',
              }}>
                Or select from parked vehicles ({parkedVehicles.length})
              </h3>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}>
                {parkedVehicles.map((vehicle, idx) => (
                  <VehicleListItem
                    key={idx}
                    vehicle={vehicle}
                    onSelect={handleVehicleSelect}
                  />
                ))}
                {parkedVehicles.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No vehicles currently parked
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Payment */}
        {step === 3 && selectedVehicle && (
          <>
            <div className="page-header">
              <h2>{isLostTicketPayment ? 'Lost Ticket - Payment' : 'Step 2: Payment'}</h2>
              <p>Confirm information and collect fee</p>
            </div>
            <div className="card animate-slide-up">
              {/* Lost Ticket Warning */}
              {isLostTicketPayment && (
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 165, 0, 0.15)',
                  border: '1px solid rgba(255, 165, 0, 0.4)',
                  marginBottom: '24px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🎫</span>
                  <div>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#ffa500',
                      margin: '0 0 2px 0',
                    }}>Lost Ticket</h4>
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#ffa500',
                      margin: 0,
                    }}>
                      Surcharge of ₫50,000 applied
                    </p>
                  </div>
                </div>
              )}

              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <DollarSign size={24} style={{ color: 'var(--accent-primary)' }} />
                {selectedVehicle.plate}
              </h3>

              <h4 style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>Vehicle Owner</h4>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '20px',
              }}>
                {selectedVehicle.owner || 'Unknown'}
              </p>

              {/* Vehicle Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '24px',
              }}>
                <div>
                  <h5 style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>Parking Location</h5>
                  <p style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}>
                    {selectedVehicle.slot}
                  </p>
                </div>
                <div>
                  <h5 style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>Ticket Type</h5>
                  <p style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textTransform: 'capitalize',
                  }}>
                    {selectedVehicle.ticketType}
                  </p>
                </div>
                <div>
                  <h5 style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>Entry Time</h5>
                  <p style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}>
                    {selectedVehicle.entryTime instanceof Date ? selectedVehicle.entryTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : selectedVehicle.entryTime}
                  </p>
                </div>
                <div>
                  <h5 style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>Exit Time</h5>
                  <p style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}>
                    {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <Clock size={20} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <h5 style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>Parking Duration</h5>
                  <p style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>
                    {selectedVehicle.duration.display}
                  </p>
                </div>
              </div>

              {/* Overstay Warning */}
              {selectedVehicle.overstay && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '24px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '2px' }}>⚠️</span>
                  <div>
                    <h5 style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#ef4444',
                      margin: '0 0 2px 0',
                    }}>Overstay Penalty</h5>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#ef4444',
                      margin: 0,
                      lineHeight: '1.4',
                    }}>
                      Vehicle has exceeded the maximum allowed parking duration. A penalty of ₫{overstayPenalty.toLocaleString()} will be applied.
                    </p>
                  </div>
                </div>
              )}

              {/* Total Fee */}
              <div style={{
                padding: '20px',
                background: 'transparent',
                border: '1.5px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Parking Fee</span>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>₫{currentFee.toLocaleString()}</span>
                </div>
                {isLostTicketPayment && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Lost Ticket Surcharge</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#ffa500' }}>₫50,000</span>
                  </div>
                )}
                {selectedVehicle.overstay && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Overstay Penalty</span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#ef4444' }}>₫{overstayPenalty.toLocaleString()}</span>
                  </div>
                )}
                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <h5 style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    margin: 0,
                  }}>Total Fee</h5>
                  <p style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'var(--accent-primary)',
                    margin: 0,
                  }}>
                    ₫{totalAmount.toLocaleString()}
                  </p>
                </div>
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  margin: '8px 0 0 0',
                  textAlign: 'right',
                }}>VAT included</p>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '24px',
              }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (isLostTicketPayment) {
                      setIsLostTicketPayment(false);
                      setIsLostTicket(true);
                    } else {
                      setStep(1);
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleProcessPayment}
                  style={{ flex: 1 }}
                >
                  <DollarSign size={18} />
                  <span>Process Payment</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Payment Success */}
        {step === 4 && receipt && (
          <>
            <div className="page-header">
              <h2>Payment Successful!</h2>
              <p>Thank you for using our service</p>
            </div>
            <div className="card animate-slide-up">
              {/* Success Icon */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'slideUp 0.6s ease',
                }}>
                  <CheckCircle size={48} style={{ color: 'var(--accent-primary)' }} />
                </div>
              </div>

              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                textAlign: 'center',
                marginBottom: '8px',
              }}>
                Payment Successful!
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginBottom: '28px',
              }}>
                Thank you for using our service
              </p>

              {/* Payment Receipt */}
              <div style={{
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🧾</span>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}>Payment Receipt</h4>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}>
                    #{Math.floor(Math.random() * 100000000)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>License Plate</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {receipt.plate}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Parking Duration</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {calculateDuration(receipt.entryTime, receipt.exitTime).display}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Payment Time</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {receipt.exitTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Amount</span>
                    <span style={{
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: 'var(--accent-primary)',
                    }}>
                      ₫{receipt.totalFee.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}>
                <button
                  className="btn-secondary"
                  style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}
                  onClick={() => store.showToast('Printing receipt...')}
                >
                  <Printer size={18} />
                  Print Receipt
                </button>
                <button
                  className="btn-primary"
                  onClick={handleProcessNext}
                  style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}
                >
                  <RotateCcw size={18} />
                  Process Next
                </button>
              </div>
            </div>
          </>
        )}
        </>
        )}
        </>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        <Statistics vehicles={store.vehicles} exitedVehicles={store.exitedVehicles} />
        <Instructions />
        <LostTicketCard />
      </div>
    </>
  );
}

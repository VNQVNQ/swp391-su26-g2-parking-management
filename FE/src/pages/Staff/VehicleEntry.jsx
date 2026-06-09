import { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  User,
  ChevronDown,
  ScanFace,
  CarFront,
  CheckCircle2,
  Camera,
  SkipForward,
  XCircle,
  AlertTriangle,
  MapPin,
  Clock,
  CreditCard,
  Car as CarLucide,
  Bike,
  Truck as TruckLucide,
  Plus,
} from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';

/* ========== VEHICLE TYPES ========== */
const vehicleTypesList = [
  { id: 'Motorbike', name: 'Motorbike', icon: 'motorbike' },
  { id: 'Car', name: 'Car', icon: 'car' },
  { id: 'Truck', name: 'Truck', icon: 'truck' },
];

/* ========== STEPS CONFIG ========== */
const steps = [
  { num: 1, label: 'Vehicle Info' },
  { num: 2, label: 'Face Registration' },
  { num: 3, label: 'Confirm' },
  { num: 4, label: 'Complete' },
];

/* ========== SVG ICONS ========== */
function MotorbikeIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M12 17h-7" />
      <path d="M19 17h-2l-3-6h-4l-1 3" />
      <path d="M17 11l-1-4h-2" />
      <path d="M9 7h4" />
    </svg>
  );
}

function CarIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M9 17h6" />
    </svg>
  );
}

function TruckIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

function SmallCarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function SmallBikeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M12 17h-7" />
      <path d="M19 17h-2l-3-6h-4l-1 3" />
    </svg>
  );
}

const getVehicleIcon = (type, size = 32) => {
  switch (type) {
    case 'motorbike': return <MotorbikeIcon size={size} />;
    case 'car': return <CarIcon size={size} />;
    case 'truck': return <TruckIcon size={size} />;
    default: return <CarIcon size={size} />;
  }
};

/* ========== HELPERS ========== */
function getSlotLocation(slot) {
  if (!slot) return 'Unknown';
  const prefix = slot.split('-')[0];
  const map = { A: 'Basement 1', B: 'Basement 1', C: 'Basement 2', D: 'Basement 2', E: 'Floor 1', F: 'Floor 1', G: 'Floor 2', H: 'Floor 2' };
  return map[prefix] || 'Floor 1';
}

/* ========== MAIN COMPONENT ========== */
export default function VehicleEntry() {
  const store = useParkingStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [ticketType, setTicketType] = useState('hourly');
  const [ownerName, setOwnerName] = useState('');
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [assignedSlot, setAssignedSlot] = useState('');
  const [assignedFloor, setAssignedFloor] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  /* Step 1 validation */
  const isStep1Valid = licensePlate.trim() !== '' && selectedVehicle !== '' && ownerName.trim() !== '';

  /* Navigate */
  const goToStep = (step) => {
    setErrorMsg('');
    setCurrentStep(step);
  };

  /* Camera helpers */
  const startCamera = async () => {
    try {
      setCameraError('');
      const constraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const errorMsg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : err.name === 'NotFoundError'
        ? 'No camera device found.'
        : `Camera error: ${err.message}`;
      setCameraError(errorMsg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (currentStep === 2) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentStep]);

  /* Handle confirm */
  const handleConfirm = () => {
    const result = store.registerVehicle({
      plate: licensePlate.trim(),
      type: selectedVehicle,
      owner: ownerName.trim(),
      ticketType,
      faceRegistered,
    });

    if (!result.success) {
      setErrorMsg(result.error);
      return;
    }

    setAssignedSlot(result.slot);
    setAssignedFloor(result.floor || getSlotLocation(result.slot));
    setEntryTime(new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true,
    }));
    goToStep(4);
  };

  /* Reset for new registration */
  const handleNewRegistration = () => {
    setCurrentStep(1);
    setLicensePlate('');
    setSelectedVehicle('');
    setTicketType('hourly');
    setOwnerName('');
    setFaceRegistered(false);
    setAssignedSlot('');
    setAssignedFloor('');
    setEntryTime('');
    setErrorMsg('');
  };

  /* ========== STEP RENDERERS ========== */
  const renderStep1 = () => (
    <div className="step-content animate-slide-up">
      <div className="step-title">
        <CarFront size={22} />
        <h3>Enter Vehicle Information</h3>
      </div>

      {/* License Plate */}
      <div className="form-group">
        <label className="form-label">
          License Plate <span className="required">*</span>
        </label>
        <div className="form-input-wrapper">
          <CarFront className="input-icon" />
          <input
            id="license-plate-input"
            type="text"
            className="form-input"
            placeholder="e.g. 79H-113.56"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
          />
        </div>
      </div>

      {/* Vehicle Type */}
      <div className="form-group">
        <label className="form-label">
          Vehicle Type <span className="required">*</span>
        </label>
        <div className="vehicle-type-grid">
          {vehicleTypesList.map((type) => (
            <div
              key={type.id}
              id={`vehicle-type-${type.id}`}
              className={`vehicle-type-card ${selectedVehicle === type.id ? 'selected' : ''}`}
              onClick={() => setSelectedVehicle(type.id)}
            >
              {getVehicleIcon(type.icon)}
              <span className="vehicle-name">{type.name}</span>
              <span className="vehicle-available">{store.getVehicleAvailability(type.id)} available</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Type */}
      <div className="form-group">
        <label className="form-label">
          Ticket Type <span className="required">*</span>
        </label>
        <div className="form-select-wrapper">
          <select
            id="ticket-type-select"
            className="form-select"
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value)}
          >
            <option value="hourly">Hourly Ticket (per hour)</option>
            <option value="daily">Daily Ticket (per day)</option>
          </select>
          <ChevronDown className="chevron" size={18} />
        </div>
      </div>

      {/* Owner Name */}
      <div className="form-group">
        <label className="form-label">
          Owner Name <span className="required">*</span>
        </label>
        <div className="form-input-wrapper">
          <User className="input-icon" />
          <input
            id="owner-name-input"
            type="text"
            className="form-input"
            placeholder="Enter owner name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>
      </div>

      {/* Continue */}
      <button
        id="btn-step1-continue"
        type="button"
        className={`btn-primary ${!isStep1Valid ? 'btn-disabled' : ''}`}
        disabled={!isStep1Valid}
        onClick={() => goToStep(2)}
      >
        <span>Continue</span>
        <ArrowRight size={20} />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content animate-slide-up">
      <div className="step-title">
        <ScanFace size={22} />
        <h3>Face Registration</h3>
      </div>
      <p className="step-desc">
        Face registration helps verify vehicle owner identity in case of lost ticket.
        The face data is securely stored and only used for verification purposes.
      </p>

      {cameraError && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="camera-container">
        <div className="camera-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width="400"
            height="300"
            className="camera-video"
          />
          <div className="camera-overlay">
            <div className="face-guide"></div>
          </div>
          {faceRegistered && (
            <div className="camera-success-badge">
              <CheckCircle2 size={18} />
              <span>Face Captured</span>
            </div>
          )}
        </div>
        <button
          id="btn-capture-face"
          type="button"
          className="btn-capture"
          onClick={() => setFaceRegistered(true)}
        >
          <Camera size={20} />
          <span>{faceRegistered ? 'Retake Photo' : 'Capture Face'}</span>
        </button>
      </div>

      <div className="step-actions">
        <button id="btn-step2-back" type="button" className="btn-secondary" onClick={() => goToStep(1)}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        {faceRegistered ? (
          <button id="btn-step2-continue" type="button" className="btn-primary" onClick={() => goToStep(3)}>
            <span>Continue</span>
            <ArrowRight size={20} />
          </button>
        ) : (
          <button id="btn-step2-skip" type="button" className="btn-secondary btn-skip" onClick={() => { setFaceRegistered(false); goToStep(3); }}>
            <span>Skip This Step</span>
            <SkipForward size={18} />
          </button>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content animate-slide-up">
      <div className="step-title">
        <CheckCircle2 size={22} />
        <h3>Confirm Information</h3>
      </div>
      <p className="step-desc">
        Please review the details below before confirming the vehicle entry.
      </p>

      {errorMsg && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="confirm-grid">
        <div className="confirm-item">
          <div className="confirm-icon"><CarFront size={18} /></div>
          <div>
            <span className="confirm-label">License Plate</span>
            <span className="confirm-value">{licensePlate}</span>
          </div>
        </div>
        <div className="confirm-item">
          <div className="confirm-icon">
            {selectedVehicle === 'Motorbike' ? <Bike size={18} /> : selectedVehicle === 'Truck' ? <TruckLucide size={18} /> : <CarLucide size={18} />}
          </div>
          <div>
            <span className="confirm-label">Vehicle Type</span>
            <span className="confirm-value">{selectedVehicle}</span>
          </div>
        </div>
        <div className="confirm-item">
          <div className="confirm-icon"><CreditCard size={18} /></div>
          <div>
            <span className="confirm-label">Ticket Type</span>
            <span className="confirm-value">{ticketType === 'hourly' ? 'Hourly Ticket' : 'Daily Ticket'}</span>
          </div>
        </div>
        <div className="confirm-item">
          <div className="confirm-icon"><MapPin size={18} /></div>
          <div>
            <span className="confirm-label">Assigned Slot</span>
            <span className="confirm-value">Auto-assigned on confirm</span>
          </div>
        </div>
        <div className="confirm-item">
          <div className="confirm-icon"><ScanFace size={18} /></div>
          <div>
            <span className="confirm-label">Face Registration</span>
            <span className={`confirm-value ${!faceRegistered ? 'not-registered' : ''}`}>
              {faceRegistered ? 'Registered' : 'Not registered'}
            </span>
          </div>
        </div>
        <div className="confirm-item">
          <div className="confirm-icon"><User size={18} /></div>
          <div>
            <span className="confirm-label">Owner Name</span>
            <span className="confirm-value">{ownerName}</span>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button id="btn-step3-back" type="button" className="btn-secondary" onClick={() => goToStep(2)}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <button id="btn-step3-confirm" type="button" className="btn-primary btn-confirm" onClick={handleConfirm}>
          <CheckCircle2 size={18} />
          <span>Confirm Entry</span>
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content animate-slide-up step-success">
      <div className="success-icon-container">
        <div className="success-ring"></div>
        <CheckCircle2 size={56} />
      </div>
      <h2 className="success-title">Registration Successful!</h2>
      <p className="success-subtitle">The vehicle has been registered and a parking slot has been assigned.</p>

      <div className="success-details">
        <div className="success-detail-row">
          <CarFront size={18} />
          <span className="detail-label">License Plate</span>
          <span className="detail-value">{licensePlate}</span>
        </div>
        <div className="success-detail-row">
          <MapPin size={18} />
          <span className="detail-label">Location</span>
          <span className="detail-value">{assignedFloor} — Slot {assignedSlot}</span>
        </div>
        <div className="success-detail-row">
          <Clock size={18} />
          <span className="detail-label">Entry Time</span>
          <span className="detail-value">{entryTime}</span>
        </div>
      </div>

      <button id="btn-new-registration" type="button" className="btn-primary" onClick={handleNewRegistration}>
        <Plus size={20} />
        <span>Register New Vehicle</span>
      </button>
    </div>
  );

  const stepRenderers = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4 };

  // Floor stats from shared store
  const floorData = store.getFloorStats;

  /* ========== RENDER ========== */
  return (
    <>
      {/* Left – Main Content */}
      <div>
        <div className="page-header">
          <h2>Vehicle Entry</h2>
          <p>Register a new vehicle entering the parking facility</p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {steps.map((step, i) => (
            <div key={step.num} className="stepper-item-wrapper">
              <div className={`stepper-item ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}>
                <div className="stepper-circle">
                  {currentStep > step.num ? <CheckCircle2 size={18} /> : <span>{step.num}</span>}
                </div>
                <span className="stepper-label">{step.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`stepper-line ${currentStep > step.num ? 'completed' : ''}`}></div>}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="step-container">
          {stepRenderers[currentStep]()}
        </div>
      </div>

      {/* Right – Sidebar */}
      <div className="right-sidebar">
        {/* Floor Status */}
        <div className="floor-status-card animate-slide-up">
          {floorData.map((floor, index) => (
            <div className="floor-item" key={index}>
              <div className="floor-header">
                <span className="floor-name">{floor.name}</span>
                <span className="floor-capacity">{floor.available}/{floor.total}</span>
              </div>
              <div className="floor-vehicles">
                <span className="floor-vehicle-count"><SmallCarIcon size={16} />{floor.total - floor.available}</span>
                <span className="floor-vehicle-count"><SmallBikeIcon size={16} />{floor.available}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="instructions-card animate-slide-up">
          <h3>Instructions</h3>
          <ul className="instruction-list">
            <li className={currentStep === 1 ? 'instruction-active' : currentStep > 1 ? 'instruction-done' : ''}>
              <span className="step-num">1.</span> Enter license plate &amp; vehicle info
            </li>
            <li className={currentStep === 2 ? 'instruction-active' : currentStep > 2 ? 'instruction-done' : ''}>
              <span className="step-num">2.</span> Capture face for verification (optional)
            </li>
            <li className={currentStep === 3 ? 'instruction-active' : currentStep > 3 ? 'instruction-done' : ''}>
              <span className="step-num">3.</span> Review and confirm information
            </li>
            <li className={currentStep === 4 ? 'instruction-active' : ''}>
              <span className="step-num">4.</span> Registration complete
            </li>
          </ul>
        </div>

        {/* Face Recognition Info */}
        <div className="face-card animate-slide-up">
          <div className="face-card-header">
            <ScanFace />
            <h3>Face Recognition</h3>
          </div>
          <p>
            Face registration helps verify vehicle owner identity
            in case of lost ticket. The face data is securely
            stored and only used for verification purposes.
          </p>
        </div>
      </div>
    </>
  );
}

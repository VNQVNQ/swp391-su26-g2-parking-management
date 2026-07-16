import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Clock, CheckCircle, Ticket, MapPin, Plus, X, Search,
  ChevronRight, ChevronLeft, FileText, Phone, CreditCard, Car,
  Eye, CheckSquare, XSquare, Filter, RefreshCw, User, Hash
} from 'lucide-react';
import api from '../../services/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const EXCEPTION_TYPE_LABELS = {
  LOST_TICKET: 'Mất vé',
  WRONG_ZONE: 'Sai vị trí',
  OVERSTAY: 'Quá giờ',
  UNPAID_EXIT: 'Nợ phí',
};

const WRONG_ZONE_SUBTYPES = [
  {
    value: 'WRONG_VEHICLE_TYPE',
    label: 'Xe máy đỗ vào khu xe khác',
    desc: 'Xe máy đỗ vào khu xe ô tô hoặc ngược lại',
    icon: '🏍️',
  },
  {
    value: 'WRONG_FLOOR',
    label: 'Xe đỗ nhầm tầng',
    desc: 'Xe đỗ không đúng tầng được phân công hoặc chỉ định',
    icon: '🏢',
  },
  {
    value: 'OCCUPIED_RESERVED',
    label: 'Chiếm vị trí đặt trước',
    desc: 'Xe đỗ vào ô đã được khách hàng đặt trước (booking)',
    icon: '📋',
  },
  {
    value: 'MULTIPLE_SLOTS',
    label: 'Chiếm nhiều hơn một ô',
    desc: 'Xe đỗ lấn sang ô bên cạnh hoặc chiếm hai ô',
    icon: '⬛',
  },
];

const STATUS_CONFIG = {
  PENDING: { label: 'Đang chờ', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  APPROVED: { label: 'Đã duyệt', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  REJECTED: { label: 'Từ chối', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  RESOLVED: { label: 'Đã giải quyết', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
};

const TYPE_CONFIG = {
  LOST_TICKET: { label: 'Mất vé', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🎫' },
  WRONG_ZONE: { label: 'Sai vị trí', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '📍' },
  OVERSTAY: { label: 'Quá giờ', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '⏰' },
  UNPAID_EXIT: { label: 'Nợ phí', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: '💰' },
};

// ─── Shared input style ───────────────────────────────────────────────────────
const inputSt = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-input, #1a1a2e)',
  border: '1.5px solid var(--border-color, #2a2a4a)',
  borderRadius: '8px',
  color: 'var(--text-primary, #e0e0e0)',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

// ─── Badge component ─────────────────────────────────────────────────────────
function Badge({ type, config }) {
  const cfg = config[type] || { label: type, color: '#888', bg: 'rgba(136,136,136,0.12)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40`,
    }}>
      {cfg.icon && <span style={{ fontSize: '0.8rem' }}>{cfg.icon}</span>}
      {cfg.label}
    </span>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, highlight }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary, #0d0d1a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} style={{ color: 'var(--accent-primary, #6366f1)' }} />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #666)', marginBottom: 2 }}>{label}</div>
        <div style={{
          fontSize: '0.88rem',
          fontWeight: highlight ? 700 : 500,
          color: highlight ? 'var(--accent-primary, #6366f1)' : 'var(--text-primary, #e0e0e0)',
        }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Modal Overlay ────────────────────────────────────────────────────────────
function ModalOverlay({ onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card, #12122a)', borderRadius: 16,
        border: '1px solid var(--border-color, #2a2a4a)',
        width: '100%', maxWidth: wide ? 700 : 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose, step, totalSteps }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px', borderBottom: '1px solid var(--border-color, #2a2a4a)',
    }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #e0e0e0)' }}>{title}</h3>
        {step && totalSteps && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} style={{
                width: i < step ? 24 : 8, height: 4, borderRadius: 2,
                background: i < step ? 'var(--accent-primary, #6366f1)' : 'var(--border-color, #2a2a4a)',
                transition: 'width 0.3s ease',
              }} />
            ))}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #666)', marginLeft: 4 }}>
              Bước {step}/{totalSteps}
            </span>
          </div>
        )}
      </div>
      <button onClick={onClose} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted, #666)', padding: 4, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <X size={18} />
      </button>
    </div>
  );
}

// ─── MODAL: Tạo ngoại lệ Mất vé (multi-step) ─────────────────────────────────
function LostTicketModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [plateInput, setPlateInput] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [form, setForm] = useState({
    phoneInput: '',
    cccdInput: '',
    faceDesc: '',
    reason: '',
    penaltyFee: '50000',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSearchPlate = async () => {
    if (!plateInput.trim()) return;
    setSearching(true);
    setSearchError('');
    setSessionInfo(null);
    try {
      // Tìm phiên đang active theo biển số
      const res = await api.get(`/api/v1/exceptions/by-plate/${plateInput.trim().toUpperCase()}`);
      const history = res.data.data || [];
      setSessionHistory(history);

      // Tìm thông tin session hiện tại
      const sessRes = await api.get('/api/v1/sessions', { params: { licensePlate: plateInput.trim().toUpperCase(), status: 'ACTIVE' } })
        .catch(() => null);

      if (sessRes?.data?.data?.length > 0) {
        setSessionInfo(sessRes.data.data[0]);
      } else {
        // Thử endpoint khác
        const sessRes2 = await api.get('/api/v1/parking-sessions', {
          params: { licensePlate: plateInput.trim().toUpperCase() }
        }).catch(() => null);
        if (sessRes2?.data?.data) {
          const active = (sessRes2.data.data || []).find(s => s.status === 'ACTIVE' || !s.exitTime);
          setSessionInfo(active || null);
        }
      }

      setStep(2);
    } catch (err) {
      setSearchError('Không tìm thấy thông tin cho biển số này');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.reason.trim()) {
      alert('Vui lòng nhập mô tả sự việc');
      return;
    }
    setSubmitting(true);
    try {
      const evidenceParts = [];
      if (form.phoneInput) evidenceParts.push(`SĐT tài khoản: ${form.phoneInput}`);
      if (form.cccdInput) evidenceParts.push(`CCCD/CMND: ${form.cccdInput}`);
      if (form.faceDesc) evidenceParts.push(`Nhận dạng: ${form.faceDesc}`);

      await api.post('/api/v1/exceptions', {
        exceptionType: 'LOST_TICKET',
        licensePlate: plateInput.trim().toUpperCase(),
        reason: form.reason,
        evidenceNote: evidenceParts.join(' | '),
        penaltyFee: form.penaltyFee || '50000',
        ...(sessionInfo?.id && { sessionId: sessionInfo.id }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tạo ngoại lệ mất vé');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} wide>
      <ModalHeader title="🎫 Xử lý Mất vé" onClose={onClose} step={step} totalSteps={2} />

      <div style={{ padding: '24px' }}>
        {step === 1 && (
          <>
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '14px 16px', marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>
                ⚠️ Quy trình xử lý mất vé
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #aaa)', lineHeight: 1.5 }}>
                Nhập biển số xe để tra cứu thông tin xe và phiên gửi xe hiện tại. Sau đó xác minh danh tính chủ xe trước khi hoàn tất.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary, #aaa)' }}>
                Biển số xe <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Car size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #666)' }} />
                  <input
                    style={{ ...inputSt, paddingLeft: 38, textTransform: 'uppercase', letterSpacing: 1 }}
                    value={plateInput}
                    onChange={e => setPlateInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchPlate()}
                    placeholder="Ví dụ: 51A-12345"
                  />
                </div>
                <button
                  onClick={handleSearchPlate}
                  disabled={searching || !plateInput.trim()}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'var(--accent-primary, #6366f1)', color: '#fff', fontWeight: 600,
                    fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6,
                    opacity: searching || !plateInput.trim() ? 0.6 : 1,
                  }}
                >
                  {searching ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />}
                  Tra cứu
                </button>
              </div>
              {searchError && (
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#ef4444' }}>⚠️ {searchError}</p>
              )}
            </div>

            <div style={{
              background: 'var(--bg-secondary, #0d0d1a)', borderRadius: 10, padding: '16px',
              border: '1px solid var(--border-color, #2a2a4a)',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #666)' }}>
                Thông tin cần xác minh:
              </p>
              {[
                '✅ Biển số xe (đã nhập ở trên)',
                '📱 Số điện thoại tài khoản đăng ký',
                '🪪 CCCD / CMND của chủ xe',
                '🚘 Thông tin xe đã đăng ký trong hệ thống',
                '👁️ Mô tả nhận dạng / ảnh khuôn mặt lúc vào bãi',
                '📋 Lịch sử phiên gửi xe',
              ].map((item, i) => (
                <p key={i} style={{ margin: '4px 0', fontSize: '0.82rem', color: 'var(--text-secondary, #aaa)' }}>{item}</p>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Thông tin xe tìm được */}
            {sessionInfo && (
              <div style={{
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 10, padding: '16px', marginBottom: 20,
              }}>
                <p style={{ margin: '0 0 12px', fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>
                  ✅ Phiên gửi xe đang hoạt động
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  {[
                    ['Biển số', sessionInfo.licensePlate || plateInput],
                    ['Loại xe', sessionInfo.vehicleType || 'N/A'],
                    ['Ô đỗ', sessionInfo.slotCode || 'N/A'],
                    ['Giờ vào', sessionInfo.entryTime ? new Date(sessionInfo.entryTime).toLocaleString('vi-VN') : 'N/A'],
                    ['Chủ xe', sessionInfo.ownerName || 'N/A'],
                    ['SĐT đăng ký', sessionInfo.ownerPhone || 'N/A'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #666)' }}>{l}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #e0e0e0)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!sessionInfo && (
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 10, padding: '14px 16px', marginBottom: 20,
              }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#f59e0b' }}>
                  ⚠️ Biển số <strong>{plateInput}</strong> — không tìm thấy phiên đang hoạt động. Vẫn có thể tạo ngoại lệ.
                </p>
              </div>
            )}

            {/* Lịch sử ngoại lệ */}
            {sessionHistory.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted, #666)', margin: '0 0 8px' }}>
                  📋 Lịch sử ngoại lệ ({sessionHistory.length} bản ghi)
                </p>
                <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sessionHistory.slice(0, 5).map(h => (
                    <div key={h.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: 'var(--bg-secondary, #0d0d1a)',
                      borderRadius: 8, fontSize: '0.78rem',
                    }}>
                      <span>{TYPE_CONFIG[h.exceptionType]?.label || h.exceptionType}</span>
                      <span style={{ color: STATUS_CONFIG[h.status]?.color || '#888' }}>
                        {STATUS_CONFIG[h.status]?.label || h.status}
                      </span>
                      <span style={{ color: 'var(--text-muted, #666)' }}>
                        {new Date(h.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form xác minh danh tính */}
            <div style={{ borderTop: '1px solid var(--border-color, #2a2a4a)', paddingTop: 20 }}>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #e0e0e0)' }}>
                🪪 Xác minh danh tính chủ xe
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
                    <Phone size={12} style={{ marginRight: 4 }} />Số điện thoại tài khoản
                  </label>
                  <input
                    style={inputSt}
                    value={form.phoneInput}
                    onChange={e => setForm(p => ({ ...p, phoneInput: e.target.value }))}
                    placeholder="0901234567"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
                    <CreditCard size={12} style={{ marginRight: 4 }} />CCCD / CMND
                  </label>
                  <input
                    style={inputSt}
                    value={form.cccdInput}
                    onChange={e => setForm(p => ({ ...p, cccdInput: e.target.value }))}
                    placeholder="Số CCCD hoặc CMND"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
                  <Eye size={12} style={{ marginRight: 4 }} />Mô tả nhận dạng / Ảnh khuôn mặt lúc vào bãi
                </label>
                <textarea
                  style={{ ...inputSt, minHeight: 70, resize: 'vertical' }}
                  value={form.faceDesc}
                  onChange={e => setForm(p => ({ ...p, faceDesc: e.target.value }))}
                  placeholder="Mô tả đặc điểm nhận dạng của chủ xe khi vào bãi (nếu hệ thống có lưu ảnh/khuôn mặt)..."
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
                  📝 Mô tả chi tiết sự việc <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  style={{ ...inputSt, minHeight: 80, resize: 'vertical' }}
                  value={form.reason}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Mô tả chi tiết sự việc mất vé..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
                  💰 Phụ phí mất vé (VND)
                </label>
                <input
                  type="number"
                  style={inputSt}
                  value={form.penaltyFee}
                  onChange={e => setForm(p => ({ ...p, penaltyFee: e.target.value }))}
                  placeholder="50000"
                />
                <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--text-muted, #666)' }}>
                  Mặc định theo quy định BR-41: 50,000 VND
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer buttons */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', borderTop: '1px solid var(--border-color, #2a2a4a)',
      }}>
        <div>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-color, #2a2a4a)',
                background: 'transparent', color: 'var(--text-secondary, #aaa)', cursor: 'pointer',
                fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <ChevronLeft size={15} /> Quay lại
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-color, #2a2a4a)',
            background: 'transparent', color: 'var(--text-secondary, #aaa)', cursor: 'pointer', fontSize: '0.88rem',
          }}>
            Hủy
          </button>
          {step === 1 && (
            <button
              onClick={handleSearchPlate}
              disabled={searching || !plateInput.trim()}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--accent-primary, #6366f1)', color: '#fff', fontWeight: 600,
                fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6,
                opacity: searching || !plateInput.trim() ? 0.6 : 1,
              }}
            >
              Tiếp theo <ChevronRight size={15} />
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.reason.trim()}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: '#ef4444', color: '#fff', fontWeight: 600,
                fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6,
                opacity: submitting || !form.reason.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Ticket size={14} />}
              Tạo ngoại lệ mất vé
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── MODAL: Tạo ngoại lệ Xe đỗ sai vị trí ───────────────────────────────────
function WrongPositionModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    licensePlate: '',
    subType: '',
    currentSlot: '',
    correctSlot: '',
    reason: '',
    penaltyFee: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedSubtype = WRONG_ZONE_SUBTYPES.find(s => s.value === form.subType);

  const handleSubmit = async () => {
    if (!form.licensePlate.trim()) { alert('Vui lòng nhập biển số xe'); return; }
    if (!form.subType) { alert('Vui lòng chọn loại vi phạm'); return; }
    if (!form.reason.trim()) { alert('Vui lòng nhập mô tả sự việc'); return; }
    setSubmitting(true);
    try {
      const evidenceParts = [];
      if (form.currentSlot) evidenceParts.push(`Ô hiện tại: ${form.currentSlot}`);
      if (form.correctSlot) evidenceParts.push(`Ô đúng: ${form.correctSlot}`);

      await api.post('/api/v1/exceptions', {
        exceptionType: 'WRONG_ZONE',
        licensePlate: form.licensePlate.trim().toUpperCase(),
        reason: form.reason,
        subType: form.subType,
        evidenceNote: evidenceParts.join(' | ') || null,
        penaltyFee: form.penaltyFee || null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tạo ngoại lệ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} wide>
      <ModalHeader title="📍 Xe đỗ sai vị trí" onClose={onClose} />

      <div style={{ padding: '24px' }}>
        {/* Chọn loại vi phạm */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary, #aaa)' }}>
            Loại vi phạm <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {WRONG_ZONE_SUBTYPES.map(st => (
              <button
                key={st.value}
                onClick={() => setForm(p => ({ ...p, subType: st.value }))}
                style={{
                  padding: '14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  border: form.subType === st.value
                    ? '2px solid var(--accent-primary, #6366f1)'
                    : '1.5px solid var(--border-color, #2a2a4a)',
                  background: form.subType === st.value
                    ? 'rgba(99,102,241,0.1)'
                    : 'var(--bg-secondary, #0d0d1a)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{st.icon}</div>
                <div style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: form.subType === st.value ? 'var(--accent-primary, #6366f1)' : 'var(--text-primary, #e0e0e0)',
                  marginBottom: 4,
                }}>
                  {st.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #666)', lineHeight: 1.4 }}>
                  {st.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Biển số xe */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
            Biển số xe <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Car size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #666)' }} />
            <input
              style={{ ...inputSt, paddingLeft: 36, textTransform: 'uppercase', letterSpacing: 1 }}
              value={form.licensePlate}
              onChange={e => setForm(p => ({ ...p, licensePlate: e.target.value }))}
              placeholder="51A-12345"
            />
          </div>
        </div>

        {/* Ô hiện tại / Ô đúng */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
              <MapPin size={12} style={{ marginRight: 4 }} />Ô đỗ hiện tại (sai)
            </label>
            <input
              style={inputSt}
              value={form.currentSlot}
              onChange={e => setForm(p => ({ ...p, currentSlot: e.target.value }))}
              placeholder="Ví dụ: A1-05"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
              <MapPin size={12} style={{ marginRight: 4, color: '#10b981' }} />Ô đỗ đúng (nếu biết)
            </label>
            <input
              style={inputSt}
              value={form.correctSlot}
              onChange={e => setForm(p => ({ ...p, correctSlot: e.target.value }))}
              placeholder="Ví dụ: B2-03"
            />
          </div>
        </div>

        {/* Mô tả */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
            Mô tả sự việc <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            style={{ ...inputSt, minHeight: 90, resize: 'vertical' }}
            value={form.reason}
            onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
            placeholder="Mô tả chi tiết vi phạm đỗ xe sai vị trí..."
          />
        </div>

        {/* Phụ phí */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary, #aaa)' }}>
            Phụ phí vi phạm (VND)
          </label>
          <input
            type="number"
            style={inputSt}
            value={form.penaltyFee}
            onChange={e => setForm(p => ({ ...p, penaltyFee: e.target.value }))}
            placeholder="Nhập số tiền phụ phí (nếu có)"
          />
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        padding: '16px 24px', borderTop: '1px solid var(--border-color, #2a2a4a)',
      }}>
        <button onClick={onClose} style={{
          padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-color, #2a2a4a)',
          background: 'transparent', color: 'var(--text-secondary, #aaa)', cursor: 'pointer', fontSize: '0.88rem',
        }}>
          Hủy
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !form.subType || !form.licensePlate.trim() || !form.reason.trim()}
          style={{
            padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#f59e0b', color: '#000', fontWeight: 700,
            fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6,
            opacity: submitting || !form.subType || !form.licensePlate.trim() || !form.reason.trim() ? 0.5 : 1,
          }}
        >
          {submitting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={14} />}
          Tạo ngoại lệ sai vị trí
        </button>
      </div>
    </ModalOverlay>
  );
}

// ─── MODAL: Chi tiết ngoại lệ ─────────────────────────────────────────────────
function DetailModal({ ex, onClose, onResolve, isManager }) {
  if (!ex) return null;
  const typeCfg = TYPE_CONFIG[ex.exceptionType] || {};
  const statusCfg = STATUS_CONFIG[ex.status] || {};

  const subTypeLabel = ex.subType
    ? WRONG_ZONE_SUBTYPES.find(s => s.value === ex.subType)?.label || ex.subType
    : null;

  return (
    <ModalOverlay onClose={onClose} wide>
      <ModalHeader title={`Chi tiết ngoại lệ #${ex.id?.substring(0, 8)}`} onClose={onClose} />
      <div style={{ padding: '24px' }}>
        {/* Header badges */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <Badge type={ex.exceptionType} config={TYPE_CONFIG} />
          <Badge type={ex.status} config={STATUS_CONFIG} />
          {subTypeLabel && (
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
              color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            }}>
              {WRONG_ZONE_SUBTYPES.find(s => s.value === ex.subType)?.icon} {subTypeLabel}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #666)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Thông tin xe
            </p>
            <InfoRow icon={Car} label="Biển số xe" value={ex.licensePlate} highlight />
            <InfoRow icon={Hash} label="Loại xe" value={ex.vehicleType} />
            <InfoRow icon={MapPin} label="Ô đỗ xe" value={ex.slotCode} />
            <InfoRow icon={User} label="Chủ xe" value={ex.ownerName} />
            <InfoRow icon={Phone} label="SĐT chủ xe" value={ex.ownerPhone} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #666)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Thông tin xử lý
            </p>
            <InfoRow icon={User} label="Nhân viên tạo" value={ex.createdBy} />
            <InfoRow icon={Clock} label="Thời gian tạo" value={ex.createdAt ? new Date(ex.createdAt).toLocaleString('vi-VN') : null} />
            <InfoRow icon={User} label="Người phê duyệt" value={ex.approvedBy} />
            <InfoRow icon={CheckCircle} label="Thời gian giải quyết" value={ex.resolvedAt ? new Date(ex.resolvedAt).toLocaleString('vi-VN') : null} />
            {ex.penaltyFee && <InfoRow icon={FileText} label="Phụ phí" value={`${parseInt(ex.penaltyFee).toLocaleString('vi-VN')} VND`} highlight />}
          </div>
        </div>

        {/* Mô tả sự việc */}
        {ex.reason && (
          <div style={{
            marginTop: 16, padding: '14px 16px',
            background: 'var(--bg-secondary, #0d0d1a)', borderRadius: 10,
            border: '1px solid var(--border-color, #2a2a4a)',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #666)', marginBottom: 6 }}>MÔ TẢ SỰ VIỆC</p>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #aaa)', lineHeight: 1.6 }}>{ex.reason}</p>
          </div>
        )}

        {/* Thông tin xác minh danh tính */}
        {ex.evidenceNote && (
          <div style={{
            marginTop: 12, padding: '14px 16px',
            background: 'rgba(99,102,241,0.06)', borderRadius: 10,
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary, #6366f1)', marginBottom: 8 }}>
              🪪 THÔNG TIN XÁC MINH DANH TÍNH
            </p>
            {ex.evidenceNote.split(' | ').map((line, i) => (
              <p key={i} style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text-primary, #e0e0e0)' }}>
                • {line}
              </p>
            ))}
          </div>
        )}

        {/* Kết quả giải quyết */}
        {ex.resolution && (
          <div style={{
            marginTop: 12, padding: '14px 16px',
            background: 'rgba(16,185,129,0.06)', borderRadius: 10,
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginBottom: 6 }}>KẾT QUẢ XỬ LÝ</p>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #aaa)', lineHeight: 1.6 }}>{ex.resolution}</p>
          </div>
        )}
      </div>

      {isManager && ex.status === 'PENDING' && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '16px 24px', borderTop: '1px solid var(--border-color, #2a2a4a)',
        }}>
          <button onClick={() => onResolve(ex, 'REJECTED')} style={{
            padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)',
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
          }}>
            <XSquare size={14} /> Từ chối
          </button>
          <button onClick={() => onResolve(ex, 'RESOLVED')} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: '#10b981', color: '#fff',
            cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
          }}>
            <CheckSquare size={14} /> Giải quyết
          </button>
        </div>
      )}
    </ModalOverlay>
  );
}

// ─── MODAL: Resolve / Reject ──────────────────────────────────────────────────
function ResolveModal({ ex, targetStatus, onClose, onSuccess }) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!ex) return null;

  const isReject = targetStatus === 'REJECTED';

  const handleConfirm = async () => {
    if (!notes.trim()) { alert('Vui lòng nhập ghi chú'); return; }
    setSubmitting(true);
    try {
      await api.put(`/api/v1/exceptions/${ex.id}/resolve`, {
        resolution: notes,
        status: targetStatus,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader
        title={isReject ? '❌ Từ chối ngoại lệ' : '✅ Giải quyết ngoại lệ'}
        onClose={onClose}
      />
      <div style={{ padding: '24px' }}>
        <div style={{
          background: 'var(--bg-secondary, #0d0d1a)', borderRadius: 10, padding: '14px 16px', marginBottom: 20,
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #666)', marginBottom: 4 }}>Ngoại lệ</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary, #e0e0e0)' }}>
            {TYPE_CONFIG[ex.exceptionType]?.icon} {TYPE_CONFIG[ex.exceptionType]?.label} — {ex.licensePlate || 'N/A'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #aaa)', marginTop: 4 }}>{ex.reason}</div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary, #aaa)' }}>
            {isReject ? 'Lý do từ chối' : 'Ghi chú giải quyết'} <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            style={{ ...inputSt, minHeight: 100, resize: 'vertical' }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={isReject ? 'Nhập lý do từ chối...' : 'Nhập kết quả xử lý...'}
            autoFocus
          />
        </div>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        padding: '16px 24px', borderTop: '1px solid var(--border-color, #2a2a4a)',
      }}>
        <button onClick={onClose} style={{
          padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-color, #2a2a4a)',
          background: 'transparent', color: 'var(--text-secondary, #aaa)', cursor: 'pointer', fontSize: '0.88rem',
        }}>
          Hủy
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting || !notes.trim()}
          style={{
            padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isReject ? '#ef4444' : '#10b981', color: '#fff', fontWeight: 600,
            fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6,
            opacity: submitting || !notes.trim() ? 0.6 : 1,
          }}
        >
          {submitting
            ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : isReject ? <XSquare size={14} /> : <CheckSquare size={14} />}
          {isReject ? 'Xác nhận từ chối' : 'Xác nhận giải quyết'}
        </button>
      </div>
    </ModalOverlay>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Modals
  const [showLostTicketModal, setShowLostTicketModal] = useState(false);
  const [showWrongPositionModal, setShowWrongPositionModal] = useState(false);
  const [detailException, setDetailException] = useState(null);
  const [resolveTarget, setResolveTarget] = useState(null); // { ex, status }

  // Filter
  const [filterStatus, setFilterStatus] = useState('');
  const [searchPlate, setSearchPlate] = useState('');

  const loadExceptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'ALL') params.type = activeTab;
      if (filterStatus) params.status = filterStatus;

      const res = await api.get('/api/v1/exceptions', { params });
      const data = res.data.data ?? res.data ?? [];
      setExceptions(Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu ngoại lệ');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterStatus]);

  useEffect(() => { loadExceptions(); }, [loadExceptions]);

  const handleResolveClick = (ex, status) => {
    setDetailException(null);
    setResolveTarget({ ex, status });
  };

  const filtered = exceptions.filter(ex => {
    if (!searchPlate) return true;
    return (ex.licensePlate || '').toLowerCase().includes(searchPlate.toLowerCase());
  });

  const stats = [
    { label: 'Đang chờ xử lý', value: exceptions.filter(e => e.status === 'PENDING').length, color: '#f59e0b', icon: Clock },
    { label: 'Đã giải quyết', value: exceptions.filter(e => e.status === 'RESOLVED' || e.status === 'APPROVED').length, color: '#10b981', icon: CheckCircle },
    { label: 'Mất vé', value: exceptions.filter(e => e.exceptionType === 'LOST_TICKET').length, color: '#ef4444', icon: Ticket },
    { label: 'Sai vị trí', value: exceptions.filter(e => e.exceptionType === 'WRONG_ZONE').length, color: '#f59e0b', icon: MapPin },
  ];

  const tabs = [
    { key: 'ALL', label: 'Tất cả', count: exceptions.length },
    { key: 'LOST_TICKET', label: '🎫 Mất vé', count: exceptions.filter(e => e.exceptionType === 'LOST_TICKET').length },
    { key: 'WRONG_ZONE', label: '📍 Sai vị trí', count: exceptions.filter(e => e.exceptionType === 'WRONG_ZONE').length },
    { key: 'OVERSTAY', label: '⏰ Quá giờ', count: exceptions.filter(e => e.exceptionType === 'OVERSTAY').length },
  ];

  return (
    <div className="page-full-width">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={24} style={{ color: '#f59e0b' }} /> Xử lý Ngoại lệ
          </h2>
          <p>Quản lý mất vé, xe đỗ sai vị trí và các tình huống bất thường</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-sm"
            style={{
              padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(239,68,68,0.12)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, cursor: 'pointer',
            }}
            onClick={() => setShowLostTicketModal(true)}
          >
            <Ticket size={15} /> Mất vé
          </button>
          <button
            className="btn-sm"
            style={{
              padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, cursor: 'pointer',
            }}
            onClick={() => setShowWrongPositionModal(true)}
          >
            <MapPin size={15} /> Sai vị trí
          </button>
          <button
            className="btn-sm btn-sm-primary"
            style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            onClick={loadExceptions}
          >
            <RefreshCw size={15} /> Làm mới
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="stat-card-header">
                <span className="stat-card-label">{s.label}</span>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div className="stat-card-value">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border-color, #2a2a4a)', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
              background: activeTab === tab.key ? 'var(--bg-card, #12122a)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-primary, #6366f1)' : 'var(--text-muted, #666)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.88rem', borderBottom: activeTab === tab.key ? '2px solid var(--accent-primary, #6366f1)' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginLeft: 6, padding: '1px 7px', borderRadius: 10, fontSize: '0.72rem',
                background: activeTab === tab.key ? 'var(--accent-primary, #6366f1)' : 'var(--bg-secondary, #0d0d1a)',
                color: activeTab === tab.key ? '#fff' : 'var(--text-muted, #666)',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #666)' }} />
          <input
            style={{ ...inputSt, paddingLeft: 36, padding: '9px 14px 9px 36px' }}
            placeholder="Tìm biển số xe..."
            value={searchPlate}
            onChange={e => setSearchPlate(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--text-muted, #666)' }} />
          <select
            style={{ ...inputSt, width: 'auto', padding: '9px 14px' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Đang chờ</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="RESOLVED">Đã giải quyết</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
        {(searchPlate || filterStatus) && (
          <button
            onClick={() => { setSearchPlate(''); setFilterStatus(''); }}
            style={{
              padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-color, #2a2a4a)',
              background: 'transparent', color: 'var(--text-muted, #666)', cursor: 'pointer', fontSize: '0.82rem',
            }}
          >
            <X size={13} /> Xóa lọc
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, marginBottom: 16, color: '#ef4444', fontSize: '0.88rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="card" style={{ overflowX: 'auto', marginBottom: 24 }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <AlertTriangle size={18} /> Danh sách ngoại lệ
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted, #666)' }}>
            {filtered.length} bản ghi
          </span>
        </h3>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted, #666)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            Đang tải dữ liệu...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted, #666)' }}>
            <AlertTriangle size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            Chưa có ngoại lệ nào
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại</th>
                <th>Chi tiết vi phạm</th>
                <th>Biển số</th>
                <th>Phụ phí</th>
                <th>Người tạo</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ex => {
                const subLabel = ex.subType
                  ? WRONG_ZONE_SUBTYPES.find(s => s.value === ex.subType)
                  : null;
                return (
                  <tr key={ex.id} style={{ cursor: 'pointer' }} onClick={() => setDetailException(ex)}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted, #666)', fontWeight: 600 }}>
                      #{ex.id?.substring(0, 8)}
                    </td>
                    <td>
                      <Badge type={ex.exceptionType} config={TYPE_CONFIG} />
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      {subLabel && (
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f59e0b', marginBottom: 3 }}>
                          {subLabel.icon} {subLabel.label}
                        </div>
                      )}
                      <div style={{
                        fontSize: '0.82rem', color: 'var(--text-secondary, #aaa)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200,
                      }}>
                        {ex.reason}
                      </div>
                      {ex.evidenceNote && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary, #6366f1)', marginTop: 2 }}>
                          🪪 Có thông tin xác minh
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', letterSpacing: 0.5 }}>
                        {ex.licensePlate || '—'}
                      </span>
                    </td>
                    <td>
                      {ex.penaltyFee
                        ? <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
                            {parseInt(ex.penaltyFee).toLocaleString('vi-VN')}đ
                          </span>
                        : <span style={{ color: 'var(--text-muted, #666)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{ex.createdBy || '—'}</td>
                    <td style={{ color: 'var(--text-muted, #666)', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                      {ex.createdAt ? new Date(ex.createdAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td><Badge type={ex.status} config={STATUS_CONFIG} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          title="Xem chi tiết"
                          onClick={() => setDetailException(ex)}
                          style={{
                            padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-color, #2a2a4a)',
                            background: 'var(--bg-secondary, #0d0d1a)', color: 'var(--text-secondary, #aaa)',
                            cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <Eye size={12} /> Chi tiết
                        </button>
                        {ex.status === 'PENDING' && (
                          <>
                            <button
                              title="Giải quyết"
                              onClick={() => handleResolveClick(ex, 'RESOLVED')}
                              style={{
                                padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)',
                                background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <CheckSquare size={12} />
                            </button>
                            <button
                              title="Từ chối"
                              onClick={() => handleResolveClick(ex, 'REJECTED')}
                              style={{
                                padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <XSquare size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Quy định xử lý ── */}
      <div className="rules-section">
        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} /> Quy định xử lý ngoại lệ
        </h4>
        <div className="rules-grid">
          {[
            {
              code: 'BR-41', icon: '🎫', title: 'Mất vé',
              desc: 'Bắt buộc xác minh danh tính: biển số + SĐT + CCCD. Phụ phí bồi thường: 50,000 VND',
            },
            {
              code: 'BR-42', icon: '🏍️', title: 'Xe máy đỗ sai khu',
              desc: 'Xe máy đỗ vào khu xe ô tô hoặc ngược lại — phải di chuyển ngay. Tính phụ phí vi phạm',
            },
            {
              code: 'BR-43', icon: '📋', title: 'Chiếm slot đặt trước',
              desc: 'Xe chiếm vị trí đã được đặt qua hệ thống booking — ưu tiên xử lý ngay',
            },
            {
              code: 'BR-44', icon: '✅', title: 'Phê duyệt',
              desc: 'Ngoại lệ chỉ được đóng sau khi Quản lý xem xét và phê duyệt hoặc từ chối',
            },
          ].map((r, i) => (
            <div key={i} className="rule-card">
              <div className="rule-card-title">
                <span className="rule-code">{r.code}</span>
                {r.icon} {r.title}
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary, #aaa)', lineHeight: 1.5 }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ── */}
      {showLostTicketModal && (
        <LostTicketModal
          onClose={() => setShowLostTicketModal(false)}
          onSuccess={loadExceptions}
        />
      )}
      {showWrongPositionModal && (
        <WrongPositionModal
          onClose={() => setShowWrongPositionModal(false)}
          onSuccess={loadExceptions}
        />
      )}
      {detailException && (
        <DetailModal
          ex={detailException}
          onClose={() => setDetailException(null)}
          onResolve={handleResolveClick}
          isManager={true}
        />
      )}
      {resolveTarget && (
        <ResolveModal
          ex={resolveTarget.ex}
          targetStatus={resolveTarget.status}
          onClose={() => setResolveTarget(null)}
          onSuccess={loadExceptions}
        />
      )}
    </div>
  );
}

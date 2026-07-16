import { Link } from 'react-router-dom';
import { Car, Shield, BarChart3, Clock, MapPin, CreditCard, ChevronRight, CheckCircle, Star, Zap, Users, TrendingUp } from 'lucide-react';

const FEATURES = [
  {
    icon: MapPin,
    color: '#4f46e5',
    gradient: 'linear-gradient(135deg, rgba(79,70,229,0.05), rgba(99,102,241,0.02))',
    border: 'rgba(79,70,229,0.15)',
    title: 'Quản lý Thời gian Thực',
    desc: 'Theo dõi toàn bộ bãi đỗ xe trực tiếp — biết ngay chỗ nào trống, chỗ nào đang có xe mà không cần đi kiểm tra thực tế.',
  },
  {
    icon: CreditCard,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.02))',
    border: 'rgba(16,185,129,0.15)',
    title: 'Vé tháng Thông minh',
    desc: 'Tài xế tự đăng ký vé tháng online. Hệ thống tự động quản lý hạn sử dụng, nhắc nhở gia hạn và phân loại theo loại xe.',
  },
  {
    icon: BarChart3,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(217,119,6,0.02))',
    border: 'rgba(245,158,11,0.15)',
    title: 'Báo cáo & Thống kê',
    desc: 'Dashboard trực quan với biểu đồ doanh thu, tỷ lệ lấp đầy, giờ cao điểm — ra quyết định dựa trên dữ liệu thực.',
  },
  {
    icon: Shield,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(109,40,217,0.02))',
    border: 'rgba(139,92,246,0.15)',
    title: 'Bảo mật Doanh nghiệp',
    desc: 'Phân quyền rõ ràng theo vai trò: Admin, Manager, Staff, Driver. Toàn bộ hoạt động được ghi log và xác thực JWT.',
  },
  {
    icon: Clock,
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(220,38,38,0.02))',
    border: 'rgba(239,68,68,0.15)',
    title: 'Đặt chỗ Trước',
    desc: 'Tài xế đặt chỗ trước qua ứng dụng, hệ thống giữ chỗ trong 30 phút. Không còn cảnh đến nơi mới biết hết chỗ.',
  },
  {
    icon: Zap,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.05), rgba(8,145,178,0.02))',
    border: 'rgba(6,182,212,0.15)',
    title: 'Nhận xe Nhanh chóng',
    desc: 'Staff scan biển số, hệ thống tự tính phí và xuất vé tự động. Giảm thời gian chờ và sai sót thu tiền.',
  },
];

const STEPS = [
  {
    num: '01',
    icon: Users,
    color: '#4f46e5',
    title: 'Đăng ký tài khoản',
    desc: 'Tạo tài khoản Tài xế chỉ mất 30 giây. Thêm phương tiện và bắt đầu sử dụng ngay.',
  },
  {
    num: '02',
    icon: MapPin,
    color: '#10b981',
    title: 'Đặt chỗ hoặc mua Vé tháng',
    desc: 'Xem sơ đồ bãi xe, chọn chỗ đỗ ưng ý hoặc mua vé tháng tiện lợi cho lịch trình cố định.',
  },
  {
    num: '03',
    icon: Car,
    color: '#f59e0b',
    title: 'Đến & gửi xe',
    desc: 'Staff quét biển số hoặc kiểm tra vé tháng — nhanh chóng, không cần giấy tờ phức tạp.',
  },
];

const STATS = [
  { value: '220+', label: 'Chỗ đỗ xe', icon: MapPin, color: '#4f46e5' },
  { value: '3', label: 'Tầng đỗ xe', icon: TrendingUp, color: '#10b981' },
  { value: '6', label: 'Khu vực', icon: Shield, color: '#f59e0b' },
  { value: '24/7', label: 'Hoạt động', icon: Clock, color: '#8b5cf6' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 5%', height: 72,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
          }}>
            <Car size={22} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#0f172a' }}>ParkingPro</span>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="#features" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#0f172a'}
            onMouseLeave={e => e.target.style.color = '#475569'}>
            Tính năng
          </a>
          <a href="#how-it-works" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#0f172a'}
            onMouseLeave={e => e.target.style.color = '#475569'}>
            Cách dùng
          </a>
          <Link to="/login" style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff', textDecoration: 'none',
            padding: '10px 24px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600,
            boxShadow: '0 4px 15px rgba(79,70,229,0.3)',
            transition: 'all 0.2s',
          }}
            id="nav-login-btn"
            onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)'; }}
            onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 15px rgba(79,70,229,0.3)'; }}>
            Đăng nhập
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 20px 60px', background: '#ffffff' }}>
        {/* Animated background orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)',
            top: '-200px', left: '-200px',
            animation: 'floatOrb 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
            top: '20%', right: '-100px',
            animation: 'floatOrb 10s ease-in-out infinite reverse',
          }} />
          <div style={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
            bottom: '0', left: '30%',
            animation: 'floatOrb 12s ease-in-out infinite 2s',
          }} />
          {/* Grid overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)',
            borderRadius: 999, padding: '8px 20px', fontSize: '0.9rem', fontWeight: 700,
            color: '#4338ca', marginBottom: 32,
            animation: 'fadeInDown 0.6s ease-out',
            boxShadow: '0 4px 12px rgba(79,70,229,0.05)',
          }}>
            <Star size={16} fill="#4338ca" />
            Hệ thống quản lý bãi đỗ xe thế hệ mới
          </div>

          <h1 style={{
            fontSize: 'clamp(2.8rem, 6.5vw, 5rem)', fontWeight: 900,
            lineHeight: 1.15, letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #0f172a 30%, #4338ca 70%, #059669 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 28,
            animation: 'fadeInUp 0.7s ease-out 0.1s both',
          }}>
            Quản lý Bãi đỗ xe<br />Thông minh & Hiệu quả
          </h1>

          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', color: '#475569',
            maxWidth: 620, margin: '0 auto 48px', lineHeight: 1.7,
            animation: 'fadeInUp 0.7s ease-out 0.2s both',
            fontWeight: 500,
          }}>
            Theo dõi chỗ đỗ xe theo thời gian thực, quản lý vé tháng tự động,
            phân tích doanh thu chuyên sâu — tất cả trong một nền tảng duy nhất.
          </p>

          <div style={{
            display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap',
            animation: 'fadeInUp 0.7s ease-out 0.3s both',
          }}>
            <Link to="/register" id="hero-register-btn" style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', textDecoration: 'none',
              padding: '16px 36px', borderRadius: 14, fontSize: '1.05rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 25px rgba(79,70,229,0.3)',
              transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(79,70,229,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(79,70,229,0.3)'; }}>
              Bắt đầu miễn phí
              <ChevronRight size={20} />
            </Link>
            <Link to="/login" id="hero-login-btn" style={{
              background: '#ffffff', border: '1px solid #cbd5e1',
              color: '#334155', textDecoration: 'none',
              padding: '16px 36px', borderRadius: 14, fontSize: '1.05rem', fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
              transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.transform = 'none'; }}>
              Đăng nhập
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ marginTop: 56, display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeInUp 0.7s ease-out 0.4s both' }}>
            {['✓ Không cần cài đặt', '✓ Bảo mật cấp Doanh nghiệp', '✓ Hỗ trợ 24/7'].map((t, i) => (
              <span key={i} style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '60px 5%', background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ textAlign: 'center', padding: '32px 20px', background: '#ffffff', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `linear-gradient(135deg, ${s.color}15, ${s.color}05)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Icon size={26} color={s.color} />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600, marginTop: 10 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '120px 5%', background: '#ffffff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <div style={{
              display: 'inline-block', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 999, padding: '8px 20px', fontSize: '0.9rem', fontWeight: 700, color: '#059669', marginBottom: 20,
            }}>
              Tính năng nổi bật
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 24, color: '#0f172a' }}>
              Mọi thứ bạn cần để<br />
              <span style={{ background: 'linear-gradient(135deg, #4f46e5, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                vận hành bãi đỗ xe hiệu quả
              </span>
            </h2>
            <p style={{ color: '#475569', maxWidth: 580, margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.8, fontWeight: 500 }}>
              Từ quản lý chỗ đỗ đến báo cáo doanh thu — mọi công cụ bạn cần trong một nền tảng thống nhất.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  background: '#ffffff',
                  border: `1px solid rgba(0,0,0,0.06)`,
                  borderRadius: 24, padding: '40px 32px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 20px 50px ${f.color}15`; e.currentTarget.style.borderColor = `${f.color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `${f.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24,
                  }}>
                    <Icon size={26} color={f.color} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12, color: '#0f172a', letterSpacing: '-0.01em' }}>{f.title}</h3>
                  <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '120px 5%', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <div style={{
              display: 'inline-block', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 999, padding: '8px 20px', fontSize: '0.9rem', fontWeight: 700, color: '#7c3aed', marginBottom: 20,
            }}>
              3 bước đơn giản
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 24, color: '#0f172a' }}>
              Bắt đầu trong vài phút
            </h2>
            <p style={{ color: '#475569', maxWidth: 540, margin: '0 auto', lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 500 }}>
              Không cần cài ứng dụng, không cần cấu hình phức tạp. Đăng ký và sử dụng ngay trực tiếp trên nền tảng web.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, position: 'relative' }}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} style={{ textAlign: 'center', position: 'relative', background: '#ffffff', padding: '40px 30px', borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.03)', zIndex: 2 }}>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 72, left: 'calc(50% + 56px)', right: 'calc(-50% + 56px)',
                      height: 2, background: `linear-gradient(90deg, ${step.color}40, transparent)`,
                      display: window.innerWidth < 800 ? 'none' : 'block',
                      zIndex: -1,
                    }} />
                  )}
                  <div style={{
                    width: 72, height: 72, borderRadius: 24,
                    background: `linear-gradient(135deg, ${step.color}15, ${step.color}05)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px', position: 'relative',
                  }}>
                    <Icon size={32} color={step.color} />
                    <div style={{
                      position: 'absolute', top: -10, right: -10,
                      width: 28, height: 28, borderRadius: '50%',
                      background: step.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 900, color: '#fff',
                      boxShadow: `0 4px 10px ${step.color}60`
                    }}>
                      {i + 1}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: step.color, letterSpacing: '0.1em', marginBottom: 12 }}>
                    BƯỚC {step.num}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, color: '#0f172a' }}>{step.title}</h3>
                  <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ROLES SECTION ── */}
      <section style={{ padding: '120px 5%', background: '#ffffff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16, color: '#0f172a' }}>
              Cho mọi vai trò trong tổ chức
            </h2>
            <p style={{ color: '#475569', fontSize: '1.1rem', fontWeight: 500 }}>Mỗi người dùng có giao diện và quyền hạn phù hợp với công việc</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { role: 'Admin', color: '#ef4444', desc: 'Cấu hình hệ thống, bảng giá, toàn quyền quản trị', checks: ['Quản lý người dùng', 'Cấu hình giá', 'Xem báo cáo tổng'] },
              { role: 'Manager', color: '#f59e0b', desc: 'Quản lý tầng, khu vực, chỗ đỗ và vé tháng', checks: ['Quản lý sơ đồ bãi', 'Xem vé tháng', 'Báo cáo vận hành'] },
              { role: 'Staff', color: '#10b981', desc: 'Xử lý xe vào ra, kiểm tra vé', checks: ['Check-in xe', 'Check-out xe', 'Xem bản đồ slot'] },
              { role: 'Driver', color: '#4f46e5', desc: 'Đặt chỗ, mua vé tháng, quản lý xe cá nhân', checks: ['Đặt chỗ trước', 'Mua vé tháng', 'Lịch sử gửi xe'] },
            ].map((item, i) => (
              <div key={i} style={{
                background: `linear-gradient(135deg, ${item.color}05, #ffffff)`,
                border: `1px solid ${item.color}20`,
                borderRadius: 20, padding: '32px 24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  display: 'inline-block', background: `${item.color}15`, border: `1px solid ${item.color}30`,
                  borderRadius: 10, padding: '6px 16px', fontSize: '0.85rem', fontWeight: 800,
                  color: item.color, marginBottom: 16, letterSpacing: '0.05em',
                }}>
                  {item.role.toUpperCase()}
                </div>
                <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, marginBottom: 24, fontWeight: 500 }}>{item.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {item.checks.map((c, j) => (
                   <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                      <CheckCircle size={16} color={item.color} />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 5%', textAlign: 'center', background: '#f8fafc' }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
          border: '1px solid rgba(79,70,229,0.15)', borderRadius: 32, padding: '80px 40px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(79,70,229,0.08)',
        }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.08), transparent)' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 24 }}>🚀</div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 20, letterSpacing: '-0.03em', color: '#0f172a' }}>
              Sẵn sàng nâng cấp<br />bãi đỗ xe của bạn?
            </h2>
            <p style={{ color: '#475569', marginBottom: 40, lineHeight: 1.8, fontSize: '1.15rem', maxWidth: 500, margin: '0 auto 40px', fontWeight: 500 }}>
              Tham gia ngay hôm nay và trải nghiệm sự khác biệt của hệ thống quản lý bãi đỗ xe thông minh.
            </p>
            <Link to="/register" id="cta-register-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', textDecoration: 'none',
              padding: '16px 40px', borderRadius: 14, fontSize: '1.1rem', fontWeight: 800,
              boxShadow: '0 8px 30px rgba(79,70,229,0.3)',
              transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(79,70,229,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(79,70,229,0.3)'; }}>
              Tạo tài khoản miễn phí
              <ChevronRight size={20} />
            </Link>
            <div style={{ marginTop: 24, fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
              Đã có tài khoản?{' '}
              <Link to="/login" id="cta-login-link" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 700 }}>Đăng nhập</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '40px 5%', background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>ParkingPro</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>© 2026 ParkingPro. Đã đăng ký bản quyền.</p>
        <div style={{ display: 'flex', gap: 32 }}>
          <Link to="/login" style={{ fontSize: '0.9rem', color: '#475569', textDecoration: 'none', fontWeight: 600 }}>Đăng nhập</Link>
          <Link to="/register" style={{ fontSize: '0.9rem', color: '#475569', textDecoration: 'none', fontWeight: 600 }}>Đăng ký</Link>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

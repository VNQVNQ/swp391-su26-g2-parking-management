import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyVnPayReturn } from '../services/vnpayApi';
import { CheckCircle, XCircle, ArrowLeft, CreditCard, Calendar, FileText, DollarSign } from 'lucide-react';

export default function VnPayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const paramsObj = {};
    searchParams.forEach((value, key) => {
      paramsObj[key] = value;
    });

    if (Object.keys(paramsObj).length === 0) {
      setError('Không tìm thấy thông tin phản hồi từ cổng thanh toán VNPay.');
      setLoading(false);
      return;
    }

    verifyVnPayReturn(paramsObj)
      .then(res => {
        setResult(res);
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Lỗi khi xác thực kết quả giao dịch.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  const isSuccess = result?.status === 'SUCCESS' || result?.responseCode === '00';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-secondary, #f8fafc)',
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        borderRadius: 20,
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        maxWidth: 520,
        width: '100%',
        padding: '36px 32px',
        textAlign: 'center',
        border: '1px solid var(--border-color, #e2e8f0)'
      }}>
        {loading ? (
          <div style={{ padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 20px', width: 44, height: 44, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Đang xác thực giao dịch VNPay...</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 8 }}>Vui lòng chờ trong giây lát, không tắt trình duyệt.</p>
          </div>
        ) : error ? (
          <div>
            <XCircle size={64} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginBottom: 12 }}>Xác thực thất bại</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, fontWeight: 700 }}>
              <ArrowLeft size={18} /> Về Trang chủ
            </button>
          </div>
        ) : (
          <div>
            {isSuccess ? (
              <CheckCircle size={68} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            ) : (
              <XCircle size={68} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            )}

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: isSuccess ? '#10b981' : '#ef4444',
              marginBottom: 8
            }}>
              {isSuccess ? 'Thanh toán VNPay Thành công!' : 'Thanh toán không thành công'}
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: 24 }}>
              {result?.message || (isSuccess ? 'Giao dịch của bạn đã được xác nhận và cập nhật vào hệ thống.' : 'Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình thanh toán.')}
            </p>

            {/* Details Box */}
            <div style={{
              background: 'var(--bg-secondary, #f8fafc)',
              borderRadius: 14,
              padding: '20px',
              textAlign: 'left',
              marginBottom: 28,
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DollarSign size={16} /> Số tiền thanh toán:
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isSuccess ? '#10b981' : 'var(--text-primary)' }}>
                  ₫{Number(result?.amount || 0).toLocaleString('vi-VN')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} /> Mã giao dịch (TxnRef):
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {result?.txnRef || 'N/A'}
                </span>
              </div>

              {result?.orderInfo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={16} /> Nội dung:
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '60%' }}>
                    {decodeURIComponent(result.orderInfo.replace(/\+/g, ' '))}
                  </span>
                </div>
              )}

              {result?.bankCode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🏦 Ngân hàng:
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3b82f6' }}>
                    {result.bankCode}
                  </span>
                </div>
              )}

              {result?.payDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={16} /> Thời gian:
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {result.payDate.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/, '$3/$2/$1 $4:$5:$6')}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px 18px', borderRadius: 12, fontWeight: 700, fontSize: '0.92rem' }}>
                Về Trang chủ
              </button>
              <button
                onClick={() => {
                  if (result?.txnRef?.startsWith('VEHICLE')) {
                    navigate('/driver/my-vehicles');
                  } else {
                    navigate('/driver/monthly-pass');
                  }
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '12px 18px', borderRadius: 12, fontWeight: 700, fontSize: '0.92rem' }}>
                {result?.txnRef?.startsWith('VEHICLE') ? 'Quản lý Xe của tôi' : 'Quản lý Vé tháng'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

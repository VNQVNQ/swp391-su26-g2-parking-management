import api from './api';

const BASE = '/api/v1/payment/vnpay';

/**
 * Request creation of VNPay payment URL from backend
 */
export const createVnPayUrl = async ({ amount, orderInfo, orderType = 'other', targetId, targetType, returnUrl }) => {
  const res = await api.post(`${BASE}/create-url`, {
    amount,
    orderInfo,
    orderType,
    targetId,
    targetType,
    returnUrl
  });
  return res.data?.data?.paymentUrl ?? res.data?.paymentUrl;
};

/**
 * Verify return parameters from VNPay gateway
 */
export const verifyVnPayReturn = async (params) => {
  const res = await api.get(`${BASE}/vnpay-return`, { params });
  return res.data?.data ?? res.data;
};

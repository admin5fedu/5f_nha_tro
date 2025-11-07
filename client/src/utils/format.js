// Format number with thousand separators
export const formatNumber = (value) => {
  if (!value && value !== 0) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('vi-VN').format(num);
};

// Parse formatted number back to number
export const parseNumber = (value) => {
  if (!value) return '';
  const num = typeof value === 'string' ? value.replace(/,/g, '') : value;
  return num;
};

// Format currency (VND)
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 đ';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '0 đ';
  return `${new Intl.NumberFormat('vi-VN').format(num)} đ`;
};

// Calculate days until expiry
export const getDaysUntilExpiry = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(endDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get expiry status label
export const getExpiryStatus = (endDate) => {
  const days = getDaysUntilExpiry(endDate);
  if (days === null) return null;
  if (days < 0) return { label: 'Đã hết hạn', color: 'bg-red-100 text-red-800' };
  if (days <= 30) return { label: `Còn ${days} ngày`, color: 'bg-red-100 text-red-800' };
  if (days <= 60) return { label: `Còn ${days} ngày`, color: 'bg-orange-100 text-orange-800' };
  if (days <= 90) return { label: `Còn ${days} ngày`, color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Còn hiệu lực', color: 'bg-green-100 text-green-800' };
};


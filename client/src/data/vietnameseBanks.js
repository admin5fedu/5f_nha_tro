// Danh sách các ngân hàng Việt Nam với mã ngân hàng cho VietQR
export const vietnameseBanks = [
  { code: 'VCB', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)' },
  { code: 'VTB', name: 'Ngân hàng TMCP Công Thương Việt Nam (Vietinbank)' },
  { code: 'BID', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)' },
  { code: 'TCB', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)' },
  { code: 'ACB', name: 'Ngân hàng TMCP Á Châu (ACB)' },
  { code: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)' },
  { code: 'TPB', name: 'Ngân hàng TMCP Tiên Phong (TPBank)' },
  { code: 'MSB', name: 'Ngân hàng TMCP Hàng Hải (MSB)' },
  { code: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)' },
  { code: 'HDB', name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)' },
  { code: 'OCB', name: 'Ngân hàng TMCP Phương Đông (OCB)' },
  { code: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)' },
  { code: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)' },
  { code: 'EIB', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam (Eximbank)' },
  { code: 'MBB', name: 'Ngân hàng TMCP Quân đội (MB)' },
  { code: 'NAB', name: 'Ngân hàng TMCP Nam Á (NamABank)' },
  { code: 'VAB', name: 'Ngân hàng TMCP Việt Á (VietABank)' },
  { code: 'BAB', name: 'Ngân hàng TMCP Bắc Á (BacABank)' },
  { code: 'PGB', name: 'Ngân hàng TMCP Xăng dầu Petrolimex (PGBank)' },
  { code: 'GPB', name: 'Ngân hàng TMCP Dầu Khí Toàn Cầu (GPBank)' },
  { code: 'DAB', name: 'Ngân hàng TMCP Đông Á (DongABank)' },
  { code: 'SEAB', name: 'Ngân hàng TMCP Đông Nam Á (SeABank)' },
  { code: 'ABB', name: 'Ngân hàng TMCP An Bình (ABBank)' },
  { code: 'VCCB', name: 'Ngân hàng TMCP Bản Việt (VietCapitalBank)' },
  { code: 'KLB', name: 'Ngân hàng TMCP Kiên Long (KienLongBank)' },
  { code: 'NCB', name: 'Ngân hàng TMCP Quốc Dân (NCB)' },
  { code: 'OJB', name: 'Ngân hàng TMCP Đại Dương (OceanBank)' },
  { code: 'PGB', name: 'Ngân hàng TMCP Xăng dầu Petrolimex (PGBank)' },
  { code: 'PUB', name: 'Ngân hàng TMCP Đại Chúng Việt Nam (PublicBank)' },
  { code: 'SCB', name: 'Ngân hàng TMCP Sài Gòn (SCB)' },
  { code: 'VDB', name: 'Ngân hàng Phát triển Việt Nam (VDB)' },
  { code: 'AGB', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)' },
  { code: 'BVB', name: 'Ngân hàng TMCP Bảo Việt (BaoVietBank)' },
  { code: 'VAF', name: 'Ngân hàng Liên doanh Việt - Nga (VRB)' },
];

// Hàm lấy mã ngân hàng từ tên
export const getBankCode = (bankName) => {
  if (!bankName) return null;
  const bank = vietnameseBanks.find(b => 
    bankName.toLowerCase().includes(b.name.toLowerCase()) ||
    bankName.toLowerCase().includes(b.code.toLowerCase())
  );
  return bank ? bank.code : null;
};

// Hàm tạo URL QR code từ VietQR API
export const generateVietQRCode = (bankCode, accountNumber, accountHolder, amount = '', memo = '') => {
  if (!bankCode || !accountNumber || !accountHolder) {
    return null;
  }
  // VietQR API format: https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png
  // Hoặc sử dụng API endpoint để tạo QR code động
  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png`;
  return qrUrl;
};


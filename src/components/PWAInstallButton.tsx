import React, { useState } from 'react';
import {
  Smartphone,
  Share2,
  PlusSquare,
  X,
  CheckCircle2,
  WifiOff,
  Hand,
  Camera,
  QrCode,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'compact' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyLink = () => {
    try {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleActionClick = () => {
    setShowModal(true);
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    currentUrl || 'https://ais-dev-uqudezp5fc2aaclcaxymv2-651590638364.asia-southeast1.run.app'
  )}`;

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleActionClick}
          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] transition-colors cursor-pointer shadow-2xs ${className}`}
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#166534]" />
            <span>Phù hợp với điện thoại</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={handleActionClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#166534] bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-2xs ${className}`}
          title="Giao diện & tính năng tối ưu phù hợp với điện thoại"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#166534]" />
          <span className="hidden sm:inline">Phù hợp với điện thoại</span>
          <span className="sm:hidden">Bản điện thoại</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleActionClick}
          className={`px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Phù hợp với điện thoại</span>
        </button>
      )}

      {/* Modal giới thiệu & tối ưu phù hợp với điện thoại */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-[#DCE5D8] space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E6EFE2] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EEF5EE] text-[#2D6A4F] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1B2A22]">
                    Phù hợp với điện thoại
                  </h3>
                  <p className="text-[11px] text-[#5C7467]">
                    Tối ưu trải nghiệm sử dụng trên smartphone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-[#5C7467] hover:bg-[#EEF5EE] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Highlight Banner */}
            <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#166534] block">
                  Ứng dụng đã sẵn sàng cho điện thoại
                </span>
                <span className="text-[#385747] text-[11px]">
                  Tự động co giãn theo kích thước màn hình, hỗ trợ cảm ứng mượt mà.
                </span>
              </div>
            </div>

            {/* Key Mobile Features Grid */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[#1B2A22] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F]" />
                Tính năng tối ưu cho di động
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[#F6F9F5] border border-[#DCE5D8] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1B2A22]">
                    <Hand className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Thao tác 1 tay</span>
                  </div>
                  <p className="text-[11px] text-[#5C7467] leading-relaxed">
                    Thanh điều hướng dưới đáy màn hình, dễ bấm bằng ngón tay cái khi đang nấu ăn.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F9F5] border border-[#DCE5D8] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1B2A22]">
                    <WifiOff className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Dùng Offline</span>
                  </div>
                  <p className="text-[11px] text-[#5C7467] leading-relaxed">
                    Xem giỏ đi chợ và công thức nấu ngay cả khi mất sóng trong tầng hầm siêu thị.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F9F5] border border-[#DCE5D8] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1B2A22]">
                    <Camera className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Chụp ảnh món ăn</span>
                  </div>
                  <p className="text-[11px] text-[#5C7467] leading-relaxed">
                    Đăng ảnh chụp thực tế trực tiếp từ camera hoặc thư viện ảnh điện thoại.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#F6F9F5] border border-[#DCE5D8] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#1B2A22]">
                    <Smartphone className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Không tốn RAM/Bộ nhớ</span>
                  </div>
                  <p className="text-[11px] text-[#5C7467] leading-relaxed">
                    Chạy trực tiếp trên trình duyệt, không cần tải bộ cài nặng nề hàng trăm MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Open on Mobile Phone with QR Code */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#423326] flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#855B32]" />
                  Mở trên điện thoại của bạn
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[11px] font-semibold text-[#855B32] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Đã sao chép link</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl bg-white p-1.5 border border-[#E5DDD0] shrink-0 shadow-2xs">
                  <img
                    src={qrUrl}
                    alt="Mã QR mở trên điện thoại"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-[#6E5B4B] space-y-1">
                  <p>
                    Quét mã QR bằng <strong>Camera điện thoại</strong> hoặc ứng dụng Zalo để mở Món Khôn ngay lập tức.
                  </p>
                  <p className="text-[#855B32] font-mono text-[10px] truncate max-w-[200px]">
                    {currentUrl || 'monkhon.app'}
                  </p>
                </div>
              </div>
            </div>

            {/* Guide to Add to Home Screen (Optional) */}
            <div className="space-y-2 bg-[#F8FBF7] p-3.5 rounded-2xl border border-[#DCE5D8] text-xs text-[#2A3C32]">
              <div className="font-bold text-[#1B2A22] flex items-center justify-between">
                <span>Ghim ra Màn hình chính (Dùng như App)</span>
                {isInstalled && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Đã ghim
                  </span>
                )}
              </div>

              {/* Install trigger if supported */}
              {isInstallable && !isInstalled && (
                <button
                  type="button"
                  onClick={() => install()}
                  className="w-full py-2 px-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors mb-2"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Bấm để Thêm vào Màn hình chính ngay</span>
                </button>
              )}

              <div className="space-y-1.5 text-[11px] text-[#4A6355]">
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-[#2D6A4F] shrink-0">iOS Safari:</span>
                  <span>
                    Bấm biểu tượng <strong>Chia sẻ (Share)</strong> <Share2 className="w-3 h-3 inline mx-0.5 text-[#2D6A4F]" /> rồi chọn <strong>"Thêm vào MH chính"</strong> <PlusSquare className="w-3 h-3 inline mx-0.5 text-[#2D6A4F]" />.
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-[#2D6A4F] shrink-0">Android:</span>
                  <span>
                    Bấm menu <strong>3 dấu chấm</strong> góc trên trình duyệt và chọn <strong>"Thêm vào Màn hình chính"</strong>.
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1B2A22] text-white text-xs font-semibold hover:bg-black transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};

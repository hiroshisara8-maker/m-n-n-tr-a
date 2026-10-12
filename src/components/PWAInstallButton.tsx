import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, Check } from 'lucide-react';
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
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EEF5EE] text-[#1B4332] text-xs font-medium">
          <Check className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>Đã cài ứng dụng trên máy</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 bg-[#FCEEF3] hover:bg-[#F8DDE8] text-[#D85A7F] border border-[#F2D5DF] transition-colors cursor-pointer ${className}`}
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#D85A7F]" />
            <span>Cài App về điện thoại</span>
          </span>
          <Download className="w-3.5 h-3.5" />
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#D85A7F] bg-[#FCEEF3] hover:bg-[#F8DDE8] border border-[#F2D5DF] rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-2xs ${className}`}
          title="Cài đặt ứng dụng Món Khôn về màn hình điện thoại"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cài App về điện thoại</span>
          <span className="sm:hidden">Cài App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Cài ứng dụng về điện thoại</span>
        </button>
      )}

      {/* Guide Dialog for iOS Safari & manual browser steps */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#DCE5D8] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E6EFE2] pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#2D6A4F]" />
                <h3 className="text-base font-display font-semibold text-[#1B2A22]">
                  Cài đặt Món Khôn về máy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-lg text-[#5C7467] hover:bg-[#EEF5EE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* App Icon Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFF8FA] border border-[#F2D5DF]">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#F4C2D7] shadow-sm shrink-0 bg-white">
                <img
                  src="/apple-touch-icon.png"
                  alt="Logo Món Khôn"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-[#D85A7F]">Món Khôn</div>
                <div className="text-[11px] text-[#6E4F5B]">Biểu tượng hiển thị trên Màn hình chính của bạn</div>
              </div>
            </div>

            <p className="text-xs text-[#4A6355] leading-relaxed">
              Bạn có thể sử dụng <strong>Món Khôn</strong> toàn màn hình như một ứng dụng native trên điện thoại, mở nhanh từ màn hình chính và dùng mượt mà ngay cả khi mạng yếu:
            </p>

            <div className="space-y-3 bg-[#F8FBF7] p-3.5 rounded-xl border border-[#DCE5D8] text-xs text-[#2A3C32]">
              <div className="font-semibold text-[#1B2A22]">Dành cho iPhone / iPad (Safari):</div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-mono text-[11px] shrink-0 font-bold">
                  1
                </span>
                <span>
                  Bấm vào nút <strong>Chia sẻ (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-[#2D6A4F]" /> ở thanh công cụ dưới đáy trình duyệt Safari.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-mono text-[11px] shrink-0 font-bold">
                  2
                </span>
                <span>
                  Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[#2D6A4F]" /> (Add to Home Screen).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-mono text-[11px] shrink-0 font-bold">
                  3
                </span>
                <span>
                  Bấm <strong>Thêm (Add)</strong> ở góc trên bên phải để hoàn tất!
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#FDF6F0] rounded-xl border border-[#F3DEC8] text-[11px] text-[#7C3A13]">
              <strong>Dành cho Android (Chrome / Cốc Cốc):</strong> Bấm vào biểu tượng 3 dấu chấm ở góc trên trình duyệt và chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#2D6A4F] text-white text-xs font-semibold hover:bg-[#1B4332] transition cursor-pointer"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};

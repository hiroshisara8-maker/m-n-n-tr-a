import React from 'react';
import { X, Palette, Check, RotateCcw, Type, Sparkles } from 'lucide-react';
import { ThemePreset, UserThemeConfig } from '../types';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'sakura-pink',
    name: 'Hồng Đào Món Khôn (Đồng bộ Logo)',
    description: 'Tông hồng pastel ngọt ngào, trẻ trung đồng điệu với biểu tượng Món Khôn',
    primary: '#D85A7F',
    primaryDark: '#B83D62',
    bg: '#FFF8FA',
    surface: '#FFFFFF',
    soft: '#FCEEF3',
    border: '#F2D5DF',
    text: '#2D1B22',
    muted: '#6E4F5B',
  },
  {
    id: 'matcha-sage',
    name: 'Xanh Trà Matcha',
    description: 'Tông xanh lá pastel dịu mắt, tươi mát cảm hứng nguyên liệu sạch',
    primary: '#2D6A4F',
    primaryDark: '#1B4332',
    bg: '#F6F9F5',
    surface: '#FFFFFF',
    soft: '#EEF5EE',
    border: '#DCE5D8',
    text: '#1B2A22',
    muted: '#4A6355',
  },
  {
    id: 'lavender-milk',
    name: 'Tím Oải Hương',
    description: 'Nhẹ nhàng, thư giãn với sắc tím khoai môn pha kem sữa',
    primary: '#6D4C9E',
    primaryDark: '#51347D',
    bg: '#F8F7FC',
    surface: '#FFFFFF',
    soft: '#F1EDF9',
    border: '#DFD6F0',
    text: '#231B30',
    muted: '#5D5073',
  },
  {
    id: 'apricot-honey',
    name: 'Cam Đào Mật Ong',
    description: 'Ấm áp như gian bếp chiều với sắc cam đào và kem bơ',
    primary: '#D46A43',
    primaryDark: '#B04E2B',
    bg: '#FDF8F5',
    surface: '#FFFFFF',
    soft: '#FAEEE7',
    border: '#EED8CC',
    text: '#2E1F18',
    muted: '#6E5347',
  },
  {
    id: 'ocean-breeze',
    name: 'Xanh Mây Trời',
    description: 'Sáng sủa, thanh lịch với sắc xanh dương pastel mát mẻ',
    primary: '#2B6CB0',
    primaryDark: '#1E4E8C',
    bg: '#F5F9FC',
    surface: '#FFFFFF',
    soft: '#EAF2FA',
    border: '#D4E3F2',
    text: '#1A2634',
    muted: '#4A6078',
  },
  {
    id: 'cozy-night',
    name: 'Đêm Dịu Mắt (Dark Pastel)',
    description: 'Nền tối dịu nhẹ bảo vệ mắt khi lên thực đơn vào buổi đêm',
    primary: '#E07A9B',
    primaryDark: '#C95B7F',
    bg: '#18151C',
    surface: '#221E28',
    soft: '#2C2634',
    border: '#3B3346',
    text: '#F7F2F5',
    muted: '#B8A8B2',
  },
];

export const DEFAULT_THEME_CONFIG: UserThemeConfig = {
  presetId: 'sakura-pink',
  primary: '#D85A7F',
  primaryDark: '#B83D62',
  bg: '#FFF8FA',
  surface: '#FFFFFF',
  soft: '#FCEEF3',
  border: '#F2D5DF',
  text: '#2D1B22',
  muted: '#6E4F5B',
  fontStyle: 'editorial',
  radiusScale: 'standard',
  fontScale: 'normal',
};

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  theme: UserThemeConfig;
  onChangeTheme: (next: UserThemeConfig) => void;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  theme,
  onChangeTheme,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleSelectPreset = (preset: ThemePreset) => {
    onChangeTheme({
      ...theme,
      presetId: preset.id,
      primary: preset.primary,
      primaryDark: preset.primaryDark,
      bg: preset.bg,
      surface: preset.surface,
      soft: preset.soft,
      border: preset.border,
      text: preset.text,
      muted: preset.muted,
    });
  };

  const handleReset = () => {
    onChangeTheme(DEFAULT_THEME_CONFIG);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6EFE2] bg-[#F8FBF7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-[#2D6A4F]" />
            <div>
              <h2 className="text-lg font-display font-semibold text-[#1B2A22]">
                Tùy chỉnh Chủ đề & Giao diện theo sở thích
              </h2>
              <p className="text-xs text-[#4A6355]">
                Thay đổi bảng màu pastel, màu nhấn, kiểu chữ và độ bo góc ngay lập tức
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#4A6355] hover:text-[#1B2A22] hover:bg-[#EAF2E8] transition-colors cursor-pointer"
            aria-label="Đóng bảng tùy chỉnh chủ đề"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-7">
          {/* 1. Curated Pastel Theme Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1B2A22] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F]" />
                1. Chọn bảng màu chủ đề Pastel dựng sẵn
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-[#4A6355] hover:text-[#1B2A22] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Khôi phục mặc định
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected = theme.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 bg-[#F8FBF7]'
                        : 'border-[#DCE5D8] bg-white hover:border-[#2D6A4F]'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Swatch preview circles */}
                        <div className="flex -space-x-1 shrink-0">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: preset.soft }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: preset.bg }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#1B2A22] truncate">
                          {preset.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4A6355] line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Color Pickers */}
          <div className="space-y-3 pt-4 border-t border-[#E6EFE2]">
            <label className="block text-xs font-semibold text-[#1B2A22]">
              2. Tự phối màu cá nhân theo ý thích
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#F8FBF7] border border-[#DCE5D8] space-y-1.5">
                <span className="text-[11px] text-[#4A6355] block">Màu điểm nhấn chính</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primary}
                    onChange={(e) =>
                      onChangeTheme({
                        ...theme,
                        presetId: 'custom',
                        primary: e.target.value,
                        primaryDark: e.target.value,
                      })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs text-[#1B2A22] uppercase">
                    {theme.primary}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FBF7] border border-[#DCE5D8] space-y-1.5">
                <span className="text-[11px] text-[#4A6355] block">Màu nền chính</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.bg}
                    onChange={(e) =>
                      onChangeTheme({
                        ...theme,
                        presetId: 'custom',
                        bg: e.target.value,
                      })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs text-[#1B2A22] uppercase">
                    {theme.bg}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FBF7] border border-[#DCE5D8] space-y-1.5">
                <span className="text-[11px] text-[#4A6355] block">Màu thẻ phụ (Soft)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.soft}
                    onChange={(e) =>
                      onChangeTheme({
                        ...theme,
                        presetId: 'custom',
                        soft: e.target.value,
                      })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs text-[#1B2A22] uppercase">
                    {theme.soft}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FBF7] border border-[#DCE5D8] space-y-1.5">
                <span className="text-[11px] text-[#4A6355] block">Màu chữ chính</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.text}
                    onChange={(e) =>
                      onChangeTheme({
                        ...theme,
                        presetId: 'custom',
                        text: e.target.value,
                      })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs text-[#1B2A22] uppercase">
                    {theme.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Typography, Corner Radius & Font Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E6EFE2]">
            {/* Font style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#1B2A22] flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-[#2D6A4F]" />
                Kiểu chữ tiêu đề
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'editorial', label: 'Nghệ thuật ấm áp (Serif)' },
                  { id: 'modern', label: 'Trẻ trung hiện đại (Sans)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onChangeTheme({
                        ...theme,
                        fontStyle: opt.id as UserThemeConfig['fontStyle'],
                      })
                    }
                    className={`w-full px-3 py-2 text-xs font-medium rounded-xl border text-left cursor-pointer ${
                      theme.fontStyle === opt.id
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                        : 'bg-[#F8FBF7] text-[#1B2A22] border-[#DCE5D8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border radius */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#1B2A22] block">
                Độ bo góc thẻ & nút
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'soft', label: 'Bo tròn mềm mại' },
                  { id: 'standard', label: 'Tiêu chuẩn cân đối' },
                  { id: 'sharp', label: 'Gọn gàng ít bo' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onChangeTheme({
                        ...theme,
                        radiusScale: opt.id as UserThemeConfig['radiusScale'],
                      })
                    }
                    className={`w-full px-3 py-2 text-xs font-medium rounded-xl border text-left cursor-pointer ${
                      theme.radiusScale === opt.id
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                        : 'bg-[#F8FBF7] text-[#1B2A22] border-[#DCE5D8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#1B2A22] block">
                Kích thước chữ
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'compact', label: 'Nhỏ gọn (95%)' },
                  { id: 'normal', label: 'Mặc định (100%)' },
                  { id: 'large', label: 'Lớn dễ nhìn (106%)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onChangeTheme({
                        ...theme,
                        fontScale: opt.id as UserThemeConfig['fontScale'],
                      })
                    }
                    className={`w-full px-3 py-2 text-xs font-medium rounded-xl border text-left cursor-pointer ${
                      theme.fontScale === opt.id
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                        : 'bg-[#F8FBF7] text-[#1B2A22] border-[#DCE5D8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E6EFE2] bg-[#F8FBF7] flex items-center justify-between">
          <span className="text-xs text-[#4A6355]">
            Chủ đề của bạn được tự động lưu cho những lần truy cập sau.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl cursor-pointer"
          >
            Hoàn tất & Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

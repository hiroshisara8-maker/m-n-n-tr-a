import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  presets?: number[];
  quickDeltas?: number[];
  id?: string;
  name?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Format raw number to display string with dot separator: 300000 -> "300.000"
 */
function formatNumberWithDots(val: number | string): string {
  if (val === '' || val === null || val === undefined) return '';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/\D/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('vi-VN');
}

/**
 * Parse display string with dot separator back to raw integer
 */
function parseDotsToNumber(str: string): number {
  const clean = str.replace(/\D/g, '');
  if (!clean) return 0;
  return parseInt(clean, 10);
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Nhập số tiền...',
  min = 0,
  max,
  presets,
  quickDeltas = [10000, 50000, 100000],
  id,
  name,
  autoFocus,
  required,
  disabled,
}) => {
  // Local string state to allow natural user typing, deleting, and editing anywhere
  const [displayValue, setDisplayValue] = useState<string>(
    value ? formatNumberWithDots(value) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  // Synchronize when value changes externally (e.g. from presets or reset)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? formatNumberWithDots(value) : '');
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    
    // Extract only digits
    const digitsOnly = rawInput.replace(/\D/g, '');
    
    if (digitsOnly === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const num = parseInt(digitsOnly, 10);
    
    // Check max if defined
    if (max !== undefined && num > max) {
      return;
    }

    // Format immediately with commas/dots for clean feedback
    setDisplayValue(formatNumberWithDots(num));
    onChange(num);
  };

  const handleBlur = () => {
    setIsFocused(false);
    let num = parseDotsToNumber(displayValue);
    if (num < min && num > 0) {
      num = min;
    }
    setDisplayValue(num > 0 ? formatNumberWithDots(num) : '');
    onChange(num);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleClear = () => {
    setDisplayValue('');
    onChange(0);
  };

  const handleAddDelta = (delta: number) => {
    const current = parseDotsToNumber(displayValue) || value || 0;
    const next = Math.max(min, current + delta);
    if (max !== undefined && next > max) return;
    setDisplayValue(formatNumberWithDots(next));
    onChange(next);
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          required={required}
          disabled={disabled}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full pr-16 pl-3.5 py-2.5 font-mono tabular-nums text-base font-semibold text-[#1B2A22] bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl transition-all focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 ${className}`}
        />
        <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
          {displayValue && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="pointer-events-auto p-1 text-[#8FA698] hover:text-[#DC2626] rounded transition-colors"
              title="Xoá để nhập lại"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          <span className="text-xs font-semibold text-[#5C7467] bg-[#E8EFE5] px-1.5 py-0.5 rounded">
            VNĐ
          </span>
        </div>
      </div>

      {/* Quick Add Increment Badges (+10k, +50k, +100k) */}
      {quickDeltas && quickDeltas.length > 0 && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[#6B7F73] text-[10px] uppercase font-semibold mr-0.5">
            Tăng nhanh:
          </span>
          {quickDeltas.map((delta) => {
            const label =
              delta >= 1000000
                ? `+${delta / 1000000}tr`
                : delta >= 1000
                ? `+${delta / 1000}k`
                : `+${delta}`;
            return (
              <button
                key={delta}
                type="button"
                onClick={() => handleAddDelta(delta)}
                className="px-2 py-0.5 bg-[#EEF4ED] hover:bg-[#D8F3DC] text-[#2D6A4F] hover:text-[#1B4332] font-mono tabular-nums font-medium rounded border border-[#DCE5D8] transition-colors cursor-pointer"
                title={`Cộng thêm ${delta.toLocaleString('vi-VN')} đ`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Preset Buttons if provided */}
      {presets && presets.length > 0 && !disabled && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {presets.map((preset) => {
            const isSelected = value === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setDisplayValue(formatNumberWithDots(preset));
                  onChange(preset);
                }}
                className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-2xs font-semibold'
                    : 'bg-[#F6F9F5] text-[#4A6355] border-[#DCE5D8] hover:border-[#2D6A4F] hover:text-[#1B2A22]'
                }`}
              >
                {preset.toLocaleString('vi-VN')}đ
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

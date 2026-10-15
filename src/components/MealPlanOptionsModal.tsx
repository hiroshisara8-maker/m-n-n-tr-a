import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Shuffle,
  AlertCircle,
  Utensils,
  ShieldCheck,
  Clock,
  DollarSign,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { MealSlotType, DietaryPreferences } from '../types';
import { formatVND } from '../utils/mealMath';

interface MealPlanOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysCount: number;
  peopleCount: number;
  budget: number;
  dietaryPreferences?: DietaryPreferences;
  onOpenDietarySettings?: () => void;
  onConfirmGenerate: (options: {
    avoidDuplicates: boolean;
    strategy: 'balanced' | 'budget_saver' | 'pantry_first';
    slots: MealSlotType[];
    filterDietary?: boolean;
  }) => void;
}

export const MealPlanOptionsModal: React.FC<MealPlanOptionsModalProps> = ({
  isOpen,
  onClose,
  daysCount,
  peopleCount,
  budget,
  dietaryPreferences,
  onOpenDietarySettings,
  onConfirmGenerate,
}) => {
  const [avoidDuplicates, setAvoidDuplicates] = useState(true);
  const [filterDietary, setFilterDietary] = useState(true);
  const [strategy, setStrategy] = useState<'balanced' | 'budget_saver' | 'pantry_first'>('balanced');
  const [selectedSlots, setSelectedSlots] = useState<MealSlotType[]>(['Sáng', 'Trưa', 'Tối']);

  if (!isOpen) return null;

  const totalRestrictions =
    (dietaryPreferences?.allergies?.length || 0) +
    (dietaryPreferences?.customAllergies?.length || 0) +
    (dietaryPreferences?.dislikes?.length || 0) +
    (dietaryPreferences?.customDislikes?.length || 0) +
    (dietaryPreferences?.customItems?.length || 0) +
    (dietaryPreferences?.excludedDishIds?.length || 0);

  const toggleSlot = (s: MealSlotType) => {
    if (selectedSlots.includes(s)) {
      if (selectedSlots.length === 1) return; // Keep at least one
      setSelectedSlots(selectedSlots.filter((x) => x !== s));
    } else {
      setSelectedSlots([...selectedSlots, s]);
    }
  };

  const handleApply = () => {
    onConfirmGenerate({
      avoidDuplicates,
      strategy,
      slots: selectedSlots,
      filterDietary,
    });
    onClose();
  };

  const totalMeals = daysCount * selectedSlots.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6EFE2] flex items-center justify-between bg-[#F8FBF7]">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#1B2A22] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2D6A4F]" />
              Tùy chọn gợi ý thực đơn thông minh
            </h2>
            <p className="text-xs text-[#5C7467] mt-0.5">
              Thiết lập thuật toán gợi ý món theo khẩu vị, chống trùng lặp và tiết kiệm chi phí.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5C7467] hover:text-[#1B2A22] rounded-lg hover:bg-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Duplication filter option */}
          <div className="p-4 rounded-xl bg-[#EEF5EE] border border-[#B7D5BF] space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2D6A4F] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-[#1B2A22]">
                    Chống trùng món tuyệt đối (100% món khác nhau)
                  </div>
                  <div className="text-[11px] text-[#4A6355]">
                    Mỗi bữa trong chu kỳ {daysCount} ngày sẽ là một món hoàn toàn riêng biệt.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={avoidDuplicates}
                  onChange={(e) => setAvoidDuplicates(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D6A4F]"></div>
              </label>
            </div>
            {avoidDuplicates && (
              <div className="text-[11px] text-[#2D6A4F] font-medium pt-1 border-t border-[#CFE0D2] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Đang bảo đảm không lặp lại bất kỳ món ăn nào trong tuần!
              </div>
            )}
          </div>

          {/* Dietary safety option (Allergies & Dislikes) */}
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-[#1B2A22]">
                    Lọc bỏ món dị ứng & món ghét ({totalRestrictions} quy tắc đang lưu)
                  </div>
                  <div className="text-[11px] text-[#7F1D1D]">
                    Tuyệt đối không gợi ý món chứa thành phần dị ứng hoặc khẩu vị bạn không thích.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={filterDietary}
                  onChange={(e) => setFilterDietary(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DC2626]"></div>
              </label>
            </div>

            {onOpenDietarySettings && (
              <div className="pt-2 border-t border-[#FECACA] flex items-center justify-between text-[11px]">
                <span className="text-[#991B1B]">
                  {totalRestrictions > 0
                    ? `Đang áp dụng: ${totalRestrictions} chất/món hạn chế`
                    : 'Chưa chọn chất dị ứng nào'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDietarySettings();
                  }}
                  className="text-[#DC2626] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Tùy chỉnh Dị ứng & Món ghét <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Slot Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#1B2A22]">
              Lên thực đơn cho các bữa ăn nào?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Sáng', 'Trưa', 'Tối'] as MealSlotType[]).map((s) => {
                const isSelected = selectedSlots.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSlot(s)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                        : 'bg-white text-[#4A6355] border-[#DCE5D8] hover:bg-[#F8FBF7]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    Bữa {s}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-[#5C7467]">
              Tổng cộng: <strong>{totalMeals} bữa ăn</strong> cho {peopleCount} người ({daysCount} ngày).
            </div>
          </div>

          {/* Suggestion Strategy */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#1B2A22]">
              Tiêu chí ưu tiên gợi ý món
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'balanced',
                  title: 'Cân bằng dinh dưỡng & Đa dạng (Khuyên dùng)',
                  desc: 'Kết hợp hài hòa món mặn, món xào, món canh và điểm tâm sáng nhẹ bụng.',
                  icon: Utensils,
                },
                {
                  id: 'pantry_first',
                  title: 'Ưu tiên giải cứu tủ lạnh (Tiết kiệm tối đa)',
                  desc: 'Tận dụng triệt để nguyên liệu sắp hết hạn trong kho để số tiền phải chi thêm thấp nhất.',
                  icon: DollarSign,
                },
                {
                  id: 'budget_saver',
                  title: 'Món nhanh & Siêu tiết kiệm',
                  desc: 'Ưu tiên các món nấu nhanh dưới 15 phút với chi phí nguyên liệu bình dân.',
                  icon: Clock,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = strategy === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setStrategy(item.id as any)}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#EEF5EE] border-[#2D6A4F] ring-1 ring-[#2D6A4F]'
                        : 'bg-white border-[#E6EFE2] hover:border-[#95D5B2]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#2D6A4F]' : 'text-[#6B7F73]'}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#1B2A22]">{item.title}</div>
                      <div className="text-[11px] text-[#5C7467] mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E6EFE2] bg-[#F8FBF7] flex items-center justify-between gap-3">
          <div className="text-xs text-[#5C7467]">
            Ngân sách: <strong className="text-[#1B2A22] font-mono">{formatVND(budget)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#4A6355] hover:text-[#1B2A22] rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              Lập thực đơn ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

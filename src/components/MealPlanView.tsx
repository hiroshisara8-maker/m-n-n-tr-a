import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  Utensils,
  ShoppingBag,
  ArrowRight,
  Edit2,
  X,
  Repeat,
  Shuffle,
  SlidersHorizontal,
  RotateCcw,
  ShieldAlert,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { Dish, MealSlotType, NavTab, PantryItem, PlannedMeal, DietaryPreferences } from '../types';
import { evaluateDishWithPantry, formatVND, isDishRestricted } from '../utils/mealMath';
import { DishImage } from './DishImage';
import { CurrencyInput } from './CurrencyInput';
import { MealSwapModal } from './MealSwapModal';
import { MealPlanOptionsModal } from './MealPlanOptionsModal';

interface MealPlanViewProps {
  budget: number;
  onUpdateBudget?: (newBudget: number) => void;
  daysCount: number;
  peopleCount: number;
  dishes: Dish[];
  pantry: PantryItem[];
  plannedMeals: PlannedMeal[];
  totalPlannedCost: number;
  totalSavedFromPantry: number;
  remainingBudget: number;
  dietaryPreferences?: DietaryPreferences;
  onAddMealToSlot: (
    dishId: string,
    dayIndex: number,
    slot: MealSlotType,
    mode: 'cook' | 'eat_out'
  ) => void;
  onRemovePlannedMeal: (mealId: string) => void;
  onMarkMealCooked: (mealId: string) => void;
  onAutoGeneratePlan: (options?: any) => void;
  onSelectDishDetail: (dish: Dish) => void;
  onNavigateTab: (tab: NavTab) => void;
  onUpdatePlannedMeal?: (
    mealId: string,
    updates: {
      dishId: string;
      servings: number;
      mode: 'cook' | 'eat_out';
      slot?: MealSlotType;
      dayIndex?: number;
    }
  ) => void;
  onClearPlan?: () => void;
}

export const MealPlanView: React.FC<MealPlanViewProps> = ({
  budget,
  onUpdateBudget,
  daysCount,
  peopleCount,
  dishes,
  pantry,
  plannedMeals,
  totalPlannedCost,
  totalSavedFromPantry,
  remainingBudget,
  dietaryPreferences,
  onAddMealToSlot,
  onRemovePlannedMeal,
  onMarkMealCooked,
  onAutoGeneratePlan,
  onSelectDishDetail,
  onNavigateTab,
  onUpdatePlannedMeal,
  onClearPlan,
}) => {
  const [activeDayAdd, setActiveDayAdd] = useState<{
    dayIndex: number;
    slot: MealSlotType;
  } | null>(null);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget);
  const [selectedDishId, setSelectedDishId] = useState<string>(dishes[0]?.id || '');
  const [selectedMode, setSelectedMode] = useState<'cook' | 'eat_out'>('cook');
  const [swappingMeal, setSwappingMeal] = useState<PlannedMeal | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Check if any planned meal contains allergy or dislike
  const flaggedPlannedMeals = plannedMeals.map((meal) => {
    const dish = dishes.find((d) => d.id === meal.dishId);
    if (!dish) return null;
    const restricted = isDishRestricted(dish, dietaryPreferences);
    if (restricted.isRestricted) {
      return { meal, dish, restricted };
    }
    return null;
  }).filter(Boolean) as Array<{
    meal: PlannedMeal;
    dish: Dish;
    restricted: ReturnType<typeof isDishRestricted>;
  }>;

  const slots: MealSlotType[] = ['Sáng', 'Trưa', 'Tối'];

  const handleConfirmSlotAdd = () => {
    if (!activeDayAdd || !selectedDishId) return;
    onAddMealToSlot(selectedDishId, activeDayAdd.dayIndex, activeDayAdd.slot, selectedMode);
    setActiveDayAdd(null);
  };

  const handleSwapConfirm = (
    mealId: string,
    updates: {
      dishId: string;
      servings: number;
      mode: 'cook' | 'eat_out';
      slot?: MealSlotType;
      dayIndex?: number;
    }
  ) => {
    if (onUpdatePlannedMeal) {
      onUpdatePlannedMeal(mealId, updates);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Summary Header */}
      <section className="bg-white border border-[#DCE5D8] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-[#1B2A22]">
              Kế hoạch ăn ({daysCount} ngày · {peopleCount} người)
            </h1>
            <p className="text-sm text-[#4A6355] mt-1">
              Theo dõi thực đơn từng bữa, chi phí thực tế sau khi trừ nguyên liệu trong Kho, tổng tiền đã dùng và số tiền còn lại.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAutoGeneratePlan({ avoidDuplicates: true })}
              className="px-3.5 py-2.5 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
              title="Tự động lập thực đơn cân bằng và không trùng món"
            >
              <Sparkles className="w-4 h-4" />
              Tự động gợi ý thực đơn
            </button>
            <button
              type="button"
              onClick={() => onAutoGeneratePlan({ avoidDuplicates: true, seed: Math.random() })}
              className="px-3.5 py-2.5 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              title="Đổi sang thực đơn khác (100% không trùng món)"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Đổi gợi ý khác
            </button>
            <button
              type="button"
              onClick={() => setIsOptionsOpen(true)}
              className="p-2.5 text-xs font-semibold text-[#4A6355] bg-white border border-[#DCE5D8] hover:bg-[#F8FBF7] rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              title="Tùy chọn gợi ý (Chọn bữa, chống trùng món, tiêu chí)"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('shopping')}
              className="px-3.5 py-2.5 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              Mở danh sách Đi chợ <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Dietary Safety Alert Banner */}
        {flaggedPlannedMeals.length > 0 && (
          <div className="p-4 bg-[#FEF2F2] border border-[#F87171] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#991B1B] font-semibold text-sm">
                  Cảnh báo: Có {flaggedPlannedMeals.length} bữa ăn chứa thành phần dị ứng hoặc món ghét!
                </strong>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {flaggedPlannedMeals.map(({ meal, dish, restricted }, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-[#FECACA] rounded text-[11px] text-[#B91C1C]"
                    >
                      Ngày {meal.dayIndex} ({meal.slot}): <strong>{dish.name}</strong> ({restricted.reasons.join(', ')})
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateTab('dietary')}
                className="px-3 py-1.5 bg-white border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg font-medium cursor-pointer"
              >
                Cài đặt dị ứng/ghét
              </button>
              <button
                type="button"
                onClick={() => onAutoGeneratePlan({ avoidDuplicates: true })}
                className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Đổi sang món an toàn ngay
              </button>
            </div>
          </div>
        )}

        {/* 4 Metric Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E6EFE2]">
          <div className="relative group">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#5C7467] block">Ngân sách tổng</span>
              {onUpdateBudget && (
                <button
                  type="button"
                  onClick={() => {
                    setTempBudget(budget);
                    setIsEditingBudget(!isEditingBudget);
                  }}
                  className="text-[#5C7467] hover:text-[#2D6A4F] p-0.5 rounded cursor-pointer transition-colors"
                  title="Chỉnh sửa lại số tiền ngân sách"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {isEditingBudget ? (
              <div className="absolute top-0 left-0 z-20 w-72 bg-white border border-[#95D5B2] shadow-xl rounded-xl p-3 space-y-2 mt-6">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1B2A22]">
                  <span>Sửa ngân sách ăn uống:</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingBudget(false)}
                    className="text-[#6B7F73] hover:text-[#1B2A22]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <CurrencyInput
                  value={tempBudget}
                  onChange={(v) => setTempBudget(v)}
                  presets={[150000, 300000, 500000, 1000000]}
                  quickDeltas={[20000, 50000, 100000]}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingBudget(false)}
                    className="px-2.5 py-1 text-xs text-[#5C7467] hover:text-[#1B2A22] rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateBudget) onUpdateBudget(tempBudget);
                      setIsEditingBudget(false);
                    }}
                    className="px-3 py-1 bg-[#2D6A4F] text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Lưu
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (onUpdateBudget) {
                    setTempBudget(budget);
                    setIsEditingBudget(true);
                  }
                }}
                className="cursor-pointer group-hover:text-[#2D6A4F] transition-colors"
                title="Bấm để chỉnh sửa lại số tiền ngân sách"
              >
                <span className="font-mono tabular-nums text-lg font-semibold text-[#1B2A22] flex items-center gap-1">
                  {formatVND(budget)}
                  <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#5C7467] transition-opacity" />
                </span>
              </div>
            )}
          </div>
          <div>
            <span className="text-xs text-[#5C7467] block">Tổng tiền đã dùng ({plannedMeals.length} bữa)</span>
            <span className="font-mono tabular-nums text-lg font-semibold text-[#B45309]">
              {formatVND(totalPlannedCost)}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#5C7467] block">Tiết kiệm nhờ Kho đồ ăn</span>
            <span className="font-mono tabular-nums text-lg font-semibold text-[#2D6A4F]">
              +{formatVND(totalSavedFromPantry)}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#5C7467] block">Số tiền còn lại</span>
            <span
              className={`font-mono tabular-nums text-lg font-semibold ${
                remainingBudget >= 0 ? 'text-[#1B4332]' : 'text-[#DC2626]'
              }`}
            >
              {formatVND(remainingBudget)}
            </span>
          </div>
        </div>
      </section>

      {/* Inline Slot Picker Modal / Drawer if user clicked "+ Thêm món" */}
      {activeDayAdd && (
        <div className="bg-[#EEF5EE] border border-[#95D5B2] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm font-semibold text-[#1B4332]">
            Chọn món cho Ngày {activeDayAdd.dayIndex} — Bữa {activeDayAdd.slot}:
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedDishId}
              onChange={(e) => setSelectedDishId(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
            >
              {dishes.map((d) => {
                const ev = evaluateDishWithPantry(d, pantry, peopleCount, 'cook');
                return (
                  <option key={d.id} value={d.id}>
                    {d.name} — Tự nấu: {formatVND(ev.netOutOfPocketCost)} | Mua ngoài:{' '}
                    {formatVND(d.eatOutCostPerPerson * peopleCount)}
                  </option>
                );
              })}
            </select>

            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as 'cook' | 'eat_out')}
              className="px-3 py-2 text-xs font-medium bg-white border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
            >
              <option value="cook">Tự nấu (Trừ đồ trong Kho)</option>
              <option value="eat_out">Mua ngoài / Đặt món</option>
            </select>

            <button
              type="button"
              onClick={handleConfirmSlotAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] rounded-xl cursor-pointer"
            >
              Xác nhận thêm
            </button>
            <button
              type="button"
              onClick={() => setActiveDayAdd(null)}
              className="px-3 py-2 text-xs font-medium text-[#4A6355] hover:text-[#1B2A22] cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Days Grid */}
      <div className="space-y-6">
        {Array.from({ length: Math.max(1, daysCount) }, (_, idx) => idx + 1).map((dayIndex) => {
          const dayMeals = plannedMeals.filter((m) => m.dayIndex === dayIndex);
          const dayTotalCost = dayMeals.reduce((sum, m) => {
            const d = dishes.find((x) => x.id === m.dishId);
            if (!d) return sum;
            return (
              sum + evaluateDishWithPantry(d, pantry, m.servings, m.mode).netOutOfPocketCost
            );
          }, 0);

          return (
            <div
              key={dayIndex}
              className="bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-3.5 bg-[#F8FBF7] border-b border-[#E6EFE2] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-[#1B2A22]">Ngày {dayIndex}</h2>
                  <span className="text-xs text-[#5C7467]">
                    {dayMeals.length} món đã chọn · {peopleCount} người ăn
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-[#5C7467]">Chi phí Ngày {dayIndex}: </span>
                  <strong className="font-mono tabular-nums text-sm text-[#2D6A4F]">
                    {formatVND(dayTotalCost)}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E6EFE2]">
                {slots.map((slot) => {
                  const slotMeals = dayMeals.filter((m) => m.slot === slot);

                  return (
                    <div key={slot} className="p-4 flex flex-col justify-between space-y-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#385747]">
                            Bữa {slot}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveDayAdd({ dayIndex, slot })}
                            className="text-xs font-medium text-[#2D6A4F] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Thêm món
                          </button>
                        </div>

                        {slotMeals.length === 0 ? (
                          <div className="py-6 text-center border border-dashed border-[#DCE5D8] rounded-xl text-xs text-[#6B7F73]">
                            Chưa có món cho bữa {slot}
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {slotMeals.map((meal) => {
                              const dish = dishes.find((d) => d.id === meal.dishId);
                              if (!dish) return null;
                              const ev = evaluateDishWithPantry(
                                dish,
                                pantry,
                                meal.servings,
                                meal.mode
                              );

                              return (
                                <div
                                  key={meal.id}
                                  className="p-3 rounded-xl bg-[#F8FBF7] border border-[#E6EFE2] space-y-2"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div
                                      onClick={() => onSelectDishDetail(dish)}
                                      className="w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer border border-[#DCE5D8]"
                                    >
                                      <DishImage
                                        src={dish.image}
                                        alt={dish.name}
                                        className="w-full h-full"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div
                                        onClick={() => onSelectDishDetail(dish)}
                                        className="text-xs font-semibold text-[#1B2A22] hover:text-[#2D6A4F] cursor-pointer truncate"
                                      >
                                        {dish.name}
                                      </div>
                                      {(() => {
                                        const res = isDishRestricted(dish, dietaryPreferences);
                                        if (res.hasAllergy) {
                                          return (
                                            <div className="flex items-center gap-1 text-[10px] font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] px-1.5 py-0.5 rounded mt-0.5 w-fit">
                                              <ShieldAlert className="w-3 h-3" /> Dị ứng: {res.allergyMatches[0]}
                                            </div>
                                          );
                                        }
                                        if (res.hasDislike || res.isExcluded) {
                                          return (
                                            <div className="flex items-center gap-1 text-[10px] font-semibold text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] px-1.5 py-0.5 rounded mt-0.5 w-fit">
                                              <Ban className="w-3 h-3" /> Món ghét: {res.dislikeMatches[0] || 'Đã cấm'}
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                      <div className="text-[11px] text-[#5C7467] flex items-center gap-1 mt-0.5">
                                        {meal.mode === 'cook' ? (
                                          <>
                                            <Utensils className="w-3 h-3 text-[#2D6A4F]" />
                                            <span>Tự nấu</span>
                                          </>
                                        ) : (
                                          <>
                                            <ShoppingBag className="w-3 h-3 text-[#B45309]" />
                                            <span>Mua ngoài</span>
                                          </>
                                        )}
                                        <span>·</span>
                                        <span className="font-mono tabular-nums font-semibold text-[#1B2A22]">
                                          {formatVND(ev.netOutOfPocketCost)}
                                        </span>
                                      </div>
                                      {ev.savedFromPantryCost > 0 && (
                                        <div className="text-[11px] text-[#2D6A4F] font-mono tabular-nums">
                                          Đỡ tốn {formatVND(ev.savedFromPantryCost)} nhờ Kho
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setSwappingMeal(meal)}
                                        className="p-1 text-[#2D6A4F] hover:bg-[#EEF5EE] rounded cursor-pointer transition-colors"
                                        title="Đổi món khác hoặc sửa khẩu phần"
                                      >
                                        <Repeat className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onRemovePlannedMeal(meal.id)}
                                        className="text-[#6B7F73] hover:text-[#DC2626] p-1 cursor-pointer"
                                        title="Xóa món khỏi bữa này"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="pt-1.5 border-t border-[#E6EFE2] flex items-center justify-between">
                                    {meal.isCooked ? (
                                      <span className="text-[11px] font-semibold text-[#2D6A4F] flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" /> Đã nấu & Ghi chi phí
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => onMarkMealCooked(meal.id)}
                                        className="text-[11px] font-semibold text-[#2D6A4F] hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Đã nấu / Đã ăn
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => setSwappingMeal(meal)}
                                      className="text-[11px] text-[#4A6355] hover:text-[#2D6A4F] flex items-center gap-1 cursor-pointer"
                                    >
                                      <Repeat className="w-3 h-3" /> Đổi món
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meal Swap Modal */}
      <MealSwapModal
        isOpen={Boolean(swappingMeal)}
        onClose={() => setSwappingMeal(null)}
        meal={swappingMeal}
        dishes={dishes}
        pantry={pantry}
        plannedMeals={plannedMeals}
        remainingBudget={remainingBudget}
        totalDays={daysCount}
        dietaryPreferences={dietaryPreferences}
        onConfirmSwap={handleSwapConfirm}
      />

      {/* Meal Plan Generation Options Modal */}
      <MealPlanOptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        daysCount={daysCount}
        peopleCount={peopleCount}
        budget={budget}
        dietaryPreferences={dietaryPreferences}
        onOpenDietarySettings={() => onNavigateTab('dietary')}
        onConfirmGenerate={(options) => onAutoGeneratePlan(options)}
      />
    </div>
  );
};

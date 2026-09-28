import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  Utensils,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { Dish, MealSlotType, NavTab, PantryItem, PlannedMeal } from '../types';
import { evaluateDishWithPantry, formatVND } from '../utils/mealMath';
import { DishImage } from './DishImage';

interface MealPlanViewProps {
  budget: number;
  daysCount: number;
  peopleCount: number;
  dishes: Dish[];
  pantry: PantryItem[];
  plannedMeals: PlannedMeal[];
  totalPlannedCost: number;
  totalSavedFromPantry: number;
  remainingBudget: number;
  onAddMealToSlot: (
    dishId: string,
    dayIndex: number,
    slot: MealSlotType,
    mode: 'cook' | 'eat_out'
  ) => void;
  onRemovePlannedMeal: (mealId: string) => void;
  onMarkMealCooked: (mealId: string) => void;
  onAutoGeneratePlan: () => void;
  onSelectDishDetail: (dish: Dish) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const MealPlanView: React.FC<MealPlanViewProps> = ({
  budget,
  daysCount,
  peopleCount,
  dishes,
  pantry,
  plannedMeals,
  totalPlannedCost,
  totalSavedFromPantry,
  remainingBudget,
  onAddMealToSlot,
  onRemovePlannedMeal,
  onMarkMealCooked,
  onAutoGeneratePlan,
  onSelectDishDetail,
  onNavigateTab,
}) => {
  const [activeDayAdd, setActiveDayAdd] = useState<{
    dayIndex: number;
    slot: MealSlotType;
  } | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<string>(dishes[0]?.id || '');
  const [selectedMode, setSelectedMode] = useState<'cook' | 'eat_out'>('cook');

  const slots: MealSlotType[] = ['Sáng', 'Trưa', 'Tối'];

  const handleConfirmSlotAdd = () => {
    if (!activeDayAdd || !selectedDishId) return;
    onAddMealToSlot(selectedDishId, activeDayAdd.dayIndex, activeDayAdd.slot, selectedMode);
    setActiveDayAdd(null);
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

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onAutoGeneratePlan}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Tự động lập thực đơn khít ngân sách
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('shopping')}
              className="px-4 py-2.5 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              Mở danh sách Đi chợ <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E6EFE2]">
          <div>
            <span className="text-xs text-[#5C7467] block">Ngân sách tổng</span>
            <span className="font-mono tabular-nums text-lg font-semibold text-[#1B2A22]">
              {formatVND(budget)}
            </span>
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
                                    <button
                                      type="button"
                                      onClick={() => onRemovePlannedMeal(meal.id)}
                                      className="text-[#6B7F73] hover:text-[#DC2626] p-1 cursor-pointer"
                                      title="Xóa món khỏi bữa này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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
                                        <Check className="w-3.5 h-3.5" /> Đánh dấu Đã nấu / Đã ăn
                                      </button>
                                    )}
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
    </div>
  );
};

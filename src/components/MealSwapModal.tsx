import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Shuffle,
  Utensils,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  Plus,
  Minus,
  ShieldAlert,
  Ban,
} from 'lucide-react';
import { Dish, DishCategory, MealSlotType, PantryItem, PlannedMeal, DietaryPreferences } from '../types';
import { evaluateDishWithPantry, formatVND, isDishRestricted } from '../utils/mealMath';
import { DishImage } from './DishImage';

interface MealSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: PlannedMeal | null;
  dishes: Dish[];
  pantry: PantryItem[];
  plannedMeals: PlannedMeal[];
  remainingBudget: number;
  totalDays: number;
  dietaryPreferences?: DietaryPreferences;
  onConfirmSwap: (
    mealId: string,
    updates: {
      dishId: string;
      servings: number;
      mode: 'cook' | 'eat_out';
      slot?: MealSlotType;
      dayIndex?: number;
    }
  ) => void;
}

export const MealSwapModal: React.FC<MealSwapModalProps> = ({
  isOpen,
  onClose,
  meal,
  dishes,
  pantry,
  plannedMeals,
  remainingBudget,
  totalDays,
  dietaryPreferences,
  onConfirmSwap,
}) => {
  if (!isOpen || !meal) return null;

  const currentDish = dishes.find((d) => d.id === meal.dishId);
  const [selectedDishId, setSelectedDishId] = useState<string>(meal.dishId);
  const [servings, setServings] = useState<number>(meal.servings || 1);
  const [mode, setMode] = useState<'cook' | 'eat_out'>(meal.mode || 'cook');
  const [slot, setSlot] = useState<MealSlotType>(meal.slot);
  const [dayIndex, setDayIndex] = useState<number>(meal.dayIndex);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hideRestricted, setHideRestricted] = useState<boolean>(true);

  // Currently planned dish IDs (excluding the one being swapped)
  const plannedDishIds = useMemo(() => {
    return new Set(
      plannedMeals.filter((m) => m.id !== meal.id).map((m) => m.dishId)
    );
  }, [plannedMeals, meal.id]);

  const categories: { label: string; value: string }[] = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Ăn sáng', value: 'Ăn sáng' },
    { label: 'Món mặn', value: 'Món mặn' },
    { label: 'Canh & Súp', value: 'Canh & Súp' },
    { label: 'Rau & Đậu', value: 'Rau & Đậu' },
    { label: 'Cơm & Bún', value: 'Cơm & Bún' },
  ];

  // Current dish evaluation
  const currentEval = currentDish
    ? evaluateDishWithPantry(currentDish, pantry, meal.servings, meal.mode)
    : null;

  // Selected new dish evaluation
  const candidateDish = dishes.find((d) => d.id === selectedDishId);
  const candidateEval = candidateDish
    ? evaluateDishWithPantry(candidateDish, pantry, servings, mode)
    : null;

  // Filtered dishes list
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (selectedCategory !== 'all' && dish.category !== selectedCategory) {
        return false;
      }
      if (hideRestricted && dietaryPreferences) {
        const restricted = isDishRestricted(dish, dietaryPreferences);
        if (restricted.hasAllergy || restricted.hasDislike || restricted.isExcluded) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = dish.name.toLowerCase().includes(query);
        const matchesIngredient = dish.ingredients.some((i) =>
          i.name.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesIngredient) return false;
      }
      return true;
    });
  }, [dishes, selectedCategory, searchQuery, hideRestricted, dietaryPreferences]);

  // One-click random swap to an unused dish (excluding allergens & dislikes)
  const handleRandomUnused = () => {
    const unusedDishes = dishes.filter((d) => {
      if (plannedDishIds.has(d.id) || d.id === selectedDishId) return false;
      if (dietaryPreferences) {
        const res = isDishRestricted(d, dietaryPreferences);
        if (res.hasAllergy || res.hasDislike || res.isExcluded) return false;
      }
      return true;
    });
    // Prefer matching category or any unused dish
    const categoryMatches =
      slot === 'Sáng'
        ? unusedDishes.filter((d) => d.category === 'Ăn sáng')
        : unusedDishes;
    const pool = categoryMatches.length > 0 ? categoryMatches : unusedDishes;

    if (pool.length > 0) {
      const picked = pool[Math.floor(Math.random() * pool.length)];
      setSelectedDishId(picked.id);
    } else {
      // Pick any other dish
      const otherDishes = dishes.filter((d) => d.id !== selectedDishId);
      if (otherDishes.length > 0) {
        setSelectedDishId(
          otherDishes[Math.floor(Math.random() * otherDishes.length)].id
        );
      }
    }
  };

  const handleSave = () => {
    onConfirmSwap(meal.id, {
      dishId: selectedDishId,
      servings,
      mode,
      slot,
      dayIndex,
    });
    onClose();
  };

  const isSelectedDishDuplicate = plannedDishIds.has(selectedDishId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6EFE2] flex items-center justify-between bg-[#F8FBF7]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#2D6A4F] text-white rounded-md">
                Ngày {dayIndex} · Bữa {slot}
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-[#1B2A22]">
                Đổi món & Chỉnh sửa bữa ăn
              </h2>
            </div>
            <p className="text-xs text-[#5C7467] mt-0.5">
              Chọn món khác không trùng lặp, điều chỉnh khẩu phần và hình thức tự nấu hoặc mua ngoài.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Current dish preview */}
          {currentDish && currentEval && (
            <div className="p-3 rounded-xl bg-[#EEF5EE] border border-[#CFE0D2] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#B7D5BF]">
                  <DishImage
                    src={currentDish.image}
                    alt={currentDish.name}
                    className="w-full h-full"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-[#5C7467]">Món hiện tại:</div>
                  <div className="font-semibold text-[#1B2A22] truncate">
                    {currentDish.name}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono tabular-nums font-semibold text-[#1B2A22]">
                  {formatVND(currentEval.netOutOfPocketCost)}
                </div>
                {currentEval.savedFromPantryCost > 0 && (
                  <div className="text-[10px] text-[#2D6A4F]">
                    Tiết kiệm {formatVND(currentEval.savedFromPantryCost)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Serving & Mode & Slot settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#F8FBF7] rounded-xl border border-[#E6EFE2]">
            {/* Servings */}
            <div>
              <label className="block text-[11px] font-medium text-[#385747] mb-1">
                Khẩu phần (người ăn)
              </label>
              <div className="flex items-center border border-[#DCE5D8] rounded-lg bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="px-2.5 py-1.5 text-[#4A6355] hover:bg-[#EEF5EE] cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="flex-1 text-center font-mono font-semibold text-xs text-[#1B2A22]">
                  {servings} người
                </span>
                <button
                  type="button"
                  onClick={() => setServings(servings + 1)}
                  className="px-2.5 py-1.5 text-[#4A6355] hover:bg-[#EEF5EE] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mode: cook vs eat out */}
            <div>
              <label className="block text-[11px] font-medium text-[#385747] mb-1">
                Hình thức ăn
              </label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-white border border-[#DCE5D8] rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode('cook')}
                  className={`py-1 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                    mode === 'cook'
                      ? 'bg-[#2D6A4F] text-white'
                      : 'text-[#5C7467] hover:bg-[#EEF5EE]'
                  }`}
                >
                  Tự nấu
                </button>
                <button
                  type="button"
                  onClick={() => setMode('eat_out')}
                  className={`py-1 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                    mode === 'eat_out'
                      ? 'bg-[#B45309] text-white'
                      : 'text-[#5C7467] hover:bg-[#EEF5EE]'
                  }`}
                >
                  Mua ngoài
                </button>
              </div>
            </div>

            {/* Slot & Day */}
            <div>
              <label className="block text-[11px] font-medium text-[#385747] mb-1">
                Bữa & Ngày
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value as MealSlotType)}
                  className="px-2 py-1 text-xs bg-white border border-[#DCE5D8] rounded-lg text-[#1B2A22]"
                >
                  <option value="Sáng">Bữa Sáng</option>
                  <option value="Trưa">Bữa Trưa</option>
                  <option value="Tối">Bữa Tối</option>
                </select>
                <select
                  value={dayIndex}
                  onChange={(e) => setDayIndex(Number(e.target.value))}
                  className="px-2 py-1 text-xs bg-white border border-[#DCE5D8] rounded-lg text-[#1B2A22]"
                >
                  {Array.from({ length: Math.max(1, totalDays) }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Ngày {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search bar and Quick Random Shuffle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1B2A22]">
                Chọn món thay thế ({filteredDishes.length} món)
              </label>
              <button
                type="button"
                onClick={handleRandomUnused}
                className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-1 cursor-pointer bg-[#EEF5EE] hover:bg-[#D8F3DC] px-2.5 py-1 rounded-lg transition-colors"
                title="Chọn ngẫu nhiên một món khác chưa có trong thực đơn"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Random món chưa trùng
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7F73]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm món ăn hoặc nguyên liệu..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FBF7] border border-[#DCE5D8] rounded-xl text-[#1B2A22] placeholder-[#6B7F73] focus:outline-none focus:border-[#2D6A4F]"
                />
              </div>
            </div>

            {/* Category tabs & Dietary filter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedCategory === cat.value
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-[#F2F6F1] text-[#4A6355] hover:bg-[#E5EFE4]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {dietaryPreferences && (
                <label className="inline-flex items-center gap-1.5 text-xs text-[#DC2626] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideRestricted}
                    onChange={(e) => setHideRestricted(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#DC2626] accent-[#DC2626] cursor-pointer"
                  />
                  <span>Ẩn món dị ứng / ghét</span>
                </label>
              )}
            </div>
          </div>

          {/* Dishes Selection Grid */}
          <div className="space-y-2 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
            {filteredDishes.map((dish) => {
              const isSelected = selectedDishId === dish.id;
              const isAlreadyPlanned = plannedDishIds.has(dish.id);
              const restricted = isDishRestricted(dish, dietaryPreferences);
              const ev = evaluateDishWithPantry(dish, pantry, servings, mode);
              const cost = ev.netOutOfPocketCost;

              return (
                <div
                  key={dish.id}
                  onClick={() => setSelectedDishId(dish.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#EEF5EE] border-[#2D6A4F] ring-1 ring-[#2D6A4F]'
                      : restricted.hasAllergy
                      ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                      : restricted.hasDislike || restricted.isExcluded
                      ? 'bg-[#FFFBEB] border-[#FDE68A]'
                      : 'bg-white border-[#E6EFE2] hover:border-[#95D5B2]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#DCE5D8]">
                      <DishImage
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-[#1B2A22] truncate">
                          {dish.name}
                        </span>
                        {restricted.hasAllergy ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-medium bg-[#FEE2E2] text-[#DC2626] rounded shrink-0 flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> Dị ứng: {restricted.allergyMatches[0]}
                          </span>
                        ) : restricted.hasDislike || restricted.isExcluded ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-medium bg-[#FEF3C7] text-[#D97706] rounded shrink-0 flex items-center gap-0.5">
                            <Ban className="w-2.5 h-2.5" /> Ghét: {restricted.dislikeMatches[0]}
                          </span>
                        ) : isAlreadyPlanned ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-medium bg-[#FEF3C7] text-[#92400E] rounded shrink-0">
                            Đã có trong lịch
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[9px] font-medium bg-[#D1FAE5] text-[#065F46] rounded shrink-0">
                            Chưa chọn (Khuyên dùng)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#5C7467] flex items-center gap-2 mt-0.5">
                        <span>{dish.category}</span>
                        <span>·</span>
                        <span>{dish.cookTimeMinutes} phút</span>
                        {ev.savedFromPantryCost > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[#2D6A4F] font-medium">
                              Kho hỗ trợ {formatVND(ev.savedFromPantryCost)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono tabular-nums text-xs font-semibold text-[#1B2A22]">
                      {formatVND(cost)}
                    </div>
                    <div className="text-[10px] text-[#5C7467]">
                      {servings} người ăn
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Duplicate Warning if selected dish is already planned */}
          {isSelectedDishDuplicate && (
            <div className="p-2.5 rounded-xl bg-[#FEF9C3] border border-[#FDE047] flex items-start gap-2 text-xs text-[#854D0E]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#CA8A04]" />
              <div>
                <strong>Lưu ý:</strong> Món <em>{candidateDish?.name}</em> đã được chọn ở một bữa khác trong thực đơn tuần. Bạn có thể bấm <strong>"Random món chưa trùng"</strong> ở trên để tự động chọn món mới hoàn toàn!
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E6EFE2] bg-[#F8FBF7] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs">
            {candidateDish && candidateEval && (
              <div>
                <span className="text-[#5C7467]">Chi phí bữa này: </span>
                <strong className="font-mono tabular-nums text-sm text-[#2D6A4F]">
                  {formatVND(candidateEval.netOutOfPocketCost)}
                </strong>
                {currentEval && (
                  <span className="ml-2 font-mono text-[11px] text-[#5C7467]">
                    (Chênh lệch:{' '}
                    {candidateEval.netOutOfPocketCost >= currentEval.netOutOfPocketCost ? '+' : ''}
                    {formatVND(candidateEval.netOutOfPocketCost - currentEval.netOutOfPocketCost)})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#4A6355] hover:text-[#1B2A22] rounded-xl cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              Lưu thay đổi món
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

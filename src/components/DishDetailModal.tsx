import React, { useState } from 'react';
import { X, Plus, Check, Star, Send, Utensils, ShoppingBag } from 'lucide-react';
import { Dish, MealSlotType, PantryItem } from '../types';
import { evaluateDishWithPantry, formatVND } from '../utils/mealMath';
import { DishImage } from './DishImage';

interface DishDetailModalProps {
  dish: Dish | null;
  pantry: PantryItem[];
  servings: number;
  daysCount: number;
  defaultMode: 'cook' | 'eat_out';
  onClose: () => void;
  onAddToMealPlan: (
    dishId: string,
    dayIndex: number,
    slot: MealSlotType,
    mode: 'cook' | 'eat_out'
  ) => void;
  onAddComment: (dishId: string, author: string, role: string, rating: number, content: string) => void;
}

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  dish,
  pantry,
  servings,
  daysCount,
  defaultMode,
  onClose,
  onAddToMealPlan,
  onAddComment,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedSlot, setSelectedSlot] = useState<MealSlotType>('Trưa');
  const [selectedMode, setSelectedMode] = useState<'cook' | 'eat_out'>(defaultMode);
  const [justAdded, setJustAdded] = useState(false);

  const [commentAuthor, setCommentAuthor] = useState('Bạn (Sinh viên tiết kiệm)');
  const [commentRating, setCommentRating] = useState(5);
  const [commentText, setCommentText] = useState('');

  if (!dish) return null;

  const evalCook = evaluateDishWithPantry(dish, pantry, servings, 'cook');
  const eatOutTotal = dish.eatOutCostPerPerson * servings;

  const handleAddMeal = () => {
    onAddToMealPlan(dish.id, selectedDay, selectedSlot, selectedMode);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1800);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(
      dish.id,
      commentAuthor.trim() || 'Người dùng Món Khôn',
      'Thành viên Món Khôn',
      commentRating,
      commentText.trim()
    );
    setCommentText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2A22]/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#FFFFFF] border border-[#DCE5D8] rounded-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6EFE2] bg-[#F8FBF7]">
          <div className="flex items-center gap-2 text-xs text-[#4A6355]">
            <span>{dish.category}</span>
            <span aria-hidden="true">·</span>
            <span>{dish.taste}</span>
            <span aria-hidden="true">·</span>
            <span>{dish.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{dish.cookTimeMinutes} phút</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-[#B45309]">
              {dish.rating.toFixed(1)} ★ ({dish.reviewCount + dish.comments.length} đánh giá)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#4A6355] hover:text-[#1B2A22] hover:bg-[#EAF2E8] transition-colors"
            aria-label="Đóng chi tiết món ăn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-6 space-y-8">
          {/* Hero Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5">
              <div className="aspect-4/3 w-full rounded-xl overflow-hidden border border-[#DCE5D8]">
                <DishImage src={dish.image} alt={dish.name} className="w-full h-full" />
              </div>
              {/* Nutrition Bar */}
              <div className="mt-4 grid grid-cols-4 gap-2 pt-3 border-t border-[#E6EFE2] text-center">
                <div>
                  <div className="text-xs text-[#5C7467]">Năng lượng</div>
                  <div className="font-mono tabular-nums text-sm font-semibold text-[#1B2A22]">
                    {dish.nutrition.calories} kcal
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#5C7467]">Đạm</div>
                  <div className="font-mono tabular-nums text-sm font-semibold text-[#1B2A22]">
                    {dish.nutrition.protein}g
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#5C7467]">Tinh bột</div>
                  <div className="font-mono tabular-nums text-sm font-semibold text-[#1B2A22]">
                    {dish.nutrition.carbs}g
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#5C7467]">Chất béo</div>
                  <div className="font-mono tabular-nums text-sm font-semibold text-[#1B2A22]">
                    {dish.nutrition.fat}g
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div>
                <h2 className="text-2xl font-display font-semibold text-[#1B2A22] leading-snug">
                  {dish.name}
                </h2>
                <p className="mt-1 text-sm text-[#4A6355] leading-relaxed">{dish.subtitle}</p>
              </div>

              {/* Cost Comparison Box */}
              <div className="p-4 rounded-xl bg-[#F4F9F4] border border-[#D5E6D7] space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs text-[#4A6355] block">
                      Chi phí tự nấu thực tế ({servings} người, đã trừ đồ trong kho)
                    </span>
                    <span className="font-mono tabular-nums text-2xl font-semibold text-[#2D6A4F]">
                      {formatVND(evalCook.netOutOfPocketCost)}
                    </span>
                    {evalCook.savedFromPantryCost > 0 && (
                      <span className="ml-2 text-xs text-[#2D6A4F] font-mono tabular-nums">
                        (Tiết kiệm {formatVND(evalCook.savedFromPantryCost)} nhờ Kho đồ ăn)
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#5C7467] block">Mua ngoài / Đặt ship</span>
                    <span className="font-mono tabular-nums text-base font-medium text-[#6B7F73] line-through">
                      {formatVND(eatOutTotal)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DCEAD9] flex flex-wrap items-center justify-between gap-2 text-xs text-[#385747]">
                  <span>
                    Khớp nguyên liệu trong kho:{' '}
                    <strong className="font-mono tabular-nums text-[#1B4332]">
                      {evalCook.pantryMatchPercent}%
                    </strong>
                  </span>
                  <span>
                    Rẻ hơn mua ngoài:{' '}
                    <strong className="font-mono tabular-nums text-[#2D6A4F]">
                      +{formatVND(evalCook.savedVsEatOut)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Smart Tip */}
              <div className="p-3.5 rounded-xl bg-[#FDF6F0] border border-[#F3DEC8] text-sm text-[#6E4726]">
                <strong className="font-semibold">Mẹo tiết kiệm: </strong>
                {dish.smartTip}
              </div>

              {/* Add to meal plan controls */}
              <div className="pt-2 space-y-3">
                <div className="text-xs font-medium text-[#4A6355]">
                  Thêm món này vào Kế hoạch ăn (Tự động trừ ngân sách & tạo danh sách đi chợ):
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="px-3 py-2 text-xs font-medium bg-[#F6F9F5] border border-[#DCE5D8] rounded-lg text-[#1B2A22]"
                  >
                    {Array.from({ length: Math.max(1, daysCount) }, (_, idx) => idx + 1).map((d) => (
                      <option key={d} value={d}>
                        Ngày {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value as MealSlotType)}
                    className="px-3 py-2 text-xs font-medium bg-[#F6F9F5] border border-[#DCE5D8] rounded-lg text-[#1B2A22]"
                  >
                    <option value="Sáng">Bữa Sáng</option>
                    <option value="Trưa">Bữa Trưa</option>
                    <option value="Tối">Bữa Tối</option>
                  </select>

                  <div className="flex items-center p-0.5 bg-[#EAF2E8] rounded-lg border border-[#DCE5D8]">
                    <button
                      type="button"
                      onClick={() => setSelectedMode('cook')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1 ${
                        selectedMode === 'cook'
                          ? 'bg-white text-[#1B4332] shadow-2xs'
                          : 'text-[#4A6355] hover:text-[#1B2A22]'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      Tự nấu ({formatVND(evalCook.netOutOfPocketCost)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMode('eat_out')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1 ${
                        selectedMode === 'eat_out'
                          ? 'bg-white text-[#1B4332] shadow-2xs'
                          : 'text-[#4A6355] hover:text-[#1B2A22]'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Mua ngoài ({formatVND(eatOutTotal)})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMeal}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        Đã thêm vào Ngày {selectedDay} ({selectedSlot})
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Chọn ăn món này
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients & Steps */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 border-t border-[#E6EFE2]">
            {/* Ingredients Table */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-base font-semibold text-[#1B2A22]">
                  Nguyên liệu ({servings} người ăn)
                </h3>
                <span className="text-xs text-[#5C7467]">Đối chiếu Kho đồ ăn</span>
              </div>
              <div className="divide-y divide-[#E6EFE2] border border-[#DCE5D8] rounded-xl overflow-hidden">
                {evalCook.evaluatedIngredients.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white flex items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <div className="font-medium text-[#1B2A22]">
                        {item.ingredient.name}{' '}
                        <span className="font-mono tabular-nums text-xs text-[#5C7467]">
                          ({item.requiredAmount} {item.ingredient.unit})
                        </span>
                      </div>
                      <div className="text-xs text-[#5C7467] mt-0.5">
                        {item.missingAmount === 0 ? (
                          <span className="text-[#2D6A4F] font-medium">
                            ✓ Đã có đủ trong Kho ({item.availableAmount} {item.ingredient.unit})
                            {item.isExpiringSoon ? ' · Ưu tiên dùng sớm' : ''}
                          </span>
                        ) : item.availableAmount > 0 ? (
                          <span className="text-[#B45309]">
                            Có {item.availableAmount} {item.ingredient.unit} · Cần mua thêm{' '}
                            {item.missingAmount} {item.ingredient.unit}
                          </span>
                        ) : (
                          <span>
                            Cần mua {item.missingAmount} {item.ingredient.unit}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      {item.netCostToBuy === 0 ? (
                        <span className="text-xs font-semibold text-[#2D6A4F]">0đ</span>
                      ) : (
                        <span className="text-xs font-medium text-[#1B2A22]">
                          +{formatVND(item.netCostToBuy)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cooking Steps */}
            <div className="md:col-span-7 space-y-3">
              <h3 className="text-base font-semibold text-[#1B2A22]">Các bước chế biến</h3>
              <ol className="space-y-3">
                {dish.steps.map((step, index) => (
                  <li
                    key={index}
                    className="p-3.5 rounded-xl bg-[#F8FBF7] border border-[#E6EFE2] flex gap-3 text-sm text-[#2A3C32] leading-relaxed"
                  >
                    <span className="font-mono tabular-nums font-semibold text-[#2D6A4F] shrink-0">
                      0{index + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Reviews & Comments */}
          <div className="pt-6 border-t border-[#E6EFE2] space-y-4">
            <h3 className="text-base font-semibold text-[#1B2A22]">
              Đánh giá & Bình luận từ người nấu ({dish.comments.length})
            </h3>

            <form
              onSubmit={handleCommentSubmit}
              className="p-4 rounded-xl bg-[#F8FBF7] border border-[#DCE5D8] space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="Tên của bạn"
                  className="px-3 py-1.5 text-xs bg-white border border-[#DCE5D8] rounded-lg text-[#1B2A22] w-56"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#5C7467] mr-1">Chấm điểm:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCommentRating(star)}
                      className={`p-1 transition-colors ${
                        star <= commentRating ? 'text-[#D97706]' : 'text-[#CBD5E1]'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm nấu món này hoặc mẹo tiết kiệm của bạn..."
                  className="flex-1 px-3 py-2 text-sm bg-white border border-[#DCE5D8] rounded-lg text-[#1B2A22]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi bình luận
                </button>
              </div>
            </form>

            {dish.comments.length === 0 ? (
              <p className="text-sm text-[#5C7467]">
                Chưa có bình luận nào cho món này. Hãy là người đầu tiên chia sẻ cảm nhận!
              </p>
            ) : (
              <div className="space-y-2.5">
                {dish.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-white border border-[#E6EFE2] space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs text-[#5C7467]">
                      <div>
                        <strong className="text-[#1B2A22] font-semibold">{c.author}</strong>
                        <span className="mx-1.5">·</span>
                        <span>{c.role}</span>
                        <span className="mx-1.5">·</span>
                        <span className="font-mono tabular-nums text-[#B45309]">
                          {c.rating} ★
                        </span>
                      </div>
                      <span>{c.createdAt}</span>
                    </div>
                    <p className="text-sm text-[#2A3C32]">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

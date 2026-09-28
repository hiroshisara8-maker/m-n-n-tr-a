import React from 'react';
import {
  Utensils,
  ShoppingBag,
  ArrowRight,
  Check,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Dish, MealSlotType, NavTab, PantryItem, PlannedMeal } from '../types';
import { evaluateDishWithPantry, formatVND, getDaysUntilExpiry } from '../utils/mealMath';
import { DishImage } from './DishImage';

interface HomeViewProps {
  budget: number;
  setBudget: (val: number) => void;
  daysCount: number;
  setDaysCount: (val: number) => void;
  peopleCount: number;
  setPeopleCount: (val: number) => void;
  diningMode: 'cook' | 'eat_out';
  setDiningMode: (val: 'cook' | 'eat_out') => void;
  dishes: Dish[];
  pantry: PantryItem[];
  plannedMeals: PlannedMeal[];
  totalPlannedCost: number;
  totalSavedFromPantry: number;
  remainingBudget: number;
  onSelectDishDetail: (dish: Dish) => void;
  onQuickAddMeal: (dishId: string, mode: 'cook' | 'eat_out') => void;
  onRemovePlannedMeal: (mealId: string) => void;
  onNavigateTab: (tab: NavTab) => void;
  onAutoGeneratePlan: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  budget,
  setBudget,
  daysCount,
  setDaysCount,
  peopleCount,
  setPeopleCount,
  diningMode,
  setDiningMode,
  dishes,
  pantry,
  plannedMeals,
  totalPlannedCost,
  totalSavedFromPantry,
  remainingBudget,
  onSelectDishDetail,
  onQuickAddMeal,
  onRemovePlannedMeal,
  onNavigateTab,
  onAutoGeneratePlan,
}) => {
  const expiringItems = pantry.filter((item) => getDaysUntilExpiry(item.expiryDate) <= 2);
  const targetPerMealBudget = Math.max(
    10000,
    Math.round(budget / Math.max(1, daysCount * 3))
  );

  // Sort dishes by best match with pantry and expiring items when cooking, or by price when eating out
  const evaluatedDishes = dishes
    .map((dish) => evaluateDishWithPantry(dish, pantry, peopleCount, diningMode))
    .sort((a, b) => {
      if (diningMode === 'cook') {
        if (b.expiringIngredientsRescued.length !== a.expiringIngredientsRescued.length) {
          return b.expiringIngredientsRescued.length - a.expiringIngredientsRescued.length;
        }
        if (b.pantryMatchPercent !== a.pantryMatchPercent) {
          return b.pantryMatchPercent - a.pantryMatchPercent;
        }
      }
      return a.netOutOfPocketCost - b.netOutOfPocketCost;
    });

  const usedPercent = budget > 0 ? Math.min(100, Math.round((totalPlannedCost / budget) * 100)) : 0;

  return (
    <div className="space-y-10">
      {/* Hero Section: Budget Calculator & Real-time Deduction */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Cols: Input Controls */}
        <div className="lg:col-span-7 bg-white border border-[#DCE5D8] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#2D6A4F]">
              Trợ lý thực đơn & ngân sách thông minh cho sinh viên, người đi làm
            </div>
            <h1
              className="text-2xl sm:text-3xl font-display font-semibold text-[#1B2A22] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Hôm nay ăn gì vừa ngon miệng, vừa khít ví tiền?
            </h1>
            <p className="text-sm text-[#4A6355] leading-relaxed max-w-[65ch]">
              Nhập ngân sách hiện có, số ngày và số người ăn. Khi bạn chọn món, ứng dụng sẽ tự động đối chiếu{' '}
              <button
                type="button"
                onClick={() => onNavigateTab('pantry')}
                className="underline font-medium text-[#2D6A4F] hover:text-[#1B4332] cursor-pointer"
              >
                Kho đồ ăn ({pantry.length} nguyên liệu)
              </button>{' '}
              để trừ tiền chính xác và tạo danh sách đi chợ.
            </p>
          </div>

          {/* 4 Main Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Ngân sách đang có */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#385747]">
                1. Số tiền ăn đang có (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={budget}
                  onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl font-mono tabular-nums text-base font-semibold text-[#1B2A22] focus:outline-none focus:border-[#2D6A4F]"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[150000, 300000, 500000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBudget(preset)}
                    className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      budget === preset
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                        : 'bg-[#F6F9F5] text-[#4A6355] border-[#DCE5D8] hover:border-[#2D6A4F]'
                    }`}
                  >
                    {formatVND(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Hình thức ăn */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#385747]">
                2. Hình thức ăn uống ưu tiên
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#EEF4ED] border border-[#DCE5D8] rounded-xl">
                <button
                  type="button"
                  onClick={() => setDiningMode('cook')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    diningMode === 'cook'
                      ? 'bg-white text-[#1B4332] shadow-2xs'
                      : 'text-[#4A6355] hover:text-[#1B2A22]'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Tự nấu tại nhà
                </button>
                <button
                  type="button"
                  onClick={() => setDiningMode('eat_out')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    diningMode === 'eat_out'
                      ? 'bg-white text-[#1B4332] shadow-2xs'
                      : 'text-[#4A6355] hover:text-[#1B2A22]'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Mua ngoài / Đặt món
                </button>
              </div>
              <p className="text-xs text-[#5C7467] pt-1">
                {diningMode === 'cook'
                  ? 'Tự động khấu trừ các nguyên liệu bạn đã có sẵn trong Kho đồ ăn.'
                  : 'Tính theo mức giá trung bình tại quán cơm sinh viên / đặt giao hàng.'}
              </p>
            </div>

            {/* Số ngày muốn ăn */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#385747]">
                3. Số ngày lên thực đơn
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={daysCount}
                  onChange={(e) => setDaysCount(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-24 px-3.5 py-2 bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl font-mono tabular-nums text-sm font-semibold text-[#1B2A22]"
                />
                <div className="flex gap-1.5">
                  {[1, 3, 5, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDaysCount(d)}
                      className={`px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                        daysCount === d
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-[#F6F9F5] text-[#4A6355] border-[#DCE5D8] hover:border-[#2D6A4F]'
                      }`}
                    >
                      {d} ngày
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Số người ăn */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#385747]">
                4. Số người cùng ăn
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={peopleCount}
                  onChange={(e) =>
                    setPeopleCount(Math.max(1, Math.min(10, Number(e.target.value))))
                  }
                  className="w-20 px-3.5 py-2 bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl font-mono tabular-nums text-sm font-semibold text-[#1B2A22]"
                />
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeopleCount(p)}
                      className={`px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                        peopleCount === p
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                          : 'bg-[#F6F9F5] text-[#4A6355] border-[#DCE5D8] hover:border-[#2D6A4F]'
                      }`}
                    >
                      {p} người
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="pt-4 border-t border-[#E6EFE2] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#4A6355]">
              Định mức gợi ý:{' '}
              <strong className="font-mono tabular-nums text-[#1B2A22]">
                ~{formatVND(targetPerMealBudget)}/bữa
              </strong>{' '}
              ({daysCount * 3} bữa cho {peopleCount} người)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onAutoGeneratePlan}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gợi ý thực đơn tự động ({daysCount} ngày)
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('random')}
                className="px-3.5 py-2 text-xs font-semibold text-[#2D6A4F] bg-[#EAF4EC] hover:bg-[#D8F3DC] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Random món ngay
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Budget Wallet & Selected Meals */}
        <div className="lg:col-span-5 bg-[#EEF5EE] border border-[#CFE0D2] rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-[#2D6A4F]">
                Ví ngân sách ăn uống ({daysCount} ngày · {peopleCount} người)
              </span>
              <span className="font-mono tabular-nums text-xs text-[#4A6355]">
                Đã dùng {usedPercent}%
              </span>
            </div>

            {/* Dominant Remaining Balance */}
            <div>
              <div className="text-xs text-[#4A6355]">Số tiền còn lại sau khi chọn món</div>
              <div
                className={`font-mono tabular-nums text-3xl sm:text-4xl font-semibold tracking-tight mt-0.5 ${
                  remainingBudget >= 0 ? 'text-[#1B4332]' : 'text-[#DC2626]'
                }`}
              >
                {formatVND(remainingBudget)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#DCE5D8]">
              <div
                className={`h-full transition-all duration-200 ${
                  remainingBudget >= 0 ? 'bg-[#2D6A4F]' : 'bg-[#DC2626]'
                }`}
                style={{ width: `${Math.min(100, usedPercent)}%` }}
              />
            </div>

            {/* 3 Key Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D6E6D9] text-xs">
              <div>
                <span className="text-[#5C7467] block">Ngân sách gốc</span>
                <strong className="font-mono tabular-nums text-sm text-[#1B2A22]">
                  {formatVND(budget)}
                </strong>
              </div>
              <div>
                <span className="text-[#5C7467] block">Đã chọn ({plannedMeals.length} bữa)</span>
                <strong className="font-mono tabular-nums text-sm text-[#B45309]">
                  -{formatVND(totalPlannedCost)}
                </strong>
              </div>
              <div>
                <span className="text-[#5C7467] block">Tiết kiệm từ Kho</span>
                <strong className="font-mono tabular-nums text-sm text-[#2D6A4F]">
                  +{formatVND(totalSavedFromPantry)}
                </strong>
              </div>
            </div>

            {/* Active Meals List with Instant Deduction */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-medium text-[#385747]">
                <span>Các món đang chọn trong thực đơn:</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('mealplan')}
                  className="text-[#2D6A4F] hover:underline cursor-pointer"
                >
                  Xem chi tiết lịch ăn →
                </button>
              </div>

              {plannedMeals.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/80 border border-[#DCE5D8] text-xs text-[#5C7467] text-center">
                  Chưa có món nào được chọn. Bấm <strong>"Chọn ăn"</strong> ở danh sách bên dưới để xem app tự động trừ tiền!
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-[#E6EFE2] bg-white border border-[#DCE5D8] rounded-xl">
                  {plannedMeals.map((pm) => {
                    const d = dishes.find((item) => item.id === pm.dishId);
                    if (!d) return null;
                    const ev = evaluateDishWithPantry(d, pantry, pm.servings, pm.mode);
                    return (
                      <div
                        key={pm.id}
                        className="px-3 py-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-[#1B2A22] truncate">
                            Ngày {pm.dayIndex} ({pm.slot}): {d.name}
                          </div>
                          <div className="text-[#5C7467]">
                            {pm.mode === 'cook' ? 'Tự nấu' : 'Mua ngoài'} · {pm.servings} người
                            {ev.savedFromPantryCost > 0 &&
                              ` · Đỡ tốn ${formatVND(ev.savedFromPantryCost)} nhờ Kho`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono tabular-nums font-semibold text-[#1B2A22]">
                            -{formatVND(ev.netOutOfPocketCost)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemovePlannedMeal(pm.id)}
                            className="p-1 text-[#6B7F73] hover:text-[#DC2626] transition-colors cursor-pointer"
                            title="Bỏ món này (Hoàn lại tiền vào ngân sách)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Expiring Pantry Alert Banner */}
          {expiringItems.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#FDF4EE] border border-[#F3D3BD] flex items-center justify-between gap-3 text-xs text-[#7C3A13]">
              <div>
                <strong>Ưu tiên giải cứu tủ lạnh:</strong> Có {expiringItems.length} nguyên liệu sắp hết hạn (
                {expiringItems.map((i) => i.name).join(', ')}).
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('pantry')}
                className="px-2.5 py-1.5 bg-white border border-[#E6C2A8] rounded-lg font-semibold text-[#7C3A13] hover:bg-[#FCE8D8] whitespace-nowrap cursor-pointer"
              >
                Xem Kho
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Workflow Stepper Bar */}
      <section className="bg-white border border-[#DCE5D8] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#1B2A22]">
            Quy trình khép kín giúp tiết kiệm 35–50% chi phí ăn uống
          </h2>
          <span className="text-xs text-[#5C7467]">Bấm vào bước bất kỳ để mở nhanh</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { step: '01', label: 'Nhập ngân sách', sub: `${formatVND(budget)}`, tab: 'home' as NavTab },
            { step: '02', label: 'Kiểm kê Kho đồ ăn', sub: `${pantry.length} nguyên liệu`, tab: 'pantry' as NavTab },
            { step: '03', label: 'Khám phá & Chọn món', sub: `${dishes.length} món ngon`, tab: 'explore' as NavTab },
            { step: '04', label: 'Lập Kế hoạch ăn', sub: `${plannedMeals.length} bữa đã lên`, tab: 'mealplan' as NavTab },
            { step: '05', label: 'Tạo danh sách Đi chợ', sub: 'Tự trừ đồ có sẵn', tab: 'shopping' as NavTab },
            { step: '06', label: 'Random hôm nay ăn gì', sub: 'Quay món 1 chạm', tab: 'random' as NavTab },
            { step: '07', label: 'Theo dõi Chi phí', sub: 'Lưu lịch sử tiết kiệm', tab: 'expenses' as NavTab },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => onNavigateTab(item.tab)}
              className="p-3 rounded-xl bg-[#F6F9F5] hover:bg-[#EAF3EB] border border-[#E2ECE0] text-left transition-colors cursor-pointer group"
            >
              <div className="font-mono tabular-nums text-xs font-semibold text-[#2D6A4F] group-hover:translate-x-0.5 transition-transform">
                Bước {item.step}
              </div>
              <div className="text-xs font-semibold text-[#1B2A22] mt-0.5">{item.label}</div>
              <div className="text-[11px] text-[#5C7467] mt-0.5 truncate">{item.sub}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Recommended Dishes Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-semibold text-[#1B2A22]">
              Đề xuất món khôn ngoan theo ngân sách & nguyên liệu sẵn có
            </h2>
            <p className="text-sm text-[#4A6355]">
              Bấm <strong>"Chọn ăn"</strong> để tự động trừ vào ngân sách và cập nhật danh sách cần mua tại mục Đi chợ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('explore')}
            className="text-xs font-semibold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-1 cursor-pointer"
          >
            Bộ lọc Khám phá chi tiết <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluatedDishes.slice(0, 6).map((ev) => {
            const { dish } = ev;
            const selectedCount = plannedMeals.filter((m) => m.dishId === dish.id).length;
            const fitsBudget = ev.netOutOfPocketCost <= Math.max(remainingBudget, targetPerMealBudget * 2);

            return (
              <div
                key={dish.id}
                className="bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#2D6A4F] transition-colors"
              >
                <div>
                  <div
                    onClick={() => onSelectDishDetail(dish)}
                    className="aspect-4/3 w-full overflow-hidden bg-[#EEF4ED] cursor-pointer relative"
                  >
                    <DishImage
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full hover:scale-103 transition-transform duration-200"
                    />
                  </div>

                  <div className="p-5 space-y-3">
                    {/* Unboxed clean metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#5C7467]">
                      <span>{dish.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{dish.cookTimeMinutes} phút</span>
                      <span aria-hidden="true">·</span>
                      <span>{dish.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-[#B45309]">
                        {dish.rating.toFixed(1)} ★
                      </span>
                    </div>

                    <div>
                      <h3
                        onClick={() => onSelectDishDetail(dish)}
                        className="text-base font-semibold text-[#1B2A22] hover:text-[#2D6A4F] cursor-pointer leading-snug"
                      >
                        {dish.name}
                      </h3>
                      <p className="text-xs text-[#4A6355] mt-1 line-clamp-2">{dish.subtitle}</p>
                    </div>

                    {/* Pantry & Rescue status text */}
                    {diningMode === 'cook' && (
                      <div className="pt-2 border-t border-[#EBF2E9] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#385747]">
                          <span>Nguyên liệu có sẵn trong Kho:</span>
                          <strong className="font-mono tabular-nums text-[#2D6A4F]">
                            {ev.pantryMatchPercent}% (Đỡ tốn {formatVND(ev.savedFromPantryCost)})
                          </strong>
                        </div>
                        {ev.expiringIngredientsRescued.length > 0 && (
                          <div className="text-[#B45309] font-medium">
                            Ưu tiên: Tận dụng {ev.expiringIngredientsRescued.join(', ')} sắp hết hạn
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Price & Action */}
                <div className="px-5 py-3.5 bg-[#F8FBF7] border-t border-[#E6EFE2] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-[#5C7467] block">
                      {diningMode === 'cook'
                        ? `Cần mua thêm (${peopleCount} người)`
                        : `Giá mua ngoài (${peopleCount} người)`}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono tabular-nums text-base font-semibold text-[#1B2A22]">
                        {formatVND(ev.netOutOfPocketCost)}
                      </span>
                      {diningMode === 'cook' && ev.savedFromPantryCost > 0 && (
                        <span className="font-mono tabular-nums text-xs text-[#6B7F73] line-through">
                          {formatVND(ev.baseTotalCost)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectDishDetail(dish)}
                      className="px-2.5 py-2 text-xs font-medium text-[#385747] hover:text-[#1B2A22] bg-white border border-[#DCE5D8] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Công thức
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAddMeal(dish.id, diningMode)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        selectedCount > 0
                          ? 'bg-[#D8F3DC] text-[#1B4332] border border-[#95D5B2]'
                          : fitsBudget
                          ? 'bg-[#2D6A4F] text-white hover:bg-[#1B4332]'
                          : 'bg-[#B45309] text-white hover:bg-[#92400E]'
                      }`}
                    >
                      {selectedCount > 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Đã chọn ({selectedCount})
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Chọn ăn
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  ShoppingBag,
  Plus,
  Check,
  ArrowRight,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import {
  CustomShoppingItem,
  Dish,
  NavTab,
  PantryItem,
  PlannedMeal,
} from '../types';
import {
  computeShoppingListFromMealPlan,
  formatVND,
  GeneratedShoppingItem,
} from '../utils/mealMath';
import { CurrencyInput } from './CurrencyInput';

interface ShoppingViewProps {
  plannedMeals: PlannedMeal[];
  dishes: Dish[];
  pantry: PantryItem[];
  customShoppingItems: CustomShoppingItem[];
  onAddCustomShoppingItem: (item: Omit<CustomShoppingItem, 'id' | 'checked'>) => void;
  onUpdateCustomShoppingItem?: (id: string, updated: Partial<CustomShoppingItem>) => void;
  onToggleCustomShoppingItem: (id: string) => void;
  onDeleteCustomShoppingItem: (id: string) => void;
  onPurchaseToPantry: (
    itemsToRestock: Array<{
      name: string;
      amount: number;
      unit: string;
      category: PantryItem['category'];
      estimatedCost: number;
    }>
  ) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const ShoppingView: React.FC<ShoppingViewProps> = ({
  plannedMeals,
  dishes,
  pantry,
  customShoppingItems,
  onAddCustomShoppingItem,
  onUpdateCustomShoppingItem,
  onToggleCustomShoppingItem,
  onDeleteCustomShoppingItem,
  onPurchaseToPantry,
  onNavigateTab,
}) => {
  const [checkedGeneratedKeys, setCheckedGeneratedKeys] = useState<Record<string, boolean>>({});
  const [restockSuccessMsg, setRestockSuccessMsg] = useState<string | null>(null);

  // Inline editing custom items
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<number>(0);

  // Form for extra custom shopping items
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState('chai');
  const [customPrice, setCustomPrice] = useState<number>(15000);
  const [customCategory, setCustomCategory] =
    useState<PantryItem['category']>('Gia vị & Đồ khô');

  const generatedItems: GeneratedShoppingItem[] = computeShoppingListFromMealPlan(
    plannedMeals,
    dishes,
    pantry
  );

  const toggleGeneratedKey = (key: string) => {
    setCheckedGeneratedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAllGenerated = () => {
    const next: Record<string, boolean> = {};
    generatedItems.forEach((item) => {
      next[item.key] = true;
    });
    setCheckedGeneratedKeys(next);
  };

  const checkedGeneratedList = generatedItems.filter((i) => checkedGeneratedKeys[i.key]);
  const checkedCustomList = customShoppingItems.filter((i) => i.checked);

  const totalGeneratedCost = generatedItems.reduce((acc, i) => acc + i.estimatedCost, 0);
  const totalCustomCost = customShoppingItems.reduce((acc, i) => acc + i.estimatedPrice, 0);
  const totalCheckedCost =
    checkedGeneratedList.reduce((acc, i) => acc + i.estimatedCost, 0) +
    checkedCustomList.reduce((acc, i) => acc + i.estimatedPrice, 0);

  const handleCompleteShopping = () => {
    const itemsToMove = [
      ...checkedGeneratedList.map((item) => ({
        name: item.name,
        amount: item.missingToBuy,
        unit: item.unit,
        category: item.category,
        estimatedCost: item.estimatedCost,
      })),
      ...checkedCustomList.map((item) => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        category: item.category,
        estimatedCost: item.estimatedPrice,
      })),
    ];

    if (itemsToMove.length === 0) return;

    onPurchaseToPantry(itemsToMove);
    setCheckedGeneratedKeys({});
    setRestockSuccessMsg(
      `Đã cập nhật ${itemsToMove.length} nguyên liệu vừa mua vào Kho đồ ăn và ghi nhận ${formatVND(
        totalCheckedCost
      )} vào Chi phí ăn uống!`
    );
    setTimeout(() => setRestockSuccessMsg(null), 4500);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || customAmount <= 0) return;
    onAddCustomShoppingItem({
      name: customName.trim(),
      amount: customAmount,
      unit: customUnit.trim() || 'phần',
      estimatedPrice: customPrice,
      category: customCategory,
    });
    setCustomName('');
  };

  return (
    <div className="space-y-8">
      {/* Top Summary Banner */}
      <section className="bg-white border border-[#DCE5D8] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <h1 className="text-2xl font-display font-semibold text-[#1B2A22]">
            Danh sách Đi chợ thông minh
          </h1>
          <p className="text-sm text-[#4A6355]">
            Tự động tổng hợp nguyên liệu từ <strong>{plannedMeals.length} bữa ăn đã chọn</strong> và trừ đi những nguyên liệu bạn đã có sẵn trong <strong>Kho đồ ăn</strong>. Đánh dấu ✓ các món đã mua rồi bấm cập nhật vào Kho!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-[#5C7467] block">Tổng dự kiến cần mua thêm</span>
            <span className="font-mono tabular-nums text-2xl font-semibold text-[#2D6A4F]">
              {formatVND(totalGeneratedCost + totalCustomCost)}
            </span>
          </div>

          <button
            type="button"
            disabled={checkedGeneratedList.length + checkedCustomList.length === 0}
            onClick={handleCompleteShopping}
            className={`px-4 py-3 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              checkedGeneratedList.length + checkedCustomList.length > 0
                ? 'bg-[#2D6A4F] text-white hover:bg-[#1B4332]'
                : 'bg-[#E6EFE2] text-[#6B7F73] cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            Đã mua xong ({checkedGeneratedList.length + checkedCustomList.length} mục) · Nhập vào Kho
          </button>
        </div>
      </section>

      {restockSuccessMsg && (
        <div className="p-4 rounded-xl bg-[#E8F6EC] border border-[#95D5B2] text-sm text-[#1B4332] flex items-center justify-between gap-4">
          <span>
            <strong>Hoàn tất đi chợ:</strong> {restockSuccessMsg}
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('pantry')}
            className="px-3 py-1.5 bg-white border border-[#95D5B2] rounded-lg text-xs font-semibold text-[#1B4332] cursor-pointer whitespace-nowrap"
          >
            Mở Kho đồ ăn →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Auto-generated shopping list from Meal Plan */}
        <div className="lg:col-span-8 bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-[#F8FBF7] border-b border-[#E6EFE2] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#1B2A22]">
                Nguyên liệu còn thiếu cho Thực đơn ({generatedItems.length} mục)
              </h2>
              <p className="text-xs text-[#5C7467]">
                Những nguyên liệu đã đủ trong Kho đồ ăn được tự động ẩn khỏi danh sách phải mua.
              </p>
            </div>
            {generatedItems.length > 0 && (
              <button
                type="button"
                onClick={selectAllGenerated}
                className="px-3 py-1.5 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] rounded-lg cursor-pointer whitespace-nowrap"
              >
                Chọn tất cả ✓
              </button>
            )}
          </div>

          {generatedItems.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <ShoppingBag className="w-8 h-8 text-[#2D6A4F] mx-auto opacity-80" />
              <div className="text-base font-semibold text-[#1B2A22]">
                Tuyệt vời! Bạn đã có đủ 100% nguyên liệu trong Kho đồ ăn cho các bữa đã chọn
              </div>
              <p className="text-xs text-[#5C7467] max-w-md mx-auto">
                Bạn không cần tốn thêm tiền đi chợ cho thực đơn hiện tại, hoặc có thể chọn thêm món mới trong phần Khám phá / Kế hoạch ăn.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('explore')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2D6A4F] rounded-xl cursor-pointer"
                >
                  Chọn thêm món ăn
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('mealplan')}
                  className="px-4 py-2 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] rounded-xl cursor-pointer"
                >
                  Xem Kế hoạch ăn
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#E6EFE2]">
              {generatedItems.map((item) => {
                const isChecked = !!checkedGeneratedKeys[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleGeneratedKey(item.key)}
                    className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isChecked ? 'bg-[#F2F9F4]' : 'hover:bg-[#F8FBF7]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-0.5 text-[#2D6A4F]"
                        aria-label={`Đánh dấu đã mua ${item.name}`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5 text-[#8FA698]" />
                        )}
                      </button>
                      <div>
                        <div
                          className={`text-sm font-semibold ${
                            isChecked ? 'line-through text-[#6B7F73]' : 'text-[#1B2A22]'
                          }`}
                        >
                          {item.name}{' '}
                          <span className="font-mono tabular-nums text-xs font-normal text-[#2D6A4F]">
                            — Cần mua thêm: {item.missingToBuy} {item.unit}
                          </span>
                        </div>
                        <div className="text-xs text-[#5C7467] mt-0.5">
                          <span>Tổng cần: {item.totalRequired} {item.unit}</span>
                          <span className="mx-1.5">·</span>
                          <span>Đã có trong Kho: {item.availableInPantry} {item.unit}</span>
                          <span className="mx-1.5">·</span>
                          <span>Dùng cho: {item.usedInDishes.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-mono tabular-nums text-sm font-semibold text-[#1B2A22]">
                          {formatVND(item.estimatedCost)}
                        </span>
                        <span className="block text-[11px] text-[#5C7467]">{item.category}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPurchaseToPantry([
                            {
                              name: item.name,
                              amount: item.missingToBuy,
                              unit: item.unit,
                              category: item.category,
                              estimatedCost: item.estimatedCost,
                            },
                          ]);
                          setRestockSuccessMsg(
                            `Đã mua "${item.name} (${item.missingToBuy} ${item.unit})" và cộng vào Kho đồ ăn!`
                          );
                          setTimeout(() => setRestockSuccessMsg(null), 3500);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] rounded-lg transition-colors whitespace-nowrap"
                      >
                        Mua lẻ ✓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 4 Cols: Extra custom shopping items */}
        <div className="lg:col-span-4 bg-white border border-[#DCE5D8] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[#1B2A22]">
              Mua thêm gia vị / đồ dùng nhà bếp
            </h2>
            <p className="text-xs text-[#5C7467] mt-0.5">
              Ghi chú thêm các món cần mua ngoài thực đơn (dầu ăn, nước mắm, gạo...)
            </p>
          </div>

          <form onSubmit={handleAddCustom} className="space-y-3">
            <input
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Tên đồ cần mua (VD: Nước mắm, Dầu ăn...)"
              className="w-full px-3 py-2 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
            />
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.max(1, Number(e.target.value)))}
                  placeholder="SL"
                  className="px-3 py-2 text-xs font-mono tabular-nums bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="Đơn vị"
                  className="px-3 py-2 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#385747] mb-0.5">
                  Giá tiền ước tính (đ)
                </label>
                <CurrencyInput
                  value={customPrice}
                  onChange={(val) => setCustomPrice(val)}
                  quickDeltas={[2000, 5000, 10000, 20000]}
                  placeholder="Giá dự tính..."
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm vào giỏ đi chợ
            </button>
          </form>

          {customShoppingItems.length > 0 && (
            <div className="pt-3 border-t border-[#E6EFE2] space-y-2">
              <div className="text-xs font-semibold text-[#385747]">
                Danh sách mua thêm ({customShoppingItems.length}):
              </div>
              <div className="divide-y divide-[#E6EFE2] border border-[#DCE5D8] rounded-xl overflow-hidden">
                {customShoppingItems.map((ci) => {
                  const isEditingPrice = editingCustomId === ci.id;

                  if (isEditingPrice) {
                    return (
                      <div
                        key={ci.id}
                        className="p-2.5 bg-[#EEF5EE] flex flex-col gap-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#1B2A22]">
                            Chỉnh giá: {ci.name} ({ci.amount} {ci.unit})
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingCustomId(null)}
                            className="text-[#5C7467] hover:text-[#1B2A22]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <CurrencyInput
                          value={editPriceVal}
                          onChange={(v) => setEditPriceVal(v)}
                          quickDeltas={[2000, 5000, 10000]}
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateCustomShoppingItem) {
                                onUpdateCustomShoppingItem(ci.id, {
                                  estimatedPrice: editPriceVal,
                                });
                              }
                              setEditingCustomId(null);
                            }}
                            className="px-3 py-1 bg-[#2D6A4F] text-white rounded-lg font-medium text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Lưu giá
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={ci.id}
                      className="p-2.5 bg-[#F8FBF7] flex items-center justify-between gap-2 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleCustomShoppingItem(ci.id)}
                        className="flex items-center gap-2 text-left cursor-pointer min-w-0 flex-1"
                      >
                        {ci.checked ? (
                          <CheckSquare className="w-4 h-4 text-[#2D6A4F] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#8FA698] shrink-0" />
                        )}
                        <span
                          className={`truncate ${
                            ci.checked ? 'line-through text-[#6B7F73]' : 'text-[#1B2A22]'
                          }`}
                        >
                          {ci.name} ({ci.amount} {ci.unit})
                        </span>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCustomId(ci.id);
                            setEditPriceVal(ci.estimatedPrice);
                          }}
                          className="font-mono tabular-nums font-semibold text-[#1B2A22] hover:text-[#2D6A4F] hover:bg-[#E8EFE5] px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1"
                          title="Bấm để chỉnh sửa lại giá tiền"
                        >
                          {formatVND(ci.estimatedPrice)}
                          <Edit2 className="w-3 h-3 text-[#5C7467]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCustomShoppingItem(ci.id)}
                          className="text-[#6B7F73] hover:text-[#DC2626] p-1 cursor-pointer"
                          title="Xóa món"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-[#E6EFE2]">
            <button
              type="button"
              onClick={() => onNavigateTab('mealplan')}
              className="w-full py-2.5 px-3 text-xs font-semibold text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Chuyển sang bước Nấu ăn & Thực đơn <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle, Check, Utensils } from 'lucide-react';
import { Dish, PantryItem, PlannedMeal } from '../types';
import {
  evaluateDishWithPantry,
  formatVND,
  getDaysUntilExpiry,
  REFERENCE_TODAY,
} from '../utils/mealMath';
import { DishImage } from './DishImage';

interface PantryViewProps {
  pantry: PantryItem[];
  onAddPantryItem: (item: Omit<PantryItem, 'id'>) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onDeletePantryItem: (id: string) => void;
  dishes: Dish[];
  peopleCount: number;
  plannedMeals: PlannedMeal[];
  onSelectDishDetail: (dish: Dish) => void;
  onQuickAddMeal: (dishId: string, mode: 'cook' | 'eat_out') => void;
}

export const PantryView: React.FC<PantryViewProps> = ({
  pantry,
  onAddPantryItem,
  onUpdateQuantity,
  onDeletePantryItem,
  dishes,
  peopleCount,
  plannedMeals,
  onSelectDishDetail,
  onQuickAddMeal,
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(2);
  const [unit, setUnit] = useState('quả');
  const [category, setCategory] = useState<PantryItem['category']>('Rau củ');
  const [purchaseDate, setPurchaseDate] = useState(REFERENCE_TODAY);
  const [expiryDate, setExpiryDate] = useState('2026-10-02');
  const [estimatedValue, setEstimatedValue] = useState<number>(3000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || quantity <= 0) return;
    onAddPantryItem({
      name: name.trim(),
      quantity,
      unit: unit.trim() || 'phần',
      category,
      purchaseDate,
      expiryDate,
      estimatedValue,
    });
    setName('');
  };

  const quickPresets: Array<Omit<PantryItem, 'id'>> = [
    {
      name: 'Thịt heo xay',
      quantity: 150,
      unit: 'g',
      category: 'Thịt & Cá',
      purchaseDate: REFERENCE_TODAY,
      expiryDate: '2026-09-30',
      estimatedValue: 110,
    },
    {
      name: 'Bông cải xanh',
      quantity: 200,
      unit: 'g',
      category: 'Rau củ',
      purchaseDate: REFERENCE_TODAY,
      expiryDate: '2026-10-01',
      estimatedValue: 80,
    },
    {
      name: 'Cà rốt',
      quantity: 150,
      unit: 'g',
      category: 'Rau củ',
      purchaseDate: REFERENCE_TODAY,
      expiryDate: '2026-10-05',
      estimatedValue: 60,
    },
    {
      name: 'Thịt ba chỉ',
      quantity: 250,
      unit: 'g',
      category: 'Thịt & Cá',
      purchaseDate: REFERENCE_TODAY,
      expiryDate: '2026-09-30',
      estimatedValue: 160,
    },
  ];

  // Sort pantry by expiry date ascending so expiring items appear at the top
  const sortedPantry = [...pantry].sort(
    (a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)
  );

  // Recommend dishes based on pantry utilization & expiring ingredients rescue
  const recommendedFromPantry = dishes
    .map((dish) => evaluateDishWithPantry(dish, pantry, peopleCount, 'cook'))
    .sort((a, b) => {
      if (b.expiringIngredientsRescued.length !== a.expiringIngredientsRescued.length) {
        return b.expiringIngredientsRescued.length - a.expiringIngredientsRescued.length;
      }
      if (b.pantryMatchPercent !== a.pantryMatchPercent) {
        return b.pantryMatchPercent - a.pantryMatchPercent;
      }
      return a.netOutOfPocketCost - b.netOutOfPocketCost;
    });

  return (
    <div className="space-y-10">
      {/* Header & Add Form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Add Ingredient Form */}
        <div className="lg:col-span-5 bg-white border border-[#DCE5D8] rounded-2xl p-6 space-y-5">
          <div>
            <h1 className="text-xl font-display font-semibold text-[#1B2A22]">
              Thêm nguyên liệu vào Kho đồ ăn
            </h1>
            <p className="text-xs text-[#4A6355] mt-1">
              Nhập nguyên liệu đang có trong tủ lạnh và hạn sử dụng để ứng dụng ưu tiên gợi ý món nấu trước khi hỏng.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#385747] mb-1">
                Tên nguyên liệu
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cà chua, Trứng gà, Đậu hũ trắng, Thịt heo xay..."
                className="w-full px-3.5 py-2 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">Số lượng</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">Đơn vị</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
                >
                  <option value="quả">quả</option>
                  <option value="bìa">bìa</option>
                  <option value="g">g (gram)</option>
                  <option value="ml">ml</option>
                  <option value="bó">bó</option>
                  <option value="hộp">hộp</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">Phân loại</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PantryItem['category'])}
                  className="w-full px-2.5 py-2 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
                >
                  <option value="Rau củ">Rau củ</option>
                  <option value="Thịt & Cá">Thịt & Cá</option>
                  <option value="Trứng & Đậu">Trứng & Đậu</option>
                  <option value="Tinh bột">Tinh bột</option>
                  <option value="Gia vị & Đồ khô">Gia vị & Đồ khô</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">Ngày mua</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Hạn sử dụng
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl text-[#1B2A22]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Lưu vào Kho đồ ăn
            </button>
          </form>

          {/* Quick Add Presets */}
          <div className="pt-3 border-t border-[#E6EFE2] space-y-2">
            <span className="text-xs text-[#5C7467] block">
              Hoặc bấm thêm nhanh nguyên liệu hay có trong tủ lạnh:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAddPantryItem(preset)}
                  className="px-2.5 py-1.5 text-xs font-medium text-[#2D6A4F] bg-[#EEF5EE] hover:bg-[#D8F3DC] border border-[#CFE0D2] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  + {preset.name} ({preset.quantity}
                  {preset.unit})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Pantry Inventory Table */}
        <div className="lg:col-span-7 bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E6EFE2] flex flex-wrap items-center justify-between gap-2 bg-[#F8FBF7]">
            <div>
              <h2 className="text-base font-semibold text-[#1B2A22]">
                Tủ lạnh & Kho đồ ăn hiện có ({pantry.length} mục)
              </h2>
              <p className="text-xs text-[#5C7467]">
                Sắp xếp tự động theo hạn sử dụng gần nhất (Ngày tham chiếu: {REFERENCE_TODAY})
              </p>
            </div>
          </div>

          {sortedPantry.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="text-sm font-semibold text-[#1B2A22]">Kho đồ ăn đang trống</div>
              <p className="text-xs text-[#5C7467]">
                Hãy thêm nguyên liệu bên trái để ứng dụng gợi ý những món không tốn tiền mua thêm!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6EFE2] text-[11px] font-semibold text-[#5C7467] bg-[#FBFDFB]">
                    <th className="py-3 px-4">Nguyên liệu</th>
                    <th className="py-3 px-3">Số lượng</th>
                    <th className="py-3 px-3">Ngày mua</th>
                    <th className="py-3 px-3">Tình trạng hạn dùng</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EFE2] text-sm">
                  {sortedPantry.map((item) => {
                    const daysLeft = getDaysUntilExpiry(item.expiryDate);
                    const isExpiring = daysLeft <= 2;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#F8FBF7] transition-colors ${
                          isExpiring ? 'bg-[#FFF9F5]' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#1B2A22]">{item.name}</div>
                          <div className="text-xs text-[#5C7467]">{item.category}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(
                                  item.id,
                                  item.unit === 'g' || item.unit === 'ml' ? -50 : -1
                                )
                              }
                              className="w-6 h-6 rounded-md bg-[#F0F5EF] hover:bg-[#DCE5D8] text-xs font-bold text-[#1B2A22] cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-mono tabular-nums text-xs font-semibold text-[#1B2A22] min-w-[48px] text-center">
                              {item.quantity} {item.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(
                                  item.id,
                                  item.unit === 'g' || item.unit === 'ml' ? 50 : 1
                                )
                              }
                              className="w-6 h-6 rounded-md bg-[#F0F5EF] hover:bg-[#DCE5D8] text-xs font-bold text-[#1B2A22] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-xs text-[#5C7467]">
                          {item.purchaseDate}
                        </td>
                        <td className="py-3 px-3">
                          {daysLeft < 0 ? (
                            <span className="text-xs font-semibold text-[#DC2626] flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Đã quá hạn ({Math.abs(daysLeft)} ngày)
                            </span>
                          ) : isExpiring ? (
                            <span className="text-xs font-semibold text-[#B45309] flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Sắp hết hạn · Còn {daysLeft} ngày ({item.expiryDate})
                            </span>
                          ) : (
                            <span className="text-xs text-[#2D6A4F] font-mono tabular-nums">
                              Còn {daysLeft} ngày ({item.expiryDate})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onDeletePantryItem(item.id)}
                            className="p-1.5 text-[#6B7F73] hover:text-[#DC2626] transition-colors cursor-pointer"
                            title="Xóa nguyên liệu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Recommended Dishes Rescuing Expiring Ingredients */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-[#1B2A22]">
            Gợi ý món nấu tận dụng tối đa Kho đồ ăn hiện có
          </h2>
          <p className="text-sm text-[#4A6355]">
            Được xếp hạng ưu tiên theo số nguyên liệu sắp hết hạn được giải cứu và tỷ lệ nguyên liệu có sẵn cao nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedFromPantry.map((ev) => {
            const { dish } = ev;
            const selectedCount = plannedMeals.filter((m) => m.dishId === dish.id).length;

            return (
              <div
                key={dish.id}
                className="bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => onSelectDishDetail(dish)}
                    className="aspect-4/3 w-full overflow-hidden bg-[#EEF4ED] cursor-pointer"
                  >
                    <DishImage src={dish.image} alt={dish.name} className="w-full h-full" />
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#2D6A4F]">
                        Đáp ứng {ev.pantryMatchPercent}% nguyên liệu
                      </span>
                      <span className="font-mono tabular-nums text-[#5C7467]">
                        Đỡ tốn {formatVND(ev.savedFromPantryCost)}
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectDishDetail(dish)}
                      className="text-base font-semibold text-[#1B2A22] hover:text-[#2D6A4F] cursor-pointer"
                    >
                      {dish.name}
                    </h3>

                    {ev.expiringIngredientsRescued.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-[#FDF4EE] border border-[#F3D3BD] text-xs text-[#7C3A13]">
                        <strong>Ưu tiên giải cứu:</strong> Dùng ngay{' '}
                        {ev.expiringIngredientsRescued.join(', ')} sắp hết hạn!
                      </div>
                    )}

                    <div className="space-y-1 text-xs pt-1">
                      {ev.evaluatedIngredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-[#385747]">
                            {ing.ingredient.name} ({ing.requiredAmount} {ing.ingredient.unit})
                          </span>
                          {ing.missingAmount === 0 ? (
                            <span className="text-[#2D6A4F] font-medium">✓ Có sẵn trong Kho</span>
                          ) : (
                            <span className="text-[#B45309] font-mono tabular-nums">
                              Mua thêm {ing.missingAmount} {ing.ingredient.unit} (+
                              {formatVND(ing.netCostToBuy)})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-[#F8FBF7] border-t border-[#E6EFE2] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#5C7467] block">Chỉ cần mua thêm</span>
                    <span className="font-mono tabular-nums text-base font-semibold text-[#1B2A22]">
                      {formatVND(ev.netOutOfPocketCost)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectDishDetail(dish)}
                      className="px-3 py-2 text-xs font-medium text-[#385747] bg-white border border-[#DCE5D8] rounded-xl cursor-pointer"
                    >
                      Cách nấu
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAddMeal(dish.id, 'cook')}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        selectedCount > 0
                          ? 'bg-[#D8F3DC] text-[#1B4332] border border-[#95D5B2]'
                          : 'bg-[#2D6A4F] text-white hover:bg-[#1B4332]'
                      }`}
                    >
                      {selectedCount > 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Đã chọn ({selectedCount})
                        </>
                      ) : (
                        <>
                          <Utensils className="w-3.5 h-3.5" />
                          Chọn nấu
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

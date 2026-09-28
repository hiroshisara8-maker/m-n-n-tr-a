import React, { useState } from 'react';
import { Plus, Trash2, TrendingDown } from 'lucide-react';
import { ExpenseRecord } from '../types';
import { formatVND, REFERENCE_TODAY } from '../utils/mealMath';

interface ExpensesViewProps {
  budget: number;
  totalPlannedCost: number;
  totalSavedFromPantry: number;
  expenses: ExpenseRecord[];
  onAddExpense: (record: Omit<ExpenseRecord, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  budget,
  totalPlannedCost,
  totalSavedFromPantry,
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(REFERENCE_TODAY);
  const [category, setCategory] = useState<ExpenseRecord['category']>('Đi chợ nấu ăn');
  const [plannedAmount, setPlannedAmount] = useState<number>(35000);
  const [actualAmount, setActualAmount] = useState<number>(25000);
  const [note, setNote] = useState('');

  const totalActualSpent = expenses.reduce((sum, e) => sum + e.actualAmount, 0);
  const totalPlannedInHistory = expenses.reduce((sum, e) => sum + e.plannedAmount, 0);
  const totalSavedInHistory = expenses.reduce(
    (sum, e) => sum + Math.max(0, e.plannedAmount - e.actualAmount) + e.savedFromPantry,
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddExpense({
      date,
      title: title.trim(),
      category,
      plannedAmount,
      actualAmount,
      savedFromPantry: Math.max(0, plannedAmount - actualAmount),
      note: note.trim() || 'Ghi nhận chi tiêu hằng ngày',
    });
    setTitle('');
    setNote('');
  };

  return (
    <div className="space-y-8">
      {/* Top KPI Cards */}
      <section className="bg-white border border-[#DCE5D8] rounded-2xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[#1B2A22]">
            Chi phí ăn uống & Lịch sử tiết kiệm
          </h1>
          <p className="text-sm text-[#4A6355] mt-1">
            Đối chiếu chi phí dự kiến và chi phí thực tế, thống kê tổng số tiền đã tiết kiệm được nhờ tự nấu và tận dụng Kho đồ ăn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FBF7] border border-[#E6EFE2]">
            <span className="text-xs text-[#5C7467] block">Ngân sách kỳ này</span>
            <span className="font-mono tabular-nums text-xl font-semibold text-[#1B2A22] mt-1 block">
              {formatVND(budget)}
            </span>
            <span className="text-[11px] text-[#5C7467]">
              Dự kiến thực đơn hiện tại: {formatVND(totalPlannedCost)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FBF7] border border-[#E6EFE2]">
            <span className="text-xs text-[#5C7467] block">Chi phí dự kiến (Lịch sử)</span>
            <span className="font-mono tabular-nums text-xl font-semibold text-[#4A6355] mt-1 block">
              {formatVND(totalPlannedInHistory)}
            </span>
            <span className="text-[11px] text-[#5C7467]">
              Nếu mua ngoài hoặc mua mới 100%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FBF7] border border-[#E6EFE2]">
            <span className="text-xs text-[#5C7467] block">Chi phí thực tế đã chi</span>
            <span className="font-mono tabular-nums text-xl font-semibold text-[#B45309] mt-1 block">
              {formatVND(totalActualSpent)}
            </span>
            <span className="text-[11px] text-[#5C7467]">
              Còn lại trong ngân sách: {formatVND(Math.max(0, budget - totalActualSpent))}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#EEF5EE] border border-[#95D5B2]">
            <span className="text-xs font-semibold text-[#1B4332] flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-[#2D6A4F]" />
              Tổng số tiền đã tiết kiệm
            </span>
            <span className="font-mono tabular-nums text-xl font-semibold text-[#2D6A4F] mt-1 block">
              +{formatVND(totalSavedInHistory + totalSavedFromPantry)}
            </span>
            <span className="text-[11px] text-[#2D6A4F]">
              Nhờ tận dụng Kho đồ ăn & đi chợ thông minh
            </span>
          </div>
        </div>
      </section>

      {/* Main Content: Add Expense + Ledger Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Cols: Log New Expense */}
        <div className="lg:col-span-4 bg-white border border-[#DCE5D8] rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#1B2A22]">
              Cập nhật khoản chi mới
            </h2>
            <p className="text-xs text-[#5C7467] mt-0.5">
              Lưu lại chi phí đi chợ hoặc bữa ăn thực tế để theo dõi chênh lệch so với dự kiến.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#385747] mb-1">
                Nội dung chi tiêu
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Đi chợ mua thịt xay & rau cải..."
                className="w-full px-3.5 py-2 text-sm bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">Ngày chi</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">Danh mục</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseRecord['category'])}
                  className="w-full px-2.5 py-2 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                >
                  <option value="Đi chợ nấu ăn">Đi chợ nấu ăn</option>
                  <option value="Ăn ngoài / Đặt món">Ăn ngoài / Đặt món</option>
                  <option value="Nguyên liệu dự trữ">Nguyên liệu dự trữ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Chi phí dự kiến (đ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={plannedAmount}
                  onChange={(e) => setPlannedAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#385747] mb-1">
                  Chi phí thực tế (đ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={actualAmount}
                  onChange={(e) => setActualAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#385747] mb-1">
                Ghi chú tiết kiệm
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Tận dụng sẵn trứng và cà chua ở nhà..."
                className="w-full px-3.5 py-2 text-xs bg-[#F6F9F5] border border-[#DCE5D8] rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Lưu vào lịch sử chi tiêu
            </button>
          </form>
        </div>

        {/* Right 8 Cols: Expense History Table */}
        <div className="lg:col-span-8 bg-white border border-[#DCE5D8] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-[#F8FBF7] border-b border-[#E6EFE2] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1B2A22]">
              Sổ lịch sử chi tiêu ({expenses.length} giao dịch)
            </h2>
          </div>

          {expenses.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#5C7467]">
              Chưa có giao dịch chi tiêu nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6EFE2] text-[11px] font-semibold text-[#5C7467] bg-[#FBFDFB]">
                    <th className="py-3 px-4">Ngày & Nội dung</th>
                    <th className="py-3 px-3 text-right">Dự kiến</th>
                    <th className="py-3 px-3 text-right">Thực tế</th>
                    <th className="py-3 px-3 text-right">Tiết kiệm</th>
                    <th className="py-3 px-4 text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EFE2] text-sm">
                  {expenses.map((exp) => {
                    const saved = Math.max(0, exp.plannedAmount - exp.actualAmount, exp.savedFromPantry);
                    return (
                      <tr key={exp.id} className="hover:bg-[#F8FBF7]">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#1B2A22]">{exp.title}</div>
                          <div className="text-xs text-[#5C7467]">
                            <span className="font-mono tabular-nums">{exp.date}</span> ·{' '}
                            <span>{exp.category}</span>
                            {exp.note ? ` · ${exp.note}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs text-[#5C7467]">
                          {formatVND(exp.plannedAmount)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-sm font-semibold text-[#1B2A22]">
                          {formatVND(exp.actualAmount)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs font-semibold text-[#2D6A4F]">
                          +{formatVND(saved)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 text-[#6B7F73] hover:text-[#DC2626] cursor-pointer"
                            title="Xóa bản ghi"
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
      </div>
    </div>
  );
};

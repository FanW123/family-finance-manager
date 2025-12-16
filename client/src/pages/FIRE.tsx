import { useEffect, useState } from 'react';
import api from '../apiClient';
import { format } from 'date-fns';
import { FIRE_CATEGORIES, FIRE_GROUPS } from './Expenses';
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ExpenseSummary {
  category: string;
  total: number;
  count: number;
}

interface FIREMetrics {
  totalIncome: number;
  totalExpenses: number;
  essentialExpenses: number;
  workExpenses: number;
  optionalExpenses: number;
  savings: number;
  debtPayments: number;
  savingsRate: number;
  retirementExpenses: number;
  fireNumber: number;
}


export default function FIRE() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [, setLoading] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/expenses/summary?month=${selectedMonth}&year=${selectedYear}`);
      setExpenseSummary(res.data.summary || []);
      setTotalExpenses(res.data.total || 0);
      
      // 加载月度收入（从localStorage或API）
      const savedIncome = localStorage.getItem(`income_${selectedYear}_${selectedMonth}`);
      if (savedIncome) {
        setTotalIncome(parseFloat(savedIncome));
        setMonthlyIncome(savedIncome);
      }
    } catch (error) {
      console.error('Error loading FIRE data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIncome = () => {
    const income = parseFloat(monthlyIncome);
    if (isNaN(income) || income <= 0) {
      alert('请输入有效的收入金额');
      return;
    }
    setTotalIncome(income);
    localStorage.setItem(`income_${selectedYear}_${selectedMonth}`, monthlyIncome);
    setShowIncomeForm(false);
  };

  const calculateFIREMetrics = (): FIREMetrics => {
    const expenseMap = new Map(expenseSummary.map(e => [e.category, e.total]));
    
    let essentialExpenses = 0;
    let workExpenses = 0;
    let optionalExpenses = 0;
    let savings = 0;
    let debtPayments = 0;

    FIRE_CATEGORIES.forEach(cat => {
      const amount = expenseMap.get(cat.value) || 0;
      switch (cat.group) {
        case 'essential':
          essentialExpenses += amount;
          break;
        case 'work':
          workExpenses += amount;
          break;
        case 'optional':
          optionalExpenses += amount;
          break;
        case 'savings':
          savings += amount;
          break;
        case 'debt':
          debtPayments += amount;
          break;
      }
    });

    const totalExpensesCalc = essentialExpenses + workExpenses + optionalExpenses + debtPayments;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    const retirementExpenses = essentialExpenses + optionalExpenses; // 排除工作相关支出
    const fireNumber = retirementExpenses * 12 * 25; // 4%法则：年度支出 × 25

    return {
      totalIncome,
      totalExpenses: totalExpensesCalc,
      essentialExpenses,
      workExpenses,
      optionalExpenses,
      savings,
      debtPayments,
      savingsRate: Math.round(savingsRate * 100) / 100,
      retirementExpenses,
      fireNumber: Math.round(fireNumber),
    };
  };

  const metrics = calculateFIREMetrics();

  const expenseByGroupData = [
    { name: '必需支出', value: metrics.essentialExpenses, color: '#3b82f6' },
    { name: '工作相关', value: metrics.workExpenses, color: '#10b981' },
    { name: '可选支出', value: metrics.optionalExpenses, color: '#f59e0b' },
    { name: '债务偿还', value: metrics.debtPayments, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const categoryBreakdown = expenseSummary
    .map(item => {
      const category = FIRE_CATEGORIES.find(c => c.value === item.category);
      return {
        name: category ? category.label : item.category,
        group: category ? FIRE_GROUPS[category.group as keyof typeof FIRE_GROUPS].label : '其他',
        value: item.total,
      };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">FIRE 财务分析</h1>
        <div className="flex gap-4">
          <select
            value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedYear(parseInt(year));
              setSelectedMonth(parseInt(month));
            }}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date(selectedYear, i, 1);
              return (
                <option key={i} value={`${selectedYear}-${String(i + 1).padStart(2, '0')}`}>
                  {format(date, 'yyyy年MM月')}
                </option>
              );
            })}
          </select>
          <button
            onClick={() => setShowIncomeForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {totalIncome > 0 ? '更新收入' : '设置收入'}
          </button>
        </div>
      </div>

      {showIncomeForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">设置月度收入</h2>
          <div className="flex gap-4">
            <input
              type="number"
              step="0.01"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="请输入月度收入（¥）"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            />
            <button
              onClick={handleSaveIncome}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              保存
            </button>
            <button
              onClick={() => setShowIncomeForm(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* FIRE 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">储蓄率</div>
          <div className={`text-3xl font-bold ${metrics.savingsRate >= 50 ? 'text-green-600' : metrics.savingsRate >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
            {metrics.savingsRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {metrics.savingsRate >= 50 ? '✓ 达到FIRE目标' : metrics.savingsRate >= 30 ? '接近目标' : '需要提高'}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">必需支出</div>
          <div className="text-3xl font-bold text-blue-600">
            ¥{metrics.essentialExpenses.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-500 mt-2">退休后继续</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">退休后总支出</div>
          <div className="text-3xl font-bold text-indigo-600">
            ¥{metrics.retirementExpenses.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-500 mt-2">年度: ¥{(metrics.retirementExpenses * 12).toLocaleString('zh-CN')}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-1">FIRE 数字</div>
          <div className="text-3xl font-bold text-purple-600">
            ¥{metrics.fireNumber.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-500 mt-2">4%法则计算</div>
        </div>
      </div>

      {/* 支出分组分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">支出分组</h2>
          {expenseByGroupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByGroupData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseByGroupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString('zh-CN')}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">暂无支出数据</div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">分组明细</h2>
          <div className="space-y-3">
            {Object.entries(FIRE_GROUPS).map(([key, group]) => {
              const groupExpenses = expenseSummary
                .filter(item => {
                  const cat = FIRE_CATEGORIES.find(c => c.value === item.category);
                  return cat?.group === key;
                })
                .reduce((sum, item) => sum + item.total, 0);

              if (groupExpenses === 0) return null;

              return (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{group.label}</div>
                      <div className="text-xs text-gray-500">{group.description}</div>
                    </div>
                    <div className="text-lg font-bold text-indigo-600">
                      ¥{groupExpenses.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 类别明细 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">类别明细</h2>
        {categoryBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类别
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分组
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    占比
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryBreakdown.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.group}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ¥{item.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">暂无支出数据</div>
        )}
      </div>

      {/* FIRE 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 FIRE 说明</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>储蓄率目标 ≥50%</strong>：这是实现FIRE的关键指标</li>
          <li><strong>必需支出</strong>：退休后仍需要支付的费用（住房、食品、医疗等）</li>
          <li><strong>工作相关支出</strong>：退休后可以消除的费用（通勤、工作餐等）</li>
          <li><strong>退休后总支出</strong>：必需支出 + 可选支出（排除工作相关）</li>
          <li><strong>FIRE数字</strong>：根据4%法则计算，退休后总支出 × 12 × 25 = 需要的总资产</li>
          <li>达到FIRE数字后，每年提取4%即可覆盖退休后支出</li>
        </ul>
      </div>
    </div>
  );
}


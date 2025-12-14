import { useEffect, useState } from 'react';
import api from '../api/client';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// FIRE 目标支出类别 - 5大分组
export const FIRE_CATEGORIES = [
  // 必需支出（退休后继续）
  { value: 'housing', label: '住房', group: 'essential', description: '房租/房贷、水电、物业、维修等' },
  { value: 'utilities', label: '公用事业', group: 'essential', description: '网络、电话、电视、水电等' },
  { value: 'food_groceries', label: '食品采购', group: 'essential', description: '日常食品、日用品采购等' },
  { value: 'healthcare', label: '医疗', group: 'essential', description: '医疗费用、药品、体检等' },
  { value: 'insurance_health', label: '健康保险', group: 'essential', description: '健康保险、医疗保险等' },
  { value: 'insurance_other', label: '其他保险', group: 'essential', description: '房屋保险、车险等' },
  { value: 'property_tax', label: '房产税', group: 'essential', description: '房产税、物业税等' },
  
  // 工作相关（退休后消失）
  { value: 'commute', label: '通勤', group: 'work', description: '交通费、油费、停车费等' },
  { value: 'work_meals', label: '工作餐', group: 'work', description: '工作日的午餐、咖啡等' },
  { value: 'work_clothing', label: '职业装', group: 'work', description: '工作服装、干洗等' },
  { value: 'work_tools', label: '工作工具', group: 'work', description: '工作设备、软件、培训等' },
  
  // 可选支出
  { value: 'dining_out', label: '外出就餐', group: 'optional', description: '餐厅、外卖、娱乐餐饮等' },
  { value: 'travel', label: '旅行', group: 'optional', description: '度假、旅行、酒店等' },
  { value: 'entertainment', label: '娱乐', group: 'optional', description: '电影、演出、爱好、订阅服务等' },
  { value: 'shopping', label: '购物', group: 'optional', description: '非必需品购物、衣物、电子产品等' },
  { value: 'personal_care', label: '个人护理', group: 'optional', description: '理发、化妆品、健身等' },
  { value: 'education', label: '教育', group: 'optional', description: '学习、培训、书籍、课程等' },
  
  // 储蓄与投资
  { value: 'savings_401k', label: '401(k)', group: 'savings', description: '401(k)退休账户储蓄' },
  { value: 'savings_ira', label: 'IRA', group: 'savings', description: 'IRA退休账户储蓄' },
  { value: 'savings_taxable', label: '应税投资', group: 'savings', description: '应税投资账户储蓄' },
  { value: 'savings_hsa', label: 'HSA', group: 'savings', description: '健康储蓄账户' },
  { value: 'savings_other', label: '其他储蓄', group: 'savings', description: '其他储蓄和投资' },
  
  // 债务偿还
  { value: 'debt_student', label: '学贷', group: 'debt', description: '学生贷款还款' },
  { value: 'debt_car', label: '车贷', group: 'debt', description: '汽车贷款还款' },
  { value: 'debt_credit', label: '信用卡', group: 'debt', description: '信用卡还款' },
  { value: 'debt_mortgage', label: '房贷本金', group: 'debt', description: '房贷本金还款（利息计入住房）' },
  { value: 'debt_other', label: '其他债务', group: 'debt', description: '其他债务还款' },
] as const;

export const FIRE_GROUPS = {
  essential: { label: '必需支出', description: '退休后继续' },
  work: { label: '工作相关', description: '退休后消失' },
  optional: { label: '可选支出', description: '可调整' },
  savings: { label: '储蓄与投资', description: '积累财富' },
  debt: { label: '债务偿还', description: '还清债务' },
} as const;

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface BudgetAnalysis {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  overBudget: boolean;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<BudgetAnalysis[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [newBudget, setNewBudget] = useState({
    category: '',
    monthly_limit: '',
  });

  useEffect(() => {
    loadExpenses();
    loadBudgetAnalysis();
  }, [selectedMonth, selectedYear]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/expenses?month=${selectedMonth}&year=${selectedYear}`);
      setExpenses(res.data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetAnalysis = async () => {
    try {
      const res = await api.get(`/expenses/budget-analysis?month=${selectedMonth}&year=${selectedYear}`);
      setBudgetAnalysis(res.data);
    } catch (error) {
      console.error('Error loading budget analysis:', error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 验证输入
    if (!newExpense.amount || !newExpense.category || !newExpense.date) {
      setErrorMessage('请填写所有必填字段');
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('请输入有效的金额');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    
    try {
      const response = await api.post('/expenses', {
        ...newExpense,
        amount: amount,
      });
      
      // 只有在成功响应后才关闭表单
      if (response.status === 200 || response.status === 201) {
        // 检查新添加的支出日期，如果不在当前选择的月份，切换到正确的月份
        const expenseDate = new Date(newExpense.date);
        const expenseMonth = expenseDate.getMonth() + 1;
        const expenseYear = expenseDate.getFullYear();
        
        if (expenseMonth !== selectedMonth || expenseYear !== selectedYear) {
          setSelectedMonth(expenseMonth);
          setSelectedYear(expenseYear);
        }
        
        setNewExpense({ amount: '', category: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
        setErrorMessage(null);
        setSuccessMessage('支出添加成功！');
        // 刷新数据
        await Promise.all([loadExpenses(), loadBudgetAnalysis()]);
        // 延迟关闭表单，让用户看到成功消息
        setTimeout(() => {
          setShowAddForm(false);
          setSuccessMessage(null);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error adding expense:', error);
      const errorMsg = error.response?.data?.error || error.message || '添加支出失败，请稍后重试';
      setErrorMessage(errorMsg);
      // 失败时不关闭表单，让用户可以看到错误并重试
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses/budgets', {
        ...newBudget,
        monthly_limit: parseFloat(newBudget.monthly_limit),
      });
      setNewBudget({ category: '', monthly_limit: '' });
      setShowBudgetForm(false);
      loadBudgetAnalysis();
    } catch (error) {
      console.error('Error adding budget:', error);
      alert('添加预算失败');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setNewExpense({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      date: expense.date,
    });
    setShowAddForm(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editingExpenseId) return;

    // 验证输入
    if (!newExpense.amount || !newExpense.category || !newExpense.date) {
      setErrorMessage('请填写所有必填字段');
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('请输入有效的金额');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    
    try {
      const response = await api.put(`/expenses/${editingExpenseId}`, {
        ...newExpense,
        amount: amount,
      });
      
      // 只有在成功响应后才关闭表单
      if (response.status === 200) {
        // 检查更新后的支出日期，如果不在当前选择的月份，切换到正确的月份
        const expenseDate = new Date(newExpense.date);
        const expenseMonth = expenseDate.getMonth() + 1;
        const expenseYear = expenseDate.getFullYear();
        
        if (expenseMonth !== selectedMonth || expenseYear !== selectedYear) {
          setSelectedMonth(expenseMonth);
          setSelectedYear(expenseYear);
        }
        
        setNewExpense({ amount: '', category: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
        setEditingExpenseId(null);
        setErrorMessage(null);
        setSuccessMessage('支出更新成功！');
        // 刷新数据
        await Promise.all([loadExpenses(), loadBudgetAnalysis()]);
        // 延迟关闭表单，让用户看到成功消息
        setTimeout(() => {
          setShowAddForm(false);
          setSuccessMessage(null);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error updating expense:', error);
      const errorMsg = error.response?.data?.error || error.message || '更新支出失败，请稍后重试';
      setErrorMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('确定要删除这条支出记录吗？')) return;
    try {
      await api.delete(`/expenses/${id}`);
      loadExpenses();
      loadBudgetAnalysis();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('删除失败');
    }
  };

  // 获取类别显示名称
  const getCategoryLabel = (categoryValue: string) => {
    const category = FIRE_CATEGORIES.find(c => c.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const chartData = budgetAnalysis.map(item => ({
    name: getCategoryLabel(item.category),
    预算: item.budget,
    实际: item.spent,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">支出管理</h1>
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
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            + 添加支出
          </button>
          <button
            onClick={() => setShowBudgetForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            + 设置预算
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingExpenseId ? '编辑支出' : '添加支出'}
          </h2>
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
          <form onSubmit={editingExpenseId ? handleUpdateExpense : handleAddExpense} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                <select
                  required
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">请选择类别</option>
                  {Object.entries(FIRE_GROUPS).map(([groupKey, group]) => (
                    <optgroup key={groupKey} label={`${group.label} (${group.description})`}>
                      {FIRE_CATEGORIES.filter(cat => cat.group === groupKey).map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label} - {cat.description}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  required
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="可选"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingExpenseId(null);
                  setNewExpense({ amount: '', category: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                disabled={submitting}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {showBudgetForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">设置预算</h2>
          <form onSubmit={handleAddBudget} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
                <select
                  required
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">请选择类别</option>
                  {Object.entries(FIRE_GROUPS).map(([groupKey, group]) => (
                    <optgroup key={groupKey} label={`${group.label} (${group.description})`}>
                      {FIRE_CATEGORIES.filter(cat => cat.group === groupKey).map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label} - {cat.description}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">月度预算 (¥)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newBudget.monthly_limit}
                  onChange={(e) => setNewBudget({ ...newBudget, monthly_limit: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => setShowBudgetForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">预算分析</h2>
        {budgetAnalysis.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString('zh-CN')}`} />
                <Legend />
                <Bar dataKey="预算" fill="#10b981" />
                <Bar dataKey="实际" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 space-y-2">
              {budgetAnalysis.map((item) => (
                <div
                  key={item.category}
                  className={`p-4 rounded-lg ${
                    item.overBudget ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{getCategoryLabel(item.category)}</div>
                      <div className="text-sm text-gray-600">
                        预算: ¥{item.budget.toLocaleString('zh-CN')} | 
                        已用: ¥{item.spent.toLocaleString('zh-CN')} | 
                        剩余: ¥{item.remaining.toLocaleString('zh-CN')} | 
                        使用率: {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                    {item.overBudget && (
                      <span className="text-red-600 font-semibold">超预算!</span>
                    )}
                  </div>
                  {item.overBudget && (
                    <div className="mt-2 text-sm text-red-600">
                      💡 建议：可以考虑削减 {getCategoryLabel(item.category)} 的支出
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            暂无预算数据，请先设置预算
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">支出记录</h2>
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类别
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(expense.date), 'yyyy-MM-dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCategoryLabel(expense.category)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {expense.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ¥{expense.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            本月暂无支出记录
          </div>
        )}
      </div>
    </div>
  );
}


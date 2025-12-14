import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FIRE_CATEGORIES } from './Expenses';

interface ExpenseSummary {
  category: string;
  total: number;
  count: number;
}

interface InvestmentAllocation {
  current: Array<{ type: string; amount: number; percentage: number }>;
  target: Array<{ type: string; percentage: number }>;
  totalValue: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [investmentAllocation, setInvestmentAllocation] = useState<InvestmentAllocation | null>(null);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesRes, investmentsRes] = await Promise.all([
        api.get(`/expenses/summary?month=${currentMonth}&year=${currentYear}`),
        api.get('/investments/allocation'),
      ]);

      setExpenseSummary(expensesRes.data.summary);
      setTotalExpenses(expensesRes.data.total);
      setInvestmentAllocation(investmentsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  // 获取类别显示名称
  const getCategoryLabel = (categoryValue: string) => {
    const category = FIRE_CATEGORIES.find(c => c.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const expenseChartData = expenseSummary.map((item) => ({
    name: getCategoryLabel(item.category),
    value: item.total,
  }));

  const allocationData = investmentAllocation?.current.map(item => ({
    name: item.type === 'stocks' ? '股票' : item.type === 'bonds' ? '债券' : '现金',
    current: item.percentage,
    target: investmentAllocation.target.find(t => t.type === item.type)?.percentage || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {format(new Date(), 'yyyy年MM月')} 概览
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">本月总支出</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">
              ¥{totalExpenses.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">投资组合总值</div>
            <div className="text-3xl font-bold text-green-900 mt-2">
              ¥{investmentAllocation?.totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">支出类别数</div>
            <div className="text-3xl font-bold text-purple-900 mt-2">
              {expenseSummary.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">支出分布</h3>
          {expenseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString('zh-CN')}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无支出数据
              <Link to="/expenses" className="text-indigo-600 hover:text-indigo-800 ml-2">
                添加支出
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">资产配置</h3>
          {allocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allocationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="current" fill="#3b82f6" name="当前配置" />
                <Bar dataKey="target" fill="#10b981" name="目标配置" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无投资数据
              <Link to="/investments" className="text-indigo-600 hover:text-indigo-800 ml-2">
                添加投资
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/expenses"
            className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-semibold text-indigo-900">记录支出</div>
            <div className="text-sm text-indigo-600 mt-1">添加新的支出记录</div>
          </Link>
          <Link
            to="/investments"
            className="bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold text-green-900">更新投资</div>
            <div className="text-sm text-green-600 mt-1">添加或更新投资记录</div>
          </Link>
          <Link
            to="/rebalancing"
            className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">⚖️</div>
            <div className="font-semibold text-purple-900">查看再平衡</div>
            <div className="text-sm text-purple-600 mt-1">获取资产再平衡建议</div>
          </Link>
        </div>
      </div>
    </div>
  );
}


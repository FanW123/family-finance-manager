import { useEffect, useState } from 'react';
import api from '../api/client';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Investment {
  id: number;
  type: string;
  symbol: string | null;
  name: string;
  amount: number;
  price: number | null;
  quantity: number | null;
  date: string;
}

interface Allocation {
  current: Array<{ type: string; amount: number; percentage: number }>;
  target: Array<{ type: string; percentage: number }>;
  totalValue: number;
}

const COLORS = {
  stocks: '#3b82f6',
  bonds: '#10b981',
  cash: '#f59e0b',
};

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newInvestment, setNewInvestment] = useState({
    type: 'stocks',
    symbol: '',
    name: '',
    amount: '',
    price: '',
    quantity: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [targetAllocation, setTargetAllocation] = useState({
    stocks: 60,
    bonds: 30,
    cash: 10,
  });

  useEffect(() => {
    loadInvestments();
    loadAllocation();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/investments');
      setInvestments(res.data);
    } catch (error) {
      console.error('Error loading investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllocation = async () => {
    try {
      const res = await api.get('/investments/allocation');
      setAllocation(res.data);
      const targetMap = new Map(res.data.target.map((t: { type: string; percentage: number }) => [t.type, t.percentage]));
      setTargetAllocation({
        stocks: (targetMap.get('stocks') as number) || 60,
        bonds: (targetMap.get('bonds') as number) || 30,
        cash: (targetMap.get('cash') as number) || 10,
      });
    } catch (error) {
      console.error('Error loading allocation:', error);
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/investments', {
        ...newInvestment,
        amount: parseFloat(newInvestment.amount),
        price: newInvestment.price ? parseFloat(newInvestment.price) : null,
        quantity: newInvestment.quantity ? parseFloat(newInvestment.quantity) : null,
        symbol: newInvestment.symbol || null,
      });
      setNewInvestment({
        type: 'stocks',
        symbol: '',
        name: '',
        amount: '',
        price: '',
        quantity: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setShowAddForm(false);
      loadInvestments();
      loadAllocation();
    } catch (error) {
      console.error('Error adding investment:', error);
      alert('添加投资失败');
    }
  };

  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = targetAllocation.stocks + targetAllocation.bonds + targetAllocation.cash;
    if (Math.abs(total - 100) > 0.01) {
      alert('目标配置总和必须等于100%');
      return;
    }

    try {
      await api.put('/investments/target-allocation', {
        allocations: [
          { type: 'stocks', percentage: targetAllocation.stocks },
          { type: 'bonds', percentage: targetAllocation.bonds },
          { type: 'cash', percentage: targetAllocation.cash },
        ],
      });
      setShowTargetForm(false);
      loadAllocation();
    } catch (error) {
      console.error('Error updating target allocation:', error);
      alert('更新目标配置失败');
    }
  };

  const handleDeleteInvestment = async (id: number) => {
    if (!confirm('确定要删除这条投资记录吗？')) return;
    try {
      await api.delete(`/investments/${id}`);
      loadInvestments();
      loadAllocation();
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('删除失败');
    }
  };

  const allocationData = allocation?.current.map(item => ({
    name: item.type === 'stocks' ? '股票' : item.type === 'bonds' ? '债券' : '现金',
    value: item.percentage,
    amount: item.amount,
  })) || [];

  const getTypeLabel = (type: string) => {
    return type === 'stocks' ? '股票' : type === 'bonds' ? '债券' : '现金';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">投资跟踪</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowTargetForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            设置目标配置
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            + 添加投资
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">添加投资</h2>
          <form onSubmit={handleAddInvestment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select
                  value={newInvestment.type}
                  onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="stocks">股票</option>
                  <option value="bonds">债券</option>
                  <option value="cash">现金</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  required
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="例如：苹果股票、国债等"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">代码 (可选)</label>
                <input
                  type="text"
                  value={newInvestment.symbol}
                  onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="例如：AAPL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">总价值 (¥)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newInvestment.amount}
                  onChange={(e) => setNewInvestment({ ...newInvestment, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">单价 (可选)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newInvestment.price}
                  onChange={(e) => setNewInvestment({ ...newInvestment, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">数量 (可选)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newInvestment.quantity}
                  onChange={(e) => setNewInvestment({ ...newInvestment, quantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  required
                  value={newInvestment.date}
                  onChange={(e) => setNewInvestment({ ...newInvestment, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {showTargetForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">设置目标资产配置</h2>
          <form onSubmit={handleUpdateTarget} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  股票占比 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={targetAllocation.stocks}
                  onChange={(e) => setTargetAllocation({ ...targetAllocation, stocks: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  债券占比 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={targetAllocation.bonds}
                  onChange={(e) => setTargetAllocation({ ...targetAllocation, bonds: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  现金占比 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={targetAllocation.cash}
                  onChange={(e) => setTargetAllocation({ ...targetAllocation, cash: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="text-sm text-gray-600">
                总和: {targetAllocation.stocks + targetAllocation.bonds + targetAllocation.cash}%
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => setShowTargetForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">当前资产配置</h2>
          {allocation && allocation.totalValue > 0 ? (
            <>
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ¥{allocation.totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">投资组合总价值</div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name === '股票' ? 'stocks' : entry.name === '债券' ? 'bonds' : 'cash']}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(1)}% (¥${props.payload.amount.toLocaleString('zh-CN')})`,
                    name
                  ]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {allocation.current.map((item) => {
                  const target = allocation.target.find(t => t.type === item.type);
                  return (
                    <div key={item.type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{getTypeLabel(item.type)}</span>
                      <div className="text-sm text-gray-600">
                        {item.percentage.toFixed(1)}% / 目标: {target?.percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无投资数据
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">目标配置</h2>
          {allocation && (
            <div className="space-y-3">
              {allocation.target.map((target) => (
                <div key={target.type} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{getTypeLabel(target.type)}</span>
                    <span className="text-2xl font-bold text-indigo-600">{target.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">投资记录</h2>
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : investments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    代码
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    价值
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investments.map((investment) => (
                  <tr key={investment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(investment.date), 'yyyy-MM-dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTypeLabel(investment.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {investment.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {investment.symbol || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ¥{investment.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteInvestment(investment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            暂无投资记录
          </div>
        )}
      </div>
    </div>
  );
}


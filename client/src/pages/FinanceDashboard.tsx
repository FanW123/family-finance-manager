import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../apiClient';

const COLORS = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#0f3460',
  highlight: '#e94560',
  success: '#00d9ff',
  warning: '#ffd369',
  stocks: '#e94560',
  bonds: '#00d9ff',
  cash: '#ffd369',
  background: '#0a0a14',
  card: '#16213e',
  text: '#eee',
  textMuted: '#a0a0b0'
};

// FIRE-focused expense categories
const EXPENSE_CATEGORIES = {
  essential: {
    label: '必需支出（退休后继续）',
    color: '#e94560',
    categories: [
      { value: 'housing', label: '住房 - 房贷/租金' },
      { value: 'utilities', label: '水电煤网' },
      { value: 'food_groceries', label: '食品杂货' },
      { value: 'insurance_health', label: '医疗保险' },
      { value: 'insurance_other', label: '汽车/人身保险' },
      { value: 'property_tax', label: '房产税' }
    ]
  },
  workRelated: {
    label: '工作相关（退休后消失）',
    color: '#00d9ff',
    categories: [
      { value: 'commute', label: '通勤交通' },
      { value: 'work_meals', label: '工作餐饮' },
      { value: 'work_clothing', label: '职业装' },
      { value: 'work_tools', label: '职业发展/培训' }
    ]
  },
  discretionary: {
    label: '可选支出',
    color: '#ffd369',
    categories: [
      { value: 'dining_out', label: '外出就餐' },
      { value: 'entertainment', label: '娱乐休闲' },
      { value: 'travel', label: '旅行度假' },
      { value: 'shopping', label: '购物消费' },
      { value: 'subscriptions', label: '订阅服务' }
    ]
  },
  savingsInvestment: {
    label: '储蓄与投资',
    color: '#06ffa5',
    categories: [
      { value: 'savings_401k', label: '401(k)供款' },
      { value: 'savings_ira', label: 'IRA供款' },
      { value: 'savings_taxable', label: '应税投资账户' },
      { value: 'savings_hsa', label: 'HSA供款' },
      { value: 'savings_emergency', label: '紧急储备金' }
    ]
  },
  debt: {
    label: '债务偿还',
    color: '#9d4edd',
    categories: [
      { value: 'debt_student', label: '学生贷款' },
      { value: 'debt_car', label: '车贷' },
      { value: 'debt_credit', label: '信用卡还款' },
      { value: 'debt_other', label: '其他债务' }
    ]
  }
};

interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface Investment {
  id: number;
  type: 'stocks' | 'bonds' | 'cash';
  amount: number;
  symbol?: string;
  name?: string;
}

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [fireMultiplier, setFireMultiplier] = useState(28.6);
  const [retirementYears, setRetirementYears] = useState(50);
  const [targetAllocation, setTargetAllocation] = useState({
    stocks: 40,
    bonds: 40,
    cash: 20
  });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'current' | 'trends'>('current');

  // Load data from API
  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load expenses
      const expensesRes = await api.get(`/expenses?month=${selectedMonth}&year=${selectedYear}`);
      setExpenses(expensesRes.data);

      // Load investments
      const investmentsRes = await api.get('/investments');
      setInvestments(investmentsRes.data);

      // Load target allocation
      const targetRes = await api.get('/investments/target-allocation');
      if (targetRes.data) {
        setTargetAllocation(targetRes.data);
      }

      // Load monthly income from localStorage (or could be from API)
      const savedIncome = localStorage.getItem('monthlyIncome');
      if (savedIncome) {
        setMonthlyIncome(parseFloat(savedIncome));
      }

      const savedMultiplier = localStorage.getItem('fireMultiplier');
      if (savedMultiplier) {
        setFireMultiplier(parseFloat(savedMultiplier));
      }

      const savedYears = localStorage.getItem('retirementYears');
      if (savedYears) {
        setRetirementYears(parseInt(savedYears));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (newExpense.category && newExpense.amount && newExpense.date) {
      try {
        await api.post('/expenses', {
          category: newExpense.category,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description || '',
          date: newExpense.date
        });
        await loadData();
        setNewExpense({ category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
        setShowAddExpense(false);
      } catch (error) {
        console.error('Error adding expense:', error);
        alert('添加支出失败');
      }
    }
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('确定要删除这条支出吗？')) return;
    try {
      await api.delete(`/expenses/${id}`);
      await loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('删除失败');
    }
  };

  const updateTargetAllocation = async (type: 'stocks' | 'bonds' | 'cash', value: number) => {
    const updated = { ...targetAllocation, [type]: value };
    setTargetAllocation(updated);
    try {
      await api.post('/investments/target-allocation', updated);
    } catch (error) {
      console.error('Error updating target allocation:', error);
    }
  };

  // Calculate expense categories
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

  // Calculate FIRE metrics
  const getCategoryGroup = (category: string) => {
    for (const [groupKey, group] of Object.entries(EXPENSE_CATEGORIES)) {
      if (group.categories.some(cat => cat.value === category)) {
        return groupKey;
      }
    }
    return 'other';
  };

  // Filter expenses by selected month/year
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() + 1 === selectedMonth && expenseDate.getFullYear() === selectedYear;
  });

  // Calculate monthly aggregations
  const getMonthlyAggregation = () => {
    const monthlyData: Record<string, {
      total: number;
      byGroup: Record<string, number>;
      count: number;
      month: number;
      year: number;
    }> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          total: 0,
          byGroup: {},
          count: 0,
          month: date.getMonth() + 1,
          year: date.getFullYear()
        };
      }
      
      monthlyData[monthKey].total += expense.amount;
      monthlyData[monthKey].count += 1;
      
      const group = getCategoryGroup(expense.category);
      monthlyData[monthKey].byGroup[group] = (monthlyData[monthKey].byGroup[group] || 0) + expense.amount;
    });
    
    return monthlyData;
  };

  const monthlyAggregation = getMonthlyAggregation();
  
  // Get trend data for last 12 months
  const getTrendData = () => {
    const trends: Array<{
      month: string;
      monthKey: string;
      total: number;
      essential: number;
      workRelated: number;
      discretionary: number;
      savings: number;
      debt: number;
    }> = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('zh-CN', { month: 'short', year: '2-digit' });
      
      const monthData = monthlyAggregation[monthKey];
      
      trends.push({
        month: monthName,
        monthKey: monthKey,
        total: monthData?.total || 0,
        essential: monthData?.byGroup?.essential || 0,
        workRelated: monthData?.byGroup?.workRelated || 0,
        discretionary: monthData?.byGroup?.discretionary || 0,
        savings: monthData?.byGroup?.savingsInvestment || 0,
        debt: monthData?.byGroup?.debt || 0
      });
    }
    
    return trends;
  };

  const trendData = getTrendData();
  
  // Current month vs previous month comparison
  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const currentMonthTotal = monthlyAggregation[currentMonthKey]?.total || 0;
  
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const prevMonthTotal = monthlyAggregation[prevMonthKey]?.total || 0;
  
  const monthOverMonthChange = prevMonthTotal > 0 ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal * 100) : 0;

  // Calculate expenses for filtered month
  const expensesByGroup = filteredExpenses.reduce((acc, expense) => {
    const group = getCategoryGroup(expense.category);
    acc[group] = (acc[group] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const essentialExpenses = expensesByGroup.essential || 0;
  const workRelatedExpenses = expensesByGroup.workRelated || 0;
  const discretionaryExpenses = expensesByGroup.discretionary || 0;
  const savingsInvestment = expensesByGroup.savingsInvestment || 0;
  const debtPayments = expensesByGroup.debt || 0;

  const retirementExpenses = essentialExpenses + discretionaryExpenses;
  const savingsRate = monthlyIncome > 0 ? ((savingsInvestment / monthlyIncome) * 100) : 0;

  const currentWithdrawalRate = fireMultiplier > 0 ? (100 / fireMultiplier) : 0;
  const fireNumber = retirementExpenses * 12 * fireMultiplier;

  // Calculate portfolio metrics
  const portfolio = investments.reduce((acc, inv) => {
    acc[inv.type] = (acc[inv.type] || 0) + inv.amount;
    return acc;
  }, { stocks: 0, bonds: 0, cash: 0 } as Record<string, number>);

  const totalPortfolio = portfolio.stocks + portfolio.bonds + portfolio.cash;
  
  const currentAllocation = {
    stocks: totalPortfolio > 0 ? (portfolio.stocks / totalPortfolio * 100) : 0,
    bonds: totalPortfolio > 0 ? (portfolio.bonds / totalPortfolio * 100) : 0,
    cash: totalPortfolio > 0 ? (portfolio.cash / totalPortfolio * 100) : 0
  };

  const portfolioChartData = [
    { name: 'Stocks', current: portfolio.stocks, target: totalPortfolio * targetAllocation.stocks / 100 },
    { name: 'Bonds', current: portfolio.bonds, target: totalPortfolio * targetAllocation.bonds / 100 },
    { name: 'Cash', current: portfolio.cash, target: totalPortfolio * targetAllocation.cash / 100 }
  ];

  // Rebalancing suggestions
  const getRebalanceSuggestions = () => {
    const suggestions: Array<{
      asset: string;
      action: 'Reduce' | 'Increase';
      amount: number;
      currentPct: number;
      targetPct: number;
    }> = [];
    const threshold = 5;

    Object.keys(targetAllocation).forEach(asset => {
      const diff = currentAllocation[asset as keyof typeof currentAllocation] - targetAllocation[asset as keyof typeof targetAllocation];
      if (Math.abs(diff) > threshold) {
        const amountDiff = (diff / 100) * totalPortfolio;
        suggestions.push({
          asset,
          action: diff > 0 ? 'Reduce' : 'Increase',
          amount: Math.abs(amountDiff),
          currentPct: currentAllocation[asset as keyof typeof currentAllocation],
          targetPct: targetAllocation[asset as keyof typeof targetAllocation]
        });
      }
    });

    return suggestions;
  };

  const rebalanceSuggestions = getRebalanceSuggestions();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.primary} 100%)`,
        color: COLORS.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Outfit", -apple-system, sans-serif'
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div className="finance-dashboard-main" style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.primary} 100%)`,
      color: COLORS.text,
      fontFamily: '"Outfit", -apple-system, sans-serif',
      padding: '2rem'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`
        @media (max-width: 768px) {
          /* 减少主容器padding */
          .finance-dashboard-main {
            padding: 1rem 0.5rem !important;
          }
          
          .tab-navigation-mobile {
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 0.25rem !important;
            overflow-x: hidden !important;
            width: 100% !important;
            justify-content: space-between !important;
          }
          .tab-button-mobile {
            flex: 1 1 0 !important;
            min-width: 0 !important;
            padding: 0.75rem 0.5rem !important;
            font-size: clamp(1rem, 3.5vw, 1.3rem) !important;
            white-space: nowrap !important;
            text-align: center !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          /* FIRE支出分析 - 两列布局改为单列 */
          .fire-expense-analysis-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          /* 图表容器在移动端 */
          .fire-chart-container {
            width: 100% !important;
            height: 250px !important;
          }
          /* 趋势分析表格优化 */
          .trends-table-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .trends-table {
            font-size: 0.85rem !important;
            min-width: 600px !important;
          }
          .trends-table th,
          .trends-table td {
            padding: 0.75rem 0.5rem !important;
          }
          /* 卡片padding减少 */
          .card-mobile {
            padding: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .finance-dashboard-main {
            padding: 0.75rem 0.25rem !important;
          }
          .tab-button-mobile {
            padding: 0.5rem 0.25rem !important;
            font-size: clamp(0.95rem, 3.2vw, 1.2rem) !important;
          }
          .fire-chart-container {
            height: 200px !important;
          }
          .trends-table {
            font-size: 0.75rem !important;
            min-width: 550px !important;
          }
          .trends-table th,
          .trends-table td {
            padding: 0.5rem 0.25rem !important;
          }
          .card-mobile {
            padding: 0.75rem !important;
          }
        }
      `}</style>
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: '3.5rem',
                fontWeight: '700',
                margin: '0 0 0.5rem 0',
                background: `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}>
                FirePath
              </h1>
              <p style={{
                fontSize: '1.1rem',
                color: COLORS.textMuted,
                margin: 0,
                fontWeight: '300'
              }}>
                自由之路 · 通往财务自由的每一步
              </p>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="tab-navigation-mobile" style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: `1px solid ${COLORS.accent}`
        }}>
          {['dashboard', 'expenses', 'portfolio', 'rebalance'].map(tab => (
            <button
              key={tab}
              className="tab-button-mobile"
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? COLORS.highlight : COLORS.textMuted,
                padding: '1rem 1.5rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? `3px solid ${COLORS.highlight}` : 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
            >
              {tab === 'dashboard' ? 'FIRE进度' : tab === 'expenses' ? '月度支出' : tab === 'portfolio' ? '投资组合' : '再平衡建议'}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* FIRE Key Metrics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: `2px solid ${COLORS.success}`
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  储蓄率 (Savings Rate)
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.success }}>
                  {savingsRate.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  目标: ≥50% for FIRE
                </div>
                {savingsRate >= 50 && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    background: `${COLORS.success}20`,
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    color: COLORS.success,
                    fontWeight: '600'
                  }}>
                    ✓ 目标达成
                  </div>
                )}
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  必需支出/月
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.highlight }}>
                  ¥{essentialExpenses.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  退休后继续
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  退休后总支出
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                  ¥{retirementExpenses.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  年需求: ¥{(retirementExpenses * 12).toLocaleString()}
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  FIRE数字 ({fireMultiplier.toFixed(1)}x)
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.warning }}>
                  ¥{fireNumber.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  {currentWithdrawalRate.toFixed(2)}% 提取率
                </div>
              </div>
            </div>

            {/* FIRE Progress Section */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>FIRE 进度追踪</h3>
              
              {/* Current Portfolio vs FIRE Number */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>当前总资产</span>
                  <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>FIRE目标</span>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.5rem',
                  height: '2rem',
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    background: `linear-gradient(90deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
                    height: '100%',
                    width: `${Math.min((totalPortfolio / fireNumber) * 100, 100)}%`,
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.text,
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}>
                    {totalPortfolio > 0 && `${((totalPortfolio / fireNumber) * 100).toFixed(1)}%`}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: COLORS.textMuted }}>
                  <span>¥{totalPortfolio.toLocaleString()}</span>
                  <span>¥{fireNumber.toLocaleString()}</span>
                </div>
                {totalPortfolio >= fireNumber && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: `${COLORS.success}20`,
                    border: `1px solid ${COLORS.success}`,
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: COLORS.success
                  }}>
                    🎉 恭喜！您已达到 FIRE 目标！
                  </div>
                )}
                {totalPortfolio < fireNumber && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: `${COLORS.warning}20`,
                    border: `1px solid ${COLORS.warning}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    <strong>距离 FIRE 目标还差:</strong> ¥{(fireNumber - totalPortfolio).toLocaleString()}
                    {monthlyIncome > 0 && savingsRate > 0 && (
                      <div style={{ marginTop: '0.5rem', color: COLORS.textMuted }}>
                        按当前储蓄率，预计还需: {Math.ceil((fireNumber - totalPortfolio) / (monthlyIncome * savingsRate / 100))} 个月
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Expense Recommendations based on FIRE Progress */}
              {monthlyIncome > 0 && totalPortfolio < fireNumber && (
                <div style={{
                  background: `${COLORS.success}10`,
                  border: `1px solid ${COLORS.success}`,
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: COLORS.success }}>
                    💡 基于 FIRE 进度的支出建议
                  </h4>
                  
                  {/* Calculate recommended monthly expenses */}
                  {(() => {
                    const remainingAmount = fireNumber - totalPortfolio;
                    const targetMonths = retirementYears * 12; // 假设还有这么多月
                    const requiredMonthlySavings = remainingAmount / targetMonths;
                    const recommendedMaxExpenses = monthlyIncome - requiredMonthlySavings;
                    const currentTotalExpenses = totalExpenses;
                    const recommendedSavingsRate = (requiredMonthlySavings / monthlyIncome) * 100;
                    const canAffordExpenses = recommendedMaxExpenses > 0;

                    return (
                      <div>
                        {canAffordExpenses ? (
                          <>
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                                为实现 FIRE 目标，建议:
                              </div>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1rem'
                              }}>
                                <div style={{
                                  padding: '0.75rem',
                                  background: COLORS.accent,
                                  borderRadius: '0.5rem',
                                  borderLeft: `4px solid ${COLORS.success}`
                                }}>
                                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                                    建议月度储蓄
                                  </div>
                                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.success }}>
                                    ¥{requiredMonthlySavings.toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                    储蓄率: {recommendedSavingsRate.toFixed(1)}%
                                  </div>
                                </div>
                                <div style={{
                                  padding: '0.75rem',
                                  background: COLORS.accent,
                                  borderRadius: '0.5rem',
                                  borderLeft: `4px solid ${COLORS.warning}`
                                }}>
                                  <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                                    建议最大支出
                                  </div>
                                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.warning }}>
                                    ¥{recommendedMaxExpenses.toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                    当前: ¥{currentTotalExpenses.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {currentTotalExpenses > recommendedMaxExpenses && (
                              <div style={{
                                padding: '0.75rem',
                                background: `${COLORS.highlight}20`,
                                border: `1px solid ${COLORS.highlight}`,
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                fontSize: '0.85rem'
                              }}>
                                <strong>⚠️ 当前支出超出建议:</strong> 超出 ¥{(currentTotalExpenses - recommendedMaxExpenses).toLocaleString()}
                                <div style={{ marginTop: '0.5rem', color: COLORS.textMuted }}>
                                  建议削减支出以提高储蓄率，加速 FIRE 进度
                                </div>
                              </div>
                            )}
                            
                            {currentTotalExpenses <= recommendedMaxExpenses && (
                              <div style={{
                                padding: '0.75rem',
                                background: `${COLORS.success}20`,
                                border: `1px solid ${COLORS.success}`,
                                borderRadius: '0.5rem',
                                marginBottom: '1rem',
                                fontSize: '0.85rem',
                                color: COLORS.success
                              }}>
                                ✓ 当前支出在建议范围内，保持当前节奏即可
                              </div>
                            )}

                            <div style={{
                              padding: '0.75rem',
                              background: COLORS.accent,
                              borderRadius: '0.5rem',
                              fontSize: '0.85rem',
                              marginBottom: '1rem'
                            }}>
                              <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>优化建议:</div>
                              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: COLORS.textMuted }}>
                                <li>优先削减"可选支出"类别（当前: ¥{discretionaryExpenses.toLocaleString()}）</li>
                                <li>工作相关支出退休后会消失，无需过度优化</li>
                                <li>保持必需支出在合理范围（当前: ¥{essentialExpenses.toLocaleString()}）</li>
                                {savingsRate < 50 && (
                                  <li style={{ color: COLORS.warning }}>
                                    <strong>目标储蓄率 ≥50%，当前 {savingsRate.toFixed(1)}%，需要提高 {(50 - savingsRate).toFixed(1)}%</strong>
                                  </li>
                                )}
                              </ul>
                            </div>

                            {/* Auto-update button */}
                            <button
                              onClick={async () => {
                                if (confirm(`确定要将建议的最大支出 ¥${recommendedMaxExpenses.toLocaleString()} 应用到月度预算吗？\n\n这将帮助您更好地控制支出，加速 FIRE 进度。`)) {
                                  try {
                                    // 为必需支出和可选支出设置预算
                                    if (essentialExpenses > 0) {
                                      await api.post('/expenses/budgets', {
                                        category: 'housing', // 使用一个通用类别作为示例
                                        monthly_limit: essentialExpenses * 1.1 // 留10%缓冲
                                      });
                                    }
                                    
                                    alert('预算建议已应用！请前往"月度支出"标签页查看和调整详细预算。');
                                    // 刷新数据
                                    await loadData();
                                  } catch (error) {
                                    console.error('Error applying budget suggestions:', error);
                                    alert('应用预算建议失败，请手动设置预算');
                                  }
                                }
                              }}
                              style={{
                                width: '100%',
                                background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
                                border: 'none',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                marginTop: '0.5rem'
                              }}
                            >
                              📊 应用支出建议到月度预算
                            </button>
                          </>
                        ) : (
                          <div style={{
                            padding: '0.75rem',
                            background: `${COLORS.highlight}20`,
                            border: `1px solid ${COLORS.highlight}`,
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem'
                          }}>
                            <strong>⚠️ 收入不足:</strong> 当前收入无法在预期时间内达到 FIRE 目标
                            <div style={{ marginTop: '0.5rem', color: COLORS.textMuted }}>
                              建议: 增加收入或延长退休时间
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              </div>

            {/* Expense Breakdown Summary */}
            {totalExpenses > 0 && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>本月支出概览</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: '必需支出', value: essentialExpenses, color: COLORS.highlight },
                    { label: '工作相关', value: workRelatedExpenses, color: COLORS.bonds },
                    { label: '可选支出', value: discretionaryExpenses, color: COLORS.warning },
                    { label: '储蓄投资', value: savingsInvestment, color: COLORS.success },
                    { label: '债务偿还', value: debtPayments, color: '#9d4edd' }
                  ].filter(item => item.value > 0).map((item, idx) => (
                    <div key={idx} style={{
                      padding: '1rem',
                      background: COLORS.accent,
                      borderRadius: '0.5rem',
                      borderLeft: `4px solid ${item.color}`
                    }}>
                      <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '700', color: item.color }}>
                        ¥{item.value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: COLORS.accent,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: '600' }}>本月总支出（{selectedYear}年{selectedMonth}月）</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.highlight }}>
                      ¥{currentMonthTotal.toLocaleString()}
                    </span>
                  </div>
                  {prevMonthTotal > 0 && (
                    <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: COLORS.textMuted }}>
                      <span>vs 上月:</span>
                      <span style={{ 
                        color: monthOverMonthChange > 0 ? COLORS.highlight : COLORS.success,
                        fontWeight: '600'
                      }}>
                        {monthOverMonthChange > 0 ? '↑' : '↓'} {Math.abs(monthOverMonthChange).toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>
                        (¥{prevMonthTotal.toLocaleString()})
                      </span>
                    </div>
                  )}
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                    {filteredExpenses.length} 笔交易
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Summary */}
            {totalPortfolio > 0 && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>投资组合概览</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    border: `2px solid ${COLORS.stocks}`
                  }}>
                    <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>股票</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.stocks }}>
                      ¥{portfolio.stocks.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                      {currentAllocation.stocks.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    border: `2px solid ${COLORS.bonds}`
                  }}>
                    <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>债券</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.bonds }}>
                      ¥{portfolio.bonds.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                      {currentAllocation.bonds.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    border: `2px solid ${COLORS.cash}`
                  }}>
                    <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>现金</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.cash }}>
                      ¥{portfolio.cash.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                      {currentAllocation.cash.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: COLORS.accent,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: '600' }}>总资产</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                    ¥{totalPortfolio.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div>
            {/* Month/Year Selector and View Switcher */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>选择月份:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{
                    padding: '0.6rem 1rem',
                    background: COLORS.accent,
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: COLORS.text,
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{
                    padding: '0.6rem 1rem',
                    background: COLORS.accent,
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: COLORS.text,
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setViewMode('current')}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: viewMode === 'current' ? `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)` : COLORS.accent,
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: COLORS.text,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  当月详情
                </button>
                <button
                  onClick={() => setViewMode('trends')}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: viewMode === 'trends' ? `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)` : COLORS.accent,
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: COLORS.text,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  趋势分析
                </button>
              </div>
            </div>

            {/* Current Month View */}
            {viewMode === 'current' && (
              <>

            {/* Monthly Income Input */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                月收入（税后）
              </label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setMonthlyIncome(value);
                  localStorage.setItem('monthlyIncome', value.toString());
                }}
                placeholder="输入月收入..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: COLORS.accent,
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: COLORS.text,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* FIRE Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: `2px solid ${COLORS.success}`
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  储蓄率
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.success }}>
                  {savingsRate.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                  目标: ≥50%
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  必需支出/月
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.highlight }}>
                  ¥{essentialExpenses.toLocaleString()}
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  退休后总支出
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                  ¥{retirementExpenses.toLocaleString()}
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  FIRE数字 ({fireMultiplier.toFixed(1)}x)
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.warning }}>
                  ¥{fireNumber.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                  本月总支出
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.highlight }}>
                  ¥{totalExpenses.toLocaleString()}
                </div>
              </div>

              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <button
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`,
                    border: 'none',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                >
                  {showAddExpense ? '取消' : '+ 添加支出'}
                </button>

                {showAddExpense && (
                  <div style={{ marginTop: '1rem' }}>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontFamily: 'inherit',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">选择类别...</option>
                      {Object.entries(EXPENSE_CATEGORIES).map(([key, group]) => (
                        <optgroup key={key} label={group.label}>
                          {group.categories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="金额"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontFamily: 'inherit'
                      }}
                    />
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontFamily: 'inherit'
                      }}
                    />
                    <button
                      onClick={addExpense}
                      style={{
                        background: COLORS.success,
                        border: 'none',
                        color: COLORS.background,
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        fontFamily: 'inherit'
                      }}
                    >
                      确认添加
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Expense Chart by FIRE Groups */}
            {currentMonthTotal > 0 && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>FIRE支出分析</h3>
                
                <div className="fire-expense-analysis-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div className="fire-chart-container">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: '必需支出', value: essentialExpenses, color: COLORS.highlight },
                            { name: '工作相关', value: workRelatedExpenses, color: COLORS.bonds },
                            { name: '可选支出', value: discretionaryExpenses, color: COLORS.warning },
                            { name: '储蓄投资', value: savingsInvestment, color: COLORS.success },
                            { name: '债务偿还', value: debtPayments, color: '#9d4edd' }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: '必需支出', value: essentialExpenses, color: COLORS.highlight },
                            { name: '工作相关', value: workRelatedExpenses, color: COLORS.bonds },
                            { name: '可选支出', value: discretionaryExpenses, color: COLORS.warning },
                            { name: '储蓄投资', value: savingsInvestment, color: COLORS.success },
                            { name: '债务偿还', value: debtPayments, color: '#9d4edd' }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: COLORS.accent, border: 'none', borderRadius: '0.5rem' }}
                          formatter={(value) => `¥${value}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                    {[
                      { label: '必需支出（退休后继续）', value: essentialExpenses, color: COLORS.highlight },
                      { label: '工作相关（退休后消失）', value: workRelatedExpenses, color: COLORS.bonds },
                      { label: '可选支出（可削减）', value: discretionaryExpenses, color: COLORS.warning },
                      { label: '储蓄投资', value: savingsInvestment, color: COLORS.success },
                      { label: '债务偿还', value: debtPayments, color: '#9d4edd' }
                    ].filter(item => item.value > 0).map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: COLORS.accent,
                        borderRadius: '0.5rem',
                        borderLeft: `4px solid ${item.color}`
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>¥{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expense List */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                支出明细（{selectedYear}年{selectedMonth}月）
              </h3>
              {filteredExpenses.length === 0 ? (
                <p style={{ color: COLORS.textMuted }}>本月暂无支出记录</p>
              ) : (
                <div>
                  {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => {
                    const group = getCategoryGroup(expense.category);
                    const groupInfo = EXPENSE_CATEGORIES[group as keyof typeof EXPENSE_CATEGORIES];
                    const groupColor = groupInfo?.color || COLORS.textMuted;
                    const groupLabel = groupInfo?.label || '其他';
                    
                    return (
                      <div key={expense.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        background: COLORS.accent,
                        borderRadius: '0.5rem',
                        borderLeft: `4px solid ${groupColor}`
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600' }}>{expense.description || expense.category}</div>
                          <div style={{ fontSize: '0.75rem', color: groupColor, marginTop: '0.25rem' }}>
                            {groupLabel}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>{expense.date}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>¥{expense.amount}</div>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            style={{
                              background: 'none',
                              border: `1px solid ${COLORS.highlight}`,
                              color: COLORS.highlight,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '0.3rem',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontFamily: 'inherit'
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
              </>
            )}

            {/* Trends View */}
            {viewMode === 'trends' && (
              <>
                {/* Monthly Trend Chart */}
                <div className="card-mobile" style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                    月度支出趋势（最近12个月）
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <XAxis dataKey="month" stroke={COLORS.textMuted} />
                      <YAxis stroke={COLORS.textMuted} />
                      <Tooltip 
                        contentStyle={{ background: COLORS.accent, border: 'none', borderRadius: '0.5rem' }}
                        formatter={(value: number) => `¥${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke={COLORS.highlight} strokeWidth={3} name="总支出" />
                      <Line type="monotone" dataKey="essential" stroke={COLORS.bonds} strokeWidth={2} name="必需" />
                      <Line type="monotone" dataKey="discretionary" stroke={COLORS.warning} strokeWidth={2} name="可选" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Breakdown Table */}
                <div className="card-mobile" style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                    月度汇总
                  </h3>
                  <div className="trends-table-container" style={{ overflowX: 'auto' }}>
                    <table className="trends-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${COLORS.accent}` }}>
                          <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem' }}>月份</th>
                          <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem' }}>总支出</th>
                          <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem' }}>必需</th>
                          <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem' }}>可选</th>
                          <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem' }}>储蓄</th>
                          <th style={{ padding: '1rem', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.9rem' }}>笔数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendData.slice().reverse().map((monthData, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.accent}` }}>
                            <td style={{ padding: '1rem', fontWeight: '600' }}>{monthData.month}</td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', fontSize: '1.1rem' }}>
                              ¥{monthData.total.toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', color: COLORS.bonds }}>
                              ¥{monthData.essential.toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', color: COLORS.warning }}>
                              ¥{monthData.discretionary.toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', color: COLORS.success }}>
                              ¥{monthData.savings.toLocaleString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center', color: COLORS.textMuted }}>
                              {monthlyAggregation[monthData.monthKey]?.count || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Average Analysis */}
                <div className="card-mobile" style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                    平均分析（最近12个月）
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {(() => {
                      const validMonths = trendData.filter(m => m.total > 0);
                      const avgTotal = validMonths.length > 0 ? validMonths.reduce((sum, m) => sum + m.total, 0) / validMonths.length : 0;
                      const avgEssential = validMonths.length > 0 ? validMonths.reduce((sum, m) => sum + m.essential, 0) / validMonths.length : 0;
                      const avgDiscretionary = validMonths.length > 0 ? validMonths.reduce((sum, m) => sum + m.discretionary, 0) / validMonths.length : 0;
                      
                      return (
                        <>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>月均总支出</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.highlight }}>
                              ¥{avgTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>月均必需支出</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.bonds }}>
                              ¥{avgEssential.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>月均可选支出</div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.warning }}>
                              ¥{avgDiscretionary.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div>
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>投资组合</h3>
              <p style={{ color: COLORS.textMuted }}>
                投资组合数据将从后端自动加载
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>总资产</div>
                <div style={{ fontSize: '2rem', fontWeight: '700' }}>¥{totalPortfolio.toLocaleString()}</div>
              </div>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: `2px solid ${COLORS.stocks}`
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>股票</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.stocks }}>
                  ¥{portfolio.stocks.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                  {currentAllocation.stocks.toFixed(1)}%
                </div>
              </div>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: `2px solid ${COLORS.bonds}`
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>债券</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.bonds }}>
                  ¥{portfolio.bonds.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                  {currentAllocation.bonds.toFixed(1)}%
                </div>
              </div>
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: `2px solid ${COLORS.cash}`
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>现金</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.cash }}>
                  ¥{portfolio.cash.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                  {currentAllocation.cash.toFixed(1)}%
                </div>
              </div>
            </div>

            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>目标配置 (%)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {(['stocks', 'bonds', 'cash'] as const).map(type => (
                  <div key={type}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                      {type === 'stocks' ? '股票' : type === 'bonds' ? '债券' : '现金'}
                    </label>
                    <input
                      type="number"
                      value={targetAllocation[type]}
                      onChange={(e) => updateTargetAllocation(type, parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                总计: {(targetAllocation.stocks + targetAllocation.bonds + targetAllocation.cash).toFixed(0)}% 
                {(targetAllocation.stocks + targetAllocation.bonds + targetAllocation.cash) !== 100 && (
                  <span style={{ color: COLORS.warning, marginLeft: '0.5rem' }}>⚠ 应为100%</span>
                )}
              </div>
            </div>

            {totalPortfolio > 0 && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>当前 vs 目标配置</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={portfolioChartData}>
                    <XAxis dataKey="name" stroke={COLORS.textMuted} />
                    <YAxis stroke={COLORS.textMuted} />
                    <Tooltip 
                      contentStyle={{ background: COLORS.accent, border: 'none', borderRadius: '0.5rem' }}
                      formatter={(value) => `¥${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="current" fill={COLORS.highlight} name="当前" />
                    <Bar dataKey="target" fill={COLORS.success} name="目标" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Rebalance Tab */}
        {activeTab === 'rebalance' && (
          <div>
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>再平衡建议</h3>
              
              {rebalanceSuggestions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: COLORS.success
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>投资组合已平衡</div>
                  <div style={{ color: COLORS.textMuted, marginTop: '0.5rem' }}>
                    当前配置与目标配置的偏差在 5% 以内
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    background: `${COLORS.warning}20`,
                    border: `1px solid ${COLORS.warning}`,
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <strong>⚠ 需要调整</strong> - 检测到 {rebalanceSuggestions.length} 项偏差超过 5%
                  </div>

                  {rebalanceSuggestions.map((suggestion, idx) => (
                    <div key={idx} style={{
                      background: COLORS.accent,
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      borderLeft: `4px solid ${suggestion.action === 'Reduce' ? COLORS.highlight : COLORS.success}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                            {suggestion.asset === 'stocks' ? '股票' : suggestion.asset === 'bonds' ? '债券' : '现金'}
                          </div>
                          <div style={{ color: COLORS.textMuted, fontSize: '0.9rem' }}>
                            当前: {suggestion.currentPct.toFixed(1)}% → 目标: {suggestion.targetPct.toFixed(1)}%
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: suggestion.action === 'Reduce' ? COLORS.highlight : COLORS.success
                          }}>
                            {suggestion.action === 'Reduce' ? '−' : '+'} ¥{suggestion.amount.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                            {suggestion.action === 'Reduce' ? '减少' : '增加'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;


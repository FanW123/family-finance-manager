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
  danger: '#e94560',
  stocks: '#e94560',
  bonds: '#00d9ff',
  cash: '#ffd369',
  background: '#0a0a14',
  card: '#16213e',
  text: '#eee',
  textMuted: '#a0a0b0'
};

// City living cost database (monthly cost in USD for housing + basic living)
const CITY_COSTS = {
  '中国': [
    { name: '北京', budget: 1110, comfortable: 2080, luxury: 3470 },
    { name: '上海', budget: 1110, comfortable: 2080, luxury: 3470 },
    { name: '深圳', budget: 970, comfortable: 1800, luxury: 3050 },
    { name: '广州', budget: 830, comfortable: 1530, luxury: 2500 },
    { name: '杭州', budget: 830, comfortable: 1530, luxury: 2500 },
    { name: '成都', budget: 625, comfortable: 1110, luxury: 1940 },
    { name: '重庆', budget: 555, comfortable: 1040, luxury: 1800 },
    { name: '西安', budget: 555, comfortable: 970, luxury: 1670 },
    { name: '南京', budget: 695, comfortable: 1250, luxury: 2080 },
    { name: '武汉', budget: 625, comfortable: 1110, luxury: 1800 },
    { name: '大理', budget: 485, comfortable: 835, luxury: 1390 },
    { name: '丽江', budget: 555, comfortable: 900, luxury: 1530 },
    { name: '厦门', budget: 765, comfortable: 1390, luxury: 2220 },
    { name: '三亚', budget: 835, comfortable: 1670, luxury: 2780 },
    { name: '青岛', budget: 695, comfortable: 1250, luxury: 2080 }
  ],
  '亚洲': [
    { name: '东京', budget: 1670, comfortable: 2780, luxury: 4860 },
    { name: '首尔', budget: 1250, comfortable: 2080, luxury: 3470 },
    { name: '曼谷', budget: 695, comfortable: 1110, luxury: 2080 },
    { name: '清迈', budget: 555, comfortable: 900, luxury: 1530 },
    { name: '巴厘岛', budget: 695, comfortable: 1110, luxury: 1940 },
    { name: '新加坡', budget: 1670, comfortable: 2780, luxury: 4860 },
    { name: '吉隆坡', budget: 695, comfortable: 1180, luxury: 2080 },
    { name: '芭提雅', budget: 625, comfortable: 1040, luxury: 1800 },
    { name: '岘港', budget: 555, comfortable: 900, luxury: 1530 },
    { name: '胡志明市', budget: 625, comfortable: 1040, luxury: 1800 }
  ],
  '欧美': [
    { name: '里斯本', budget: 1390, comfortable: 2220, luxury: 3890 },
    { name: '波尔图', budget: 1250, comfortable: 1940, luxury: 3330 },
    { name: '巴塞罗那', budget: 1670, comfortable: 2780, luxury: 4860 },
    { name: '柏林', budget: 1530, comfortable: 2500, luxury: 4170 },
    { name: '墨西哥城', budget: 970, comfortable: 1670, luxury: 2780 },
    { name: '布宜诺斯艾利斯', budget: 970, comfortable: 1670, luxury: 2780 },
    { name: '纽约', budget: 3470, comfortable: 5560, luxury: 9720 },
    { name: '旧金山', budget: 3890, comfortable: 6250, luxury: 10420 },
    { name: '伦敦', budget: 2780, comfortable: 4860, luxury: 8330 },
    { name: '巴黎', budget: 2080, comfortable: 3470, luxury: 6250 }
  ],
  '其他': [
    { name: '迪拜', budget: 2080, comfortable: 3470, luxury: 6250 },
    { name: '悉尼', budget: 2500, comfortable: 4170, luxury: 6940 },
    { name: '奥克兰', budget: 1800, comfortable: 3050, luxury: 5280 }
  ]
};

// Expense categories by budget cycle
const EXPENSE_CATEGORIES = {
  weekly: {
    label: '周预算',
    color: '#00d9ff',
    categories: [
      { value: 'food_dining', label: '🍽️ 餐饮饮食', description: '食品杂货 + 外出就餐' },
      { value: 'transportation', label: '🚗 交通出行', description: '通勤 + 打车 + 加油 + 停车' }
    ]
  },
  monthly: {
    label: '月预算',
    color: '#ffd369',
    categories: [
      { value: 'shopping', label: '🛍️ 购物消费', description: '服装 + 日用品 + 电子产品' },
      { value: 'entertainment', label: '🎮 娱乐休闲', description: '电影 + 健身 + 游戏' },
      { value: 'subscriptions', label: '💳 订阅服务', description: 'Cursor + Claude + Netflix + Apple等' },
      { value: 'pets', label: '🐕 宠物相关', description: '食物 + 用品 + 医疗' },
      { value: 'beauty', label: '💄 美容护肤', description: '护肤品 + 彩妆 + 医美' }
    ]
  },
  yearly: {
    label: '年预算',
    color: '#e94560',
    categories: [
      { value: 'housing', label: '🏠 住房居住', description: '房租/房贷 + 物业 + 水电网' },
      { value: 'travel', label: '✈️ 旅行度假', description: '机票 + 酒店 + 景点' },
      { value: 'healthcare', label: '💊 医疗健康', description: '医疗保险 + 看病 + 体检' },
      { value: 'education', label: '📚 教育发展', description: '课程 + 书籍 + 培训' },
      { value: 'family', label: '👨‍👩‍👧 家人支持', description: '父母生活费 + 医疗 + 其他' }
    ]
  }
};

// Budget templates by location
const BUDGET_TEMPLATES = {
  'sf-bay': {
    name: '🏙️ 旧金山湾区',
    description: '高消费城市',
    categories: [
      { id: 'food_dining', name: '🍽️ 餐饮饮食', budgetType: 'weekly', amount: 200 },
      { id: 'transportation', name: '🚗 交通出行', budgetType: 'weekly', amount: 80 },
      { id: 'shopping', name: '🛍️ 购物消费', budgetType: 'monthly', amount: 600 },
      { id: 'entertainment', name: '🎮 娱乐休闲', budgetType: 'monthly', amount: 400 },
      { id: 'subscriptions', name: '💳 订阅服务', budgetType: 'monthly', amount: 250 },
      { 
        id: 'pets', 
        name: '🐕 宠物相关', 
        isParent: true,
        expanded: false,
        children: [
          { id: 'pet_insurance', name: '宠物保险', budgetType: 'yearly', amount: 1200 },
          { id: 'pet_food', name: '宠物食物', budgetType: 'weekly', amount: 30 },
          { id: 'pet_medical', name: '宠物医疗', budgetType: 'yearly', amount: 500 },
          { id: 'pet_grooming', name: '宠物美容', budgetType: 'monthly', amount: 80 }
        ]
      },
      { 
        id: 'beauty', 
        name: '💄 美容护肤', 
        isParent: true,
        expanded: false,
        children: [
          { id: 'skincare', name: '护肤品', budgetType: 'monthly', amount: 300 },
          { id: 'cosmetics', name: '彩妆', budgetType: 'monthly', amount: 200 },
          { id: 'aesthetic', name: '医美', budgetType: 'yearly', amount: 8000 }
        ]
      },
      { id: 'housing', name: '🏠 住房居住', budgetType: 'yearly', amount: 60000 },
      { id: 'travel', name: '✈️ 旅行度假', budgetType: 'yearly', amount: 20000 },
      { id: 'healthcare', name: '💊 医疗健康', budgetType: 'yearly', amount: 10000 },
      { id: 'education', name: '📚 教育发展', budgetType: 'yearly', amount: 12000 },
      { id: 'family', name: '👨‍👩‍👧 家人支持', budgetType: 'yearly', amount: 24000 }
    ]
  },
  'mid-tier': {
    name: '🌆 中等消费城市',
    description: '西雅图、波士顿等',
    categories: [
      { id: 'food_dining', name: '🍽️ 餐饮饮食', budgetType: 'weekly', amount: 130 },
      { id: 'transportation', name: '🚗 交通出行', budgetType: 'weekly', amount: 50 },
      { id: 'shopping', name: '🛍️ 购物消费', budgetType: 'monthly', amount: 400 },
      { id: 'entertainment', name: '🎮 娱乐休闲', budgetType: 'monthly', amount: 280 },
      { id: 'subscriptions', name: '💳 订阅服务', budgetType: 'monthly', amount: 200 },
      { 
        id: 'pets', 
        name: '🐕 宠物相关', 
        isParent: true,
        expanded: false,
        children: [
          { id: 'pet_insurance', name: '宠物保险', budgetType: 'yearly', amount: 800 },
          { id: 'pet_food', name: '宠物食物', budgetType: 'weekly', amount: 20 },
          { id: 'pet_medical', name: '宠物医疗', budgetType: 'yearly', amount: 300 },
          { id: 'pet_grooming', name: '宠物美容', budgetType: 'monthly', amount: 60 }
        ]
      },
      { 
        id: 'beauty', 
        name: '💄 美容护肤', 
        isParent: true,
        expanded: false,
        children: [
          { id: 'skincare', name: '护肤品', budgetType: 'monthly', amount: 200 },
          { id: 'cosmetics', name: '彩妆', budgetType: 'monthly', amount: 150 },
          { id: 'aesthetic', name: '医美', budgetType: 'yearly', amount: 5000 }
        ]
      },
      { id: 'housing', name: '🏠 住房居住', budgetType: 'yearly', amount: 36000 },
      { id: 'travel', name: '✈️ 旅行度假', budgetType: 'yearly', amount: 12000 },
      { id: 'healthcare', name: '💊 医疗健康', budgetType: 'yearly', amount: 6000 },
      { id: 'education', name: '📚 教育发展', budgetType: 'yearly', amount: 8000 },
      { id: 'family', name: '👨‍👩‍👧 家人支持', budgetType: 'yearly', amount: 18000 }
    ]
  },
  'low-cost': {
    name: '🏡 低消费生活',
    description: '远程工作、小城市',
    categories: [
      { id: 'food_dining', name: '🍽️ 餐饮饮食', budgetType: 'weekly', amount: 80 },
      { id: 'transportation', name: '🚗 交通出行', budgetType: 'weekly', amount: 30 },
      { id: 'shopping', name: '🛍️ 购物消费', budgetType: 'monthly', amount: 240 },
      { id: 'entertainment', name: '🎮 娱乐休闲', budgetType: 'monthly', amount: 200 },
      { id: 'subscriptions', name: '💳 订阅服务', budgetType: 'monthly', amount: 150 },
      { 
        id: 'pets', 
        name: '🐕 宠物相关', 
        isParent: true,
        expanded: false,
        children: [
          { id: 'pet_insurance', name: '宠物保险', budgetType: 'yearly', amount: 600 },
          { id: 'pet_food', name: '宠物食物', budgetType: 'weekly', amount: 15 },
          { id: 'pet_medical', name: '宠物医疗', budgetType: 'yearly', amount: 200 },
          { id: 'pet_grooming', name: '宠物美容', budgetType: 'monthly', amount: 40 }
        ]
      },
      { 
        id: 'beauty', 
        name: '💄 美容护肤', 
        isParent: true,
        expanded: false,
        children: [
          { id: 'skincare', name: '护肤品', budgetType: 'monthly', amount: 150 },
          { id: 'cosmetics', name: '彩妆', budgetType: 'monthly', amount: 100 },
          { id: 'aesthetic', name: '医美', budgetType: 'yearly', amount: 3000 }
        ]
      },
      { id: 'housing', name: '🏠 住房居住', budgetType: 'yearly', amount: 24000 },
      { id: 'travel', name: '✈️ 旅行度假', budgetType: 'yearly', amount: 8000 },
      { id: 'healthcare', name: '💊 医疗健康', budgetType: 'yearly', amount: 4000 },
      { id: 'education', name: '📚 教育发展', budgetType: 'yearly', amount: 5000 },
      { id: 'family', name: '👨‍👩‍👧 家人支持', budgetType: 'yearly', amount: 12000 }
    ]
  }
};

// Helper function to calculate yearly amount for a category or subcategory
const calculateYearlyAmount = (cat: any): number => {
  if (cat.isParent && cat.children) {
    return cat.children.reduce((sum: number, child: any) => sum + calculateYearlyAmount(child), 0);
  }
  return cat.budgetType === 'weekly' ? cat.amount * 52 :
         cat.budgetType === 'monthly' ? cat.amount * 12 :
         cat.amount;
};

// Helper function to get all trackable categories (flattens parent-child structure)
const getAllTrackableCategories = (categories: any[], budgetType?: string): any[] => {
  const result: any[] = [];
  
  categories.forEach(cat => {
    if (cat.isParent && cat.children) {
      // Add parent as a group summary
      const childrenOfType = budgetType 
        ? cat.children.filter((c: any) => c.budgetType === budgetType)
        : cat.children;
      
      if (childrenOfType.length > 0) {
        result.push({
          ...cat,
          isGroupSummary: true,
          trackableChildren: childrenOfType
        });
      }
    } else if (!cat.isParent) {
      // Add standalone category
      if (!budgetType || cat.budgetType === budgetType) {
        result.push(cat);
      }
    }
  });
  
  return result;
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
  type: 'stocks' | 'bonds' | 'cash' | 'crypto';
  amount: number;
  symbol?: string | null;
  name: string;
  price?: number | null;
  quantity?: number | null;
  account?: string | null; // 新增账户字段
  date: string;
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
  
  // User custom budget categories
  const [budgetCategories, setBudgetCategories] = useState(() => {
    const saved = localStorage.getItem('budgetCategories');
    return saved ? JSON.parse(saved) : null; // null means not set up yet
  });
  
  const [showBudgetWizard, setShowBudgetWizard] = useState(() => {
    return !localStorage.getItem('budgetCategories');
  });
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ 
    category: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    description: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'current' | 'trends'>('current');
  const [expensesSubTab, setExpensesSubTab] = useState<'overview' | 'trends'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'day'>('month');
  
  // Budget tracking states
  const [weeklyBudgets] = useState(() => {
    const saved = localStorage.getItem('weeklyBudgets');
    return saved ? JSON.parse(saved) : {
      food_dining: { spent: 70, limit: 100 },
      transportation: { spent: 30, limit: 50 }
    };
  });
  
  const [monthlyBudgets] = useState(() => {
    const saved = localStorage.getItem('monthlyBudgets');
    return saved ? JSON.parse(saved) : {
      shopping: { spent: 200, limit: 500 },
      entertainment: { spent: 150, limit: 300 },
      subscriptions: { spent: 100, limit: 200 },
      pets: { spent: 80, limit: 150 },
      beauty: { spent: 300, limit: 600 }
    };
  });
  
  const [annualBudgets] = useState(() => {
    const saved = localStorage.getItem('annualBudgets');
    return saved ? JSON.parse(saved) : {
      housing: { spent: 36000, limit: 48000 },
      travel: { spent: 5000, limit: 15000 },
      healthcare: { spent: 2000, limit: 8000 },
      education: { spent: 0, limit: 10000 },
      family: { spent: 12000, limit: 24000 }
    };
  });
  
  // Investment management states
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState<number | null>(null);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);
  const [newInvestment, setNewInvestment] = useState({
    type: 'stocks',
    symbol: '',
    name: '',
    amount: '',
    price: '',
    quantity: '',
    account: '', // 新增账户字段
    date: new Date().toISOString().split('T')[0],
  });
  const [editingInvestment, setEditingInvestment] = useState({
    type: '',
    symbol: '',
    name: '',
    amount: '',
    price: '',
    quantity: '',
    account: '', // 添加账户字段
    date: '',
  });
  const [showCashCalculator, setShowCashCalculator] = useState(false);
  const [showFireOptimization, setShowFireOptimization] = useState(false);
  const [showCityPlanner, setShowCityPlanner] = useState(false);
  const [cityPlan, setCityPlan] = useState(() => {
    const saved = localStorage.getItem('cityPlan');
    return saved ? JSON.parse(saved) : [];
  });
  const [annualTravelCosts, setAnnualTravelCosts] = useState(() => {
    const saved = localStorage.getItem('annualTravelCosts');
    return saved ? JSON.parse(saved) : { flights: 0, visas: 0, insurance: 0 };
  });
  const [currencySettings, setCurrencySettings] = useState(() => {
    const saved = localStorage.getItem('currencySettings');
    return saved ? JSON.parse(saved) : {
      baseCurrency: 'USD',
      exchangeRates: {
        USD: 1,
        CNY: 0.139, // 1 CNY = 0.139 USD (1 USD = 7.2 CNY)
        EUR: 1.08   // 1 EUR = 1.08 USD
      }
    };
  });
  const [showCurrencySettings, setShowCurrencySettings] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [customCost, setCustomCost] = useState('');
  const [customMonths, setCustomMonths] = useState('1');
  const [retirementExpenseAdjustments, setRetirementExpenseAdjustments] = useState(() => {
    // 从 localStorage 恢复退休支出调整数据
    const saved = localStorage.getItem('retirementExpenseAdjustments');
    return saved ? JSON.parse(saved) : {
      essential: { enabled: false, adjustmentPct: 0, customAmount: 0, useCityPlanner: false },
      workRelated: { enabled: true, adjustmentPct: -100, customAmount: 0, useCityPlanner: false }, // 默认工作相关支出退休后消失
      discretionary: { enabled: false, adjustmentPct: 0, customAmount: 0, useCityPlanner: false }
    };
  });
  const [cashAccounts, setCashAccounts] = useState(() => {
    // 从 localStorage 恢复现金账户数据
    const savedAccounts = localStorage.getItem('cashAccounts');
    console.log('Initializing cashAccounts from localStorage:', savedAccounts);
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        console.log('Parsed cash accounts:', parsed);
        // 验证数据有效性
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved cash accounts:', e);
      }
    }
    console.log('Using default empty account');
    return [{ id: Date.now(), name: '', amount: '' }];
  });

  // Load data from API
  useEffect(() => {
    loadData();
    checkAndRefreshPrices();
    
    // Load last update time
    const lastUpdate = localStorage.getItem('lastPriceUpdate');
    if (lastUpdate) {
      setLastPriceUpdate(lastUpdate);
    }
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load expenses
      try {
        const expensesRes = await api.get(`/expenses?month=${selectedMonth}&year=${selectedYear}`);
        setExpenses(expensesRes.data);
      } catch (error: any) {
        console.error('Error loading expenses:', error);
        if (error.response?.status === 401) {
          alert('登录已过期，请重新登录');
          window.location.href = '/auth';
          return;
        }
        console.error('Expenses error details:', error.response?.data);
      }

      // Load investments
      try {
        const investmentsRes = await api.get('/investments');
        setInvestments(investmentsRes.data);
      } catch (error: any) {
        console.error('Error loading investments:', error);
        if (error.response?.status === 401) {
          alert('登录已过期，请重新登录');
          window.location.href = '/auth';
          return;
        }
        console.error('Investments error details:', error.response?.data);
      }

      // Load target allocation
      try {
        const targetRes = await api.get('/investments/target-allocation');
        if (targetRes.data) {
          setTargetAllocation(targetRes.data);
        }
      } catch (error: any) {
        console.error('Error loading target allocation:', error);
        console.error('Target allocation error details:', error.response?.data);
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
    } catch (error: any) {
      console.error('Error loading data:', error);
      console.error('Error details:', error.response?.data);
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
        setNewExpense({ category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '', currency: 'USD' });
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

  // Investment management functions
  const checkAndRefreshPrices = async () => {
    const lastUpdate = localStorage.getItem('lastPriceUpdate');
    if (!lastUpdate) {
      return;
    }

    const lastUpdateTime = new Date(lastUpdate);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);

    if (hoursDiff >= 24) {
      await refreshStockPrices();
    }
  };

  const refreshStockPrices = async () => {
    setRefreshingPrices(true);
    try {
      const stocksWithSymbols = investments.filter(inv => inv.type === 'stocks' && inv.symbol);
      
      if (stocksWithSymbols.length === 0) {
        alert('没有找到需要更新价格的股票（需要有股票代码）');
        setRefreshingPrices(false);
        return;
      }

      console.log(`准备更新 ${stocksWithSymbols.length} 只股票的价格...`);
      let successCount = 0;
      let failCount = 0;
      let apiKeyMissing = false;
      
      for (const stock of stocksWithSymbols) {
        try {
          console.log(`正在获取 ${stock.symbol} 的价格...`);
          const res = await api.get(`/rebalancing/market-data/${stock.symbol}`);
          if (res.data && res.data.price) {
            await api.put(`/investments/${stock.id}`, {
              type: stock.type,
              symbol: stock.symbol,
              name: stock.name || stock.symbol,
              price: res.data.price,
              quantity: stock.quantity,
              amount: res.data.price * (stock.quantity || 0),
              date: stock.date,
            });
            console.log(`${stock.symbol} 价格已更新: $${res.data.price}`);
            successCount++;
          } else {
            console.warn(`${stock.symbol} 未返回价格数据`);
            failCount++;
          }
        } catch (error: any) {
          console.error(`更新 ${stock.symbol} 价格失败:`, error);
          if (error.response?.status === 503) {
            apiKeyMissing = true;
          } else if (error.response?.status === 404) {
            console.warn(`${stock.symbol}: 股票代码未找到，可能不是有效的股票代码`);
          } else if (error.response?.status === 429) {
            console.warn(`${stock.symbol}: API 速率限制，请稍后再试`);
          }
          failCount++;
        }
      }

      const now = new Date().toISOString();
      localStorage.setItem('lastPriceUpdate', now);
      setLastPriceUpdate(now);

      await loadData();
      
      if (apiKeyMissing) {
        alert(`⚠️ Alpha Vantage API Key 未配置\n\n自动价格更新需要 API Key。\n\n临时方案：可以点击"编辑"按钮手动更新价格。\n\n获取免费 API Key：\nhttps://www.alphavantage.co/support/#api-key\n\n然后在服务器的 .env 文件中设置：\nALPHA_VANTAGE_API_KEY=your_key`);
      } else if (failCount > 0) {
        alert(`价格更新完成！\n✅ 成功: ${successCount} 只\n❌ 失败: ${failCount} 只\n\n失败原因可能：\n1. 股票代码无效（如 VRT、ONDS）\n2. 加密货币（DOGE、SHIB）不支持\n3. API 速率限制\n\n💡 建议：\n- 点击"编辑"按钮手动更新价格\n- 或检查浏览器控制台查看详细错误`);
      } else {
        alert(`✅ 价格更新完成！成功更新 ${successCount} 只股票`);
      }
    } catch (error) {
      console.error('更新价格时出错:', error);
      alert('更新价格失败，请检查API配置或网络连接');
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const quantity = parseFloat(newInvestment.quantity);
      const price = parseFloat(newInvestment.price);
      const amount = quantity * price;
      
      // Ensure name is not empty - use symbol or a default name based on type
      let investmentName = newInvestment.name;
      if (!investmentName && newInvestment.symbol) {
        investmentName = newInvestment.symbol;
      } else if (!investmentName && newInvestment.type === 'stocks') {
        investmentName = '股票投资';
      } else if (!investmentName && newInvestment.type === 'bonds') {
        investmentName = '债券投资';
      } else if (!investmentName && newInvestment.type === 'crypto') {
        investmentName = '加密货币投资';
      } else if (!investmentName && newInvestment.type === 'cash') {
        investmentName = '现金投资';
      }
      
      await api.post('/investments', {
        type: newInvestment.type,
        symbol: newInvestment.symbol || null,
        name: investmentName,
        amount: amount,
        price: price,
        quantity: quantity,
        account: newInvestment.account || null, // 添加账户字段
        date: newInvestment.date,
      });
      setNewInvestment({
        type: 'stocks',
        symbol: '',
        name: '',
        amount: '',
        price: '',
        quantity: '',
        account: '', // 重置账户字段
        date: new Date().toISOString().split('T')[0],
      });
      setShowAddInvestment(false);
      loadData();
    } catch (error: any) {
      console.error('Error adding investment:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || '添加投资失败';
      alert(`添加投资失败: ${errorMsg}`);
    }
  };

  const handleStartEditInvestment = (investment: Investment) => {
    setEditingInvestmentId(investment.id);
    setEditingInvestment({
      type: investment.type,
      symbol: investment.symbol || '',
      name: investment.name,
      amount: investment.amount.toString(),
      price: investment.price ? investment.price.toString() : '',
      quantity: investment.quantity ? investment.quantity.toString() : '',
      account: investment.account || '', // 添加账户字段
      date: investment.date || new Date().toISOString().split('T')[0],
    });
  };

  const handleCancelEditInvestment = () => {
    setEditingInvestmentId(null);
    setEditingInvestment({
      type: '',
      symbol: '',
      name: '',
      amount: '',
      price: '',
      quantity: '',
      account: '', // 添加账户字段
      date: '',
    });
  };

  const handleSaveEditInvestment = async (id: number) => {
    try {
      await api.put(`/investments/${id}`, {
        ...editingInvestment,
        amount: parseFloat(editingInvestment.amount),
        price: editingInvestment.price ? parseFloat(editingInvestment.price) : null,
        quantity: editingInvestment.quantity ? parseFloat(editingInvestment.quantity) : null,
        symbol: editingInvestment.symbol || null,
        account: editingInvestment.account || null, // 添加账户字段
      });
      setEditingInvestmentId(null);
      loadData();
    } catch (error) {
      console.error('Error updating investment:', error);
      alert('更新失败');
    }
  };

  const handleDeleteInvestment = async (id: number) => {
    if (!confirm('确定要删除这条投资记录吗？')) return;
    try {
      await api.delete(`/investments/${id}`);
      loadData();
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('删除失败');
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'stocks' ? '股票' : type === 'bonds' ? '债券' : '现金';
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
  
  // Calculate monthly net savings and savings rate (income - total expenses)
  const monthlyTotalExpenses = currentMonthTotal;
  const monthlySavings = monthlyIncome - monthlyTotalExpenses;
  const actualSavingsRate = monthlyIncome > 0 ? ((monthlySavings / monthlyIncome) * 100) : 0;

  // Calculate FIRE target based on last 12 months actual expenses with user adjustments
  const getLast12MonthsExpensesByGroup = () => {
    const now = new Date();
    const byGroup = { essential: 0, workRelated: 0, discretionary: 0 };
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthData = monthlyAggregation[monthKey];
      
      if (monthData && monthData.byGroup) {
        byGroup.essential += monthData.byGroup.essential || 0;
        byGroup.workRelated += monthData.byGroup.workRelated || 0;
        byGroup.discretionary += monthData.byGroup.discretionary || 0;
      }
    }
    
    return byGroup;
  };

  const getLast12MonthsExpenses = () => {
    const expensesByGroup = getLast12MonthsExpensesByGroup();
    let optimizedTotal = 0;
    
    // Apply user adjustments from retirementExpenseAdjustments
    Object.keys(expensesByGroup).forEach(key => {
      const current = expensesByGroup[key as keyof typeof expensesByGroup];
      const adj = retirementExpenseAdjustments[key as keyof typeof retirementExpenseAdjustments];
      
      if (adj && adj.enabled) {
        // For essential expenses with city planner enabled, use city plan total
        if (key === 'essential' && adj.useCityPlanner && cityPlan.length > 0) {
          optimizedTotal += cityPlan.reduce((sum: number, city: any) => sum + (city.monthlyCost * city.months), 0);
        } else if (current > 0) {
          // Use percentage adjustment
          optimizedTotal += current * (1 + adj.adjustmentPct / 100);
        } else {
          // Use custom amount
          optimizedTotal += (adj.customAmount || 0);
        }
      } else {
        optimizedTotal += current;
      }
    });
    
    return optimizedTotal;
  };

  const last12MonthsExpenses = getLast12MonthsExpenses();
  const annualExpenses = last12MonthsExpenses; // Already 12 months total with adjustments applied
  
  // Calculate optimized FIRE number based on user adjustments
  const calculateOptimizedAnnualExpenses = () => {
    const currentExpensesByGroup = getLast12MonthsExpensesByGroup();
    let optimizedTotal = 0;
    
    Object.keys(currentExpensesByGroup).forEach(key => {
      const current = currentExpensesByGroup[key as keyof typeof currentExpensesByGroup];
      const adj = retirementExpenseAdjustments[key as keyof typeof retirementExpenseAdjustments];
      
      if (adj.enabled) {
        // For essential expenses with city planner enabled, use city plan total + travel costs
        if (key === 'essential' && adj.useCityPlanner && cityPlan.length > 0) {
          const cityCosts = cityPlan.reduce((sum: number, city: any) => sum + (city.monthlyCost * city.months), 0);
          const travelCosts = annualTravelCosts.flights + annualTravelCosts.visas + annualTravelCosts.insurance;
          optimizedTotal += cityCosts + travelCosts;
        } else if (current > 0) {
          // Use percentage adjustment
          optimizedTotal += current * (1 + adj.adjustmentPct / 100);
        } else {
          // Use custom amount
          optimizedTotal += (adj.customAmount || 0);
        }
      } else {
        optimizedTotal += current;
      }
    });
    
    return optimizedTotal;
  };
  
  const optimizedAnnualExpenses = calculateOptimizedAnnualExpenses();
  const currentWithdrawalRate = fireMultiplier > 0 ? (100 / fireMultiplier) : 0;
  const fireNumber = optimizedAnnualExpenses > 0 ? optimizedAnnualExpenses * fireMultiplier : last12MonthsExpenses * fireMultiplier;

  // Calculate portfolio metrics
  // Calculate portfolio from investments (excluding cash)
  const portfolio = investments.reduce((acc, inv) => {
    // Skip cash - we'll calculate it from localStorage instead
    if (inv.type === 'cash') return acc;
    
    // For stocks/bonds/crypto, calculate from quantity * price
    const amount = (inv.quantity || 0) * (inv.price || 0);
    acc[inv.type] = (acc[inv.type] || 0) + amount;
    return acc;
  }, { stocks: 0, bonds: 0, cash: 0, crypto: 0 } as Record<string, number>);

  // Calculate cash directly from localStorage
  portfolio.cash = cashAccounts.reduce((sum: number, acc: any) => {
    return sum + (parseFloat(acc.amount) || 0);
  }, 0);

  const totalPortfolio = portfolio.stocks + portfolio.bonds + portfolio.cash + (portfolio.crypto || 0);
  
  // Calculate asset growth rate (estimated based on monthly savings * 12)
  // TODO: In the future, track historical portfolio values for accurate calculation
  const estimatedAnnualGrowth = monthlySavings * 12;
  const assetGrowthRate = totalPortfolio > estimatedAnnualGrowth && totalPortfolio > 0 
    ? (estimatedAnnualGrowth / (totalPortfolio - estimatedAnnualGrowth)) * 100 
    : 0;
  
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
          {['dashboard', 'expenses', 'budget', 'portfolio', 'rebalance'].map(tab => (
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
              {tab === 'dashboard' ? 'FIRE总览' : tab === 'expenses' ? '收支管理' : tab === 'budget' ? '预算管理' : tab === 'portfolio' ? '投资组合' : '再平衡建议'}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* FIRE Progress Section */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Current Total Assets - Prominent Display */}
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                marginBottom: '1.5rem',
                color: COLORS.text 
              }}>
                当前总资产：${totalPortfolio.toLocaleString()}
              </div>
              
              {/* FIRE Progress Tracking */}
              <div style={{ marginBottom: '0.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: COLORS.textMuted }}>
                  FIRE 进度追踪
                </h4>
              </div>
              
              {/* Current Portfolio vs FIRE Number */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>当前总资产</span>
                  <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>FIRE 目标</span>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.5rem',
                  height: '2.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  {/* Progress Bar */}
                  <div style={{
                    background: `linear-gradient(90deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
                    height: '100%',
                    width: `${Math.min(Math.max((totalPortfolio / fireNumber) * 100, 0.5), 100)}%`,
                    transition: 'width 0.3s ease'
                  }} />
                  {/* Percentage Text - Always Visible */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: COLORS.text,
                    fontWeight: '700',
                    fontSize: '1rem',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                  }}>
                    {totalPortfolio > 0 && fireNumber > 0 ? `${((totalPortfolio / fireNumber) * 100).toFixed(2)}%` : '0.00%'}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '600' }}>
                  <span style={{ color: COLORS.text }}>${totalPortfolio.toLocaleString()}</span>
                  <span style={{ color: COLORS.warning }}>${fireNumber.toLocaleString()}</span>
                </div>
              </div>
              {/* Progress Status */}
              {totalPortfolio >= fireNumber && (
                <div style={{
                  padding: '1.25rem',
                  background: `${COLORS.success}20`,
                  border: `2px solid ${COLORS.success}`,
                  borderRadius: '0.75rem',
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: COLORS.success
                }}>
                  🎉 恭喜！您已达到 FIRE 目标！
                </div>
              )}
              {totalPortfolio < fireNumber && (
                <div style={{
                  padding: '1rem',
                  background: `${COLORS.warning}10`,
                  border: `1px solid ${COLORS.warning}40`,
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <strong style={{ color: COLORS.warning }}>距离 FIRE 目标还差:</strong>{' '}
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: COLORS.text }}>
                    ${(fireNumber - totalPortfolio).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* KPI 1: FIRE Progress */}
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.75rem' }}>
                  🎯 FIRE 进度
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: COLORS.success,
                  marginBottom: '0.75rem'
                }}>
                  {totalPortfolio > 0 && fireNumber > 0 ? `${((totalPortfolio / fireNumber) * 100).toFixed(2)}%` : '0.00%'}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                  当前: ${(totalPortfolio / 1000).toFixed(1)}K
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                  目标: ${(fireNumber / 1000).toFixed(1)}K
                </div>
              </div>

              {/* KPI 2: FIRE Target with Optimize Button */}
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.75rem' }}>
                  🔥 FIRE 目标
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: COLORS.warning,
                  marginBottom: '0.5rem'
                }}>
                  ${fireNumber.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '1rem' }}>
                  年支出 × {fireMultiplier.toFixed(1)} 倍
                </div>
                <button
                  onClick={() => setShowFireOptimization(true)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: `1px solid ${COLORS.success}`,
                    color: COLORS.success,
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${COLORS.success}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  📝 优化目标
                </button>
              </div>

              {/* KPI 3: Monthly Net Savings */}
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.75rem' }}>
                  💰 月度净储蓄
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: monthlySavings >= 0 ? COLORS.success : COLORS.highlight,
                  marginBottom: '0.5rem'
                }}>
                  ${monthlySavings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                  = 收入 ${monthlyIncome.toLocaleString()} - 支出 ${monthlyTotalExpenses.toLocaleString()}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: actualSavingsRate >= 50 ? COLORS.success : COLORS.textMuted,
                  marginTop: '0.5rem'
                }}>
                  储蓄率: {actualSavingsRate.toFixed(1)}%
                  {actualSavingsRate >= 50 && ' ✓'}
                </div>
              </div>

              {/* KPI 4: Asset Growth Rate */}
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.75rem' }}>
                  📈 资产增长
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: COLORS.bonds,
                  marginBottom: '0.5rem'
                }}>
                  +{assetGrowthRate.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                  近 12 个月（估算）
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                  年增长: +${estimatedAnnualGrowth.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                  月均: +${(estimatedAnnualGrowth / 12).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Monthly Income/Expense Overview with Insights */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>📊 本月收支概览</h3>
                {monthOverMonthChange !== 0 && (
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: monthOverMonthChange > 0 ? COLORS.highlight : COLORS.success,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {monthOverMonthChange > 0 ? '↗' : '↘'} {Math.abs(monthOverMonthChange).toFixed(1)}% 超上月同比
                  </div>
                )}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  padding: '1rem',
                  background: COLORS.accent,
                  borderRadius: '0.5rem',
                  borderLeft: `4px solid ${COLORS.highlight}`
                }}>
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                    当前月度支出
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.highlight }}>
                    ${currentMonthTotal.toLocaleString()}
                  </div>
                </div>
                
                <div style={{
                  padding: '1rem',
                  background: COLORS.accent,
                  borderRadius: '0.5rem',
                  borderLeft: `4px solid ${COLORS.success}`
                }}>
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                    当前月度收入
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.success }}>
                    ${monthlyIncome.toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Insights */}
              <div style={{
                padding: '1rem',
                background: `${COLORS.warning}15`,
                border: `1px solid ${COLORS.warning}40`,
                borderRadius: '0.5rem',
                fontSize: '0.9rem'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.75rem', color: COLORS.text }}>
                  💡 Insights
                </div>
                {(() => {
                  const insights = [];
                  
                  // Insight 1: Savings rate
                  if (actualSavingsRate >= 50) {
                    insights.push(`储蓄率 ${actualSavingsRate.toFixed(1)}%，高于 FIRE 目标 50%，保持优秀！`);
                  } else if (actualSavingsRate > 0) {
                    insights.push(`储蓄率 ${actualSavingsRate.toFixed(1)}%，建议提高至 50% 以加速 FIRE 进度。`);
                  } else {
                    insights.push(`本月支出超过收入，建议检查必需支出和可选支出。`);
                  }
                  
                  // Insight 2: Month over month change
                  if (monthOverMonthChange > 15) {
                    insights.push(`本月支出环比增长 ${monthOverMonthChange.toFixed(1)}%，增幅较大，建议查看支出明细。`);
                  } else if (monthOverMonthChange < -15) {
                    insights.push(`本月支出环比下降 ${Math.abs(monthOverMonthChange).toFixed(1)}%，支出控制良好！`);
                  }
                  
                  // Insight 3: FIRE progress
                  if (totalPortfolio > 0 && fireNumber > 0) {
                    const progressPct = (totalPortfolio / fireNumber) * 100;
                    if (progressPct >= 75) {
                      insights.push(`FIRE 进度已达 ${progressPct.toFixed(1)}%，距离目标越来越近了！`);
                    }
                  }
                  
                  return insights.length > 0 ? (
                    <ol style={{ margin: 0, paddingLeft: '1.5rem', color: COLORS.textMuted, lineHeight: '1.8' }}>
                      {insights.map((insight, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>{insight}</li>
                      ))}
                    </ol>
                  ) : (
                    <div style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                      持续记录收支，获取更多智能洞察。
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Expense Recommendations based on FIRE Progress */}
            {monthlyIncome > 0 && totalPortfolio < fireNumber && (
              <div style={{
                background: `${COLORS.success}10`,
                border: `1px solid ${COLORS.success}`,
                borderRadius: '0.5rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
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
                                  ${requiredMonthlySavings.toLocaleString()}
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
                                  ${recommendedMaxExpenses.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                  当前: ${currentTotalExpenses.toLocaleString()}
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
                              <strong>⚠️ 当前支出超出建议:</strong> 超出 ${(currentTotalExpenses - recommendedMaxExpenses).toLocaleString()}
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
                              <li>优先削减"可选支出"类别（当前: ${discretionaryExpenses.toLocaleString()}）</li>
                              <li>工作相关支出退休后会消失，无需过度优化</li>
                              <li>保持必需支出在合理范围（当前: ${essentialExpenses.toLocaleString()}）</li>
                              {actualSavingsRate < 50 && (
                                <li style={{ color: COLORS.warning }}>
                                  <strong>目标储蓄率 ≥50%，当前 {actualSavingsRate.toFixed(1)}%，需要提高 {(50 - actualSavingsRate).toFixed(1)}%</strong>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Auto-update button */}
                          <button
                            onClick={async () => {
                              if (confirm(`确定要将建议的最大支出 $${recommendedMaxExpenses.toLocaleString()} 应用到月度预算吗？\n\n这将帮助您更好地控制支出，加速 FIRE 进度。`)) {
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
                      ${portfolio.stocks.toLocaleString()}
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
                      ${portfolio.bonds.toLocaleString()}
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
                      ${portfolio.cash.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                      {currentAllocation.cash.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div>
            {/* Sub-Tab Navigation */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              borderBottom: `2px solid ${COLORS.accent}`
            }}>
              {['overview', 'trends'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setExpensesSubTab(tab as 'overview' | 'trends')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: expensesSubTab === tab ? COLORS.highlight : COLORS.textMuted,
                    padding: '1rem 1.5rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    borderBottom: expensesSubTab === tab ? `3px solid ${COLORS.highlight}` : 'none',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                >
                  {tab === 'overview' ? '支出一览' : '趋势分析'}
                </button>
              ))}
            </div>

            {/* Tab-1: 支出一览 */}
            {expensesSubTab === 'overview' && (
              <div>
                {/* Month/Year Selector */}
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
            </div>

                {/* 1. 本月当前支出卡片 (上) */}
                <div style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>本月当前支出</h3>
                    <button
                      onClick={() => setShowAddExpense(true)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      ➕ 添加支出
                    </button>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.danger, marginBottom: '0.5rem' }}>
                    ${currentMonthTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: monthOverMonthChange >= 0 ? COLORS.danger : COLORS.success }}>
                    较上月 {monthOverMonthChange >= 0 ? '↑' : '↓'} {Math.abs(monthOverMonthChange).toFixed(1)}%
                  </div>
                </div>

                {/* 2. 本月当前收入卡片 (下) */}
                <div style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>本月当前收入</h3>
                    <button
                      style={{
                        padding: '0.5rem 1rem',
                        background: `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      ➕ 添加收入
                    </button>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.success, marginBottom: '0.5rem' }}>
                    ${monthlyIncome.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>
                    税后收入
                  </div>
                </div>

                {/* 3. 本周预算追踪卡片 */}
                {budgetCategories && getAllTrackableCategories(budgetCategories, 'weekly').length > 0 && (
                  <div style={{
                    background: COLORS.card,
                    borderRadius: '1rem',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem' }}>本周预算追踪</h3>
                    {getAllTrackableCategories(budgetCategories, 'weekly').map((item: any) => {
                      const weekStart = new Date();
                      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                      weekStart.setHours(0, 0, 0, 0);
                      
                      if (item.isGroupSummary && item.trackableChildren) {
                        // Parent category with children
                        const totalBudget = item.trackableChildren.reduce((sum: number, child: any) => sum + child.amount, 0);
                        const totalSpent = item.trackableChildren.reduce((sum: number, child: any) => {
                          return sum + expenses
                            .filter(exp => {
                              const expDate = new Date(exp.date);
                              return expDate >= weekStart && exp.category === child.id;
                            })
                            .reduce((s, e) => s + e.amount, 0);
                        }, 0);
                        const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                        
                        return (
                          <div key={item.id} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: COLORS.textMuted }}>
                              {item.name}
                            </div>
                            {item.trackableChildren.map((child: any) => {
                              const spent = expenses
                                .filter(exp => {
                                  const expDate = new Date(exp.date);
                                  return expDate >= weekStart && exp.category === child.id;
                                })
                                .reduce((sum, exp) => sum + exp.amount, 0);
                              
                              const percentage = (spent / child.amount) * 100;
                              
                              return (
                                <div key={child.id} style={{ marginBottom: '0.75rem', paddingLeft: '1rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{child.name}</span>
                                    <span style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>
                                      ${spent.toFixed(0)} / ${child.amount}
                                    </span>
                                  </div>
                                  <div style={{
                                    width: '100%',
                                    height: '5px',
                                    background: COLORS.accent,
                                    borderRadius: '2.5px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${Math.min(percentage, 100)}%`,
                                      height: '100%',
                                      background: percentage > 90 ? COLORS.danger : percentage > 70 ? COLORS.warning : COLORS.success,
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              marginTop: '0.5rem',
                              paddingTop: '0.5rem',
                              borderTop: `1px solid ${COLORS.accent}`,
                              fontSize: '0.9rem',
                              fontWeight: '600'
                            }}>
                              <span>总计</span>
                              <span style={{ color: totalPercentage > 90 ? COLORS.danger : totalPercentage > 70 ? COLORS.warning : COLORS.success }}>
                                ${totalSpent.toFixed(0)} / ${totalBudget}
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        // Standalone category
                        const spent = expenses
                          .filter(exp => {
                            const expDate = new Date(exp.date);
                            return expDate >= weekStart && exp.category === item.id;
                          })
                          .reduce((sum, exp) => sum + exp.amount, 0);
                        
                        const percentage = (spent / item.amount) * 100;
                        
                        return (
                          <div key={item.id} style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
                              <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                                ${spent.toFixed(0)} / ${item.amount}
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '6px',
                              background: COLORS.accent,
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.min(percentage, 100)}%`,
                                height: '100%',
                                background: percentage > 90 ? COLORS.danger : percentage > 70 ? COLORS.warning : COLORS.success,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}

                {/* 4. 月度预算追踪卡片 */}
                {budgetCategories && getAllTrackableCategories(budgetCategories, 'monthly').length > 0 && (
                  <div style={{
                    background: COLORS.card,
                    borderRadius: '1rem',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem' }}>本月预算追踪</h3>
                    {getAllTrackableCategories(budgetCategories, 'monthly').map((item: any) => {
                      const monthStart = new Date();
                      monthStart.setDate(1);
                      monthStart.setHours(0, 0, 0, 0);
                      
                      if (item.isGroupSummary && item.trackableChildren) {
                        // Parent category with children
                        const totalBudget = item.trackableChildren.reduce((sum: number, child: any) => sum + child.amount, 0);
                        const totalSpent = item.trackableChildren.reduce((sum: number, child: any) => {
                          return sum + expenses
                            .filter(exp => {
                              const expDate = new Date(exp.date);
                              return expDate >= monthStart && exp.category === child.id;
                            })
                            .reduce((s, e) => s + e.amount, 0);
                        }, 0);
                        const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                        
                        return (
                          <div key={item.id} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: COLORS.textMuted }}>
                              {item.name}
                            </div>
                            {item.trackableChildren.map((child: any) => {
                              const spent = expenses
                                .filter(exp => {
                                  const expDate = new Date(exp.date);
                                  return expDate >= monthStart && exp.category === child.id;
                                })
                                .reduce((sum, exp) => sum + exp.amount, 0);
                              
                              const percentage = (spent / child.amount) * 100;
                              
                              return (
                                <div key={child.id} style={{ marginBottom: '0.75rem', paddingLeft: '1rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{child.name}</span>
                                    <span style={{ fontSize: '0.8rem', color: COLORS.textMuted }}>
                                      ${spent.toFixed(0)} / ${child.amount}
                                    </span>
                                  </div>
                                  <div style={{
                                    width: '100%',
                                    height: '5px',
                                    background: COLORS.accent,
                                    borderRadius: '2.5px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${Math.min(percentage, 100)}%`,
                                      height: '100%',
                                      background: percentage > 90 ? COLORS.danger : percentage > 70 ? COLORS.warning : COLORS.success,
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              marginTop: '0.5rem',
                              paddingTop: '0.5rem',
                              borderTop: `1px solid ${COLORS.accent}`,
                              fontSize: '0.9rem',
                              fontWeight: '600'
                            }}>
                              <span>总计</span>
                              <span style={{ color: totalPercentage > 90 ? COLORS.danger : totalPercentage > 70 ? COLORS.warning : COLORS.success }}>
                                ${totalSpent.toFixed(0)} / ${totalBudget}
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        // Standalone category
                        const spent = expenses
                          .filter(exp => {
                            const expDate = new Date(exp.date);
                            return expDate >= monthStart && exp.category === item.id;
                          })
                          .reduce((sum, exp) => sum + exp.amount, 0);
                        
                        const percentage = (spent / item.amount) * 100;
                        
                        return (
                          <div key={item.id} style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
                              <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                                ${spent.toFixed(0)} / ${item.amount}
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '6px',
                              background: COLORS.accent,
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.min(percentage, 100)}%`,
                                height: '100%',
                                background: percentage > 90 ? COLORS.danger : percentage > 70 ? COLORS.warning : COLORS.success,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}

                {/* 5. 年度预算追踪卡片 */}
                {budgetCategories && getAllTrackableCategories(budgetCategories, 'yearly').length > 0 && (
                  <div style={{
                    background: COLORS.card,
                    borderRadius: '1rem',
                    padding: '2rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem' }}>年度预算追踪</h3>
                    {getAllTrackableCategories(budgetCategories, 'yearly').map((item: any) => {
                      const yearStart = new Date(new Date().getFullYear(), 0, 1);
                      
                      if (item.isGroupSummary && item.trackableChildren) {
                        // Parent category with children
                        const totalBudget = item.trackableChildren.reduce((sum: number, child: any) => sum + child.amount, 0);
                        const totalSpent = item.trackableChildren.reduce((sum: number, child: any) => {
                          return sum + expenses
                            .filter(exp => {
                              const expDate = new Date(exp.date);
                              return expDate >= yearStart && exp.category === child.id;
                            })
                            .reduce((s, e) => s + e.amount, 0);
                        }, 0);
                        const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                        
                        return (
                          <div key={item.id} style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '1rem', color: COLORS.textMuted }}>
                              {item.name}
                            </div>
                            {item.trackableChildren.map((child: any) => {
                              const spent = expenses
                                .filter(exp => {
                                  const expDate = new Date(exp.date);
                                  return expDate >= yearStart && exp.category === child.id;
                                })
                                .reduce((sum, exp) => sum + exp.amount, 0);
                              
                              const percentage = (spent / child.amount) * 100;
                              
                              return (
                                <div key={child.id} style={{ marginBottom: '1rem', paddingLeft: '1rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '0.9rem' }}>{child.name}</span>
                                    <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                                      ${spent.toLocaleString()} / ${child.amount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div style={{
                                    width: '100%',
                                    height: '7px',
                                    background: COLORS.accent,
                                    borderRadius: '3.5px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${Math.min(percentage, 100)}%`,
                                      height: '100%',
                                      background: percentage > 90 ? COLORS.danger : percentage > 70 ? COLORS.warning : COLORS.success,
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                    {percentage.toFixed(0)}% 已使用
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              marginTop: '0.75rem',
                              paddingTop: '0.75rem',
                              borderTop: `2px solid ${COLORS.accent}`,
                              fontSize: '1rem',
                              fontWeight: '700'
                            }}>
                              <span>总计</span>
                              <span style={{ color: totalPercentage > 90 ? COLORS.danger : totalPercentage > 70 ? COLORS.warning : COLORS.success }}>
                                ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.25rem', textAlign: 'right' }}>
                              {totalPercentage.toFixed(0)}% 已使用
                            </div>
                          </div>
                        );
                      } else {
                        // Standalone category
                        const spent = expenses
                          .filter(exp => {
                            const expDate = new Date(exp.date);
                            return expDate >= yearStart && exp.category === item.id;
                          })
                          .reduce((sum, exp) => sum + exp.amount, 0);
                        
                        const percentage = (spent / item.amount) * 100;
                        
                        return (
                          <div key={item.id} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.95rem' }}>{item.name}</span>
                              <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>
                                ${spent.toLocaleString()} / ${item.amount.toLocaleString()}
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '8px',
                              background: COLORS.accent,
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${Math.min(percentage, 100)}%`,
                                height: '100%',
                                background: percentage > 90 ? COLORS.danger : percentage > 70 ? COLORS.warning : COLORS.success,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                              {percentage.toFixed(0)}% 已使用
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}

                {/* 5. FIRE支出分析卡片（Placeholder） */}
                <div style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>FIRE支出分析</h3>
                  
                  {/* 饼图 Placeholder */}
                  <div style={{
                    height: '200px',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    color: COLORS.textMuted
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem' }}>支出结构饼图</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>(Coming Soon)</div>
                    </div>
                  </div>

                  {/* Transaction List Placeholder */}
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>交易明细</h4>
                  <div style={{
                    padding: '2rem',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    color: COLORS.textMuted
                  }}>
                    <div>暂无交易记录</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab-2: 趋势分析 */}
            {expensesSubTab === 'trends' && (
              <div>
                {/* Time Range Selector */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>时间范围:</span>
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year' | 'day')}
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
                      <option value="day">当日详情</option>
                      <option value="week">本周详情</option>
                      <option value="month">当月详情</option>
                      <option value="year">年度详情</option>
                    </select>
                  </div>
                </div>

                {/* Placeholder for Charts and Transaction List */}
                <div style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    {timeRange === 'day' && '当日'}
                    {timeRange === 'week' && '本周'}
                    {timeRange === 'month' && '当月'}
                    {timeRange === 'year' && '年度'}
                    支出趋势
                  </h3>
                  
                  {/* Chart Placeholder */}
                  <div style={{
                    height: '300px',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    color: COLORS.textMuted
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem' }}>趋势图表</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>(Coming Soon)</div>
                    </div>
                  </div>

                  {/* Transaction List Placeholder */}
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>交易明细</h4>
                  <div style={{
                    padding: '2rem',
                    background: COLORS.accent,
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    color: COLORS.textMuted
                  }}>
                    <div>暂无交易记录</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div>
            {/* Budget Wizard for new users */}
            {showBudgetWizard && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '3rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                textAlign: 'center'
              }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>🎯 欢迎！让我们设置你的预算</h2>
                <p style={{ fontSize: '1.1rem', color: COLORS.textMuted, marginBottom: '3rem' }}>
                  选择你的主要居住地，我们会根据当地生活成本推荐预算
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '2rem',
                  marginBottom: '2rem'
                }}>
                  {Object.entries(BUDGET_TEMPLATES).map(([key, template]) => {
                    const totalYearly = template.categories.reduce((sum, cat) => {
                      return sum + calculateYearlyAmount(cat);
                    }, 0);
                    
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          setBudgetCategories(template.categories);
                          localStorage.setItem('budgetCategories', JSON.stringify(template.categories));
                          setShowBudgetWizard(false);
                        }}
                        style={{
                          background: COLORS.accent,
                          borderRadius: '1rem',
                          padding: '2rem',
                          cursor: 'pointer',
                          border: `2px solid transparent`,
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.border = `2px solid ${COLORS.highlight}`;
                          e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.border = `2px solid transparent`;
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{template.name}</h3>
                        <p style={{ fontSize: '0.95rem', color: COLORS.textMuted, marginBottom: '1rem' }}>
                          {template.description}
                        </p>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.success }}>
                          ${totalYearly.toLocaleString()}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>预估年支出</p>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setBudgetCategories([]);
                    localStorage.setItem('budgetCategories', JSON.stringify([]));
                    setShowBudgetWizard(false);
                  }}
                  style={{
                    padding: '1rem 2rem',
                    background: COLORS.accent,
                    border: `2px solid ${COLORS.highlight}`,
                    borderRadius: '0.5rem',
                    color: COLORS.text,
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  ✏️ 我要自己设置
                </button>
              </div>
            )}

            {/* Budget Management UI */}
            {!showBudgetWizard && budgetCategories && (
              <div>
                {/* Summary Card */}
                <div style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>📊 全年支出预估</h2>
                  
                  {(() => {
                    const totalYearly = budgetCategories.reduce((sum: number, cat: any) => {
                      return sum + calculateYearlyAmount(cat);
                    }, 0);
                    const fireNumber = totalYearly * fireMultiplier;
                    const fireProgress = totalPortfolio > 0 ? (totalPortfolio / fireNumber) * 100 : 0;
                    
                    return (
                      <>
                        <div style={{
                          fontSize: '3rem',
                          fontWeight: '700',
                          color: COLORS.success,
                          marginBottom: '1rem'
                        }}>
                          ${totalYearly.toLocaleString()}
                        </div>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '1rem',
                          marginBottom: '1.5rem'
                        }}>
                          <div style={{ padding: '1rem', background: COLORS.accent, borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                              FIRE目标
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.warning }}>
                              ${fireNumber.toLocaleString()}
                            </div>
                          </div>
                          <div style={{ padding: '1rem', background: COLORS.accent, borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                              当前进度
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.highlight }}>
                              {fireProgress.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        {expenses.length > 0 && (() => {
                          const last12MonthsExpenses = expenses
                            .filter(exp => {
                              const expDate = new Date(exp.date);
                              const oneYearAgo = new Date();
                              oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                              return expDate >= oneYearAgo;
                            })
                            .reduce((sum, exp) => sum + exp.amount, 0);
                          
                          if (last12MonthsExpenses > 0) {
                            const diff = totalYearly - last12MonthsExpenses;
                            const diffPercent = (diff / last12MonthsExpenses) * 100;
                            
                            return (
                              <div style={{
                                padding: '1rem',
                                background: `${COLORS.highlight}20`,
                                borderRadius: '0.5rem',
                                border: `1px solid ${COLORS.highlight}`
                              }}>
                                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                  💡 基于你过去12个月的实际支出
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                                  实际支出: ${last12MonthsExpenses.toLocaleString()} / 年
                                </div>
                                <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                  预算比实际{diff > 0 ? '高' : '低'} ${Math.abs(diff).toLocaleString()} ({Math.abs(diffPercent).toFixed(1)}%)
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    );
                  })()}
                </div>

                {/* Categories List */}
                <div style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>我的预算分类</h2>
                    <button
                      onClick={() => {
                        const newCategory = {
                          id: `custom_${Date.now()}`,
                          name: '🆕 新分类',
                          budgetType: 'weekly',
                          amount: 0
                        };
                        // Insert at the beginning instead of the end
                        const updated = [newCategory, ...budgetCategories];
                        setBudgetCategories(updated);
                        localStorage.setItem('budgetCategories', JSON.stringify(updated));
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      + 新增分类
                    </button>
                  </div>

                  {budgetCategories.map((category: any, index: number) => {
                    const yearlyAmount = calculateYearlyAmount(category);
                    const isParent = category.isParent && category.children;
                    
                    return (
                      <div
                        key={category.id}
                        style={{
                          background: COLORS.accent,
                          borderRadius: '0.75rem',
                          padding: '1.5rem',
                          marginBottom: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            {isParent && (
                              <button
                                onClick={() => {
                                  const updated = [...budgetCategories];
                                  updated[index].expanded = !updated[index].expanded;
                                  setBudgetCategories(updated);
                                  localStorage.setItem('budgetCategories', JSON.stringify(updated));
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: COLORS.text,
                                  fontSize: '1rem',
                                  cursor: 'pointer',
                                  padding: '0',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {category.expanded ? '▼' : '▶'}
                              </button>
                            )}
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) => {
                                const updated = [...budgetCategories];
                                updated[index].name = e.target.value;
                                setBudgetCategories(updated);
                              }}
                              onBlur={() => {
                                localStorage.setItem('budgetCategories', JSON.stringify(budgetCategories));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: COLORS.text,
                                fontSize: '1.2rem',
                                fontWeight: '600',
                                fontFamily: 'inherit',
                                width: '200px'
                              }}
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`确定要删除"${category.name}"吗？${isParent ? '\n这将同时删除所有子分类。' : ''}`)) {
                                const updated = budgetCategories.filter((_: any, i: number) => i !== index);
                                setBudgetCategories(updated);
                                localStorage.setItem('budgetCategories', JSON.stringify(updated));
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: COLORS.danger,
                              fontSize: '1.2rem',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </div>

                        {!isParent && (
                          <>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <select
                                value={category.budgetType}
                                onChange={(e) => {
                                  const updated = [...budgetCategories];
                                  updated[index].budgetType = e.target.value;
                                  setBudgetCategories(updated);
                                  localStorage.setItem('budgetCategories', JSON.stringify(updated));
                                }}
                                style={{
                                  padding: '0.5rem',
                                  background: COLORS.card,
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  color: COLORS.text,
                                  fontSize: '0.9rem',
                                  fontFamily: 'inherit',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="weekly">周预算</option>
                                <option value="monthly">月预算</option>
                                <option value="yearly">年预算</option>
                              </select>

                              <input
                                type="number"
                                value={category.amount}
                                onFocus={(e) => {
                                  if (category.amount === 0) {
                                    // Only select on focus, not on click, to allow manual editing
                                    setTimeout(() => e.target.select(), 0);
                                  }
                                }}
                                onChange={(e) => {
                                  const updated = [...budgetCategories];
                                  const value = e.target.value;
                                  // Allow empty string during editing, will convert to 0 on blur
                                  updated[index].amount = value === '' ? 0 : parseFloat(value) || 0;
                                  setBudgetCategories(updated);
                                }}
                                onBlur={(e) => {
                                  const updated = [...budgetCategories];
                                  // Ensure valid number on blur
                                  updated[index].amount = parseFloat(e.target.value) || 0;
                                  setBudgetCategories(updated);
                                  localStorage.setItem('budgetCategories', JSON.stringify(updated));
                                }}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  background: COLORS.card,
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  color: COLORS.text,
                                  fontSize: '1rem',
                                  fontFamily: 'inherit'
                                }}
                              />
                              <span style={{ fontSize: '0.9rem', color: COLORS.textMuted }}>
                                /{category.budgetType === 'weekly' ? '周' : category.budgetType === 'monthly' ? '月' : '年'}
                              </span>
                            </div>
                          </>
                        )}

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: COLORS.success,
                          marginTop: '0.5rem'
                        }}>
                          <span>→ ${yearlyAmount.toLocaleString()} / 年</span>
                          <button
                            onClick={() => {
                              const updated = [...budgetCategories];
                              
                              if (isParent) {
                                // Already a parent, just add a new child
                                const newChild = {
                                  id: `${category.id}_child_${Date.now()}`,
                                  name: '新子分类',
                                  budgetType: 'weekly',
                                  amount: 0
                                };
                                updated[index].children.push(newChild);
                                // Expand to show the new child
                                updated[index].expanded = true;
                              } else {
                                // Convert to parent and add first child
                                updated[index] = {
                                  id: category.id,
                                  name: category.name,
                                  isParent: true,
                                  expanded: true,
                                  children: [
                                    {
                                      id: `${category.id}_original`,
                                      name: category.name.replace(/^[^\s]+\s/, ''), // Remove emoji
                                      budgetType: category.budgetType,
                                      amount: category.amount
                                    },
                                    {
                                      id: `${category.id}_child_${Date.now()}`,
                                      name: '新子分类',
                                      budgetType: 'weekly',
                                      amount: 0
                                    }
                                  ]
                                };
                              }
                              
                              setBudgetCategories(updated);
                              localStorage.setItem('budgetCategories', JSON.stringify(updated));
                            }}
                            style={{
                              padding: '0.4rem 0.8rem',
                              background: COLORS.card,
                              border: `1px solid ${COLORS.highlight}`,
                              borderRadius: '0.35rem',
                              color: COLORS.text,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              fontFamily: 'inherit'
                            }}
                          >
                            + 添加子分类
                          </button>
                        </div>

                        {/* Render children if parent and expanded */}
                        {isParent && category.expanded && category.children && category.children.length > 0 && (
                          <div style={{ 
                            marginTop: '1rem', 
                            paddingLeft: '2rem',
                            borderLeft: `2px solid ${COLORS.highlight}30`
                          }}>
                            {category.children.map((child: any, childIndex: number) => {
                              const childYearlyAmount = calculateYearlyAmount(child);
                              
                              return (
                                <div
                                  key={child.id}
                                  style={{
                                    background: COLORS.card,
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                    marginBottom: '0.75rem'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <input
                                      type="text"
                                      value={child.name}
                                      onChange={(e) => {
                                        const updated = [...budgetCategories];
                                        updated[index].children[childIndex].name = e.target.value;
                                        setBudgetCategories(updated);
                                      }}
                                      onBlur={() => {
                                        localStorage.setItem('budgetCategories', JSON.stringify(budgetCategories));
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: COLORS.text,
                                        fontSize: '1rem',
                                        fontWeight: '500',
                                        fontFamily: 'inherit',
                                        flex: 1
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        // If it's a "默认" child with 0 amount, delete without confirmation
                                        const shouldConfirm = !(child.name === '默认' && child.amount === 0);
                                        
                                        if (!shouldConfirm || confirm(`确定要删除"${child.name}"吗？`)) {
                                          const updated = [...budgetCategories];
                                          updated[index].children = updated[index].children.filter((_: any, i: number) => i !== childIndex);
                                          setBudgetCategories(updated);
                                          localStorage.setItem('budgetCategories', JSON.stringify(updated));
                                        }
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: COLORS.danger,
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      🗑️
                                    </button>
                                  </div>

                                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <select
                                      value={child.budgetType}
                                      onChange={(e) => {
                                        const updated = [...budgetCategories];
                                        updated[index].children[childIndex].budgetType = e.target.value;
                                        setBudgetCategories(updated);
                                        localStorage.setItem('budgetCategories', JSON.stringify(updated));
                                      }}
                                      style={{
                                        padding: '0.4rem',
                                        background: COLORS.accent,
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        color: COLORS.text,
                                        fontSize: '0.85rem',
                                        fontFamily: 'inherit',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <option value="weekly">周预算</option>
                                      <option value="monthly">月预算</option>
                                      <option value="yearly">年预算</option>
                                    </select>

                                    <input
                                      type="number"
                                      value={child.amount}
                                      onFocus={(e) => {
                                        if (child.amount === 0) {
                                          setTimeout(() => e.target.select(), 0);
                                        }
                                      }}
                                      onChange={(e) => {
                                        const updated = [...budgetCategories];
                                        const value = e.target.value;
                                        // Allow empty string during editing
                                        updated[index].children[childIndex].amount = value === '' ? 0 : parseFloat(value) || 0;
                                        setBudgetCategories(updated);
                                      }}
                                      onBlur={(e) => {
                                        const updated = [...budgetCategories];
                                        // Ensure valid number on blur
                                        updated[index].children[childIndex].amount = parseFloat(e.target.value) || 0;
                                        setBudgetCategories(updated);
                                        localStorage.setItem('budgetCategories', JSON.stringify(updated));
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: '0.4rem',
                                        background: COLORS.accent,
                                        border: 'none',
                                        borderRadius: '0.25rem',
                                        color: COLORS.text,
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit'
                                      }}
                                    />
                                    <span style={{ color: COLORS.textMuted, fontSize: '0.85rem', minWidth: '30px' }}>
                                      /{child.budgetType === 'weekly' ? '周' : child.budgetType === 'monthly' ? '月' : '年'}
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                                    → ${childYearlyAmount.toLocaleString()} / 年
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div>
            {/* Portfolio Summary - Moved to top */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>投资组合汇总</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: `2px solid ${COLORS.secondary}`
                }}>
                  <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>总资产</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>${totalPortfolio.toLocaleString()}</div>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: `2px solid ${COLORS.stocks}`
                }}>
                  <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>股票</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.stocks }}>
                    ${portfolio.stocks.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                    {currentAllocation.stocks.toFixed(1)}%
                  </div>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: `2px solid ${COLORS.bonds}`
                }}>
                  <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>债券</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.bonds }}>
                    ${portfolio.bonds.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                    {currentAllocation.bonds.toFixed(1)}%
                  </div>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: `2px solid ${COLORS.cash}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
                onClick={() => setShowCashCalculator(true)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                    现金 
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>🧮 点击计算</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.cash }}>
                    ${portfolio.cash.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                    {currentAllocation.cash.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Calculator Modal */}
            {showCashCalculator && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              onClick={() => setShowCashCalculator(false)}
              >
                <div style={{
                  background: COLORS.card,
                  borderRadius: '1rem',
                  padding: '2rem',
                  maxWidth: '500px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>🧮 现金账户计算器</h3>
                  
                  <div style={{
                    background: `${COLORS.success}20`,
                    border: `1px solid ${COLORS.success}`,
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: COLORS.text
                  }}>
                    💡 <strong>提示：</strong>修改账户金额会自动保存并实时更新现金卡片
                  </div>
                  
                  {cashAccounts.map((account: any, index: number) => (
                    <div key={index} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={account.name}
                        onChange={(e) => {
                          const newAccounts = [...cashAccounts];
                          newAccounts[index].name = e.target.value;
                          setCashAccounts(newAccounts);
                          // 实时保存到 localStorage
                          localStorage.setItem('cashAccounts', JSON.stringify(newAccounts));
                        }}
                        placeholder="账户名称"
                        style={{
                          flex: '1',
                          padding: '0.75rem',
                          background: COLORS.accent,
                          border: `1px solid ${COLORS.secondary}`,
                          borderRadius: '0.5rem',
                          color: COLORS.text,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                      />
                      <input
                        type="number"
                        value={account.amount}
                        onChange={(e) => {
                          const newAccounts = [...cashAccounts];
                          newAccounts[index].amount = e.target.value;
                          setCashAccounts(newAccounts);
                          // 实时保存到 localStorage
                          localStorage.setItem('cashAccounts', JSON.stringify(newAccounts));
                        }}
                        placeholder="金额"
                        step="0.01"
                        style={{
                          flex: '1',
                          padding: '0.75rem',
                          background: COLORS.accent,
                          border: `1px solid ${COLORS.secondary}`,
                          borderRadius: '0.5rem',
                          color: COLORS.text,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                      />
                      {cashAccounts.length > 1 && (
                        <button
                          onClick={() => {
                            const newAccounts = cashAccounts.filter((_: any, i: number) => i !== index);
                            setCashAccounts(newAccounts);
                            // 立即保存到 localStorage
                            localStorage.setItem('cashAccounts', JSON.stringify(newAccounts));
                          }}
                          style={{
                            background: 'none',
                            color: COLORS.highlight,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0.5rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const newAccounts = [...cashAccounts, { id: Date.now(), name: `账户${cashAccounts.length + 1}`, amount: '' }];
                      setCashAccounts(newAccounts);
                      // 立即保存到 localStorage
                      localStorage.setItem('cashAccounts', JSON.stringify(newAccounts));
                    }}
                    style={{
                      background: 'none',
                      color: COLORS.success,
                      border: `1px dashed ${COLORS.success}`,
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      width: '100%',
                      marginBottom: '1.5rem',
                      fontFamily: 'inherit'
                    }}
                  >
                    + 添加账户
                  </button>

                  <div style={{
                    background: COLORS.accent,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: `2px solid ${COLORS.cash}`
                  }}>
                    <div style={{ fontSize: '0.9rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>总计</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: COLORS.cash }}>
                      ${(() => {
                        const total = cashAccounts.reduce((sum: number, acc: any) => {
                          const amount = parseFloat(acc.amount) || 0;
                          console.log(`Account: ${acc.name}, Amount: ${acc.amount}, Parsed: ${amount}`);
                          return sum + amount;
                        }, 0);
                        console.log(`Total cash: ${total}`);
                        return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.5rem' }}>
                      {cashAccounts.length} 个账户
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => setShowCashCalculator(false)}
                      style={{
                        flex: 1,
                        background: 'none',
                        color: COLORS.textMuted,
                        border: `1px solid ${COLORS.textMuted}`,
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        fontFamily: 'inherit'
                      }}
                    >
                      取消
                    </button>
                    <button
                      onClick={async () => {
                        const totalCash = cashAccounts.reduce((sum: number, acc: any) => {
                          const amount = parseFloat(acc.amount) || 0;
                          console.log(`Saving - Account: ${acc.name}, Amount: ${acc.amount}, Parsed: ${amount}`);
                          return sum + amount;
                        }, 0);
                        
                          console.log(`Total to save: ${totalCash}, Accounts:`, cashAccounts);
                        
                        if (totalCash === 0) {
                          alert('请输入现金金额');
                          return;
                        }

                        try {
                          const cashInvestment = investments.find(inv => inv.type === 'cash');
                          console.log('Current cash investment:', cashInvestment);
                          console.log('Total cash to save:', totalCash);
                          console.log('Current investments state:', investments);

                          if (cashInvestment) {
                            console.log('Updating existing cash investment...');
                            const response = await api.put(`/investments/${cashInvestment.id}`, {
                              type: 'cash',
                              name: '现金账户总计',
                              symbol: null,
                              amount: totalCash,
                              price: null,
                              quantity: null,
                              account: null,
                              date: new Date().toISOString().split('T')[0]
                            });
                            console.log('Update response:', response.data);
                          } else {
                            console.log('Creating new cash investment...');
                            const response = await api.post('/investments', {
                              type: 'cash',
                              name: '现金账户总计',
                              symbol: null,
                              amount: totalCash,
                              price: null,
                              quantity: null,
                              account: null,
                              date: new Date().toISOString().split('T')[0]
                            });
                            console.log('Create response:', response.data);
                          }
                          
                          console.log('Reloading data...');
                          await loadData();
                          console.log('Data reloaded successfully');
                          console.log('Updated investments state:', investments);
                          
                          // 验证数据是否真的更新了
                          const updatedCashInvestment = investments.find(inv => inv.type === 'cash');
                          console.log('After reload - cash investment:', updatedCashInvestment);
                          
                          // 保存现金账户到 localStorage
                          localStorage.setItem('cashAccounts', JSON.stringify(cashAccounts));
                          
                          setShowCashCalculator(false);
                          alert(`现金总额已更新为 $${totalCash.toLocaleString()}！请刷新页面查看更新。`);
                        } catch (error: any) {
                          console.error('Error updating cash:', error);
                          console.error('Error details:', error.response?.data);
                          alert(`更新失败：${error.response?.data?.error || error.message}`);
                        }
                      }}
                      style={{
                        flex: 1,
                        background: COLORS.success,
                        color: COLORS.text,
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        fontFamily: 'inherit'
                      }}
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}

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

            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>当前 vs 目标配置</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={portfolioChartData}>
                  <XAxis dataKey="name" stroke={COLORS.textMuted} />
                  <YAxis stroke={COLORS.textMuted} />
                  <Tooltip 
                    contentStyle={{ background: COLORS.accent, border: 'none', borderRadius: '0.5rem' }}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="current" fill={COLORS.highlight} name="当前" />
                  <Bar dataKey="target" fill={COLORS.success} name="目标" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Investment List - Moved after chart */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              overflowX: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>投资明细</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {lastPriceUpdate && (
                    <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                      上次更新: {new Date(lastPriceUpdate).toLocaleString('zh-CN')}
                    </span>
                  )}
                  <button
                    onClick={refreshStockPrices}
                    disabled={refreshingPrices}
                    style={{
                      background: refreshingPrices ? COLORS.accent : COLORS.success,
                      color: COLORS.text,
                      border: 'none',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '0.5rem',
                      cursor: refreshingPrices ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      fontFamily: 'inherit',
                      opacity: refreshingPrices ? 0.6 : 1
                    }}
                  >
                    {refreshingPrices ? '更新中...' : '🔄 刷新价格'}
                  </button>
                  <button
                    onClick={() => setShowAddInvestment(true)}
                    style={{
                      background: COLORS.highlight,
                      color: COLORS.text,
                      border: 'none',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      fontFamily: 'inherit'
                    }}
                  >
                    + 添加投资
                  </button>
                </div>
              </div>

              {/* Add Investment Form */}
              {showAddInvestment && (
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: `1px solid ${COLORS.secondary}`
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>添加新投资</h4>
                  <form onSubmit={handleAddInvestment} style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>类型</label>
                        <select
                          value={newInvestment.type}
                          onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          <option value="stocks">股票</option>
                          <option value="bonds">债券</option>
                          <option value="cash">现金</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>代码</label>
                        <input
                          type="text"
                          value={newInvestment.symbol}
                          onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value.toUpperCase() })}
                          required
                          placeholder="如：AAPL"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>股数</label>
                        <input
                          type="number"
                          value={newInvestment.quantity}
                          onChange={(e) => setNewInvestment({ ...newInvestment, quantity: e.target.value })}
                          required
                          step="0.01"
                          placeholder="持有股数"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>当前价格</label>
                        <input
                          type="number"
                          value={newInvestment.price}
                          onChange={(e) => setNewInvestment({ ...newInvestment, price: e.target.value })}
                          required
                          step="0.01"
                          placeholder="每股价格"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                          账户 <span style={{ color: COLORS.textMuted, fontSize: '0.8rem' }}>(选填)</span>
                        </label>
                        <input
                          type="text"
                          value={newInvestment.account}
                          onChange={(e) => setNewInvestment({ ...newInvestment, account: e.target.value })}
                          placeholder="如：Fidelity"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>日期</label>
                        <input
                          type="date"
                          value={newInvestment.date}
                          onChange={(e) => setNewInvestment({ ...newInvestment, date: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.secondary}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowAddInvestment(false)}
                        style={{
                          background: 'none',
                          color: COLORS.textMuted,
                          border: `1px solid ${COLORS.textMuted}`,
                          padding: '0.6rem 1.2rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          fontFamily: 'inherit'
                        }}
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        style={{
                          background: COLORS.success,
                          color: COLORS.text,
                          border: 'none',
                          padding: '0.6rem 1.2rem',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          fontFamily: 'inherit'
                        }}
                      >
                        添加
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {investments.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COLORS.accent}` }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '110px' }}>日期</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '80px' }}>类型</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '90px' }}>代码</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '120px' }}>账户</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '90px' }}>股数</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '100px' }}>当前价格</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '120px' }}>总金额</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.9rem', minWidth: '150px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((investment) => (
                        <tr key={investment.id} style={{ borderBottom: `1px solid ${COLORS.accent}` }}>
                          {editingInvestmentId === investment.id ? (
                            <>
                              <td style={{ padding: '1rem' }}>
                                <input
                                  type="date"
                                  value={editingInvestment.date}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, date: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <select
                                  value={editingInvestment.type}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, type: e.target.value })}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  <option value="stocks">股票</option>
                                  <option value="bonds">债券</option>
                                  <option value="cash">现金</option>
                                </select>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <input
                                  type="text"
                                  value={editingInvestment.symbol}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, symbol: e.target.value.toUpperCase() })}
                                  placeholder="代码"
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem', minWidth: '120px' }}>
                                <input
                                  type="text"
                                  value={editingInvestment.account || ''}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, account: e.target.value })}
                                  placeholder="账户名"
                                  style={{
                                    width: '100%',
                                    minWidth: '100px',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    fontSize: '0.9rem',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  value={editingInvestment.quantity}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, quantity: e.target.value })}
                                  step="0.01"
                                  placeholder="股数"
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    textAlign: 'right',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  value={editingInvestment.price}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, price: e.target.value })}
                                  step="0.01"
                                  placeholder="价格"
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    textAlign: 'right',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: '700' }}>
                                ${((parseFloat(editingInvestment.quantity) || 0) * (parseFloat(editingInvestment.price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleSaveEditInvestment(investment.id)}
                                  style={{
                                    background: COLORS.success,
                                    color: COLORS.text,
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.3rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    marginRight: '0.5rem',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  保存
                                </button>
                                <button
                                  onClick={handleCancelEditInvestment}
                                  style={{
                                    background: 'none',
                                    color: COLORS.textMuted,
                                    border: `1px solid ${COLORS.textMuted}`,
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.3rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  取消
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{investment.date}</td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{getTypeLabel(investment.type)}</td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>{investment.symbol || '-'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                                {investment.account || '-'}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right' }}>
                                {(investment.quantity || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right' }}>
                                ${(investment.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: '700' }}>
                                ${((investment.quantity || 0) * (investment.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleStartEditInvestment(investment)}
                                  style={{
                                    background: 'none',
                                    color: COLORS.success,
                                    border: `1px solid ${COLORS.success}`,
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.3rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    marginRight: '0.5rem',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => handleDeleteInvestment(investment.id)}
                                  style={{
                                    background: 'none',
                                    color: COLORS.highlight,
                                    border: `1px solid ${COLORS.highlight}`,
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.3rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'inherit'
                                  }}
                                >
                                  删除
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {investments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: COLORS.textMuted }}>
                  暂无投资记录，点击"+ 添加投资"开始记录
                </div>
              )}
            </div>
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
                            {suggestion.action === 'Reduce' ? '−' : '+'} ${suggestion.amount.toLocaleString()}
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

        {/* Add Expense Modal */}
        {showAddExpense && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}>
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Header */}
              <div style={{
                padding: '2rem',
                borderBottom: `1px solid ${COLORS.accent}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>添加支出</h2>
                <button
                  onClick={() => setShowAddExpense(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.text,
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <div style={{ padding: '2rem' }}>
                {/* Category Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                    支出类别
                  </label>
                  {budgetCategories && budgetCategories.length > 0 ? (
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: COLORS.text,
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">选择类别...</option>
                      
                      {/* Render all categories in order, parent categories can be selected */}
                      {budgetCategories.flatMap((cat: any) => {
                        if (cat.isParent && cat.children) {
                          // Parent category with children
                          return [
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>,
                            ...cat.children.map((child: any) => (
                              <option key={child.id} value={child.id}>
                                &nbsp;&nbsp;&nbsp;&nbsp;↳ {child.name}
                              </option>
                            ))
                          ];
                        } else {
                          // Standalone category
                          return (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          );
                        }
                      })}
                    </select>
                  ) : (
                    <div style={{
                      padding: '1rem',
                      background: COLORS.accent,
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      color: COLORS.textMuted
                    }}>
                      <p style={{ marginBottom: '0.5rem' }}>请先在"预算管理"中设置分类</p>
                      <button
                        onClick={() => {
                          setShowAddExpense(false);
                          setActiveTab('budget');
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: COLORS.highlight,
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: COLORS.text,
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        去设置
                      </button>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                    金额 (USD)
                  </label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0.00"
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

                {/* Date */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                    日期
                  </label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
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

                {/* Description */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>
                    备注 (可选)
                  </label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="例如：午餐、地铁卡充值..."
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

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => setShowAddExpense(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: COLORS.accent,
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: COLORS.text,
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={addExpense}
                    disabled={loading || !newExpense.category || !newExpense.amount || !newExpense.date}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: !newExpense.category || !newExpense.amount || !newExpense.date
                        ? COLORS.accent
                        : `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`,
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: COLORS.text,
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: !newExpense.category || !newExpense.amount || !newExpense.date ? 'not-allowed' : 'pointer',
                      opacity: !newExpense.category || !newExpense.amount || !newExpense.date ? 0.5 : 1,
                      fontFamily: 'inherit'
                    }}
                  >
                    {loading ? '添加中...' : '添加支出'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIRE Optimization Modal */}
        {showFireOptimization && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}>
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Header */}
              <div style={{
                padding: '2rem',
                borderBottom: `1px solid ${COLORS.accent}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: COLORS.card,
                zIndex: 1
              }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>🎛️ 优化你的 FIRE 目标</h2>
                <button
                  onClick={() => setShowFireOptimization(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.textMuted,
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '2rem' }}>
                {/* Current Baseline */}
                <div style={{
                  background: `${COLORS.accent}80`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>📊 基准数据（过去 12 个月）</h3>
                  <div style={{ fontSize: '0.95rem', color: COLORS.textMuted }}>
                    年支出：<strong style={{ color: COLORS.text, fontSize: '1.2rem' }}>${annualExpenses.toLocaleString()}</strong>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginTop: '1rem'
                  }}>
                    {(() => {
                      const getLast12MonthsByGroup = () => {
                        const now = new Date();
                        const byGroup = { essential: 0, workRelated: 0, discretionary: 0 };
                        
                        for (let i = 0; i < 12; i++) {
                          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          const monthData = monthlyAggregation[monthKey];
                          
                          if (monthData && monthData.byGroup) {
                            byGroup.essential += monthData.byGroup.essential || 0;
                            byGroup.workRelated += monthData.byGroup.workRelated || 0;
                            byGroup.discretionary += monthData.byGroup.discretionary || 0;
                          }
                        }
                        
                        return byGroup;
                      };
                      
                      const expensesByGroup = getLast12MonthsByGroup();
                      
                      return (
                        <>
                          <div style={{
                            background: COLORS.card,
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            borderLeft: `4px solid ${COLORS.highlight}`
                          }}>
                            <div style={{ fontSize: '0.8rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                              🏠 必需支出
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.text }}>
                              ${expensesByGroup.essential.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                              {annualExpenses > 0 ? ((expensesByGroup.essential / annualExpenses * 100).toFixed(0)) : 0}%
                            </div>
                          </div>

                          <div style={{
                            background: COLORS.card,
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            borderLeft: `4px solid ${COLORS.bonds}`
                          }}>
                            <div style={{ fontSize: '0.8rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                              🚗 工作相关
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.text }}>
                              ${expensesByGroup.workRelated.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                              {annualExpenses > 0 ? ((expensesByGroup.workRelated / annualExpenses * 100).toFixed(0)) : 0}%
                            </div>
                          </div>

                          <div style={{
                            background: COLORS.card,
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            borderLeft: `4px solid ${COLORS.warning}`
                          }}>
                            <div style={{ fontSize: '0.8rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
                              ✈️ 可选支出
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.text }}>
                              ${expensesByGroup.discretionary.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                              {annualExpenses > 0 ? ((expensesByGroup.discretionary / annualExpenses * 100).toFixed(0)) : 0}%
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Adjustment Controls */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>📍 调整退休后的支出预期：</h3>
                  
                  {(() => {
                    const getLast12MonthsByGroup = () => {
                      const now = new Date();
                      const byGroup = { essential: 0, workRelated: 0, discretionary: 0 };
                      
                      for (let i = 0; i < 12; i++) {
                        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const monthData = monthlyAggregation[monthKey];
                        
                        if (monthData && monthData.byGroup) {
                          byGroup.essential += monthData.byGroup.essential || 0;
                          byGroup.workRelated += monthData.byGroup.workRelated || 0;
                          byGroup.discretionary += monthData.byGroup.discretionary || 0;
                        }
                      }
                      
                      return byGroup;
                    };
                    
                    const currentExpenses = getLast12MonthsByGroup();
                    
                    const categories = [
                      {
                        key: 'essential',
                        label: '🏠 必需支出（住房、水电、食品、医疗等）',
                        current: currentExpenses.essential,
                        examples: '如全球旅居可能降低住房成本'
                      },
                      {
                        key: 'workRelated',
                        label: '🚗 工作相关（通勤、职业装、工作餐等）',
                        current: currentExpenses.workRelated,
                        examples: '退休后通常完全消失'
                      },
                      {
                        key: 'discretionary',
                        label: '✈️ 可选支出（旅行、娱乐、外出就餐等）',
                        current: currentExpenses.discretionary,
                        examples: '退休后可能增加旅行和爱好支出'
                      }
                    ];
                    
                    return categories.map(cat => {
                      const adj = retirementExpenseAdjustments[cat.key as keyof typeof retirementExpenseAdjustments];
                      const hasCurrentExpense = cat.current > 0;
                      
                      // Calculate adjusted amount based on method chosen
                      let adjustedAmount = 0;
                      
                      if (cat.key === 'essential' && adj.useCityPlanner && cityPlan.length > 0) {
                        // Use city planner total
                        adjustedAmount = cityPlan.reduce((sum: number, city: any) => sum + (city.monthlyCost * city.months), 0);
                      } else if (hasCurrentExpense) {
                        // Use percentage adjustment
                        adjustedAmount = cat.current * (1 + adj.adjustmentPct / 100);
                      } else {
                        // Use custom amount input
                        adjustedAmount = adj.customAmount || 0;
                      }
                      
                      return (
                        <div key={cat.key} style={{
                          background: COLORS.accent,
                          borderRadius: '0.75rem',
                          padding: '1.5rem',
                          marginBottom: '1.5rem',
                          border: adj.enabled ? `2px solid ${COLORS.success}` : `1px solid ${COLORS.accent}`
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '1rem'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                {cat.label}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: hasCurrentExpense ? COLORS.textMuted : COLORS.warning }}>
                                当前：${cat.current.toLocaleString()}/年
                                {!hasCurrentExpense && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>（暂无记录）</span>}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: COLORS.textMuted, marginTop: '0.25rem', fontStyle: 'italic' }}>
                                {cat.examples}
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: '1rem' }}>
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              marginBottom: '1rem'
                            }}>
                              <input
                                type="checkbox"
                                checked={adj.enabled}
                                onChange={(e) => {
                                  const newAdj = {
                                    ...retirementExpenseAdjustments,
                                    [cat.key]: { ...adj, enabled: e.target.checked }
                                  };
                                  setRetirementExpenseAdjustments(newAdj);
                                  localStorage.setItem('retirementExpenseAdjustments', JSON.stringify(newAdj));
                                }}
                                style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '0.9rem' }}>调整此项支出</span>
                            </label>

                            {adj.enabled && (
                              <div>
                                {/* City Planner option for essential expenses */}
                                {cat.key === 'essential' && (
                                  <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    marginBottom: '1rem',
                                    background: adj.useCityPlanner ? `${COLORS.success}15` : 'transparent',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: adj.useCityPlanner ? `1px solid ${COLORS.success}40` : '1px solid transparent'
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={adj.useCityPlanner || false}
                                      onChange={(e) => {
                                        const newAdj = {
                                          ...retirementExpenseAdjustments,
                                          [cat.key]: { ...adj, useCityPlanner: e.target.checked }
                                        };
                                        setRetirementExpenseAdjustments(newAdj);
                                        localStorage.setItem('retirementExpenseAdjustments', JSON.stringify(newAdj));
                                      }}
                                      style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', flex: 1 }}>🌍 使用城市规划器（全球旅居）</span>
                                    {adj.useCityPlanner && cityPlan.length > 0 && (
                                      <span style={{ fontSize: '0.85rem', color: COLORS.success, fontWeight: '600' }}>
                                        {cityPlan.length} 个城市
                                      </span>
                                    )}
                                  </label>
                                )}

                                {cat.key === 'essential' && adj.useCityPlanner ? (
                                  // City Planner UI
                                  <div style={{
                                    background: COLORS.card,
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                    marginTop: '1rem'
                                  }}>
                                    <button
                                      onClick={() => setShowCityPlanner(true)}
                                      style={{
                                        width: '100%',
                                        background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
                                        border: 'none',
                                        color: 'white',
                                        padding: '0.875rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        marginBottom: cityPlan.length > 0 ? '1rem' : '0'
                                      }}
                                    >
                                      {cityPlan.length > 0 ? '✏️ 编辑城市规划' : '+ 添加城市规划'}
                                    </button>

                                    {cityPlan.length > 0 && (
                                      <div>
                                        {cityPlan.map((city: any, idx: number) => (
                                          <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            background: COLORS.accent,
                                            borderRadius: '0.5rem',
                                            marginBottom: '0.5rem'
                                          }}>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                                {city.city}
                                              </div>
                                              <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                                {city.months} 个月 × ${city.monthlyCost.toLocaleString()}/月
                                              </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                              <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                                                {city.level === 'budget' ? '节俭' : city.level === 'comfortable' ? '舒适' : '富足'}
                                              </div>
                                              <div style={{ fontSize: '1rem', fontWeight: '700', color: COLORS.text }}>
                                                ${(city.monthlyCost * city.months).toLocaleString()}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                        <div style={{
                                          padding: '0.75rem',
                                          background: `${COLORS.success}20`,
                                          borderRadius: '0.5rem',
                                          marginTop: '0.75rem',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}>
                                          <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>年度总计：</span>
                                          <span style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.success }}>
                                            ${adjustedAmount.toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : hasCurrentExpense ? (
                                  // Percentage-based adjustment for categories with data
                                  <>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '1rem',
                                      marginBottom: '0.75rem'
                                    }}>
                                      <span style={{ fontSize: '0.9rem', minWidth: '80px' }}>调整幅度：</span>
                                      <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={adj.adjustmentPct}
                                        onChange={(e) => {
                                          const newAdj = {
                                            ...retirementExpenseAdjustments,
                                            [cat.key]: { ...adj, adjustmentPct: parseInt(e.target.value) }
                                          };
                                          setRetirementExpenseAdjustments(newAdj);
                                          localStorage.setItem('retirementExpenseAdjustments', JSON.stringify(newAdj));
                                        }}
                                        style={{ flex: 1 }}
                                      />
                                      <span style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '700',
                                        minWidth: '60px',
                                        textAlign: 'right',
                                        color: adj.adjustmentPct < 0 ? COLORS.success : adj.adjustmentPct > 0 ? COLORS.highlight : COLORS.text
                                      }}>
                                        {adj.adjustmentPct > 0 ? '+' : ''}{adj.adjustmentPct}%
                                      </span>
                                    </div>

                                    <div style={{
                                      background: COLORS.card,
                                      padding: '0.75rem',
                                      borderRadius: '0.5rem',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>退休后预估：</span>
                                      <span style={{
                                        fontSize: '1.2rem',
                                        fontWeight: '700',
                                        color: adjustedAmount < cat.current ? COLORS.success : adjustedAmount > cat.current ? COLORS.warning : COLORS.text
                                      }}>
                                        ${adjustedAmount.toLocaleString()}
                                        <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', color: COLORS.textMuted }}>
                                          ({adjustedAmount - cat.current > 0 ? '+' : ''}
                                          ${(adjustedAmount - cat.current).toLocaleString()})
                                        </span>
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  // Direct amount input for categories without data
                                  <>
                                    <div style={{
                                      background: `${COLORS.warning}15`,
                                      border: `1px solid ${COLORS.warning}40`,
                                      borderRadius: '0.5rem',
                                      padding: '0.75rem',
                                      marginBottom: '0.75rem',
                                      fontSize: '0.85rem',
                                      color: COLORS.textMuted
                                    }}>
                                      💡 暂无历史记录，请直接输入退休后的预期年支出
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '1rem',
                                      marginBottom: '0.75rem'
                                    }}>
                                      <span style={{ fontSize: '0.9rem', minWidth: '80px' }}>预期支出：</span>
                                      <div style={{ flex: 1, position: 'relative' }}>
                                        <span style={{
                                          position: 'absolute',
                                          left: '0.75rem',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          color: COLORS.textMuted,
                                          fontSize: '1rem'
                                        }}>
                                          $
                                        </span>
                                        <input
                                          type="number"
                                          placeholder="0"
                                          value={adj.customAmount || ''}
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value) || 0;
                                            const newAdj = {
                                              ...retirementExpenseAdjustments,
                                              [cat.key]: { ...adj, customAmount: value }
                                            };
                                            setRetirementExpenseAdjustments(newAdj);
                                            localStorage.setItem('retirementExpenseAdjustments', JSON.stringify(newAdj));
                                          }}
                                          style={{
                                            width: '100%',
                                            padding: '0.75rem 0.75rem 0.75rem 2rem',
                                            background: COLORS.card,
                                            border: `1px solid ${COLORS.accent}`,
                                            borderRadius: '0.5rem',
                                            color: COLORS.text,
                                            fontSize: '1rem',
                                            fontFamily: 'inherit'
                                          }}
                                        />
                                      </div>
                                      <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>/年</span>
                                    </div>

                                    {adjustedAmount > 0 && (
                                      <div style={{
                                        background: COLORS.card,
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.85rem',
                                        color: COLORS.success
                                      }}>
                                        ✓ 已设置退休后年支出：${adjustedAmount.toLocaleString()}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Summary */}
                {(() => {
                  const getLast12MonthsByGroup = () => {
                    const now = new Date();
                    const byGroup = { essential: 0, workRelated: 0, discretionary: 0 };
                    
                    for (let i = 0; i < 12; i++) {
                      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      const monthData = monthlyAggregation[monthKey];
                      
                      if (monthData && monthData.byGroup) {
                        byGroup.essential += monthData.byGroup.essential || 0;
                        byGroup.workRelated += monthData.byGroup.workRelated || 0;
                        byGroup.discretionary += monthData.byGroup.discretionary || 0;
                      }
                    }
                    
                    return byGroup;
                  };
                  
                  const currentExpenses = getLast12MonthsByGroup();
                  let optimizedAnnualExpenses = 0;
                  
                  Object.keys(currentExpenses).forEach(key => {
                    const current = currentExpenses[key as keyof typeof currentExpenses];
                    const adj = retirementExpenseAdjustments[key as keyof typeof retirementExpenseAdjustments];
                    if (adj.enabled) {
                      // For essential expenses with city planner enabled, use city plan total + travel costs
                      if (key === 'essential' && adj.useCityPlanner && cityPlan.length > 0) {
                        const cityCosts = cityPlan.reduce((sum: number, city: any) => sum + (city.monthlyCost * city.months), 0);
                        const travelCosts = annualTravelCosts.flights + annualTravelCosts.visas + annualTravelCosts.insurance;
                        optimizedAnnualExpenses += cityCosts + travelCosts;
                      } else if (current > 0) {
                        // Use percentage adjustment
                        optimizedAnnualExpenses += current * (1 + adj.adjustmentPct / 100);
                      } else {
                        // Use custom amount
                        optimizedAnnualExpenses += (adj.customAmount || 0);
                      }
                    } else {
                      optimizedAnnualExpenses += current;
                    }
                  });
                  
                  const optimizedFireNumber = optimizedAnnualExpenses * fireMultiplier;
                  const savings = fireNumber - optimizedFireNumber;
                  
                  return (
                    <div style={{
                      background: `linear-gradient(135deg, ${COLORS.success}20 0%, ${COLORS.highlight}20 100%)`,
                      border: `2px solid ${COLORS.success}`,
                      borderRadius: '1rem',
                      padding: '2rem',
                      marginTop: '2rem'
                    }}>
                      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.2rem' }}>💡 优化后的结果：</h3>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '1.5rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                            退休年支出
                          </div>
                          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: COLORS.text }}>
                            ${optimizedAnnualExpenses.toLocaleString()}
                          </div>
                          {optimizedAnnualExpenses !== annualExpenses && (
                            <div style={{ fontSize: '0.8rem', color: savings > 0 ? COLORS.success : COLORS.warning, marginTop: '0.25rem' }}>
                              {savings > 0 ? '⬇️' : '⬆️'} {((optimizedAnnualExpenses - annualExpenses) / annualExpenses * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '0.5rem' }}>
                            新的 FIRE 目标
                          </div>
                          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: COLORS.warning }}>
                            ${optimizedFireNumber.toLocaleString()}
                          </div>
                          {savings !== 0 && (
                            <div style={{ fontSize: '0.8rem', color: savings > 0 ? COLORS.success : COLORS.warning, marginTop: '0.25rem' }}>
                              {savings > 0 ? '节省' : '增加'} ${Math.abs(savings).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {savings > 0 && (
                        <div style={{
                          background: `${COLORS.success}20`,
                          border: `1px solid ${COLORS.success}`,
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          fontSize: '0.9rem',
                          color: COLORS.success
                        }}>
                          🎉 优化后，你的 FIRE 目标降低了 ${savings.toLocaleString()}！这意味着你可以更早实现财务自由。
                        </div>
                      )}
                      
                      {savings < 0 && (
                        <div style={{
                          background: `${COLORS.warning}20`,
                          border: `1px solid ${COLORS.warning}`,
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          fontSize: '0.9rem',
                          color: COLORS.warning
                        }}>
                          ⚠️ 优化后，你的 FIRE 目标增加了 ${Math.abs(savings).toLocaleString()}。这反映了你对退休生活质量的更高期望。
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '2rem',
                  paddingTop: '2rem',
                  borderTop: `1px solid ${COLORS.accent}`
                }}>
                  <button
                    onClick={() => {
                      // Reset to defaults
                      const defaultAdj = {
                        essential: { enabled: false, adjustmentPct: 0, customAmount: 0, useCityPlanner: false },
                        workRelated: { enabled: true, adjustmentPct: -100, customAmount: 0, useCityPlanner: false },
                        discretionary: { enabled: false, adjustmentPct: 0, customAmount: 0, useCityPlanner: false }
                      };
                      setRetirementExpenseAdjustments(defaultAdj);
                      localStorage.setItem('retirementExpenseAdjustments', JSON.stringify(defaultAdj));
                      setCityPlan([]);
                      localStorage.setItem('cityPlan', JSON.stringify([]));
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: `1px solid ${COLORS.textMuted}`,
                      color: COLORS.textMuted,
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    重置为默认
                  </button>
                  <button
                    onClick={() => setShowFireOptimization(false)}
                    style={{
                      flex: 1,
                      background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
                      border: 'none',
                      color: 'white',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    保存设置
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* City Planner Modal */}
        {showCityPlanner && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '2rem'
          }}>
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              maxWidth: '1000px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Header */}
              <div style={{
                padding: '2rem',
                borderBottom: `1px solid ${COLORS.accent}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: COLORS.card,
                zIndex: 1
              }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>🌍 城市规划器 - 设计你的全球旅居方案</h2>
                <button
                  onClick={() => setShowCityPlanner(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.textMuted,
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '2rem' }}>
                {/* Month Usage Summary */}
                {(() => {
                  const totalMonths = cityPlan.reduce((sum: number, city: any) => sum + city.months, 0);
                  const remainingMonths = 12 - totalMonths;
                  const isOverLimit = totalMonths > 12;
                  
                  return (
                    <div style={{
                      background: isOverLimit ? `${COLORS.highlight}20` : totalMonths === 12 ? `${COLORS.success}20` : `${COLORS.warning}20`,
                      border: `2px solid ${isOverLimit ? COLORS.highlight : totalMonths === 12 ? COLORS.success : COLORS.warning}`,
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      marginBottom: '2rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                            {isOverLimit ? '⚠️ 月数超限' : totalMonths === 12 ? '✓ 已规划全年' : '📅 月份规划'}
                          </h3>
                          <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                            {isOverLimit ? '总月数不能超过 12 个月' : totalMonths === 12 ? '完美！已规划完整一年' : '可以继续添加城市'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '2rem', fontWeight: '700', color: isOverLimit ? COLORS.highlight : COLORS.text }}>
                            {totalMonths}/12
                          </div>
                          <div style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                            剩余 {remainingMonths} 个月
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{
                        background: COLORS.card,
                        borderRadius: '0.5rem',
                        height: '1.5rem',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          background: isOverLimit 
                            ? `linear-gradient(90deg, ${COLORS.highlight} 0%, ${COLORS.highlight}80 100%)`
                            : totalMonths === 12
                            ? `linear-gradient(90deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`
                            : `linear-gradient(90deg, ${COLORS.warning} 0%, ${COLORS.success} 100%)`,
                          height: '100%',
                          width: `${Math.min((totalMonths / 12) * 100, 100)}%`,
                          transition: 'width 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: 'white'
                        }}>
                          {totalMonths > 0 && `${totalMonths} 个月`}
                        </div>
                      </div>
                      
                      {isOverLimit && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          background: `${COLORS.highlight}30`,
                          borderRadius: '0.5rem',
                          fontSize: '0.85rem',
                          color: COLORS.text
                        }}>
                          💡 请删除或减少某些城市的月数，使总月数不超过 12 个月
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Current Plan Summary */}
                {cityPlan.length > 0 && (
                  <div style={{
                    background: `${COLORS.success}15`,
                    border: `1px solid ${COLORS.success}40`,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>📋 当前规划 - 可直接编辑</h3>
                    <div style={{ marginBottom: '1rem' }}>
                      {cityPlan.map((city: any, idx: number) => (
                        <div key={idx} style={{
                          padding: '1rem',
                          background: COLORS.card,
                          borderRadius: '0.5rem',
                          marginBottom: '0.75rem'
                        }}>
                          {/* City Name Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{city.city}</div>
                            <button
                              onClick={() => {
                                const newPlan = cityPlan.filter((_: any, i: number) => i !== idx);
                                setCityPlan(newPlan);
                                localStorage.setItem('cityPlan', JSON.stringify(newPlan));
                              }}
                              style={{
                                background: 'transparent',
                                border: `1px solid ${COLORS.highlight}`,
                                color: COLORS.highlight,
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontFamily: 'inherit'
                              }}
                            >
                              删除
                            </button>
                          </div>

                          {/* Editable Fields */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '0.75rem'
                          }}>
                            {/* Month Cost Input */}
                            <div>
                              <label style={{ fontSize: '0.8rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.5rem' }}>
                                月成本：
                              </label>
                              <div style={{ position: 'relative' }}>
                                <span style={{
                                  position: 'absolute',
                                  left: '0.75rem',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: COLORS.textMuted,
                                  fontSize: '0.9rem'
                                }}>
                                  $
                                </span>
                                <input
                                  type="number"
                                  value={city.monthlyCost}
                                  onChange={(e) => {
                                    const newPlan = [...cityPlan];
                                    newPlan[idx].monthlyCost = parseInt(e.target.value) || 0;
                                    setCityPlan(newPlan);
                                    localStorage.setItem('cityPlan', JSON.stringify(newPlan));
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0.75rem 2rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.accent}`,
                                    borderRadius: '0.5rem',
                                    color: COLORS.text,
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    fontWeight: '600'
                                  }}
                                />
                              </div>
                              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                参考值: {city.level === 'budget' ? '节俭' : city.level === 'comfortable' ? '舒适' : '富足'}
                              </div>
                            </div>

                            {/* Months Input */}
                            <div>
                              <label style={{ fontSize: '0.8rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.5rem' }}>
                                居住月数：
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="12"
                                value={city.months}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  const newPlan = [...cityPlan];
                                  const currentTotal = cityPlan.reduce((sum: number, c: any, i: number) => 
                                    i === idx ? sum : sum + c.months, 0);
                                  const maxAllowed = Math.min(12, 12 - currentTotal);
                                  newPlan[idx].months = Math.min(maxAllowed, Math.max(1, value));
                                  
                                  if (value > maxAllowed) {
                                    alert(`最多只能设置 ${maxAllowed} 个月（总月数不能超过 12）`);
                                  }
                                  
                                  setCityPlan(newPlan);
                                  localStorage.setItem('cityPlan', JSON.stringify(newPlan));
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem',
                                  background: COLORS.accent,
                                  border: `1px solid ${COLORS.accent}`,
                                  borderRadius: '0.5rem',
                                  color: COLORS.text,
                                  fontSize: '1rem',
                                  fontFamily: 'inherit',
                                  fontWeight: '600'
                                }}
                              />
                              <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                                1-12 个月
                              </div>
                            </div>
                          </div>

                          {/* Total */}
                          <div style={{
                            padding: '0.75rem',
                            background: `${COLORS.success}20`,
                            borderRadius: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                              {city.months} 个月 × ${city.monthlyCost.toLocaleString()}/月
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: COLORS.success }}>
                              = ${(city.monthlyCost * city.months).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      padding: '1rem',
                      background: COLORS.card,
                      borderRadius: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: `2px solid ${COLORS.success}`
                    }}>
                      <span style={{ fontSize: '1rem', fontWeight: '600' }}>城市生活成本：</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.success }}>
                        ${cityPlan.reduce((sum: number, city: any) => sum + (city.monthlyCost * city.months), 0).toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Annual Travel Costs */}
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.5rem',
                      background: `${COLORS.warning}15`,
                      border: `2px dashed ${COLORS.warning}40`,
                      borderRadius: '0.75rem'
                    }}>
                      <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>✈️</span>
                        <span>年度额外成本</span>
                        <span style={{ fontSize: '0.8rem', color: COLORS.textMuted, fontWeight: 'normal' }}>（可选）</span>
                      </h4>
                      <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '1.5rem', lineHeight: '1.5' }}>
                        城市生活成本不包含以下项目，请根据您的旅居计划填写：
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Flights */}
                        <div style={{
                          background: COLORS.card,
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' }}>🛫 城市间交通（机票/火车）</div>
                            <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                              {cityPlan.length > 1 ? `您规划了 ${cityPlan.length} 个城市，需要 ${cityPlan.length - 1}+ 次城市间交通` : '建议预留往返交通费用'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>$</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={annualTravelCosts.flights || ''}
                              onChange={(e) => {
                                const newCosts = { ...annualTravelCosts, flights: parseInt(e.target.value) || 0 };
                                setAnnualTravelCosts(newCosts);
                                localStorage.setItem('annualTravelCosts', JSON.stringify(newCosts));
                              }}
                              style={{
                                width: '120px',
                                padding: '0.5rem',
                                background: COLORS.accent,
                                border: `1px solid ${COLORS.warning}40`,
                                borderRadius: '0.5rem',
                                color: COLORS.text,
                                fontSize: '0.9rem',
                                fontFamily: 'inherit',
                                textAlign: 'right'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Visas */}
                        <div style={{
                          background: COLORS.card,
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' }}>📋 签证费用</div>
                            <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                              包含签证申请费、照片、文件翻译等
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>$</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={annualTravelCosts.visas || ''}
                              onChange={(e) => {
                                const newCosts = { ...annualTravelCosts, visas: parseInt(e.target.value) || 0 };
                                setAnnualTravelCosts(newCosts);
                                localStorage.setItem('annualTravelCosts', JSON.stringify(newCosts));
                              }}
                              style={{
                                width: '120px',
                                padding: '0.5rem',
                                background: COLORS.accent,
                                border: `1px solid ${COLORS.warning}40`,
                                borderRadius: '0.5rem',
                                color: COLORS.text,
                                fontSize: '0.9rem',
                                fontFamily: 'inherit',
                                textAlign: 'right'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Insurance */}
                        <div style={{
                          background: COLORS.card,
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' }}>🛡️ 旅行保险</div>
                            <div style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                              医疗、意外、财产等旅行保险费用
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>$</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={annualTravelCosts.insurance || ''}
                              onChange={(e) => {
                                const newCosts = { ...annualTravelCosts, insurance: parseInt(e.target.value) || 0 };
                                setAnnualTravelCosts(newCosts);
                                localStorage.setItem('annualTravelCosts', JSON.stringify(newCosts));
                              }}
                              style={{
                                width: '120px',
                                padding: '0.5rem',
                                background: COLORS.accent,
                                border: `1px solid ${COLORS.warning}40`,
                                borderRadius: '0.5rem',
                                color: COLORS.text,
                                fontSize: '0.9rem',
                                fontFamily: 'inherit',
                                textAlign: 'right'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Subtotal */}
                        {(annualTravelCosts.flights + annualTravelCosts.visas + annualTravelCosts.insurance > 0) && (
                          <div style={{
                            padding: '0.75rem 1rem',
                            background: `${COLORS.warning}30`,
                            borderRadius: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: `2px solid ${COLORS.warning}`
                          }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>额外成本小计：</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.warning }}>
                              ${(annualTravelCosts.flights + annualTravelCosts.visas + annualTravelCosts.insurance).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Grand Total */}
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.5rem',
                      background: `linear-gradient(135deg, ${COLORS.success}20 0%, ${COLORS.highlight}20 100%)`,
                      border: `3px solid ${COLORS.success}`,
                      borderRadius: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>🎯 年度总计</div>
                        <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>
                          城市生活 + 额外成本
                        </div>
                      </div>
                      <span style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.success }}>
                        ${(
                          cityPlan.reduce((sum: number, city: any) => sum + (city.monthlyCost * city.months), 0) +
                          annualTravelCosts.flights + 
                          annualTravelCosts.visas + 
                          annualTravelCosts.insurance
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* City Selection */}
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>➕ 添加城市</h3>
                  
                  {/* Custom City Input */}
                  <div style={{
                    background: COLORS.accent,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    border: `2px dashed ${COLORS.success}40`
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: COLORS.success }}>
                      ✏️ 自定义城市
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginBottom: '1rem' }}>
                      添加数据库中没有的城市，或使用自己的生活成本数据
                      {(() => {
                        const totalMonths = cityPlan.reduce((sum: number, city: any) => sum + city.months, 0);
                        const remainingMonths = 12 - totalMonths;
                        if (remainingMonths < 12) {
                          return (
                            <span style={{ 
                              marginLeft: '0.5rem', 
                              color: remainingMonths > 0 ? COLORS.warning : COLORS.highlight,
                              fontWeight: '600'
                            }}>
                              （剩余 {remainingMonths} 个月可用）
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="城市名称（如：台北）"
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          style={{
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.accent}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                        <input
                          type="number"
                          placeholder="月成本"
                          value={customCost}
                          onChange={(e) => setCustomCost(e.target.value)}
                          style={{
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.accent}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                        <input
                          type="number"
                          placeholder="月数"
                          min="1"
                          max="12"
                          value={customMonths}
                          onChange={(e) => setCustomMonths(e.target.value)}
                          style={{
                            padding: '0.75rem',
                            background: COLORS.card,
                            border: `1px solid ${COLORS.accent}`,
                            borderRadius: '0.5rem',
                            color: COLORS.text,
                            fontSize: '0.9rem',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (customCity && customCost && parseInt(customCost) > 0) {
                            const currentTotal = cityPlan.reduce((sum: number, c: any) => sum + c.months, 0);
                            const requestedMonths = parseInt(customMonths) || 1;
                            
                            if (currentTotal + requestedMonths > 12) {
                              const remainingMonths = 12 - currentTotal;
                              alert(`无法添加 ${requestedMonths} 个月，只剩余 ${remainingMonths} 个月可用。请调整月数或删除其他城市。`);
                              return;
                            }
                            
                            const newCity = {
                              city: customCity,
                              level: 'custom',
                              monthlyCost: parseInt(customCost),
                              months: requestedMonths
                            };
                            const newPlan = [...cityPlan, newCity];
                            setCityPlan(newPlan);
                            localStorage.setItem('cityPlan', JSON.stringify(newPlan));
                            // Reset form
                            setCustomCity('');
                            setCustomCost('');
                            setCustomMonths('1');
                          } else {
                            alert('请填写完整的城市信息');
                          }
                        }}
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
                          border: 'none',
                          color: 'white',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        + 添加自定义城市
                      </button>
                    </div>
                  </div>

                  {Object.entries(CITY_COSTS).map(([region, cities]) => (
                    <div key={region} style={{ marginBottom: '2rem' }}>
                      <h4 style={{
                        margin: '0 0 1rem 0',
                        fontSize: '1rem',
                        color: COLORS.success,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>{region === '中国' ? '🇨🇳' : region === '亚洲' ? '🌏' : region === '欧美' ? '🌎' : '🌍'}</span>
                        <span>{region}</span>
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1rem'
                      }}>
                        {cities.map((city: any) => (
                          <div key={city.name} style={{
                            background: COLORS.accent,
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: `1px solid ${COLORS.accent}`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.border = `1px solid ${COLORS.success}`;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.border = `1px solid ${COLORS.accent}`;
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}>
                            <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                              {city.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: COLORS.textMuted, marginBottom: '0.75rem' }}>
                              选择生活水平：
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {[
                                { 
                                  level: 'budget', 
                                  label: '节俭', 
                                  cost: city.budget, 
                                  color: COLORS.bonds,
                                  description: '合租/青旅，自己做饭为主(周1-2次外食)，公共交通，基础娱乐'
                                },
                                { 
                                  level: 'comfortable', 
                                  label: '舒适', 
                                  cost: city.comfortable, 
                                  color: COLORS.success,
                                  description: '独立公寓/Airbnb，做饭+外食各半(周3-4次)，公共交通+偶尔打车，常规娱乐'
                                },
                                { 
                                  level: 'luxury', 
                                  label: '富足', 
                                  cost: city.luxury, 
                                  color: COLORS.warning,
                                  description: '高品质公寓，经常外食(周5-6次)，打车为主，丰富娱乐'
                                }
                              ].map(option => (
                                <button
                                  key={option.level}
                                  onClick={() => {
                                    const currentTotal = cityPlan.reduce((sum: number, c: any) => sum + c.months, 0);
                                    const defaultMonths = 1;
                                    
                                    if (currentTotal + defaultMonths > 12) {
                                      const remainingMonths = 12 - currentTotal;
                                      if (remainingMonths <= 0) {
                                        alert('已规划满 12 个月，无法添加更多城市。请删除或减少其他城市的月数。');
                                        return;
                                      } else {
                                        alert(`无法添加默认的 ${defaultMonths} 个月，只剩余 ${remainingMonths} 个月。将自动设置为 ${remainingMonths} 个月。`);
                                      }
                                    }
                                    
                                    const actualMonths = Math.min(defaultMonths, Math.max(0, 12 - currentTotal));
                                    if (actualMonths <= 0) return;
                                    
                                    const newCity = {
                                      city: city.name,
                                      level: option.level,
                                      monthlyCost: option.cost,
                                      months: actualMonths
                                    };
                                    const newPlan = [...cityPlan, newCity];
                                    setCityPlan(newPlan);
                                    localStorage.setItem('cityPlan', JSON.stringify(newPlan));
                                  }}
                                  style={{
                                    background: COLORS.card,
                                    border: `1px solid ${option.color}40`,
                                    color: COLORS.text,
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'stretch',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = `${option.color}20`;
                                    e.currentTarget.style.borderColor = option.color;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = COLORS.card;
                                    e.currentTarget.style.borderColor = `${option.color}40`;
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600' }}>{option.label}</span>
                                    <span style={{ fontWeight: '700', color: option.color }}>
                                      ${option.cost.toLocaleString()}/月
                                    </span>
                                  </div>
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: COLORS.textMuted, 
                                    lineHeight: '1.4',
                                    paddingTop: '0.25rem',
                                    borderTop: `1px solid ${COLORS.accent}`
                                  }}>
                                    {option.description}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: COLORS.textMuted, fontStyle: 'italic' }}>
                                    ⚠️ 不含：机票、签证费用
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '2rem',
                  paddingTop: '2rem',
                  borderTop: `1px solid ${COLORS.accent}`
                }}>
                  <button
                    onClick={() => {
                      setCityPlan([]);
                      localStorage.setItem('cityPlan', JSON.stringify([]));
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: `1px solid ${COLORS.textMuted}`,
                      color: COLORS.textMuted,
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    清空规划
                  </button>
                  <button
                    onClick={() => setShowCityPlanner(false)}
                    style={{
                      flex: 1,
                      background: `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
                      border: 'none',
                      color: 'white',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    完成
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;


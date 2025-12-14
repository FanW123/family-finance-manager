import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface RebalancingSuggestion {
  type: string;
  currentAmount: number;
  currentPercentage: number;
  targetPercentage: number;
  targetAmount: number;
  difference: number;
  action: string;
}

interface RebalancingResponse {
  suggestions: RebalancingSuggestion[];
  totalValue: number;
}

export default function Rebalancing() {
  const [suggestions, setSuggestions] = useState<RebalancingSuggestion[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [marketData, setMarketData] = useState<any>(null);
  const [loadingMarketData, setLoadingMarketData] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const res = await api.get<RebalancingResponse>('/rebalancing/suggestions');
      setSuggestions(res.data.suggestions);
      setTotalValue(res.data.totalValue);
    } catch (error) {
      console.error('Error loading rebalancing suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    if (!symbol.trim()) {
      alert('请输入股票代码');
      return;
    }

    try {
      setLoadingMarketData(true);
      const res = await api.get(`/rebalancing/market-data/${symbol.toUpperCase()}`);
      setMarketData(res.data);
    } catch (error: any) {
      console.error('Error fetching market data:', error);
      if (error.response?.status === 503) {
        alert('API密钥未配置。请在服务器环境变量中设置 ALPHA_VANTAGE_API_KEY');
      } else if (error.response?.status === 429) {
        alert('API请求频率过高，请稍后再试');
      } else {
        alert('获取市场数据失败：' + (error.response?.data?.error || '未知错误'));
      }
      setMarketData(null);
    } finally {
      setLoadingMarketData(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'stocks' ? '股票' : type === 'bonds' ? '债券' : '现金';
  };

  const getActionLabel = (action: string) => {
    return action === 'buy' ? '买入' : '卖出';
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">资产再平衡</h1>
        <button
          onClick={loadSuggestions}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          刷新建议
        </button>
      </div>

      {totalValue === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">暂无投资数据</div>
            <Link
              to="/investments"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              前往添加投资 →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">再平衡建议</h2>
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">投资组合总价值</div>
              <div className="text-3xl font-bold text-indigo-600">
                ¥{totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.type}
                    className={`p-4 rounded-lg border-2 ${
                      suggestion.action === 'buy'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-lg text-gray-900">
                          {getTypeLabel(suggestion.type)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          当前: {suggestion.currentPercentage.toFixed(1)}% (¥{suggestion.currentAmount.toLocaleString('zh-CN')}) | 
                          目标: {suggestion.targetPercentage.toFixed(1)}% (¥{suggestion.targetAmount.toLocaleString('zh-CN')})
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        suggestion.action === 'buy'
                          ? 'bg-blue-600 text-white'
                          : 'bg-orange-600 text-white'
                      }`}>
                        {getActionLabel(suggestion.action)}
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-white rounded">
                      <div className="font-medium text-gray-900 mb-1">建议操作</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {suggestion.action === 'buy' ? '+' : '-'}
                        ¥{Math.abs(suggestion.difference).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {suggestion.action === 'buy'
                          ? `建议买入 ${getTypeLabel(suggestion.type)} 以达到目标配置`
                          : `建议卖出 ${getTypeLabel(suggestion.type)} 以达到目标配置`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-green-600 font-semibold mb-2">✓ 投资组合已平衡</div>
                <div className="text-sm">当前配置与目标配置一致，无需调整</div>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">市场数据查询</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                查询股票实时价格（需要配置 Alpha Vantage API 密钥）
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="输入股票代码，例如：AAPL"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  onKeyPress={(e) => e.key === 'Enter' && fetchMarketData()}
                />
                <button
                  onClick={fetchMarketData}
                  disabled={loadingMarketData}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {loadingMarketData ? '查询中...' : '查询'}
                </button>
              </div>
            </div>

            {marketData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">股票代码</div>
                    <div className="text-lg font-semibold">{marketData.symbol}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">当前价格</div>
                    <div className="text-lg font-semibold text-indigo-600">
                      ${marketData.price.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">涨跌</div>
                    <div className={`text-lg font-semibold ${
                      marketData.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {marketData.change >= 0 ? '+' : ''}{marketData.change.toFixed(2)} ({marketData.changePercent})
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">成交量</div>
                    <div className="text-lg font-semibold">{marketData.volume}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">最后更新</div>
                    <div className="text-sm">{marketData.lastUpdated}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 再平衡说明</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>再平衡建议基于您设置的目标资产配置</li>
              <li>只有当差异超过总资产的1%时才会显示建议</li>
              <li>建议定期（如每季度）检查并执行再平衡操作</li>
              <li>可以通过"投资跟踪"页面更新您的投资记录</li>
              <li>市场数据查询需要配置 Alpha Vantage API 密钥（在服务器 .env 文件中设置）</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}


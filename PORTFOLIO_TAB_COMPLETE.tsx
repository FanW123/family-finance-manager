        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div>
            {/* Header with buttons */}
            <div style={{
              background: COLORS.card,
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>投资管理</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {lastPriceUpdate && (
                    <span style={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
                      上次更新: {new Date(lastPriceUpdate).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
            </div>

            {/* Add Investment Form */}
            {showAddInvestment && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.2rem' }}>添加投资</h3>
                <form onSubmit={handleAddInvestment} style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>类型</label>
                      <select
                        value={newInvestment.type}
                        onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: COLORS.accent,
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
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>名称</label>
                      <input
                        type="text"
                        value={newInvestment.name}
                        onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: COLORS.accent,
                          border: `1px solid ${COLORS.secondary}`,
                          borderRadius: '0.5rem',
                          color: COLORS.text,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                        placeholder="投资名称"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>代码（可选）</label>
                      <input
                        type="text"
                        value={newInvestment.symbol}
                        onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value.toUpperCase() })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: COLORS.accent,
                          border: `1px solid ${COLORS.secondary}`,
                          borderRadius: '0.5rem',
                          color: COLORS.text,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                        placeholder="如：AAPL"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: COLORS.textMuted }}>金额</label>
                      <input
                        type="number"
                        value={newInvestment.amount}
                        onChange={(e) => setNewInvestment({ ...newInvestment, amount: e.target.value })}
                        required
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: COLORS.accent,
                          border: `1px solid ${COLORS.secondary}`,
                          borderRadius: '0.5rem',
                          color: COLORS.text,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                        placeholder="投资金额"
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
                          background: COLORS.accent,
                          border: `1px solid ${COLORS.secondary}`,
                          borderRadius: '0.5rem',
                          color: COLORS.text,
                          fontSize: '0.9rem',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddInvestment(false);
                        setNewInvestment({
                          type: 'stocks',
                          symbol: '',
                          name: '',
                          amount: '',
                          price: '',
                          quantity: '',
                          date: new Date().toISOString().split('T')[0],
                        });
                      }}
                      style={{
                        background: COLORS.accent,
                        color: COLORS.text,
                        border: `1px solid ${COLORS.secondary}`,
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

            {/* Investment List */}
            {investments.length > 0 && (
              <div style={{
                background: COLORS.card,
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                overflowX: 'auto'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.2rem' }}>投资明细</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COLORS.accent}` }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem' }}>日期</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem' }}>类型</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem' }}>名称</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: COLORS.textMuted, fontSize: '0.9rem' }}>代码</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: COLORS.textMuted, fontSize: '0.9rem' }}>金额</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.9rem' }}>操作</th>
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
                                  value={editingInvestment.name}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, name: e.target.value })}
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
                                <input
                                  type="text"
                                  value={editingInvestment.symbol}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, symbol: e.target.value.toUpperCase() })}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: COLORS.accent,
                                    border: `1px solid ${COLORS.secondary}`,
                                    borderRadius: '0.3rem',
                                    color: COLORS.text,
                                    fontFamily: 'inherit'
                                  }}
                                  placeholder="代码"
                                />
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  value={editingInvestment.amount}
                                  onChange={(e) => setEditingInvestment({ ...editingInvestment, amount: e.target.value })}
                                  step="0.01"
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
                              <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>{investment.name}</td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', color: COLORS.textMuted }}>{investment.symbol || '-'}</td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem', textAlign: 'right', fontWeight: '700' }}>
                                ¥{investment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              </div>
            )}

            {/* Portfolio Summary - Moved to bottom */}
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
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>¥{totalPortfolio.toLocaleString()}</div>
                </div>
                <div style={{
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
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
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
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
                  background: COLORS.accent,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
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
            </div>

            {/* Target Allocation and Chart remain at the end */}
          </div>
        )}


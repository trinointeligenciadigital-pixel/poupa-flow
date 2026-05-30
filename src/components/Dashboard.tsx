import React from 'react';
import { ArrowUpRight, ArrowDownRight, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Transaction, FixedExpense, Account, User } from '../App';
import { calcAccountBalance, getLastActivity } from '../App';

interface DashboardProps {
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  monthlyBudget: number;
  accounts: Account[];
  users: User[];
  onPayFixedExpense: (id: string, accountId?: string) => void;
}

const USER_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#14b8a6', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  fixedExpenses,
  monthlyBudget,
  accounts,
  users,
  onPayFixedExpense
}) => {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // "YYYY-MM"

  // Calculations
  const totalInflow = transactions
    .filter(t => t.type === 'inflow')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOutflow = transactions
    .filter(t => t.type === 'outflow')
    .reduce((acc, t) => acc + t.amount, 0);

  // Group outflows by user
  const userOutflows = users.map(user => {
    const total = transactions
      .filter(t => t.type === 'outflow' && t.userId === user.id)
      .reduce((acc, t) => acc + t.amount, 0);
    return { user, total };
  });

  // Remaining budget
  const budgetRemaining = monthlyBudget - totalOutflow;
  
  // Calculate percentage of budget left
  let fillPercentage = 100;
  if (monthlyBudget > 0) {
    fillPercentage = Math.max(0, Math.min(100, (budgetRemaining / monthlyBudget) * 100));
  }

  // Format currency
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Determine state of bubble (normal, warning, danger)
  let bubbleStateClass = '';
  let statusMessage = '';
  let statusIcon = <Award className="text-inflow" size={18} />;

  if (fillPercentage <= 15 || budgetRemaining < 0) {
    bubbleStateClass = 'danger';
    statusMessage = 'Alerta vermelho! Limite de gastos quase estourado. Evite novos gastos!';
    statusIcon = <AlertTriangle className="text-outflow" size={18} />;
  } else if (fillPercentage <= 40) {
    bubbleStateClass = 'warning';
    statusMessage = 'Atenção. Você já gastou mais de 60% do seu limite mensal.';
    statusIcon = <AlertTriangle style={{ color: '#f59e0b' }} size={18} />;
  } else {
    statusMessage = 'Tudo fluindo bem! Seu orçamento está saudável. Continue acompanhando!';
  }

  // Filter fixed expenses for the current month
  const pendingFixedExpenses = fixedExpenses.filter(fe => !fe.paidMonths.includes(currentMonthStr));

  // Wave height logic (mapped to CSS bottom property)
  const waveHeightStyle = {
    bottom: `${fillPercentage - 100}%` // maps 0% to -100% and 100% to 0%
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Wave Reservoir */}
      <div className="glass-panel reservoir-container">
        <div className={`reservoir-bubble ${bubbleStateClass}`}>
          {/* Animated Waves */}
          <div className="reservoir-wave" style={waveHeightStyle}></div>
          <div className="reservoir-wave-overlay" style={waveHeightStyle}></div>

          {/* Central values */}
          <div className="reservoir-value-container">
            <span className="reservoir-title">Disponível</span>
            <span className="reservoir-value">
              {budgetRemaining < 0 ? '-' : ''}{formatCurrency(Math.abs(budgetRemaining))}
            </span>
            <span className="reservoir-percent">
              {Math.round(fillPercentage)}% do limite
            </span>
          </div>
        </div>

        <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Limite restante de R$ {monthlyBudget.toFixed(2)}
        </div>
      </div>

      {/* Motivational message for procrastinators */}
      <div className="glass-panel quote-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {statusIcon}
        <p style={{ margin: 0, lineHeight: 1.4 }}>{statusMessage}</p>
      </div>

      {/* Accounts List (Reservas / Carteiras) */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--surface-border)', paddingBottom: '6px' }}>
          Suas Contas e Carteiras
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {accounts.map(acc => {
            const balance = calcAccountBalance(acc, transactions);
            const lastActivity = getLastActivity(acc, transactions);
            
            // Format activity text
            let activityText = 'Sem movimentações recentes';
            if (lastActivity) {
              const dateObj = new Date(lastActivity);
              const today = new Date();
              const diffTime = Math.abs(today.getTime() - dateObj.getTime());
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 0) {
                activityText = 'Movimentado hoje';
              } else if (diffDays === 1) {
                activityText = 'Movimentado ontem';
              } else {
                activityText = `Movimentado há ${diffDays} dias`;
              }
            }

            return (
              <div 
                key={acc.id} 
                className="flex-between"
                style={{ 
                  padding: '10px 14px', 
                  background: 'rgba(0, 0, 0, 0.1)', 
                  border: `1px solid var(--surface-border)`,
                  borderLeft: `4px solid ${acc.color}`,
                  borderRadius: '10px',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{acc.emoji}</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{acc.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{activityText}</span>
                  </div>
                </div>
                
                <span 
                  style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontWeight: 800, 
                    fontSize: '1.05rem', 
                    color: balance >= 0 ? 'var(--color-inflow)' : 'var(--color-outflow)' 
                  }}
                >
                  {formatCurrency(balance)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared Spending Breakdown */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--surface-border)', paddingBottom: '6px' }}>
          Divisão de Gastos do Grupo
        </h3>

        {(() => {
          const totalOutflowActive = userOutflows.reduce((sum, u) => sum + u.total, 0);
          
          if (totalOutflowActive === 0) {
            return (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                Nenhum gasto registrado neste mês ainda.
              </span>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Proportional horizontal segmented bar */}
              <div 
                style={{ 
                  height: '10px', 
                  width: '100%', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '5px', 
                  overflow: 'hidden',
                  display: 'flex'
                }}
              >
                {userOutflows.map((item, idx) => {
                  const percentage = totalOutflowActive > 0 ? (item.total / totalOutflowActive) * 100 : 0;
                  if (percentage === 0) return null;
                  const color = USER_COLORS[idx % USER_COLORS.length];
                  return (
                    <div 
                      key={item.user.id} 
                      style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: color,
                        transition: 'var(--transition-smooth)'
                      }} 
                      title={`${item.user.name}: ${percentage.toFixed(0)}%`}
                    />
                  );
                })}
              </div>

              {/* Detail legends with user photo/emoji and value */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 16px' }}>
                {userOutflows.map((item, idx) => {
                  const percentage = totalOutflowActive > 0 ? (item.total / totalOutflowActive) * 100 : 0;
                  const color = USER_COLORS[idx % USER_COLORS.length];
                  return (
                    <div 
                      key={item.user.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '0.8rem'
                      }}
                    >
                      {/* Color indicator dot */}
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                      
                      {/* Avatar/Emoji */}
                      {item.user.avatar ? (
                        <img 
                          src={item.user.avatar} 
                          alt={item.user.name} 
                          style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>{item.user.emoji}</span>
                      )}

                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.user.name}:</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(item.total)} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="flex-between">
            <span className="stat-box-title">Ganhos</span>
            <ArrowUpRight className="text-inflow" size={16} />
          </div>
          <span className="stat-box-val text-inflow">{formatCurrency(totalInflow)}</span>
        </div>

        <div className="stat-box">
          <div className="flex-between">
            <span className="stat-box-title">Gastos</span>
            <ArrowDownRight className="text-outflow" size={16} />
          </div>
          <span className="stat-box-val text-outflow">{formatCurrency(totalOutflow)}</span>
        </div>
      </div>


      {/* Fixed Expenses Checklist (Low friction for procrastinators) */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--surface-border)', paddingBottom: '6px' }}>
          Contas Fixas do Mês
        </h3>
        
        {pendingFixedExpenses.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-inflow)', fontSize: '0.85rem', padding: '8px 0' }}>
            <CheckCircle2 size={18} />
            <span>Tudo pago por aqui! Nenhuma conta pendente. 🎉</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingFixedExpenses.map(fe => (
              <div 
                key={fe.id} 
                className="flex-between"
                style={{ 
                  padding: '10px 12px', 
                  background: 'rgba(0, 0, 0, 0.1)', 
                  border: '1px solid var(--surface-border)',
                  borderRadius: '10px',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.25rem' }}>{fe.emoji}</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{fe.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>Vence dia {fe.dueDay}</span>
                      {(() => {
                        const acc = accounts.find(a => a.id === fe.defaultAccountId);
                        return acc ? (
                          <>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <span>{acc.emoji}</span>
                              <span>{acc.name}</span>
                            </span>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>R$ {fe.amount.toFixed(2)}</span>
                  <button 
                    onClick={() => onPayFixedExpense(fe.id)}
                    className="action-btn inflow"
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '0.75rem', 
                      borderRadius: '6px', 
                      width: 'auto',
                      fontWeight: 700,
                      boxShadow: 'none'
                    }}
                  >
                    Pago ✔️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

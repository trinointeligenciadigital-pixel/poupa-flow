import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import type { Transaction, Account, User } from '../App';

interface HistoryProps {
  transactions: Transaction[];
  accounts: Account[];
  users: User[];
  onDeleteTransaction: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({ 
  transactions, 
  accounts,
  users,
  onDeleteTransaction 
}) => {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDateLabel = (dateStr: string) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const date = new Date(dateStr);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    }
  };

  // Group transactions by date
  const groupedTransactions: { [key: string]: Transaction[] } = {};
  
  // Sort from newest to oldest
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedTransactions.forEach(t => {
    const label = formatDateLabel(t.date);
    if (!groupedTransactions[label]) {
      groupedTransactions[label] = [];
    }
    groupedTransactions[label].push(t);
  });

  return (
    <div className="history-container">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Histórico Simples</h2>

      {transactions.length === 0 ? (
        <div className="glass-panel empty-state">
          <AlertCircle />
          <p>Nenhuma movimentação ainda.<br />Que tal registrar sua primeira transação?</p>
        </div>
      ) : (
        Object.keys(groupedTransactions).map(dateLabel => (
          <div key={dateLabel} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              color: 'var(--text-muted)',
              marginTop: '12px',
              letterSpacing: '0.05em'
            }}>
              {dateLabel}
            </div>
            
            {groupedTransactions[dateLabel].map((t) => (
              <div key={t.id} className="transaction-card glass-panel">
                <div className="transaction-left">
                  <div className="transaction-emoji-wrapper">
                    {t.emoji}
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-category">{t.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>
                        {new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {(() => {
                        const acc = accounts.find(a => a.id === t.accountId);
                        return acc ? (
                          <>
                            <span>•</span>
                            <span 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '2.5px', 
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--surface-border)', 
                                padding: '1px 6px', 
                                borderRadius: '10px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <span>{acc.emoji}</span>
                              <span>{acc.name}</span>
                            </span>
                          </>
                        ) : null;
                      })()}
                      {(() => {
                        const usr = users.find(u => u.id === t.userId);
                        return usr ? (
                          <>
                            <span>•</span>
                            <span 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '2.5px', 
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--surface-border)', 
                                padding: '1px 6px', 
                                borderRadius: '10px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {usr.avatar ? (
                                <img 
                                  src={usr.avatar} 
                                  alt={usr.name} 
                                  style={{ width: '12px', height: '12px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <span>{usr.emoji}</span>
                              )}
                              <span>{usr.name}</span>
                            </span>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="transaction-right">
                  <span className={`transaction-value ${t.type === 'inflow' ? 'inflow' : 'outflow'}`}>
                    {t.type === 'inflow' ? '+' : '-'} {formatCurrency(t.amount)}
                  </span>
                  <button 
                    onClick={() => onDeleteTransaction(t.id)} 
                    className="delete-btn"
                    title="Excluir lançamento"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

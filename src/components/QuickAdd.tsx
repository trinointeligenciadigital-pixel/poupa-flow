import React, { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';
import type { Category, Account } from '../App';

interface QuickAddProps {
  categories: Category[];
  accounts: Account[];
  lastAccountId: string;
  onAddTransaction: (
    type: 'inflow' | 'outflow',
    amount: number,
    category: string,
    emoji: string,
    accountId: string
  ) => void;
}

export const QuickAdd: React.FC<QuickAddProps> = ({
  categories,
  accounts,
  lastAccountId,
  onAddTransaction,
}) => {
  const [valStr, setValStr] = useState('0');
  const [selectedEmoji, setSelectedEmoji] = useState('🍔');
  const [selectedAccountId, setSelectedAccountId] = useState(
    lastAccountId || (accounts[0] ? accounts[0].id : '')
  );

  // Sync selected emoji with categories if they change or on load
  useEffect(() => {
    if (categories.length > 0) {
      const exists = categories.some(c => c.emoji === selectedEmoji);
      if (!exists) {
        setSelectedEmoji(categories[0].emoji);
      }
    }
  }, [categories, selectedEmoji]);

  // Sync selected account if lastAccountId or accounts list change
  useEffect(() => {
    if (lastAccountId && accounts.some(a => a.id === lastAccountId)) {
      setSelectedAccountId(lastAccountId);
    } else if (accounts.length > 0 && !accounts.some(a => a.id === selectedAccountId)) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [lastAccountId, accounts]);

  // Handle keypress from custom numpad
  const handleNumPress = (num: string) => {
    if (valStr === '0' && num !== ',') {
      setValStr(num);
    } else {
      if (num === ',' && valStr.includes(',')) return;
      if (valStr.includes(',')) {
        const parts = valStr.split(',');
        if (parts[1] && parts[1].length >= 2) return;
      }
      if (valStr.replace(',', '').length >= 8) return;

      setValStr(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    if (valStr.length <= 1) {
      setValStr('0');
    } else {
      setValStr(prev => prev.slice(0, -1));
    }
  };

  const getNumericValue = (): number => {
    const formatted = valStr.replace(',', '.');
    return parseFloat(formatted) || 0;
  };

  const handleSubmit = (type: 'inflow' | 'outflow') => {
    const value = getNumericValue();
    if (value <= 0) return;

    const cat = categories.find(c => c.emoji === selectedEmoji);
    const categoryName = cat ? cat.name : 'Outros';

    onAddTransaction(type, value, categoryName, selectedEmoji, selectedAccountId);
    
    setValStr('0');
  };

  return (
    <div className="quick-add-container">
      {/* Visual Display */}
      <div className="input-display">
        <span className="input-label">Valor do Registro</span>
        <div className="input-amount">
          R$ {valStr}
        </div>
      </div>

      {/* Account Selector */}
      <div>
        <div className="emoji-selector-label">Qual conta/carteira?</div>
        <div className="account-selector-scroll">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`account-pill ${selectedAccountId === acc.id ? 'selected' : ''}`}
              style={{
                borderColor: selectedAccountId === acc.id ? acc.color : 'var(--surface-border)',
                boxShadow: selectedAccountId === acc.id ? `0 4px 12px ${acc.color}33` : 'none',
              }}
            >
              <span className="account-emoji">{acc.emoji}</span>
              <span className="account-name">{acc.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Tags */}
      <div>
        <div className="emoji-selector-label">Onde ou com o que?</div>
        <div className="emoji-grid" style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedEmoji(cat.emoji)}
              className={`emoji-btn ${selectedEmoji === cat.emoji ? 'selected' : ''}`}
              title={cat.name}
            >
              <span>{cat.emoji}</span>
              <span className="emoji-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Numeric Keyboard */}
      <div className="numpad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button key={num} onClick={() => handleNumPress(num)} className="numpad-btn">
            {num}
          </button>
        ))}
        <button onClick={() => handleNumPress(',')} className="numpad-btn">,</button>
        <button onClick={() => handleNumPress('0')} className="numpad-btn">0</button>
        <button onClick={handleBackspace} className="numpad-btn" style={{ fontSize: '1.2rem' }}>
          ⌫
        </button>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={() => handleSubmit('inflow')} 
          className="action-btn inflow"
          disabled={getNumericValue() <= 0}
          style={{ opacity: getNumericValue() <= 0 ? 0.6 : 1 }}
        >
          <PlusCircle size={20} />
          Entrou
        </button>
        <button 
          onClick={() => handleSubmit('outflow')} 
          className="action-btn outflow"
          disabled={getNumericValue() <= 0}
          style={{ opacity: getNumericValue() <= 0 ? 0.6 : 1 }}
        >
          <MinusCircle size={20} />
          Saiu
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Trash2, Plus, RefreshCw, DollarSign, Calendar, Layers } from 'lucide-react';
import type { Category, FixedExpense, Account, User } from '../App';

interface SettingsProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  fixedExpenses: FixedExpense[];
  setFixedExpenses: React.Dispatch<React.SetStateAction<FixedExpense[]>>;
  monthlyBudget: number;
  setMonthlyBudget: (budget: number) => void;
  accounts: Account[];
  onAddAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onResetData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  categories,
  setCategories,
  fixedExpenses,
  setFixedExpenses,
  monthlyBudget,
  setMonthlyBudget,
  accounts,
  onAddAccount,
  onDeleteAccount,
  users,
  onAddUser,
  onDeleteUser,
  onResetData
}) => {
  // Budget Form
  const [budgetVal, setBudgetVal] = useState(monthlyBudget.toString());
  const [budgetSaved, setBudgetSaved] = useState(false);

  // Account Form
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmoji, setNewAccEmoji] = useState('💳');
  const [newAccColor, setNewAccColor] = useState('#8b5cf6');
  const [newAccBalance, setNewAccBalance] = useState('0');

  // User Form
  const [newUsrName, setNewUsrName] = useState('');
  const [newUsrEmoji, setNewUsrEmoji] = useState('👤');
  const [newUsrAvatar, setNewUsrAvatar] = useState<string | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🎁');

  // Fixed Expense Form
  const [newFeName, setNewFeName] = useState('');
  const [newFeAmount, setNewFeAmount] = useState('');
  const [newFeCategoryIndex, setNewFeCategoryIndex] = useState(0);
  const [newFeDueDay, setNewFeDueDay] = useState('5');
  const [newFeAccountId, setNewFeAccountId] = useState(accounts[0] ? accounts[0].id : '');

  // Sync default account ID for new fixed expense when accounts load
  React.useEffect(() => {
    if (accounts.length > 0 && !accounts.some(a => a.id === newFeAccountId)) {
      setNewFeAccountId(accounts[0].id);
    }
  }, [accounts, newFeAccountId]);

  // Save Budget
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetVal) || 0;
    if (val > 0) {
      setMonthlyBudget(val);
      setBudgetSaved(true);
      setTimeout(() => setBudgetSaved(false), 2000);
    }
  };

  // Add Account
  const handleAddAccountLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccEmoji.trim()) return;

    const initialBalance = parseFloat(newAccBalance) || 0;
    
    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name: newAccName.trim(),
      emoji: newAccEmoji.trim().substring(0, 4),
      color: newAccColor,
      initialBalance
    };

    onAddAccount(newAcc);
    setNewAccName('');
    setNewAccEmoji('💳');
    setNewAccColor('#8b5cf6');
    setNewAccBalance('0');
  };

  // Avatar Image Upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image using Canvas to keep localStorage light
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setNewUsrAvatar(dataUrl);
        setAvatarPreview(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Add Member
  const handleAddUserLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsrName.trim()) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: newUsrName.trim(),
      emoji: newUsrEmoji.trim().substring(0, 4) || '👤',
      avatar: newUsrAvatar
    };

    onAddUser(newUser);
    setNewUsrName('');
    setNewUsrEmoji('👤');
    setNewUsrAvatar(undefined);
    setAvatarPreview(null);
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatEmoji.trim()) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      emoji: newCatEmoji.trim().substring(0, 4) // grab first emoji/char
    };

    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
  };

  // Delete Category
  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) {
      alert("Você precisa manter pelo menos 1 categoria!");
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Add Fixed Expense
  const handleAddFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newFeAmount) || 0;
    if (!newFeName.trim() || amount <= 0) return;

    const selectedCat = categories[newFeCategoryIndex] || categories[0];
    const dueDay = parseInt(newFeDueDay) || 5;

    const newFe: FixedExpense = {
      id: `fixed-${Date.now()}`,
      name: newFeName.trim(),
      amount,
      category: selectedCat.name,
      emoji: selectedCat.emoji,
      dueDay,
      paidMonths: [],
      defaultAccountId: newFeAccountId || (accounts[0] ? accounts[0].id : '')
    };

    setFixedExpenses(prev => [...prev, newFe]);
    setNewFeName('');
    setNewFeAmount('');
  };

  // Delete Fixed Expense
  const handleDeleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(fe => fe.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '20px' }}>
      <h2 style={{ fontSize: '1.25rem' }}>Painel de Ajustes</h2>

      {/* 1. Monthly Budget */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} className="text-inflow" />
          Meta de Gastos do Mês
        </h3>
        <form onSubmit={handleSaveBudget} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            value={budgetVal}
            onChange={(e) => setBudgetVal(e.target.value)}
            placeholder="Ex: 2500"
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--surface-border)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600
            }}
          />
          <button
            type="submit"
            className="action-btn inflow"
            style={{ padding: '0 20px', fontSize: '0.9rem', borderRadius: '8px', width: 'auto' }}
          >
            {budgetSaved ? 'Salvo ✓' : 'Salvar'}
          </button>
        </form>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
          Define a capacidade da bolha d'água na página principal.
        </span>
      </div>

      {/* 2. Accounts Management */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: 'var(--color-inflow)' }} />
          Suas Contas e Carteiras
        </h3>

        {/* Add Account Form */}
        <form onSubmit={handleAddAccountLocal} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px' }}>
            <input
              type="text"
              value={newAccEmoji}
              onChange={(e) => setNewAccEmoji(e.target.value)}
              placeholder="Emoji"
              required
              title="Emoji da Conta"
              style={{
                textAlign: 'center',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)',
                fontSize: '1.2rem'
              }}
            />
            <input
              type="text"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              placeholder="Nome da Conta (ex: Nubank)"
              required
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              type="number"
              value={newAccBalance}
              onChange={(e) => setNewAccBalance(e.target.value)}
              placeholder="Saldo Inicial R$"
              step="0.01"
              required
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cor:</span>
              <input
                type="color"
                value={newAccColor}
                onChange={(e) => setNewAccColor(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          {/* Quick Predefined Color Buttons */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '2px 0' }}>
            {[
              { name: 'Nubank', color: '#8b5cf6' },
              { name: 'Carteira', color: '#10b981' },
              { name: 'Itaú', color: '#f97316' },
              { name: 'BB', color: '#eab308' },
              { name: 'Bradesco', color: '#ef4444' },
              { name: 'Preto', color: '#1e293b' }
            ].map(item => (
              <button
                key={item.color}
                type="button"
                onClick={() => setNewAccColor(item.color)}
                style={{
                  background: item.color,
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: newAccColor === item.color ? '2px solid white' : 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: newAccColor === item.color ? '0 0 6px rgba(255,255,255,0.8)' : 'none'
                }}
                title={item.name}
              />
            ))}
          </div>

          <button type="submit" className="action-btn inflow" style={{ borderRadius: '8px', padding: '10px', fontSize: '0.9rem' }}>
            <Plus size={16} /> Adicionar Conta
          </button>
        </form>

        {/* Accounts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {accounts.map((acc) => (
            <div 
              key={acc.id} 
              className="flex-between"
              style={{ 
                padding: '8px 12px', 
                background: 'rgba(0, 0, 0, 0.1)', 
                border: '1px solid var(--surface-border)', 
                borderLeft: `4px solid ${acc.color}`,
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{acc.emoji}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>{acc.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Saldo Inicial: R$ {acc.initialBalance.toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={() => onDeleteAccount(acc.id)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                disabled={accounts.length <= 1}
                title={accounts.length <= 1 ? "Você precisa manter pelo menos uma conta!" : "Excluir Conta"}
              >
                <Trash2 size={14} className="delete-btn" style={{ opacity: accounts.length <= 1 ? 0.4 : 1 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Shared Finances (Group Members) */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: 'var(--color-brand)' }} />
          Membros do Grupo (Finanças Compartilhadas)
        </h3>

        {/* Add User Form */}
        <form onSubmit={handleAddUserLocal} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px' }}>
            <input
              type="text"
              value={newUsrEmoji}
              onChange={(e) => setNewUsrEmoji(e.target.value)}
              placeholder="Emoji"
              required={!newUsrAvatar}
              title="Emoji do Perfil"
              style={{
                textAlign: 'center',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)',
                fontSize: '1.2rem'
              }}
            />
            <input
              type="text"
              value={newUsrName}
              onChange={(e) => setNewUsrName(e.target.value)}
              placeholder="Nome do Membro (ex: Thayane)"
              required
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Profile Photo Uploader */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Foto de Perfil (Opcional):</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              />
            </div>
            
            {/* Live Preview */}
            {avatarPreview && (
              <div style={{ position: 'relative' }}>
                <img
                  src={avatarPreview}
                  alt="Previa do Perfil"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--color-brand)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setNewUsrAvatar(undefined);
                    setAvatarPreview(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--color-outflow)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="action-btn inflow" style={{ borderRadius: '8px', padding: '10px', fontSize: '0.9rem' }}>
            <Plus size={16} /> Adicionar Membro
          </button>
        </form>

        {/* Users List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {users.map((usr) => (
            <div 
              key={usr.id} 
              className="flex-between"
              style={{ 
                padding: '8px 12px', 
                background: 'rgba(0, 0, 0, 0.1)', 
                border: '1px solid var(--surface-border)', 
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {usr.avatar ? (
                  <img 
                    src={usr.avatar} 
                    alt={usr.name} 
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '1.2rem' }}>{usr.emoji}</span>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600 }}>{usr.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {usr.id === 'usr-1' ? 'Membro Principal' : 'Membro Compartilhado'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => onDeleteUser(usr.id)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                disabled={users.length <= 1 || usr.id === 'usr-1'}
                title={usr.id === 'usr-1' ? "O usuário principal não pode ser excluído!" : "Excluir Membro"}
              >
                <Trash2 
                  size={14} 
                  className="delete-btn" 
                  style={{ opacity: (users.length <= 1 || usr.id === 'usr-1') ? 0.4 : 1 }} 
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Fixed Expenses */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: 'var(--color-brand)' }} />
          Despesas Fixas Mensais
        </h3>

        {/* Add Fixed Expense Form */}
        <form onSubmit={handleAddFixedExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              type="text"
              value={newFeName}
              onChange={(e) => setNewFeName(e.target.value)}
              placeholder="Nome (ex: Netflix)"
              required
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)'
              }}
            />
            <input
              type="number"
              value={newFeAmount}
              onChange={(e) => setNewFeAmount(e.target.value)}
              placeholder="Valor R$"
              step="0.01"
              required
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select
              value={newFeCategoryIndex}
              onChange={(e) => setNewFeCategoryIndex(parseInt(e.target.value))}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              {categories.map((c, idx) => (
                <option key={c.id} value={idx}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
            
            <input
              type="number"
              value={newFeDueDay}
              onChange={(e) => setNewFeDueDay(e.target.value)}
              placeholder="Dia do Vencimento"
              min="1"
              max="31"
              required
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pagar com qual conta?</span>
            <select
              value={newFeAccountId}
              onChange={(e) => setNewFeAccountId(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--surface-border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.emoji} {acc.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="action-btn inflow" style={{ borderRadius: '8px', padding: '10px', fontSize: '0.9rem' }}>
            <Plus size={16} /> Adicionar Compromisso Fixo
          </button>
        </form>

        {/* Fixed Expenses List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {fixedExpenses.length === 0 ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block', padding: '10px' }}>
              Nenhuma despesa fixa cadastrada.
            </span>
          ) : (
            fixedExpenses.map((fe) => (
              <div 
                key={fe.id} 
                className="flex-between"
                style={{ 
                  padding: '8px 12px', 
                  background: 'rgba(0, 0, 0, 0.1)', 
                  border: '1px solid var(--surface-border)', 
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{fe.emoji}</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{fe.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>Vence dia {fe.dueDay}</span>
                      {(() => {
                        const acc = accounts.find(a => a.id === fe.defaultAccountId);
                        return acc ? (
                          <>
                            <span>•</span>
                            <span>{acc.emoji} {acc.name}</span>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700 }}>R$ {fe.amount.toFixed(2)}</span>
                  <button 
                    onClick={() => handleDeleteFixedExpense(fe.id)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} className="delete-btn" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Category Customizer */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: 'var(--color-brand-purple)' }} />
          Suas Categorias
        </h3>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            value={newCatEmoji}
            onChange={(e) => setNewCatEmoji(e.target.value)}
            placeholder="Emoji (ex: 🍔)"
            required
            style={{
              width: '80px',
              textAlign: 'center',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--surface-border)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              fontSize: '1.2rem'
            }}
          />
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nome (ex: Mercado)"
            required
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--surface-border)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)'
            }}
          />
          <button type="submit" className="action-btn inflow" style={{ width: '42px', borderRadius: '8px', padding: 0 }}>
            <Plus size={18} />
          </button>
        </form>

        {/* Categories List */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {categories.map((c) => (
            <div 
              key={c.id} 
              className="flex-between"
              style={{ 
                padding: '8px 10px', 
                background: 'rgba(0, 0, 0, 0.1)', 
                border: '1px solid var(--surface-border)', 
                borderRadius: '8px',
                fontSize: '0.8rem'
              }}
            >
              <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span>{c.emoji}</span>
                <span>{c.name}</span>
              </span>
              <button 
                onClick={() => handleDeleteCategory(c.id)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <Trash2 size={13} className="delete-btn" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Resets / Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          onClick={onResetData} 
          style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            color: 'var(--color-outflow)', 
            padding: '12px', 
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <RefreshCw size={15} />
          Redefinir Dados de Fábrica
        </button>
      </div>
    </div>
  );
};

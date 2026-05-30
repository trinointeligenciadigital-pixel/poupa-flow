import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { QuickAdd } from './components/QuickAdd';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Home, Plus, History as HistoryIcon, Sun, Moon, Sparkles, Settings as SettingsIcon } from 'lucide-react';

export interface User {
  id: string;
  name: string;
  emoji: string;
  avatar?: string; // Base64 data URI
}

export interface Transaction {
  id: string;
  type: 'inflow' | 'outflow';
  amount: number;
  category: string;
  emoji: string;
  date: string;
  accountId: string;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  emoji: string;
  dueDay: number;
  paidMonths: string[]; // format "YYYY-MM"
  defaultAccountId: string;
}

export interface Account {
  id: string;
  name: string;
  emoji: string;
  color: string;
  initialBalance: number;
}

// Utility: calculate live account balance
export function calcAccountBalance(account: Account, transactions: Transaction[]): number {
  const txs = transactions.filter(t => t.accountId === account.id);
  const inflow = txs.filter(t => t.type === 'inflow').reduce((sum, t) => sum + t.amount, 0);
  const outflow = txs.filter(t => t.type === 'outflow').reduce((sum, t) => sum + t.amount, 0);
  return account.initialBalance + inflow - outflow;
}

// Utility: get latest transaction date for an account
export function getLastActivity(account: Account, transactions: Transaction[]): string | null {
  const txs = transactions
    .filter(t => t.accountId === account.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return txs.length > 0 ? txs[0].date : null;
}

const DEFAULT_USERS: User[] = [
  { id: 'usr-1', name: 'Alisson', emoji: '🧔' },
  { id: 'usr-2', name: 'Thayane', emoji: '👩' }
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Nubank',   emoji: '🟣', color: '#8b5cf6', initialBalance: 1500.00 },
  { id: 'acc-2', name: 'Carteira', emoji: '💵', color: '#10b981', initialBalance: 100.00  },
  { id: 'acc-3', name: 'Itaú',     emoji: '🟧', color: '#f59e0b', initialBalance: 2000.00 },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', emoji: '🍔', name: 'Comida' },
  { id: 'cat-2', emoji: '🚗', name: 'Transporte' },
  { id: 'cat-3', emoji: '🏠', name: 'Casa' },
  { id: 'cat-4', emoji: '🛍️', name: 'Compras' },
  { id: 'cat-5', emoji: '🎉', name: 'Lazer' },
  { id: 'cat-6', emoji: '🩺', name: 'Saúde' },
  { id: 'cat-7', emoji: '💡', name: 'Contas' },
  { id: 'cat-8', emoji: '💰', name: 'Salário' },
  { id: 'cat-9', emoji: '🎁', name: 'Outros' },
];

const DEFAULT_FIXED_EXPENSES: FixedExpense[] = [
  {
    id: 'fixed-1',
    name: 'Aluguel',
    amount: 850.00,
    category: 'Casa',
    emoji: '🏠',
    dueDay: 5,
    paidMonths: [],
    defaultAccountId: 'acc-1',
  },
  {
    id: 'fixed-2',
    name: 'Internet',
    amount: 120.00,
    category: 'Contas',
    emoji: '💡',
    dueDay: 10,
    paidMonths: [],
    defaultAccountId: 'acc-1',
  },
  {
    id: 'fixed-3',
    name: 'Netflix',
    amount: 55.90,
    category: 'Lazer',
    emoji: '🎉',
    dueDay: 15,
    paidMonths: [],
    defaultAccountId: 'acc-1',
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'mock-1',
    type: 'inflow',
    amount: 3500.00,
    category: 'Salário',
    emoji: '💰',
    accountId: 'acc-1',
    userId: 'usr-1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    type: 'outflow',
    amount: 850.00,
    category: 'Casa',
    emoji: '🏠',
    accountId: 'acc-1',
    userId: 'usr-1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    type: 'outflow',
    amount: 150.00,
    category: 'Comida',
    emoji: '🍔',
    accountId: 'acc-2',
    userId: 'usr-2',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-4',
    type: 'outflow',
    amount: 42.50,
    category: 'Transporte',
    emoji: '🚗',
    accountId: 'acc-2',
    userId: 'usr-1',
    date: new Date().toISOString(),
  },
  {
    id: 'mock-5',
    type: 'outflow',
    amount: 120.00,
    category: 'Lazer',
    emoji: '🎉',
    accountId: 'acc-3',
    userId: 'usr-2',
    date: new Date().toISOString(),
  }
];

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'history' | 'settings'>('dashboard');

  // State: Users
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('poupa_flow_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_USERS;
  });

  // State: Active User
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem('poupa_flow_active_user') || 'usr-1';
  });

  // State: Accounts
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('poupa_flow_accounts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_ACCOUNTS;
  });

  // State: Last account used (for smart default selection)
  const [lastAccountId, setLastAccountId] = useState<string>(() => {
    return localStorage.getItem('poupa_flow_last_account') || 'acc-1';
  });

  // State: Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('poupa_flow_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_TRANSACTIONS;
  });

  // State: Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('poupa_flow_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_CATEGORIES;
  });

  // State: Fixed Expenses
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => {
    const saved = localStorage.getItem('poupa_flow_fixed');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const defaults = DEFAULT_FIXED_EXPENSES.map((fe): FixedExpense => ({ ...fe, paidMonths: [] }));
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    defaults[0].paidMonths = [currentMonthStr];
    return defaults;
  });

  // State: Monthly Budget Limit
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('poupa_flow_budget');
    return saved ? parseFloat(saved) : 2500;
  });

  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('poupa_flow_theme') === 'light';
  });

  // Persist states
  useEffect(() => {
    localStorage.setItem('poupa_flow_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('poupa_flow_active_user', activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    localStorage.setItem('poupa_flow_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('poupa_flow_last_account', lastAccountId);
  }, [lastAccountId]);

  useEffect(() => {
    localStorage.setItem('poupa_flow_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('poupa_flow_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('poupa_flow_fixed', JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem('poupa_flow_budget', monthlyBudget.toString());
  }, [monthlyBudget]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isLightMode) {
      root.classList.add('light-mode');
      localStorage.setItem('poupa_flow_theme', 'light');
    } else {
      root.classList.remove('light-mode');
      localStorage.setItem('poupa_flow_theme', 'dark');
    }
  }, [isLightMode]);

  // Transaction handlers
  const handleAddTransaction = (
    type: 'inflow' | 'outflow',
    amount: number,
    category: string,
    emoji: string,
    accountId: string
  ) => {
    const newTx: Transaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      category,
      emoji,
      accountId,
      userId: activeUserId,
      date: new Date().toISOString(),
    };

    setLastAccountId(accountId);
    setTransactions(prev => [newTx, ...prev]);
    setActiveTab('dashboard');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Fixed Expense pay action — uses activeUserId
  const handlePayFixedExpense = (id: string, accountId?: string) => {
    const currentMonthStr = new Date().toISOString().substring(0, 7);

    setFixedExpenses(prev => prev.map(fe => {
      if (fe.id === id && !fe.paidMonths.includes(currentMonthStr)) {
        const targetAccount = accountId ?? fe.defaultAccountId ?? lastAccountId;
        const newTx: Transaction = {
          id: `fe-${fe.id}-${Date.now()}`,
          type: 'outflow',
          amount: fe.amount,
          category: fe.category,
          emoji: fe.emoji,
          accountId: targetAccount,
          userId: activeUserId,
          date: new Date().toISOString(),
        };
        setTransactions(txs => [newTx, ...txs]);
        return { ...fe, paidMonths: [...fe.paidMonths, currentMonthStr] };
      }
      return fe;
    }));
  };

  // Account handlers
  const handleAddAccount = (account: Account) => {
    setAccounts(prev => [...prev, account]);
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      alert('Você precisa manter pelo menos uma conta!');
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    // Move orphaned transactions to first remaining account
    const remaining = accounts.filter(a => a.id !== id);
    if (remaining.length > 0) {
      setTransactions(prev => prev.map(t =>
        t.accountId === id ? { ...t, accountId: remaining[0].id } : t
      ));
      if (lastAccountId === id) setLastAccountId(remaining[0].id);
    }
  };

  // User handlers
  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) {
      alert('Você precisa manter pelo menos um usuário ativo!');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    const remaining = users.filter(u => u.id !== id);
    if (remaining.length > 0) {
      setTransactions(prev => prev.map(t =>
        t.userId === id ? { ...t, userId: remaining[0].id } : t
      ));
      if (activeUserId === id) setActiveUserId(remaining[0].id);
    }
  };

  // Reset all to defaults
  const handleResetData = () => {
    if (window.confirm('Deseja mesmo redefinir o aplicativo com os dados de demonstração?')) {
      setUsers(DEFAULT_USERS);
      setActiveUserId('usr-1');
      setAccounts(DEFAULT_ACCOUNTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setCategories(DEFAULT_CATEGORIES);
      const defaults = DEFAULT_FIXED_EXPENSES.map((fe): FixedExpense => ({ ...fe, paidMonths: [] }));
      const currentMonthStr = new Date().toISOString().substring(0, 7);
      defaults[0].paidMonths = [currentMonthStr];
      setFixedExpenses(defaults);
      setMonthlyBudget(2500);
      setLastAccountId('acc-1');
      setActiveTab('dashboard');
    }
  };

  function toggleTheme() {
    setIsLightMode(prev => !prev);
  }

  // Active user object
  const activeUser = users.find(u => u.id === activeUserId) || users[0] || DEFAULT_USERS[0];

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        {/* User Profile Switcher (Simulador) */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => {
              const currentIndex = users.findIndex(u => u.id === activeUserId);
              const nextIndex = (currentIndex + 1) % users.length;
              setActiveUserId(users[nextIndex].id);
            }}
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'var(--transition-spring)',
              boxShadow: 'var(--shadow-sm)'
            }}
            title={`Logado como ${activeUser.name}. Clique para alternar.`}
          >
            {activeUser.avatar ? (
              <img 
                src={activeUser.avatar} 
                alt={activeUser.name} 
                style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span>{activeUser.emoji}</span>
            )}
            <span style={{ maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeUser.name}
            </span>
          </button>
        </div>

        {/* Logo */}
        <div className="app-logo" style={{ fontSize: '1.15rem' }}>
          <Sparkles size={18} fill="currentColor" />
          <span>PoupaFlow</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)'
          }}
          title={isLightMode ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
        >
          {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>

      {/* Main Page Area */}
      <main className="app-content">
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            fixedExpenses={fixedExpenses}
            monthlyBudget={monthlyBudget}
            accounts={accounts}
            users={users}
            onPayFixedExpense={handlePayFixedExpense}
          />
        )}
        {activeTab === 'add' && (
          <QuickAdd
            categories={categories}
            accounts={accounts}
            lastAccountId={lastAccountId}
            onAddTransaction={handleAddTransaction}
          />
        )}
        {activeTab === 'history' && (
          <History
            transactions={transactions}
            accounts={accounts}
            users={users}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
        {activeTab === 'settings' && (
          <Settings
            categories={categories}
            setCategories={setCategories}
            fixedExpenses={fixedExpenses}
            setFixedExpenses={setFixedExpenses}
            monthlyBudget={monthlyBudget}
            setMonthlyBudget={setMonthlyBudget}
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
            users={users}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="bottom-nav">
        <button
          id="nav-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <Home />
          <span>Início</span>
        </button>

        <button
          id="nav-add"
          onClick={() => setActiveTab('add')}
          className={`nav-btn ${activeTab === 'add' ? 'active' : ''}`}
          style={{
            background: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-purple) 100%)',
            color: '#ffffff',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            padding: '0',
            transform: 'translateY(-12px)',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            border: '4px solid var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Plus size={28} strokeWidth={2.5} style={{ transform: activeTab === 'add' ? 'rotate(45deg)' : 'none' }} />
        </button>

        <button
          id="nav-history"
          onClick={() => setActiveTab('history')}
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
        >
          <HistoryIcon />
          <span>Extrato</span>
        </button>

        <button
          id="nav-settings"
          onClick={() => setActiveTab('settings')}
          className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <SettingsIcon />
          <span>Ajustes</span>
        </button>
      </nav>
    </div>
  );
}

export default App;

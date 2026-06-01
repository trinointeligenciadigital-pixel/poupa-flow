import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { QuickAdd } from './components/QuickAdd';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { supabase } from './supabaseClient';
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

// Nota: A função calcAccountBalance agora é importada diretamente de ./utils/finance e está 100% coberta por testes automatizados (Skill 5 Trino).

// Utility: get latest transaction date for an account
export function getLastActivity(account: Account, transactions: Transaction[]): string | null {
  const txs = transactions
    .filter(t => t.accountId === account.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return txs.length > 0 ? txs[0].date : null;
}

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

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'history' | 'settings'>('dashboard');
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // States loaded from Supabase
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(2500);
  
  // Local-only states
  const [lastAccountId, setLastAccountId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('poupa_flow_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_CATEGORIES;
  });

  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('poupa_flow_theme') === 'light';
  });

  // Track session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setActiveUserId(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setActiveUserId(session.user.id);
      } else {
        setActiveUserId('');
        setGroupId('');
        setInviteCode('');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data from Supabase when logged in
  const fetchData = async (uid: string) => {
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', uid)
        .single();

      if (pErr || !profile || !profile.group_id) {
        console.error("Profile not found or no group_id", pErr);
        return;
      }

      const gId = profile.group_id;
      setGroupId(gId);

      // Fetch group invite code
      const { data: group } = await supabase
        .from('groups')
        .select('invite_code')
        .eq('id', gId)
        .single();

      if (group) {
        setInviteCode(group.invite_code);
      }

      // Fetch group profiles (users)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, emoji, avatar')
        .eq('group_id', gId);

      if (profiles) {
        setUsers(profiles.map(p => ({
          id: p.id,
          name: p.name,
          emoji: p.emoji,
          avatar: p.avatar
        })));
      }

      // Fetch accounts
      const { data: accs } = await supabase
        .from('accounts')
        .select('id, name, emoji, color, initial_balance')
        .eq('group_id', gId);

      if (accs) {
        const loadedAccs = accs.map(a => ({
          id: a.id,
          name: a.name,
          emoji: a.emoji,
          color: a.color,
          initialBalance: Number(a.initial_balance)
        }));
        setAccounts(loadedAccs);
        if (loadedAccs.length > 0 && !lastAccountId) {
          setLastAccountId(loadedAccs[0].id);
        }
      }

      // Fetch settings (budget)
      const { data: settings } = await supabase
        .from('group_settings')
        .select('monthly_budget')
        .eq('group_id', gId)
        .single();

      if (settings) {
        setMonthlyBudget(Number(settings.monthly_budget));
      }

      // Fetch transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('id, type, amount, category, emoji, date, account_id, user_id')
        .eq('group_id', gId)
        .order('date', { ascending: false });

      if (txs) {
        setTransactions(txs.map(t => ({
          id: t.id,
          type: t.type as 'inflow' | 'outflow',
          amount: Number(t.amount),
          category: t.category,
          emoji: t.emoji,
          date: t.date,
          accountId: t.account_id,
          userId: t.user_id
        })));
      }

      // Fetch fixed expenses
      const { data: fixed } = await supabase
        .from('fixed_expenses')
        .select('id, name, amount, category, emoji, due_day, paid_months, default_account_id')
        .eq('group_id', gId);

      if (fixed) {
        setFixedExpenses(fixed.map(fe => ({
          id: fe.id,
          name: fe.name,
          amount: Number(fe.amount),
          category: fe.category,
          emoji: fe.emoji,
          dueDay: fe.due_day,
          paidMonths: fe.paid_months || [],
          defaultAccountId: fe.default_account_id
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeUserId) return;

    fetchData(activeUserId);

    // Subscribe to DB changes for real-time multiplayer updates!
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData(activeUserId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeUserId]);

  // Persist categories & theme locally
  useEffect(() => {
    localStorage.setItem('poupa_flow_categories', JSON.stringify(categories));
  }, [categories]);

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
  const handleAddTransaction = async (
    type: 'inflow' | 'outflow',
    amount: number,
    category: string,
    emoji: string,
    accountId: string
  ) => {
    try {
      setLastAccountId(accountId);
      const { error } = await supabase
        .from('transactions')
        .insert({
          group_id: groupId,
          account_id: accountId,
          user_id: activeUserId,
          type,
          amount,
          category,
          emoji,
          date: new Date().toISOString()
        });

      if (error) throw error;
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar transação no banco.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir transação.');
    }
  };

  // Fixed Expense pay action
  const handlePayFixedExpense = async (id: string, accountId?: string) => {
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const fe = fixedExpenses.find(x => x.id === id);
    if (!fe || fe.paidMonths.includes(currentMonthStr)) return;

    try {
      const targetAccount = accountId ?? fe.defaultAccountId ?? lastAccountId;

      // 1. Insert transaction
      const { error: txErr } = await supabase
        .from('transactions')
        .insert({
          group_id: groupId,
          account_id: targetAccount,
          user_id: activeUserId,
          type: 'outflow',
          amount: fe.amount,
          category: fe.category,
          emoji: fe.emoji,
          date: new Date().toISOString()
        });

      if (txErr) throw txErr;

      // 2. Update paid months
      const { error: feErr } = await supabase
        .from('fixed_expenses')
        .update({
          paid_months: [...fe.paidMonths, currentMonthStr]
        })
        .eq('id', id);

      if (feErr) throw feErr;
    } catch (err) {
      console.error(err);
      alert('Erro ao pagar despesa fixa.');
    }
  };

  // Account handlers
  const handleAddAccount = async (account: Account) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .insert({
          group_id: groupId,
          name: account.name,
          emoji: account.emoji,
          color: account.color,
          initial_balance: account.initialBalance
        });

      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar conta.');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (accounts.length <= 1) {
      alert('Você precisa manter pelo menos uma conta!');
      return;
    }

    try {
      // 1. Delete account from database
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir conta.');
    }
  };

  // User handlers (Profiles)
  const handleAddUser = (user: User) => {
    alert(`Para adicionar ${user.name}, compartilhe o código de convite do grupo com ele(a) para que crie uma conta real.`);
  };

  const handleDeleteUser = async (id: string) => {
    if (id === activeUserId) {
      alert('Você não pode se excluir do grupo!');
      return;
    }

    if (window.confirm('Deseja mesmo desvincular este membro do seu grupo?')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ group_id: null })
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error(err);
        alert('Erro ao remover membro do grupo.');
      }
    }
  };

  // Reset all to defaults
  const handleResetData = async () => {
    if (window.confirm('Deseja mesmo redefinir o aplicativo com os dados de demonstração no banco de dados?')) {
      try {
        setLoading(true);
        // Delete all
        await supabase.from('transactions').delete().eq('group_id', groupId);
        await supabase.from('fixed_expenses').delete().eq('group_id', groupId);
        await supabase.from('accounts').delete().eq('group_id', groupId);
        
        // Update budget
        await supabase.from('group_settings').update({ monthly_budget: 2500 }).eq('group_id', groupId);
        
        // Re-insert default accounts
        const { data: newAccs, error: accErr } = await supabase.from('accounts').insert([
          { group_id: groupId, name: 'Nubank', emoji: '🟣', color: '#8b5cf6', initial_balance: 1500.00 },
          { group_id: groupId, name: 'Carteira', emoji: '💵', color: '#10b981', initial_balance: 100.00 },
          { group_id: groupId, name: 'Itaú', emoji: '🟧', color: '#f59e0b', initial_balance: 2000.00 }
        ]).select();

        if (accErr || !newAccs) throw accErr;

        const nubankId = newAccs.find(a => a.name === 'Nubank')?.id || newAccs[0].id;

        // Re-insert default fixed expenses
        await supabase.from('fixed_expenses').insert([
          { group_id: groupId, name: 'Aluguel', amount: 850.00, category: 'Casa', emoji: '🏠', due_day: 5, default_account_id: nubankId, paid_months: [new Date().toISOString().substring(0, 7)] },
          { group_id: groupId, name: 'Internet', amount: 120.00, category: 'Contas', emoji: '💡', due_day: 10, default_account_id: nubankId },
          { group_id: groupId, name: 'Netflix', amount: 55.90, category: 'Lazer', emoji: '🎉', due_day: 15, default_account_id: nubankId }
        ]);

        // Re-insert mock transactions
        await supabase.from('transactions').insert([
          { group_id: groupId, type: 'inflow', amount: 3500.00, category: 'Salário', emoji: '💰', account_id: nubankId, user_id: activeUserId, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { group_id: groupId, type: 'outflow', amount: 850.00, category: 'Casa', emoji: '🏠', account_id: nubankId, user_id: activeUserId, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
        ]);

        alert('Dados redefinidos com sucesso!');
        await fetchData(activeUserId);
      } catch (err) {
        console.error(err);
        alert('Erro ao redefinir os dados.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateBudget = async (budget: number) => {
    try {
      const { error } = await supabase
        .from('group_settings')
        .upsert({ group_id: groupId, monthly_budget: budget });

      if (error) throw error;
      setMonthlyBudget(budget);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar meta de gastos.');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Deseja mesmo sair da sua conta?')) {
      await supabase.auth.signOut();
    }
  };

  function toggleTheme() {
    setIsLightMode(prev => !prev);
  }

  // Active user object
  const activeUser = users.find(u => u.id === activeUserId) || { id: activeUserId, name: 'Usuário', emoji: '👤' };

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
        <div className="app-logo" style={{ fontSize: '2rem' }}>
          <Sparkles size={28} fill="currentColor" />
          <span>PoupaFlow</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Carregando suas finanças...</p>
      </div>
    );
  }

  if (!activeUserId) {
    return (
      <div className="app-container">
        <Login onLoginSuccess={(uid) => setActiveUserId(uid)} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        {/* User Profile Info */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
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
              fontWeight: 700
            }}
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
            <span style={{ maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeUser.name}
            </span>
          </div>
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
            setMonthlyBudget={handleUpdateBudget}
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
            users={users}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onResetData={handleResetData}
            inviteCode={inviteCode}
            onLogout={handleLogout}
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

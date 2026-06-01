export interface Transaction {
  id?: string;
  type: 'inflow' | 'outflow';
  amount: number;
  category: string;
  emoji: string;
  date: string;
  accountId: string;
  userId: string;
}

export interface Account {
  id: string;
  name: string;
  emoji: string;
  color: string;
  initialBalance: number;
}

/**
 * Calcula o total de entradas (inflows) em uma lista de transações
 */
export function calculateInflow(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'inflow')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calcula o total de saídas (outflows) em uma lista de transações
 */
export function calculateOutflow(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'outflow')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calcula o saldo atual de uma conta específica considerando seu saldo inicial e as transações associadas
 */
export function calcAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  const accountTransactions = transactions.filter(t => t.accountId === account.id);
  const inflows = calculateInflow(accountTransactions);
  const outflows = calculateOutflow(accountTransactions);
  
  return account.initialBalance + inflows - outflows;
}

/**
 * Calcula o saldo geral consolidado de todas as contas combinando seus saldos iniciais e transações globais
 */
export function calculateConsolidatedBalance(
  accounts: Account[],
  transactions: Transaction[]
): number {
  const initialSum = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
  const totalInflows = calculateInflow(transactions);
  const totalOutflows = calculateOutflow(transactions);
  
  return initialSum + totalInflows - totalOutflows;
}

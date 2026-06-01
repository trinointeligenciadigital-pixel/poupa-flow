import { describe, it, expect } from 'vitest';
import {
  calculateInflow,
  calculateOutflow,
  calcAccountBalance,
  calculateConsolidatedBalance,
} from './finance';
import type { Transaction, Account } from './finance';

describe('Utilitários Financeiros - PoupaFlow Trino Standards', () => {
  // Dados de teste mockados
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      accountId: 'acc-nubank',
      userId: 'user-1',
      type: 'inflow',
      amount: 3500.00,
      category: 'Salário',
      emoji: '💰',
      date: '2026-06-01T12:00:00Z',
    },
    {
      id: 'tx-2',
      accountId: 'acc-nubank',
      userId: 'user-1',
      type: 'outflow',
      amount: 850.00,
      category: 'Casa',
      emoji: '🏠',
      date: '2026-06-01T14:00:00Z',
    },
    {
      id: 'tx-3',
      accountId: 'acc-inter',
      userId: 'user-2',
      type: 'outflow',
      amount: 150.00,
      category: 'Alimentação',
      emoji: '🍔',
      date: '2026-06-01T15:00:00Z',
    },
    {
      id: 'tx-4',
      accountId: 'acc-inter',
      userId: 'user-1',
      type: 'inflow',
      amount: 200.00,
      category: 'Freelance',
      emoji: '💻',
      date: '2026-06-01T16:00:00Z',
    },
  ];

  const mockAccounts: Account[] = [
    {
      id: 'acc-nubank',
      name: 'Nubank',
      emoji: '💜',
      color: '#8A05BE',
      initialBalance: 1000.00,
    },
    {
      id: 'acc-inter',
      name: 'Inter',
      emoji: '🧡',
      color: '#FF7A00',
      initialBalance: 500.00,
    },
  ];

  describe('calculateInflow', () => {
    it('deve calcular a soma correta apenas das entradas (inflows)', () => {
      const result = calculateInflow(mockTransactions);
      expect(result).toBe(3700.00); // 3500 + 200
    });

    it('deve retornar zero se a lista de transações for vazia', () => {
      expect(calculateInflow([])).toBe(0);
    });

    it('deve retornar zero se não houver entradas na lista', () => {
      const onlyOutflows = mockTransactions.filter(t => t.type === 'outflow');
      expect(calculateInflow(onlyOutflows)).toBe(0);
    });
  });

  describe('calculateOutflow', () => {
    it('deve calcular a soma correta apenas das saídas (outflows)', () => {
      const result = calculateOutflow(mockTransactions);
      expect(result).toBe(1000.00); // 850 + 150
    });

    it('deve retornar zero se a lista for vazia', () => {
      expect(calculateOutflow([])).toBe(0);
    });
  });

  describe('calcAccountBalance', () => {
    it('deve calcular o saldo correto de uma conta específica considerando saldo inicial', () => {
      // Nubank: Inicial 1000 + Entrada 3500 - Saída 850 = 3650
      const balanceNubank = calcAccountBalance(mockAccounts[0], mockTransactions);
      expect(balanceNubank).toBe(3650.00);

      // Inter: Inicial 500 + Entrada 200 - Saída 150 = 550
      const balanceInter = calcAccountBalance(mockAccounts[1], mockTransactions);
      expect(balanceInter).toBe(550.00);
    });

    it('deve manter o saldo inicial inalterado se não houver transações para a conta', () => {
      const balance = calcAccountBalance(mockAccounts[0], []);
      expect(balance).toBe(1000.00);
    });
  });

  describe('calculateConsolidatedBalance', () => {
    it('deve somar todos os saldos iniciais e balancear com entradas e saídas globais', () => {
      // Iniciais: 1000 + 500 = 1500
      // Inflows: 3700
      // Outflows: 1000
      // Esperado: 1500 + 3700 - 1000 = 4200
      const consolidated = calculateConsolidatedBalance(mockAccounts, mockTransactions);
      expect(consolidated).toBe(4200.00);
    });

    it('deve retornar a soma dos saldos iniciais se não houver nenhuma transação', () => {
      const consolidated = calculateConsolidatedBalance(mockAccounts, []);
      expect(consolidated).toBe(1500.00);
    });
  });
});

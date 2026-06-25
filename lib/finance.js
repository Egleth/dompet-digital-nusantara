import { query } from './db';

export function toNumber(value) {
  return Number.parseFloat(value ?? 0) || 0;
}

export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(toNumber(value));
}

export function getMonthKey(date = new Date()) {
  const parsed = new Date(date);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
}

export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium'
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function buildTransactionWhere(userId, filters = {}) {
  const where = ['t.user_id = ?'];
  const params = [userId];

  if (filters.q) {
    where.push('(t.title LIKE ? OR t.merchant LIKE ? OR c.name LIKE ?)');
    const q = `%${filters.q}%`;
    params.push(q, q, q);
  }

  if (filters.type && ['income', 'expense'].includes(filters.type)) {
    where.push('t.txn_type = ?');
    params.push(filters.type);
  }

  if (filters.category) {
    where.push('c.name = ?');
    params.push(filters.category);
  }

  if (filters.from) {
    where.push('DATE(t.occurred_at) >= ?');
    params.push(filters.from);
  }

  if (filters.to) {
    where.push('DATE(t.occurred_at) <= ?');
    params.push(filters.to);
  }

  return { sql: where.join(' AND '), params };
}

export async function getCategories(userId) {
  return query(
    `SELECT id, name, type, color, created_at, updated_at
     FROM categories
     WHERE user_id = ?
     ORDER BY name ASC`,
    [userId]
  );
}

export async function getTransactions(userId, filters = {}) {
  const where = buildTransactionWhere(userId, filters);

  return query(
    `SELECT t.id, t.user_id, t.category_id, t.txn_type, t.title, t.merchant,
            t.amount, t.occurred_at, t.notes, t.created_at, t.updated_at,
            c.name AS category_name, c.color AS category_color
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE ${where.sql}
     ORDER BY t.occurred_at DESC, t.id DESC`,
    where.params
  );
}

export async function getBudgets(userId) {
  return query(
    `SELECT b.id, b.user_id, b.category_id, b.period_month, b.limit_amount,
            b.created_at, b.updated_at, c.name AS category_name, c.color AS category_color
     FROM budgets b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.user_id = ?
     ORDER BY b.period_month DESC, c.name ASC`,
    [userId]
  );
}

export async function getReminders(userId) {
  return query(
    `SELECT r.id, r.user_id, r.category_id, r.title, r.due_date, r.amount,
            r.status, r.notes, r.created_at, r.updated_at,
            c.name AS category_name, c.color AS category_color
     FROM reminders r
     LEFT JOIN categories c ON c.id = r.category_id
     WHERE r.user_id = ?
     ORDER BY r.status ASC, r.due_date ASC, r.id DESC`,
    [userId]
  );
}

export function computeSummary(transactions = [], budgets = [], reminders = []) {
  const income = transactions
    .filter((item) => item.txn_type === 'income')
    .reduce((total, item) => total + toNumber(item.amount), 0);
  const expense = transactions
    .filter((item) => item.txn_type === 'expense')
    .reduce((total, item) => total + toNumber(item.amount), 0);

  const currentMonth = getMonthKey();
  const monthlyTransactions = transactions.filter((item) => getMonthKey(item.occurred_at) === currentMonth);
  const monthlyExpense = monthlyTransactions
    .filter((item) => item.txn_type === 'expense')
    .reduce((total, item) => total + toNumber(item.amount), 0);
  const monthlyIncome = monthlyTransactions
    .filter((item) => item.txn_type === 'income')
    .reduce((total, item) => total + toNumber(item.amount), 0);

  const categoryTotals = {};
  for (const item of transactions) {
    if (item.txn_type !== 'expense') continue;
    const category = item.category_name || 'Tanpa kategori';
    categoryTotals[category] = (categoryTotals[category] || 0) + toNumber(item.amount);
  }

  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const monthBudgets = budgets.filter((budget) => budget.period_month === currentMonth);
  const budgetTotal = monthBudgets.reduce((total, item) => total + toNumber(item.limit_amount), 0);
  const remainingBudget = budgetTotal - monthlyExpense;
  const usedPercent = budgetTotal > 0 ? Math.min(100, Math.round((monthlyExpense / budgetTotal) * 100)) : 0;
  const pendingReminders = reminders.filter((item) => item.status === 'pending').length;

  return {
    balance: income - expense,
    income,
    expense,
    monthlyIncome,
    monthlyExpense,
    categoryTotals,
    topCategory: categoryEntries[0]?.[0] || 'Belum ada data',
    topCategoryAmount: categoryEntries[0]?.[1] || 0,
    budgetTotal,
    remainingBudget,
    usedPercent,
    pendingReminders
  };
}

export function enrichBudgetsWithUsage(budgets = [], transactions = [], month = getMonthKey()) {
  const spentByCategory = {};

  for (const item of transactions) {
    if (item.txn_type !== 'expense' || getMonthKey(item.occurred_at) !== month) continue;
    const key = item.category_id || 'none';
    spentByCategory[key] = (spentByCategory[key] || 0) + toNumber(item.amount);
  }

  return budgets
    .filter((budget) => budget.period_month === month)
    .map((budget) => {
      const spent = spentByCategory[budget.category_id || 'none'] || 0;
      const limit = toNumber(budget.limit_amount);
      return {
        ...budget,
        spent,
        remaining: limit - spent,
        usedPercent: limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
      };
    });
}

export async function getFinanceData(userId, filters = {}) {
  const [categories, transactions, budgets, reminders] = await Promise.all([
    getCategories(userId),
    getTransactions(userId, filters),
    getBudgets(userId),
    getReminders(userId)
  ]);

  const summary = computeSummary(transactions, budgets, reminders);

  return {
    categories,
    transactions,
    budgets,
    reminders,
    summary
  };
}

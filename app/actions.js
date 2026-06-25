'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clearSession, hashPassword, requireUser, setSession, verifyPassword } from '../lib/auth';
import { isDatabaseSetupError, query, transaction } from '../lib/db';
import { getMonthKey } from '../lib/finance';

function value(formData, name) {
  return String(formData.get(name) || '').trim();
}

function optionalValue(formData, name) {
  const item = value(formData, name);
  return item || null;
}

function amountValue(formData, name) {
  const amount = Number.parseFloat(value(formData, name));
  return Number.isFinite(amount) ? amount : 0;
}

function redirectTo(formData, fallback) {
  const path = value(formData, 'redirectTo') || fallback;
  return path.startsWith('/') ? path : fallback;
}

function goBack(formData, fallback, type, message) {
  const separator = redirectTo(formData, fallback).includes('?') ? '&' : '?';
  redirect(`${redirectTo(formData, fallback)}${separator}${type}=${encodeURIComponent(message)}`);
}

function normalizeDateTime(input) {
  const raw = String(input || '').trim();
  if (!raw) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (raw.length === 16) return `${raw.replace('T', ' ')}:00`;
  return raw.replace('T', ' ');
}

async function execute(connection, sql, params = []) {
  const [rows] = await connection.execute(sql, params);
  return rows;
}

async function ensureCategory(connection, userId, name, type = 'expense') {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;

  const rows = await execute(
    connection,
    'SELECT id FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
    [userId, cleanName]
  );

  if (rows[0]) return rows[0].id;

  const result = await execute(
    connection,
    'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)',
    [userId, cleanName, type]
  );

  return result.insertId;
}

export async function registerAction(formData) {
  const name = value(formData, 'name');
  const email = value(formData, 'email').toLowerCase();
  const phone = optionalValue(formData, 'phone');
  const password = value(formData, 'password');

  if (!name || !email || !password) {
    goBack(formData, '/register', 'error', 'Nama, email, dan password wajib diisi.');
  }

  if (password.length < 6) {
    goBack(formData, '/register', 'error', 'Password minimal 6 karakter.');
  }

  try {
    const passwordHash = await hashPassword(password);
    const result = await query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, phone, passwordHash]
    );
    await setSession({ id: result.insertId, email });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      goBack(formData, '/register', 'error', 'Email sudah terdaftar.');
    }

    if (isDatabaseSetupError(error)) {
      goBack(formData, '/register', 'error', 'Database belum siap. Import sql/schema.sql di phpMyAdmin.');
    }

    throw error;
  }

  redirect('/dashboard');
}

export async function loginAction(formData) {
  const email = value(formData, 'email').toLowerCase();
  const password = value(formData, 'password');

  if (!email || !password) {
    goBack(formData, '/login', 'error', 'Email dan password wajib diisi.');
  }

  try {
    const rows = await query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const user = rows[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      goBack(formData, '/login', 'error', 'Email atau password tidak sesuai.');
    }

    await setSession(user);
  } catch (error) {
    if (isDatabaseSetupError(error)) {
      goBack(formData, '/login', 'error', 'Database belum siap. Import sql/schema.sql di phpMyAdmin.');
    }

    throw error;
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  await clearSession();
  redirect('/login');
}

export async function createTransactionAction(formData) {
  const user = await requireUser();
  const type = value(formData, 'txn_type') === 'income' ? 'income' : 'expense';
  const title = value(formData, 'title');
  const category = value(formData, 'category');
  const merchant = optionalValue(formData, 'merchant');
  const amount = amountValue(formData, 'amount');
  const occurredAt = normalizeDateTime(value(formData, 'occurred_at'));
  const notes = optionalValue(formData, 'notes');

  if (!title || !category || amount <= 0) {
    goBack(formData, '/transactions', 'error', 'Judul, kategori, dan nominal wajib valid.');
  }

  await transaction(async (connection) => {
    const categoryId = await ensureCategory(connection, user.id, category, type);
    await execute(
      connection,
      `INSERT INTO transactions
       (user_id, category_id, txn_type, title, merchant, amount, occurred_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, categoryId, type, title, merchant, amount, occurredAt, notes]
    );
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  goBack(formData, '/transactions', 'success', 'Transaksi tersimpan.');
}

export async function updateTransactionAction(formData) {
  const user = await requireUser();
  const id = Number(value(formData, 'id'));
  const type = value(formData, 'txn_type') === 'income' ? 'income' : 'expense';
  const title = value(formData, 'title');
  const category = value(formData, 'category');
  const merchant = optionalValue(formData, 'merchant');
  const amount = amountValue(formData, 'amount');
  const occurredAt = normalizeDateTime(value(formData, 'occurred_at'));
  const notes = optionalValue(formData, 'notes');

  if (!id || !title || !category || amount <= 0) {
    goBack(formData, '/transactions', 'error', 'Data transaksi belum lengkap.');
  }

  await transaction(async (connection) => {
    const categoryId = await ensureCategory(connection, user.id, category, type);
    await execute(
      connection,
      `UPDATE transactions
       SET category_id = ?, txn_type = ?, title = ?, merchant = ?, amount = ?, occurred_at = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [categoryId, type, title, merchant, amount, occurredAt, notes, id, user.id]
    );
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  goBack(formData, '/transactions', 'success', 'Transaksi diperbarui.');
}

export async function deleteTransactionAction(formData) {
  const user = await requireUser();
  const id = Number(value(formData, 'id'));

  if (id) {
    await query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, user.id]);
  }

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  goBack(formData, '/transactions', 'success', 'Transaksi dihapus.');
}

export async function createCategoryAction(formData) {
  const user = await requireUser();
  const name = value(formData, 'name');
  const type = ['income', 'expense', 'both'].includes(value(formData, 'type')) ? value(formData, 'type') : 'expense';
  const color = value(formData, 'color') || '#1593f3';

  if (!name) {
    goBack(formData, '/categories', 'error', 'Nama kategori wajib diisi.');
  }

  try {
    await query('INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)', [
      user.id,
      name,
      type,
      color
    ]);
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      goBack(formData, '/categories', 'error', 'Kategori dengan nama itu sudah ada.');
    }

    throw error;
  }

  revalidatePath('/categories');
  goBack(formData, '/categories', 'success', 'Kategori tersimpan.');
}

export async function updateCategoryAction(formData) {
  const user = await requireUser();
  const id = Number(value(formData, 'id'));
  const name = value(formData, 'name');
  const type = ['income', 'expense', 'both'].includes(value(formData, 'type')) ? value(formData, 'type') : 'expense';
  const color = value(formData, 'color') || '#1593f3';

  if (!id || !name) {
    goBack(formData, '/categories', 'error', 'Data kategori belum lengkap.');
  }

  await query(
    'UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ? AND user_id = ?',
    [name, type, color, id, user.id]
  );

  revalidatePath('/categories');
  revalidatePath('/transactions');
  revalidatePath('/budgets');
  goBack(formData, '/categories', 'success', 'Kategori diperbarui.');
}

export async function deleteCategoryAction(formData) {
  const user = await requireUser();
  const id = Number(value(formData, 'id'));

  if (id) {
    await query('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, user.id]);
  }

  revalidatePath('/categories');
  revalidatePath('/transactions');
  revalidatePath('/budgets');
  goBack(formData, '/categories', 'success', 'Kategori dihapus.');
}

export async function createBudgetAction(formData) {
  const user = await requireUser();
  const month = value(formData, 'period_month') || getMonthKey();
  const category = value(formData, 'category');
  const limit = amountValue(formData, 'limit_amount');

  if (!category || limit <= 0) {
    goBack(formData, '/budgets', 'error', 'Kategori dan limit budget wajib valid.');
  }

  await transaction(async (connection) => {
    const categoryId = await ensureCategory(connection, user.id, category, 'expense');
    await execute(
      connection,
      `INSERT INTO budgets (user_id, category_id, period_month, limit_amount)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE limit_amount = VALUES(limit_amount)`,
      [user.id, categoryId, month, limit]
    );
  });

  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  goBack(formData, '/budgets', 'success', 'Budget tersimpan.');
}

export async function updateBudgetAction(formData) {
  const user = await requireUser();
  const id = Number(value(formData, 'id'));
  const month = value(formData, 'period_month') || getMonthKey();
  const category = value(formData, 'category');
  const limit = amountValue(formData, 'limit_amount');

  if (!id || !category || limit <= 0) {
    goBack(formData, '/budgets', 'error', 'Data budget belum lengkap.');
  }

  await transaction(async (connection) => {
    const categoryId = await ensureCategory(connection, user.id, category, 'expense');
    await execute(
      connection,
      'UPDATE budgets SET category_id = ?, period_month = ?, limit_amount = ? WHERE id = ? AND user_id = ?',
      [categoryId, month, limit, id, user.id]
    );
  });

  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  goBack(formData, '/budgets', 'success', 'Budget diperbarui.');
}

export async function deleteBudgetAction(formData) {
  const user = await requireUser();
  const id = Number(value(formData, 'id'));

  if (id) {
    await query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, user.id]);
  }

  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  goBack(formData, '/budgets', 'success', 'Budget dihapus.');
}

export async function createReminderAction(formData) {
  const user = await requireUser();
  const title = value(formData, 'title');
  const category = optionalValue(formData, 'category');
  const dueDate = value(formData, 'due_date');
  const amount = amountValue(formData, 'amount') || null;
  const notes = optionalValue(formData, 'notes');

  if (!title || !dueDate) {
    goBack(formData, '/reminders', 'error', 'Judul dan tanggal wajib diisi.');
  }

  await transaction(async (connection) => {
    const categoryId = category ? await ensureCategory(connection, user.id, category, 'expense') : null;
    await execute(
      connection,
      `INSERT INTO reminders (user_id, category_id, title, due_date, amount, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, categoryId, title, dueDate, amount, notes]
    );
  });

  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  goBack(formData, '/reminders', 'success', 'Reminder tersimpan.');
}

export async function updateReminderAction(formData) {
  const user = await requireUser();
  const id = Number(value(formData, 'id'));
  const title = value(formData, 'title');
  const category = optionalValue(formData, 'category');
  const dueDate = value(formData, 'due_date');
  const amount = amountValue(formData, 'amount') || null;
  const status = value(formData, 'status') === 'done' ? 'done' : 'pending';
  const notes = optionalValue(formData, 'notes');

  if (!id || !title || !dueDate) {
    goBack(formData, '/reminders', 'error', 'Data reminder belum lengkap.');
  }

  await transaction(async (connection) => {
    const categoryId = category ? await ensureCategory(connection, user.id, category, 'expense') : null;
    await execute(
      connection,
      `UPDATE reminders
       SET category_id = ?, title = ?, due_date = ?, amount = ?, status = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [categoryId, title, dueDate, amount, status, notes, id, user.id]
    );
  });

  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  goBack(formData, '/reminders', 'success', 'Reminder diperbarui.');
}

export async function completeReminderAction(formData) {
  const user = await requireUser();
  const id = Number(value(formData, 'id'));
  const status = value(formData, 'status') === 'done' ? 'done' : 'pending';

  if (id) {
    await query('UPDATE reminders SET status = ? WHERE id = ? AND user_id = ?', [status, id, user.id]);
  }

  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  goBack(formData, '/reminders', 'success', 'Status reminder diperbarui.');
}

export async function deleteReminderAction(formData) {
  const user = await requireUser();
  const id = Number(value(formData, 'id'));

  if (id) {
    await query('DELETE FROM reminders WHERE id = ? AND user_id = ?', [id, user.id]);
  }

  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  goBack(formData, '/reminders', 'success', 'Reminder dihapus.');
}

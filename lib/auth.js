import crypto from 'crypto';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from './db';

const scryptAsync = promisify(crypto.scrypt);
const SESSION_COOKIE = 'ddn_session';
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.SESSION_SECRET || 'dev-secret-change-this-value';
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function encodeSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function decodeSession(token) {
  if (!token || !token.includes('.')) return null;

  const [body, signature] = token.split('.');
  const expected = sign(body);
  const left = Buffer.from(signature || '');
  const right = Buffer.from(expected);

  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.id || Number(payload.exp) < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const [method, salt, key] = String(storedHash || '').split(':');
  if (method !== 'scrypt' || !salt || !key) return false;

  const derived = await scryptAsync(password, salt, 64);
  const stored = Buffer.from(key, 'hex');
  return stored.length === derived.length && crypto.timingSafeEqual(stored, derived);
}

export async function setSession(user) {
  const store = await cookies();
  const token = encodeSession({
    id: user.id,
    email: user.email,
    exp: Date.now() + SESSION_AGE_SECONDS * 1000
  });

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const session = decodeSession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const rows = await query(
    'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1',
    [session.id]
  );

  return rows[0] || null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

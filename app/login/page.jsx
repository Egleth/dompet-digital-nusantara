import Link from 'next/link';
import { loginAction } from '../actions';
import StatusMessage from '../../components/StatusMessage';

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <h1>Masuk</h1>
        <StatusMessage searchParams={params} />
        <form action={loginAction} className="form-grid">
          <input type="hidden" name="redirectTo" value="/login" />
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="button" type="submit">Masuk</button>
        </form>
        <p>
          Belum punya akun? <Link href="/register">Daftar di sini</Link>
        </p>
      </section>
    </main>
  );
}

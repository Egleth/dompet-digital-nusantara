import Link from 'next/link';
import { registerAction } from '../actions';
import StatusMessage from '../../components/StatusMessage';

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <h1>Daftar Akun</h1>
        <StatusMessage searchParams={params} />
        <form action={registerAction} className="form-grid">
          <input type="hidden" name="redirectTo" value="/register" />
          <div className="field">
            <label htmlFor="name">Nama</label>
            <input id="name" name="name" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="phone">Nomor HP</label>
            <input id="phone" name="phone" autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />
          </div>
          <button className="button" type="submit">Daftar</button>
        </form>
        <p>
          Sudah punya akun? <Link href="/login">Masuk</Link>
        </p>
      </section>
    </main>
  );
}

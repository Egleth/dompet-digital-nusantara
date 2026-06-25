import Link from 'next/link';
import { logoutAction } from '../app/actions';

const links = [
  { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
  { href: '/transactions', label: 'Transaksi', key: 'transactions' },
  { href: '/categories', label: 'Kategori', key: 'categories' },
  { href: '/budgets', label: 'Budget', key: 'budgets' },
  { href: '/reminders', label: 'Reminder', key: 'reminders' },
  { href: '/reports', label: 'Laporan', key: 'reports' }
];

export default function AppNav({ active, user }) {
  return (
    <nav className="top-nav">
      <Link className="brand-block" href="/dashboard">
        <strong>Dompet Digital Nusantara</strong>
        <span>{user?.name || 'Personal Finance'}</span>
      </Link>
      <div className="nav-links">
        {links.map((link) => (
          <Link key={link.key} className={active === link.key ? 'active' : ''} href={link.href}>
            {link.label}
          </Link>
        ))}
        <form action={logoutAction}>
          <button type="submit">Keluar</button>
        </form>
      </div>
    </nav>
  );
}

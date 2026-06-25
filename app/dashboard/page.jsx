import Link from 'next/link';
import AppNav from '../../components/AppNav';
import BudgetAlert from '../../components/BudgetAlert';
import { requireUser } from '../../lib/auth';
import { formatDate, formatRupiah, getFinanceData } from '../../lib/finance';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const recent = data.transactions.slice(0, 5);
  const pendingReminders = data.reminders.filter((item) => item.status === 'pending').slice(0, 5);
  const categoryEntries = Object.entries(data.summary.categoryTotals).slice(0, 5);
  const maxCategory = Math.max(...categoryEntries.map(([, total]) => total), 1);

  return (
    <main className="app-shell">
      <AppNav active="dashboard" user={user} />
      <header className="page-title">
        <div>
          <h1>Dashboard Keuangan</h1>
          <p>Ringkasan pemasukan, pengeluaran, budget, dan reminder personal.</p>
        </div>
        <Link className="button" href="/transactions">Tambah Transaksi</Link>
      </header>

      <section className="grid three">
        <article className="metric">
          <span>Saldo bersih</span>
          <strong>{formatRupiah(data.summary.balance)}</strong>
        </article>
        <article className="metric good">
          <span>Pemasukan bulan ini</span>
          <strong>{formatRupiah(data.summary.monthlyIncome)}</strong>
        </article>
        <article className="metric bad">
          <span>Pengeluaran bulan ini</span>
          <strong>{formatRupiah(data.summary.monthlyExpense)}</strong>
        </article>
      </section>

      <BudgetAlert
        budgetTotal={data.summary.budgetTotal}
        remainingBudget={data.summary.remainingBudget}
        usedPercent={data.summary.usedPercent}
      />

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2>Budget bulan ini</h2>
          <strong>{data.summary.usedPercent}% terpakai</strong>
        </div>
        <div className="progress">
          <span style={{ width: `${data.summary.usedPercent}%` }} />
        </div>
        <p className="muted">Sisa budget: {formatRupiah(data.summary.remainingBudget)}</p>
      </section>

      <section className="quick-links" style={{ margin: '16px 0' }}>
        <Link href="/transactions">Kelola transaksi</Link>
        <Link href="/categories">Kelola kategori</Link>
        <Link href="/budgets">Kelola budget</Link>
        <Link href="/reminders">Kelola reminder</Link>
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="section-head">
            <h2>Transaksi terbaru</h2>
            <Link className="ghost-button" href="/transactions">Lihat</Link>
          </div>
          {recent.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Transaksi</th>
                    <th>Kategori</th>
                    <th>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <div className="muted">{formatDate(item.occurred_at)}</div>
                      </td>
                      <td>{item.category_name || 'Tanpa kategori'}</td>
                      <td className={`amount ${item.txn_type}`}>{formatRupiah(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Belum ada transaksi.</div>
          )}
        </article>

        <article className="panel">
          <div className="section-head">
            <h2>Pengeluaran per kategori</h2>
            <Link className="ghost-button" href="/reports">Laporan</Link>
          </div>
          {categoryEntries.length ? (
            <div className="bar-list">
              {categoryEntries.map(([name, total]) => (
                <div className="bar-item" key={name}>
                  <header>
                    <strong>{name}</strong>
                    <span>{formatRupiah(total)}</span>
                  </header>
                  <div className="progress">
                    <span style={{ width: `${Math.round((total / maxCategory) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Grafik akan muncul setelah transaksi pengeluaran ditambahkan.</div>
          )}
        </article>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2>Reminder aktif</h2>
          <Link className="ghost-button" href="/reminders">Kelola</Link>
        </div>
        {pendingReminders.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Tanggal</th>
                  <th>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {pendingReminders.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{formatDate(item.due_date)}</td>
                    <td>{item.amount ? formatRupiah(item.amount) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">Belum ada reminder aktif.</div>
        )}
      </section>
    </main>
  );
}

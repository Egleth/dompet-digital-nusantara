import AppNav from '../../components/AppNav';
import ReportPdfButton from '../../components/ReportPdfButton';
import { requireUser } from '../../lib/auth';
import { formatRupiah, getFinanceData } from '../../lib/finance';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const user = await requireUser();
  const data = await getFinanceData(user.id);
  const categories = Object.entries(data.summary.categoryTotals);
  const maxCategory = Math.max(...categories.map(([, total]) => total), 1);

  return (
    <main className="app-shell">
      <AppNav active="reports" user={user} />
      <div style={{ marginTop: 16 }}>
        <ReportPdfButton />
      </div>
      <div id="report-print-area">
        <header className="page-title">
          <div>
            <h1>Laporan</h1>
          </div>
        </header>

        <section className="grid three">
        <article className="metric">
          <span>Total pemasukan</span>
          <strong>{formatRupiah(data.summary.income)}</strong>
        </article>
        <article className="metric">
          <span>Total pengeluaran</span>
          <strong>{formatRupiah(data.summary.expense)}</strong>
        </article>
        <article className="metric">
          <span>Reminder pending</span>
          <strong>{data.summary.pendingReminders}</strong>
        </article>
      </section>

      <section className="grid two" style={{ marginTop: 16 }}>
        <article className="panel">
          <div className="section-head">
            <h2>Pengeluaran kategori</h2>
            <span className="badge">{categories.length} kategori</span>
          </div>
          {categories.length ? (
            <div className="bar-list">
              {categories.map(([name, total]) => (
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
            <div className="empty-state">Belum ada data pengeluaran.</div>
          )}
        </article>

        <article className="panel">
          <div className="section-head">
            <h2>Kondisi budget</h2>
            <span className="badge">{data.summary.usedPercent}%</span>
          </div>
          <div className="progress">
            <span style={{ width: `${data.summary.usedPercent}%` }} />
          </div>
          <p className="muted">Limit bulan ini: {formatRupiah(data.summary.budgetTotal)}</p>
          <p className="muted">Sisa budget: {formatRupiah(data.summary.remainingBudget)}</p>
        </article>
      </section>
      </div>
    </main>
  );
}

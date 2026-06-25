import AppNav from '../../components/AppNav';
import CategoryOptions from '../../components/CategoryOptions';
import StatusMessage from '../../components/StatusMessage';
import { createBudgetAction, deleteBudgetAction, updateBudgetAction } from '../actions';
import { requireUser } from '../../lib/auth';
import { enrichBudgetsWithUsage, formatRupiah, getFinanceData, getMonthKey } from '../../lib/finance';

export const dynamic = 'force-dynamic';

export default async function BudgetsPage({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const month = params?.month || getMonthKey();
  const data = await getFinanceData(user.id);
  const budgets = enrichBudgetsWithUsage(data.budgets, data.transactions, month);

  return (
    <main className="app-shell">
      <AppNav active="budgets" user={user} />
      <header className="page-title">
        <div>
          <h1>Budget</h1>
          <p>Tentukan batas pengeluaran per kategori dan periode bulanan.</p>
        </div>
      </header>
      <StatusMessage searchParams={params} />

      <section className="grid two">
        <article className="panel">
          <h2>Tambah budget</h2>
          <form action={createBudgetAction} className="form-grid" style={{ marginTop: 14 }}>
            <input type="hidden" name="redirectTo" value="/budgets" />
            <CategoryOptions categories={data.categories} />
            <div className="field">
              <label>Bulan</label>
              <input name="period_month" type="month" defaultValue={month} required />
            </div>
            <div className="field">
              <label>Kategori</label>
              <input name="category" list="category-options" required />
            </div>
            <div className="field">
              <label>Limit</label>
              <input name="limit_amount" type="number" min="1" step="1" required />
            </div>
            <button className="button" type="submit">Simpan Budget</button>
          </form>
        </article>

        <article className="panel">
          <h2>Filter bulan</h2>
          <form className="form-grid" style={{ marginTop: 14 }}>
            <div className="field">
              <label>Bulan</label>
              <input name="month" type="month" defaultValue={month} />
            </div>
            <button className="button" type="submit">Tampilkan</button>
          </form>
        </article>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2>Daftar budget {month}</h2>
          <span className="badge">{budgets.length} data</span>
        </div>
        {budgets.length ? (
          <div className="grid">
            {budgets.map((item) => (
              <details key={item.id}>
                <summary>
                  {item.category_name || 'Tanpa kategori'} - {formatRupiah(item.limit_amount)}
                </summary>
                <p className="muted">
                  Terpakai {formatRupiah(item.spent)}. Sisa {formatRupiah(item.remaining)}.
                </p>
                <div className="progress">
                  <span style={{ width: `${item.usedPercent}%` }} />
                </div>
                <form action={updateBudgetAction} className="form-grid">
                  <input type="hidden" name="redirectTo" value="/budgets" />
                  <input type="hidden" name="id" value={item.id} />
                  <CategoryOptions categories={data.categories} id={`budget-category-${item.id}`} />
                  <div className="form-grid three">
                    <div className="field">
                      <label>Bulan</label>
                      <input name="period_month" type="month" defaultValue={item.period_month} required />
                    </div>
                    <div className="field">
                      <label>Kategori</label>
                      <input name="category" list={`budget-category-${item.id}`} defaultValue={item.category_name || ''} required />
                    </div>
                    <div className="field">
                      <label>Limit</label>
                      <input name="limit_amount" type="number" min="1" step="1" defaultValue={Number(item.limit_amount)} required />
                    </div>
                  </div>
                  <div className="actions-row">
                    <button className="button" type="submit">Update</button>
                    <button
                      className="danger-button"
                      formAction={deleteBudgetAction}
                      name="id"
                      value={item.id}
                      type="submit"
                    >
                      Hapus
                    </button>
                  </div>
                </form>
              </details>
            ))}
          </div>
        ) : (
          <div className="empty-state">Belum ada budget pada bulan ini.</div>
        )}
      </section>
    </main>
  );
}

import AppNav from '../../components/AppNav';
import CategoryOptions from '../../components/CategoryOptions';
import StatusMessage from '../../components/StatusMessage';
import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction
} from '../actions';
import { requireUser } from '../../lib/auth';
import { formatDateTime, formatRupiah, getFinanceData } from '../../lib/finance';

export const dynamic = 'force-dynamic';

function dateTimeInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
}

export default async function TransactionsPage({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const filters = {
    q: params?.q || '',
    type: params?.type || '',
    category: params?.category || '',
    from: params?.from || '',
    to: params?.to || ''
  };
  const data = await getFinanceData(user.id, filters);

  return (
    <main className="app-shell">
      <AppNav active="transactions" user={user} />
      <header className="page-title">
        <div>
          <h1>Transaksi</h1>
          <p>Input, edit, filter, dan hapus pemasukan atau pengeluaran.</p>
        </div>
      </header>
      <StatusMessage searchParams={params} />

      <section className="grid two">
        <article className="panel">
          <h2>Tambah transaksi</h2>
          <form action={createTransactionAction} className="form-grid" style={{ marginTop: 14 }}>
            <input type="hidden" name="redirectTo" value="/transactions" />
            <CategoryOptions categories={data.categories} />
            <div className="form-grid two">
              <div className="field">
                <label>Jenis</label>
                <select name="txn_type" required>
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>
              <div className="field">
                <label>Nominal</label>
                <input name="amount" type="number" min="1" step="1" required />
              </div>
            </div>
            <div className="field">
              <label>Judul</label>
              <input name="title" required />
            </div>
            <div className="form-grid two">
              <div className="field">
                <label>Kategori</label>
                <input name="category" list="category-options" required />
              </div>
              <div className="field">
                <label>Merchant</label>
                <input name="merchant" />
              </div>
            </div>
            <div className="field">
              <label>Tanggal</label>
              <input name="occurred_at" type="datetime-local" required />
            </div>
            <div className="field">
              <label>Catatan</label>
              <textarea name="notes" />
            </div>
            <button className="button" type="submit">Simpan Transaksi</button>
          </form>
        </article>

        <article className="panel">
          <h2>Filter</h2>
          <form className="form-grid" style={{ marginTop: 14 }}>
            <CategoryOptions categories={data.categories} id="filter-category-options" />
            <div className="field">
              <label>Kata kunci</label>
              <input name="q" defaultValue={filters.q} />
            </div>
            <div className="form-grid two">
              <div className="field">
                <label>Jenis</label>
                <select name="type" defaultValue={filters.type}>
                  <option value="">Semua</option>
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>
              <div className="field">
                <label>Kategori</label>
                <input name="category" list="filter-category-options" defaultValue={filters.category} />
              </div>
            </div>
            <div className="form-grid two">
              <div className="field">
                <label>Dari</label>
                <input name="from" type="date" defaultValue={filters.from} />
              </div>
              <div className="field">
                <label>Sampai</label>
                <input name="to" type="date" defaultValue={filters.to} />
              </div>
            </div>
            <div className="actions-row">
              <button className="button" type="submit">Terapkan</button>
              <a className="ghost-button" href="/transactions">Reset</a>
            </div>
          </form>
        </article>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2>Daftar transaksi</h2>
          <span className="badge">{data.transactions.length} data</span>
        </div>
        {data.transactions.length ? (
          <div className="grid">
            {data.transactions.map((item) => (
              <details key={item.id}>
                <summary>
                  {item.title} - <span className={`amount ${item.txn_type}`}>{formatRupiah(item.amount)}</span>
                </summary>
                <p className="muted">
                  {item.category_name || 'Tanpa kategori'} - {formatDateTime(item.occurred_at)}
                </p>
                <form action={updateTransactionAction} className="form-grid">
                  <input type="hidden" name="redirectTo" value="/transactions" />
                  <input type="hidden" name="id" value={item.id} />
                  <CategoryOptions categories={data.categories} id={`category-edit-${item.id}`} />
                  <div className="form-grid three">
                    <div className="field">
                      <label>Jenis</label>
                      <select name="txn_type" defaultValue={item.txn_type}>
                        <option value="expense">Pengeluaran</option>
                        <option value="income">Pemasukan</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Nominal</label>
                      <input name="amount" type="number" min="1" step="1" defaultValue={Number(item.amount)} required />
                    </div>
                    <div className="field">
                      <label>Tanggal</label>
                      <input name="occurred_at" type="datetime-local" defaultValue={dateTimeInput(item.occurred_at)} required />
                    </div>
                  </div>
                  <div className="form-grid two">
                    <div className="field">
                      <label>Judul</label>
                      <input name="title" defaultValue={item.title} required />
                    </div>
                    <div className="field">
                      <label>Kategori</label>
                      <input name="category" list={`category-edit-${item.id}`} defaultValue={item.category_name || ''} required />
                    </div>
                  </div>
                  <div className="field">
                    <label>Merchant</label>
                    <input name="merchant" defaultValue={item.merchant || ''} />
                  </div>
                  <div className="field">
                    <label>Catatan</label>
                    <textarea name="notes" defaultValue={item.notes || ''} />
                  </div>
                  <div className="actions-row">
                    <button className="button" type="submit">Update</button>
                    <button
                      className="danger-button"
                      formAction={deleteTransactionAction}
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
          <div className="empty-state">Belum ada transaksi yang sesuai.</div>
        )}
      </section>
    </main>
  );
}

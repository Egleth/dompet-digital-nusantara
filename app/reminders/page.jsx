import AppNav from '../../components/AppNav';
import CategoryOptions from '../../components/CategoryOptions';
import StatusMessage from '../../components/StatusMessage';
import {
  completeReminderAction,
  createReminderAction,
  deleteReminderAction,
  updateReminderAction
} from '../actions';
import { requireUser } from '../../lib/auth';
import { formatDate, formatRupiah, getFinanceData } from '../../lib/finance';

export const dynamic = 'force-dynamic';

function dateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default async function RemindersPage({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await getFinanceData(user.id);

  return (
    <main className="app-shell">
      <AppNav active="reminders" user={user} />
      <header className="page-title">
        <div>
          <h1>Reminder</h1>
          <p>Catat pengingat tagihan, target pembayaran, atau kontrol pengeluaran.</p>
        </div>
      </header>
      <StatusMessage searchParams={params} />

      <section className="grid two">
        <article className="panel">
          <h2>Tambah reminder</h2>
          <form action={createReminderAction} className="form-grid" style={{ marginTop: 14 }}>
            <input type="hidden" name="redirectTo" value="/reminders" />
            <CategoryOptions categories={data.categories} />
            <div className="field">
              <label>Judul</label>
              <input name="title" required />
            </div>
            <div className="form-grid two">
              <div className="field">
                <label>Tanggal</label>
                <input name="due_date" type="date" required />
              </div>
              <div className="field">
                <label>Nominal</label>
                <input name="amount" type="number" min="0" step="1" />
              </div>
            </div>
            <div className="field">
              <label>Kategori</label>
              <input name="category" list="category-options" />
            </div>
            <div className="field">
              <label>Catatan</label>
              <textarea name="notes" />
            </div>
            <button className="button" type="submit">Simpan Reminder</button>
          </form>
        </article>

        <article className="panel">
          <h2>Status</h2>
          <p className="muted">
            {data.reminders.filter((item) => item.status === 'pending').length} pending dan{' '}
            {data.reminders.filter((item) => item.status === 'done').length} selesai.
          </p>
        </article>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2>Daftar reminder</h2>
          <span className="badge">{data.reminders.length} data</span>
        </div>
        {data.reminders.length ? (
          <div className="grid">
            {data.reminders.map((item) => (
              <details key={item.id}>
                <summary>
                  {item.title} - {formatDate(item.due_date)} - {item.status}
                </summary>
                <p className="muted">
                  {item.category_name || 'Tanpa kategori'} {item.amount ? `- ${formatRupiah(item.amount)}` : ''}
                </p>
                <form action={updateReminderAction} className="form-grid">
                  <input type="hidden" name="redirectTo" value="/reminders" />
                  <input type="hidden" name="id" value={item.id} />
                  <CategoryOptions categories={data.categories} id={`reminder-category-${item.id}`} />
                  <div className="form-grid three">
                    <div className="field">
                      <label>Judul</label>
                      <input name="title" defaultValue={item.title} required />
                    </div>
                    <div className="field">
                      <label>Tanggal</label>
                      <input name="due_date" type="date" defaultValue={dateInput(item.due_date)} required />
                    </div>
                    <div className="field">
                      <label>Status</label>
                      <select name="status" defaultValue={item.status}>
                        <option value="pending">Pending</option>
                        <option value="done">Selesai</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid two">
                    <div className="field">
                      <label>Nominal</label>
                      <input name="amount" type="number" min="0" step="1" defaultValue={item.amount ? Number(item.amount) : ''} />
                    </div>
                    <div className="field">
                      <label>Kategori</label>
                      <input name="category" list={`reminder-category-${item.id}`} defaultValue={item.category_name || ''} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Catatan</label>
                    <textarea name="notes" defaultValue={item.notes || ''} />
                  </div>
                  <div className="actions-row">
                    <button className="button" type="submit">Update</button>
                    <button
                      className="ghost-button"
                      formAction={completeReminderAction}
                      name="status"
                      value={item.status === 'done' ? 'pending' : 'done'}
                      type="submit"
                    >
                      {item.status === 'done' ? 'Jadikan Pending' : 'Tandai Selesai'}
                    </button>
                    <button
                      className="danger-button"
                      formAction={deleteReminderAction}
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
          <div className="empty-state">Belum ada reminder.</div>
        )}
      </section>
    </main>
  );
}

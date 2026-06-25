import AppNav from '../../components/AppNav';
import StatusMessage from '../../components/StatusMessage';
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from '../actions';
import { requireUser } from '../../lib/auth';
import { getFinanceData } from '../../lib/finance';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage({ searchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await getFinanceData(user.id);

  return (
    <main className="app-shell">
      <AppNav active="categories" user={user} />
      <header className="page-title">
        <div>
          <h1>Kategori</h1>
          <p>Kelola kategori pemasukan dan pengeluaran sesuai kebutuhan pengguna.</p>
        </div>
      </header>
      <StatusMessage searchParams={params} />

      <section className="grid two">
        <article className="panel">
          <h2>Tambah kategori</h2>
          <form action={createCategoryAction} className="form-grid" style={{ marginTop: 14 }}>
            <input type="hidden" name="redirectTo" value="/categories" />
            <div className="field">
              <label>Nama</label>
              <input name="name" required />
            </div>
            <div className="form-grid two">
              <div className="field">
                <label>Tipe</label>
                <select name="type" defaultValue="expense">
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                  <option value="both">Keduanya</option>
                </select>
              </div>
              <div className="field">
                <label>Warna</label>
                <input name="color" type="color" defaultValue="#1593f3" />
              </div>
            </div>
            <button className="button" type="submit">Simpan Kategori</button>
          </form>
        </article>

        <article className="panel">
          <h2>Ringkasan</h2>
          <p className="muted">{data.categories.length} kategori tersimpan untuk akun ini.</p>
          <p className="muted">Kategori baru juga otomatis dibuat saat user menambah transaksi, budget, atau reminder dengan nama kategori yang belum ada.</p>
        </article>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-head">
          <h2>Daftar kategori</h2>
          <span className="badge">{data.categories.length} data</span>
        </div>
        {data.categories.length ? (
          <div className="grid">
            {data.categories.map((item) => (
              <details key={item.id}>
                <summary>
                  <span className="badge">
                    <span className="swatch" style={{ background: item.color }} />
                    {item.name}
                  </span>
                </summary>
                <form action={updateCategoryAction} className="form-grid">
                  <input type="hidden" name="redirectTo" value="/categories" />
                  <input type="hidden" name="id" value={item.id} />
                  <div className="form-grid three">
                    <div className="field">
                      <label>Nama</label>
                      <input name="name" defaultValue={item.name} required />
                    </div>
                    <div className="field">
                      <label>Tipe</label>
                      <select name="type" defaultValue={item.type}>
                        <option value="expense">Pengeluaran</option>
                        <option value="income">Pemasukan</option>
                        <option value="both">Keduanya</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Warna</label>
                      <input name="color" type="color" defaultValue={item.color || '#1593f3'} />
                    </div>
                  </div>
                  <div className="actions-row">
                    <button className="button" type="submit">Update</button>
                    <button
                      className="danger-button"
                      formAction={deleteCategoryAction}
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
          <div className="empty-state">Belum ada kategori.</div>
        )}
      </section>
    </main>
  );
}

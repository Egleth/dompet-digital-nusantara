'use client';

import { useEffect, useState } from 'react';

export default function BudgetAlert({ budgetTotal, remainingBudget, usedPercent }) {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const isBudgetReached = budgetTotal > 0 && (remainingBudget <= 0 || usedPercent >= 100);
    if (isBudgetReached && !shown) {
      setVisible(true);
      setShown(true);
    }
  }, [budgetTotal, remainingBudget, usedPercent, shown]);

  if (!visible) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={() => setVisible(false)}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>Dompet Digital Nusantara</h2>
        </header>
        <div className="modal-body">
          <p>Peringatan: Budget bulan ini sudah habis. Silakan periksa pengeluaran atau perbarui budget Anda.</p>
        </div>
        <footer className="modal-footer">
          <button className="button" type="button" onClick={() => setVisible(false)}>
            Tutup
          </button>
        </footer>
      </div>
    </div>
  );
}

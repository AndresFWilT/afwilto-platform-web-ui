export default function DesignPage() {
  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-primary-400 text-glow-primary">Design System</h1>
        <p className="text-text-secondary text-sm mt-1">Color palette & component tokens</p>
      </div>

      {/* Palette */}
      <section>
        <h2 className="text-text-primary text-sm font-semibold uppercase tracking-wider mb-4">Color Palette</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Primary (Teal)', swatches: [['Brand','bg-primary-400','#00fff0'],['Mid','bg-primary-600','#00b3a8'],['Dark','bg-primary-800','#004f4a']] },
            { title: 'Accent (Purple)', swatches: [['Light','bg-purple-400','#c084fc'],['Main','bg-purple-500','#a855f7'],['Dark','bg-purple-700','#7c3aed']] },
            { title: 'Semantic', swatches: [['Income','bg-income-500','#10b981'],['Expense','bg-expense-500','#f43f5e'],['Warning','bg-warning-500','#f59e0b']] },
            { title: 'Dark Scale', swatches: [['BG','bg-dark-900','#0a0a0a'],['Surface','bg-dark-800','#111111'],['Card','bg-dark-700','#1a1a1a']] },
          ].map(({ title, swatches }) => (
            <div key={title} className="bg-dark-700 rounded-xl p-4 border border-border">
              <p className="text-text-muted text-xs uppercase tracking-widest mb-3">{title}</p>
              <div className="space-y-2">
                {swatches.map(([label, cls, hex]) => (
                  <div key={hex} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded border border-dark-400 ${cls}`} />
                    <span className="text-text-secondary text-xs">{label}</span>
                    <span className="text-text-muted text-xs ml-auto font-mono">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stat cards */}
      <section>
        <h2 className="text-text-primary text-sm font-semibold uppercase tracking-wider mb-4">Stat Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-dark-700 rounded-xl border border-border p-5 glow-primary">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-1">Total Income</p>
            <p className="text-income-500 text-2xl font-bold">+ $4,200.00</p>
            <p className="text-text-secondary text-xs mt-1">April 2026</p>
          </div>
          <div className="bg-dark-700 rounded-xl border border-border p-5">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-1">Total Expenses</p>
            <p className="text-expense-500 text-2xl font-bold">- $2,830.00</p>
            <p className="text-text-secondary text-xs mt-1">April 2026</p>
          </div>
          <div className="bg-dark-700 rounded-xl border border-border p-5 glow-purple">
            <p className="text-text-muted text-xs uppercase tracking-widest mb-1">Net Balance</p>
            <p className="text-primary-400 text-2xl font-bold text-glow-primary">$1,370.00</p>
            <p className="text-text-secondary text-xs mt-1">April 2026</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-text-primary text-sm font-semibold uppercase tracking-wider mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <button className="bg-primary-400 hover:bg-primary-300 text-dark-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Primary</button>
          <button className="bg-purple-500 hover:bg-purple-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Accent</button>
          <button className="bg-income-500 hover:bg-income-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Income</button>
          <button className="bg-expense-500 hover:bg-expense-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Expense</button>
          <button className="border border-primary-400 text-primary-400 hover:bg-primary-400/10 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Outline</button>
          <button className="bg-dark-600 hover:bg-dark-500 text-text-secondary font-medium px-4 py-2 rounded-lg text-sm transition-colors">Ghost</button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-text-primary text-sm font-semibold uppercase tracking-wider mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ['Income',       'bg-income-500/15 text-income-400'],
            ['Expense',      'bg-expense-500/15 text-expense-400'],
            ['Primary',      'bg-primary-400/15 text-primary-400'],
            ['Purple',       'bg-purple-500/15 text-purple-400'],
            ['Warning',      'bg-warning-500/15 text-warning-400'],
          ].map(([label, cls]) => (
            <span key={label} className={`text-xs font-medium px-3 py-1 rounded-full ${cls}`}>{label}</span>
          ))}
        </div>
      </section>
    </div>
  )
}

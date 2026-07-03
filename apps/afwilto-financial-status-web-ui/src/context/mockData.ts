import { type Transaction } from '../types'

const d = (y: number, m: number, day: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`

let _id = 1
const id = () => String(_id++)

interface Entry { day: number; desc: string; category: string; amount: number }

const baseExpenses: Entry[] = [
  { day: 3,  desc: 'Rent',               category: 'Housing',       amount: 1500 },
  { day: 1,  desc: 'Netflix + Spotify',  category: 'Entertainment', amount: 50   },
  { day: 18, desc: 'Electricity & Water',category: 'Utilities',     amount: 150  },
  { day: 10, desc: 'Phone plan',          category: 'Utilities',     amount: 45   },
  { day: 5,  desc: 'Supermarket',         category: 'Food',          amount: 120  },
  { day: 15, desc: 'Supermarket',         category: 'Food',          amount: 90   },
  { day: 22, desc: 'Supermarket',         category: 'Food',          amount: 105  },
  { day: 9,  desc: 'Gas',                 category: 'Transport',     amount: 60   },
  { day: 20, desc: 'Ride-share',          category: 'Transport',     amount: 35   },
  { day: 13, desc: 'Restaurant',          category: 'Entertainment', amount: 80   },
  { day: 5,  desc: 'Gym',                 category: 'Health',        amount: 50   },
]

interface MonthConfig {
  year: number
  month: number
  salary?: number
  incomeExtras?: Entry[]
  expenseExtras?: Entry[]
}

function makeMonth({ year, month, salary = 5000, incomeExtras = [], expenseExtras = [] }: MonthConfig): Transaction[] {
  const txs: Transaction[] = []

  txs.push({ id: id(), type: 'income', amount: salary, description: 'Monthly Salary', category: 'Salary', date: d(year, month, 1) })

  for (const e of incomeExtras)
    txs.push({ id: id(), type: 'income', amount: e.amount, description: e.desc, category: e.category, date: d(year, month, e.day) })

  for (const e of [...baseExpenses, ...expenseExtras])
    txs.push({ id: id(), type: 'expense', amount: e.amount, description: e.desc, category: e.category, date: d(year, month, e.day) })

  return txs
}

export const mockTransactions: Transaction[] = [
  // ── 2025 ──────────────────────────────────────────────────────────────────
  ...makeMonth({ year: 2025, month: 1,
    incomeExtras:  [{ day: 25, desc: 'Freelance — Web App',       category: 'Freelance', amount: 800  }],
    expenseExtras: [{ day: 28, desc: 'Doctor visit',              category: 'Health',    amount: 120  }],
  }),
  ...makeMonth({ year: 2025, month: 2,
    expenseExtras: [{ day: 14, desc: "Valentine's dinner",        category: 'Entertainment', amount: 150 }],
  }),
  ...makeMonth({ year: 2025, month: 3,
    incomeExtras:  [{ day: 20, desc: 'Freelance — Logo design',   category: 'Freelance', amount: 1200 }],
    expenseExtras: [{ day: 10, desc: 'Online course',             category: 'Education', amount: 200  }],
  }),
  ...makeMonth({ year: 2025, month: 4,
    expenseExtras: [{ day: 5,  desc: 'Car service',               category: 'Transport', amount: 250  }],
  }),
  ...makeMonth({ year: 2025, month: 5,
    incomeExtras:  [{ day: 12, desc: 'Freelance — Dashboard UI',  category: 'Freelance', amount: 600  }],
  }),
  ...makeMonth({ year: 2025, month: 6,
    incomeExtras:  [{ day: 30, desc: 'Mid-year Bonus',            category: 'Bonus',     amount: 500  }],
    expenseExtras: [{ day: 20, desc: 'Summer trip flights',       category: 'Entertainment', amount: 400 }],
  }),
  ...makeMonth({ year: 2025, month: 7,
    incomeExtras:  [{ day: 18, desc: 'Freelance — API integration',category: 'Freelance',amount: 900  }],
    expenseExtras: [{ day: 15, desc: 'Hotel (vacation)',          category: 'Entertainment', amount: 350 }],
  }),
  ...makeMonth({ year: 2025, month: 8,
    expenseExtras: [{ day: 25, desc: 'Back-to-school supplies',   category: 'Education', amount: 180  }],
  }),
  ...makeMonth({ year: 2025, month: 9,
    incomeExtras:  [{ day: 10, desc: 'Freelance — Mobile App',    category: 'Freelance', amount: 1500 }],
  }),
  ...makeMonth({ year: 2025, month: 10,
    expenseExtras: [{ day: 31, desc: 'Halloween party',           category: 'Entertainment', amount: 120 }],
  }),
  ...makeMonth({ year: 2025, month: 11,
    incomeExtras:  [{ day: 22, desc: 'Freelance — Brand identity',category: 'Freelance', amount: 700  }],
    expenseExtras: [{ day: 28, desc: 'Black Friday shopping',     category: 'Entertainment', amount: 300 }],
  }),
  ...makeMonth({ year: 2025, month: 12,
    incomeExtras:  [{ day: 31, desc: 'Year-end Bonus',            category: 'Bonus',     amount: 1000 }],
    expenseExtras: [
      { day: 20, desc: 'Christmas gifts',       category: 'Entertainment', amount: 450 },
      { day: 26, desc: "New Year's Eve dinner", category: 'Entertainment', amount: 200 },
    ],
  }),

  // ── 2026 ──────────────────────────────────────────────────────────────────
  ...makeMonth({ year: 2026, month: 1,
    incomeExtras:  [{ day: 20, desc: 'Freelance — E-commerce site', category: 'Freelance', amount: 1000 }],
    expenseExtras: [{ day: 12, desc: 'Annual health check',         category: 'Health',    amount: 200  }],
  }),
  ...makeMonth({ year: 2026, month: 2,
    expenseExtras: [{ day: 14, desc: "Valentine's gifts",          category: 'Entertainment', amount: 130 }],
  }),
  ...makeMonth({ year: 2026, month: 3,
    incomeExtras:  [{ day: 15, desc: 'Freelance — Design system',  category: 'Freelance', amount: 500  }],
    expenseExtras: [{ day: 22, desc: 'Spring wardrobe',            category: 'Entertainment', amount: 220 }],
  }),
  ...makeMonth({ year: 2026, month: 4,
    expenseExtras: [{ day: 10, desc: 'Online certification',       category: 'Education', amount: 150  }],
  }),
]

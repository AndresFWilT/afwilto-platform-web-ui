import { api } from '../lib/api'
import type { Transaction, TransactionType } from '../types'

interface ApiTransaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  category_name: string | null
  date: string
}

function toTransaction(t: ApiTransaction): Transaction {
  return {
    id:          t.id,
    type:        t.type,
    amount:      t.amount,
    description: t.description,
    category:    t.category_name ?? '',
    date:        t.date,
  }
}

export interface TransactionFilter {
  year?: number
  month?: number
  type?: TransactionType
}

export async function listTransactions(f?: TransactionFilter): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (f?.year)  params.set('year',  String(f.year))
  if (f?.month) params.set('month', String(f.month))
  if (f?.type)  params.set('type',  f.type)
  const qs = params.size ? `?${params}` : ''
  const data = await api.get<ApiTransaction[]>(`/transactions${qs}`)
  return data.map(toTransaction)
}

export async function createTransaction(t: Omit<Transaction, 'id'>): Promise<Transaction> {
  const data = await api.post<ApiTransaction>('/transactions', {
    type:          t.type,
    amount:        t.amount,
    description:   t.description,
    category_name: t.category || undefined,
    date:          t.date,
  })
  return toTransaction(data)
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.del(`/transactions/${id}`)
}

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Transaction } from '../types'
import {
  listTransactions,
  createTransaction,
  deleteTransaction as apiDeleteTransaction,
} from '../services/transactions.service'

interface TransactionsContextType {
  transactions: Transaction[]
  loading: boolean
  addTransaction: (t: Omit<Transaction, 'id'>) => void
  deleteTransaction: (id: string) => void
}

const TransactionsContext = createContext<TransactionsContextType | null>(null)

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listTransactions()
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    createTransaction(t)
      .then(created => setTransactions(prev => [created, ...prev]))
      .catch(console.error)
  }

  const deleteTransaction = (id: string) => {
    apiDeleteTransaction(id)
      .then(() => setTransactions(prev => prev.filter(t => t.id !== id)))
      .catch(console.error)
  }

  return (
    <TransactionsContext.Provider value={{ transactions, loading, addTransaction, deleteTransaction }}>
      {children}
    </TransactionsContext.Provider>
  )
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext)
  if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider')
  return ctx
}

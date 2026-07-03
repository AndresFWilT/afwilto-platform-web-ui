import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Credit } from '../types'
import {
  listCredits,
  createCredit,
  updateCredit as apiUpdateCredit,
  deleteCredit as apiDeleteCredit,
  setPaidInstallments as apiSetPaid,
} from '../services/credits.service'

interface CreditsContextType {
  credits: Credit[]
  loading: boolean
  addCredit: (c: Omit<Credit, 'id' | 'createdAt'>) => void
  updateCredit: (id: string, updates: Partial<Omit<Credit, 'id' | 'createdAt'>>) => void
  deleteCredit: (id: string) => void
  setPaidInstallments: (id: string, count: number) => void
}

const CreditsContext = createContext<CreditsContextType | null>(null)

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listCredits()
      .then(setCredits)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const addCredit = (c: Omit<Credit, 'id' | 'createdAt'>) => {
    createCredit(c)
      .then(created => setCredits(prev => [...prev, created]))
      .catch(console.error)
  }

  const updateCredit = (id: string, updates: Partial<Omit<Credit, 'id' | 'createdAt'>>) => {
    apiUpdateCredit(id, updates)
      .then(updated => setCredits(prev => prev.map(c => c.id === id ? updated : c)))
      .catch(console.error)
  }

  const deleteCredit = (id: string) => {
    apiDeleteCredit(id)
      .then(() => setCredits(prev => prev.filter(c => c.id !== id)))
      .catch(console.error)
  }

  const setPaidInstallments = (id: string, count: number) => {
    apiSetPaid(id, count)
      .then(updated => setCredits(prev => prev.map(c => c.id === id ? updated : c)))
      .catch(console.error)
  }

  return (
    <CreditsContext.Provider value={{ credits, loading, addCredit, updateCredit, deleteCredit, setPaidInstallments }}>
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const ctx = useContext(CreditsContext)
  if (!ctx) throw new Error('useCredits must be used within CreditsProvider')
  return ctx
}

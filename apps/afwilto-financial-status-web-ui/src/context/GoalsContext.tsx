import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Goal, GoalContribution } from '../types'
import {
  loadAllGoals,
  createGoal,
  updateGoal as apiUpdateGoal,
  deleteGoal as apiDeleteGoal,
  createContribution,
  updateContribution as apiUpdateContribution,
  deleteContribution as apiDeleteContribution,
} from '../services/goals.service'

interface GoalsContextType {
  goals: Goal[]
  loading: boolean
  addGoal: (input: { name: string; targetAmount: number; targetDate?: string; initialAmount?: number; initialDate?: string }) => void
  updateGoal: (id: string, updates: Partial<Pick<Goal, 'name' | 'targetAmount' | 'targetDate'>>) => void
  deleteGoal: (id: string) => void
  addContribution: (goalId: string, c: Omit<GoalContribution, 'id'>) => void
  updateContribution: (goalId: string, cId: string, updates: Partial<Omit<GoalContribution, 'id'>>) => void
  deleteContribution: (goalId: string, cId: string) => void
}

const GoalsContext = createContext<GoalsContextType | null>(null)

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    return loadAllGoals()
      .then(setGoals)
      .catch(console.error)
  }, [])

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [reload])

  const addGoal: GoalsContextType['addGoal'] = (input) => {
    createGoal(input).then(reload).catch(console.error)
  }

  const updateGoal: GoalsContextType['updateGoal'] = (id, updates) => {
    apiUpdateGoal(id, updates).then(reload).catch(console.error)
  }

  const deleteGoal = (id: string) => {
    apiDeleteGoal(id).then(reload).catch(console.error)
  }

  const addContribution: GoalsContextType['addContribution'] = (goalId, c) => {
    createContribution(goalId, c).then(reload).catch(console.error)
  }

  const updateContribution: GoalsContextType['updateContribution'] = (goalId, cId, updates) => {
    apiUpdateContribution(goalId, cId, updates).then(reload).catch(console.error)
  }

  const deleteContribution: GoalsContextType['deleteContribution'] = (goalId, cId) => {
    apiDeleteContribution(goalId, cId).then(reload).catch(console.error)
  }

  return (
    <GoalsContext.Provider value={{ goals, loading, addGoal, updateGoal, deleteGoal, addContribution, updateContribution, deleteContribution }}>
      {children}
    </GoalsContext.Provider>
  )
}

export function useGoals() {
  const ctx = useContext(GoalsContext)
  if (!ctx) throw new Error('useGoals must be used within GoalsProvider')
  return ctx
}

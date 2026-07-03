import { api } from '../lib/api'
import type { Goal, GoalContribution } from '../types'

interface ApiGoalSummary {
  id: string
  name: string
  target_amount: number
  target_date: string | null
  created_at: string
}

interface ApiContribution {
  id: string
  amount: number
  date: string
  note: string | null
}

interface ApiGoal {
  id: string
  name: string
  target_amount: number
  target_date: string | null
  created_at: string
}

function toContribution(c: ApiContribution): GoalContribution {
  return {
    id:     c.id,
    amount: c.amount,
    date:   c.date,
    note:   c.note ?? undefined,
  }
}

async function fetchContributions(goalId: string): Promise<GoalContribution[]> {
  const data = await api.get<ApiContribution[]>(`/goals/${goalId}/contributions`)
  return data.map(toContribution)
}

export async function loadAllGoals(): Promise<Goal[]> {
  const summaries = await api.get<ApiGoalSummary[]>('/goals')
  const withContribs = await Promise.all(
    summaries.map(async (s): Promise<Goal> => ({
      id:            s.id,
      name:          s.name,
      targetAmount:  s.target_amount,
      targetDate:    s.target_date ?? undefined,
      createdAt:     s.created_at,
      contributions: await fetchContributions(s.id),
    }))
  )
  return withContribs
}

export async function createGoal(input: {
  name: string
  targetAmount: number
  targetDate?: string
  initialAmount?: number
  initialDate?: string
}): Promise<void> {
  const goal = await api.post<ApiGoal>('/goals', {
    name:          input.name,
    target_amount: input.targetAmount,
    target_date:   input.targetDate ?? null,
  })
  if (input.initialAmount && input.initialAmount > 0) {
    await api.post<ApiContribution>(`/goals/${goal.id}/contributions`, {
      amount: input.initialAmount,
      date:   input.initialDate ?? new Date().toISOString().slice(0, 10),
      note:   'Initial deposit',
    })
  }
}

export async function updateGoal(id: string, updates: Partial<Pick<Goal, 'name' | 'targetAmount' | 'targetDate'>>): Promise<void> {
  await api.put(`/goals/${id}`, {
    name:          updates.name,
    target_amount: updates.targetAmount,
    target_date:   updates.targetDate ?? null,
  })
}

export async function deleteGoal(id: string): Promise<void> {
  await api.del(`/goals/${id}`)
}

export async function createContribution(goalId: string, c: Omit<GoalContribution, 'id'>): Promise<void> {
  await api.post<ApiContribution>(`/goals/${goalId}/contributions`, {
    amount: c.amount,
    date:   c.date,
    note:   c.note ?? null,
  })
}

export async function updateContribution(goalId: string, cId: string, updates: Partial<Omit<GoalContribution, 'id'>>): Promise<void> {
  await api.put(`/goals/${goalId}/contributions/${cId}`, {
    amount: updates.amount,
    date:   updates.date,
    note:   updates.note ?? null,
  })
}

export async function deleteContribution(goalId: string, cId: string): Promise<void> {
  await api.del(`/goals/${goalId}/contributions/${cId}`)
}

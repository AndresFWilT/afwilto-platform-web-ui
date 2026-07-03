import { api } from '../lib/api'
import type { Credit, CreditType } from '../types'

interface ApiCredit {
  id: string
  type: string
  name: string
  description: string | null
  principal: number
  monthly_rate: number
  installments: number
  paid_installments: number
  start_date: string
  created_at: string
}

function toCredit(c: ApiCredit): Credit {
  return {
    id:               c.id,
    type:             c.type as CreditType,
    name:             c.name,
    description:      c.description ?? undefined,
    principal:        c.principal,
    monthlyRate:      c.monthly_rate,
    installments:     c.installments,
    paidInstallments: c.paid_installments,
    startDate:        c.start_date,
    createdAt:        c.created_at,
  }
}

export async function listCredits(): Promise<Credit[]> {
  const data = await api.get<ApiCredit[]>('/credits')
  return data.map(toCredit)
}

export async function createCredit(c: Omit<Credit, 'id' | 'createdAt'>): Promise<Credit> {
  const data = await api.post<ApiCredit>('/credits', {
    type:              c.type,
    name:              c.name,
    description:       c.description ?? null,
    principal:         c.principal,
    monthly_rate:      c.monthlyRate,
    installments:      c.installments,
    paid_installments: c.paidInstallments,
    start_date:        c.startDate,
  })
  return toCredit(data)
}

export async function updateCredit(id: string, updates: Partial<Omit<Credit, 'id' | 'createdAt'>>): Promise<Credit> {
  const data = await api.put<ApiCredit>(`/credits/${id}`, {
    type:              updates.type,
    name:              updates.name,
    description:       updates.description ?? null,
    principal:         updates.principal,
    monthly_rate:      updates.monthlyRate,
    installments:      updates.installments,
    paid_installments: updates.paidInstallments,
    start_date:        updates.startDate,
  })
  return toCredit(data)
}

export async function deleteCredit(id: string): Promise<void> {
  await api.del(`/credits/${id}`)
}

export async function setPaidInstallments(id: string, paid: number): Promise<Credit> {
  const data = await api.patch<ApiCredit>(`/credits/${id}/paid`, {
    paid_installments: paid,
  })
  return toCredit(data)
}

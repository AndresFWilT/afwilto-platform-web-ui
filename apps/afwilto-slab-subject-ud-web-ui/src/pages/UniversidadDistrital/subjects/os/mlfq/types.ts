export type { MLFQQueueLevel, MLFQActionType, MLFQConfig, MLFQProcessDto, MLFQPromotion, MLFQExecutionStep, MLFQProcessResult, MLFQState, MLFQSimulateResponse } from '@/application/ports/IMLFQService'

export interface ProcessRow {
  id: number
  pid: string
  name: string
  burstTime: string
  queueLevel: import('@/application/ports/IMLFQService').MLFQQueueLevel
}

export const QUEUE_COLORS: Record<import('@/application/ports/IMLFQService').MLFQQueueLevel, string> = {
  RoundRobin:           '#3b82f6',
  ShortestJobFirst:     '#22c55e',
  FirstComeFirstServed: '#f59e0b',
}

export const QUEUE_LABELS: Record<import('@/application/ports/IMLFQService').MLFQQueueLevel, string> = {
  RoundRobin:           'Q1 — Round-Robin',
  ShortestJobFirst:     'Q2 — SJF',
  FirstComeFirstServed: 'Q3 — FCFS',
}

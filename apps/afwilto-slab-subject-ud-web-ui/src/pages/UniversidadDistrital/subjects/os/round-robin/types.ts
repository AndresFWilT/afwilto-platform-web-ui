export type { RRAction, ProcessDto, ExecutionStep, ProcessResult, SchedulerState, SimulateResponse } from '@/application/ports/IRoundRobinService'

export interface ProcessRow {
  id: number
  pid: string
  burstTime: string
}

const PALETTE = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

export function processColor(pid: number): string {
  return PALETTE[(pid - 1) % PALETTE.length]
}

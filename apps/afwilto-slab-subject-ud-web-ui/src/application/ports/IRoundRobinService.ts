export type RRAction = 'COMPLETED' | 'REQUEUED' | 'IDLE' | 'BLOCKED' | 'UNBLOCKED'

export interface ProcessDto {
  pid: number
  burstTime: number
  remainingTime: number
}

export interface ExecutionStep {
  time: number
  pid: number
  timeUsed: number
  remainingAfter: number
  action: RRAction
}

export interface ProcessResult {
  pid: number
  burstTime: number
  completionTime: number
  turnaroundTime: number
  waitingTime: number
}

export interface SchedulerState {
  queue: ProcessDto[]
  blockedQueue: ProcessDto[]
  completedProcesses: ProcessDto[]
  executionLog: ExecutionStep[]
  currentTime: number
  timeQuantum: number
}

export interface SimulateResponse {
  executionLog: ExecutionStep[]
  totalTime: number
  processResults: ProcessResult[]
  averageTurnaroundTime: number
  averageWaitingTime: number
  timeQuantum: number
  finalQueue: ProcessDto[]
}

export interface ProcessInput {
  pid: number
  burstTime: number
}

export interface IRoundRobinService {
  simulate(timeQuantum: number, processes: ProcessInput[]): Promise<SimulateResponse>
  tick(state: SchedulerState): Promise<SchedulerState>
  enqueue(state: SchedulerState, pid: number, burstTime: number): Promise<SchedulerState>
  block(state: SchedulerState, pid: number): Promise<SchedulerState>
  unblock(state: SchedulerState, pid: number): Promise<SchedulerState>
}

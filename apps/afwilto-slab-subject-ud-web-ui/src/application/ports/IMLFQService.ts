export type MLFQQueueLevel = 'RoundRobin' | 'ShortestJobFirst' | 'FirstComeFirstServed'
export type MLFQActionType = 'COMPLETED' | 'REQUEUED' | 'PREEMPTED' | 'CONTINUING' | 'IDLE'

export interface MLFQConfig {
  quantum: number
  agingThreshold: number
}

export interface MLFQProcessDto {
  pid: number
  name: string
  burstTime: number
  remainingTime: number
  agingCounter: number
  priority: MLFQQueueLevel
  blockedFrom: MLFQQueueLevel | null
}

export interface MLFQPromotion {
  pid: number
  from: MLFQQueueLevel
  to: MLFQQueueLevel
  agingAtPromotion: number
}

export interface MLFQExecutionStep {
  time: number
  pid: number
  queueLevel: MLFQQueueLevel
  timeUsed: number
  remainingAfter: number
  action: MLFQActionType
  promotions: MLFQPromotion[]
}

export interface MLFQProcessResult {
  pid: number
  burstTime: number
  completionTime: number
  turnaroundTime: number
  waitingTime: number
  finalQueue: MLFQQueueLevel
}

export interface MLFQState {
  rrQueue: MLFQProcessDto[]
  sjfQueue: MLFQProcessDto[]
  fcfsQueue: MLFQProcessDto[]
  blockedQueue: MLFQProcessDto[]
  completed: MLFQProcessDto[]
  executionLog: MLFQExecutionStep[]
  config: MLFQConfig
  currentTime: number
}

export interface MLFQSimulateQueues {
  roundRobin?: Array<{ pid: number; name: string; burstTime: number }>
  sjf?: Array<{ pid: number; name: string; burstTime: number }>
  fcfs?: Array<{ pid: number; name: string; burstTime: number }>
}

export interface MLFQSimulateResponse {
  executionLog: MLFQExecutionStep[]
  processResults: MLFQProcessResult[]
  averageTurnaroundTime: number
  averageWaitingTime: number
  totalPromotions: number
  totalTime: number
  config: MLFQConfig
}

export interface IMLFQService {
  simulate(config: MLFQConfig, queues: MLFQSimulateQueues): Promise<MLFQSimulateResponse>
  tick(state: MLFQState): Promise<MLFQState>
  enqueue(state: MLFQState, pid: number, name: string, burstTime: number, queueLevel: MLFQQueueLevel): Promise<MLFQState>
  block(state: MLFQState, pid: number): Promise<MLFQState>
  unblock(state: MLFQState, pid: number): Promise<MLFQState>
}

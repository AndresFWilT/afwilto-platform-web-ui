export interface ActivityInput {
  name: string
  duration: number
  predecessors: string[]
}

export interface ScheduledActivity {
  name: string
  duration: number
  predecessors: string[]
  earlyStart: number
  earlyFinish: number
  lateStart: number
  lateFinish: number
  slack: number
  isCritical: boolean
}

export interface CriticalPathResult {
  schedule: ScheduledActivity[]
  projectDuration: number
  criticalPath: string[]
}

export interface ICriticalPathService {
  compute(activities: ActivityInput[]): Promise<CriticalPathResult>
}

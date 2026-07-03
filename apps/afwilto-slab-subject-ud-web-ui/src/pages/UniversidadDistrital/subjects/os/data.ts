export type OSCategory = 'CPU Scheduling'

export interface OSProject {
  slug: string
  title: string
  description: string
  detail: string
  category: OSCategory
  concept: string
  gradientFrom: string
  gradientTo: string
}

export const OS_PROJECTS: OSProject[] = [
  {
    slug: 'mlfq-scheduler',
    title: 'MLFQ Scheduler',
    description:
      'Multi-Level Feedback Queue with aging: three priority queues (RR → SJF → FCFS), anti-starvation promotions, process blocking/unblocking, and step-by-step trace.',
    detail:
      'Implements the classic MLFQ scheduling policy: processes enter Queue 1 (Round-Robin, highest priority), demote to Queue 2 (SJF) and Queue 3 (FCFS) over time, or age back up through anti-starvation promotion. Each queue uses a different scheduling algorithm. Processes can be blocked (I/O simulation) and return to their original queue on unblock. The simulator runs full simulation or advances one time unit at a time, recording every scheduling decision, promotion, and preemption.',
    category: 'CPU Scheduling',
    concept: 'MLFQ / Aging / Anti-Starvation',
    gradientFrom: '#1e1b4b',
    gradientTo: '#7c3aed',
  },
  {
    slug: 'round-robin',
    title: 'Round-Robin Scheduler',
    description:
      'CPU scheduling with configurable time quantum. Each process gets an equal slice; if it does not finish, it goes to the back of the ready queue.',
    detail:
      'Implements textbook Round-Robin scheduling: processes (with configurable burst times) share the CPU in time quanta. If a process exhausts its quantum without completing, it is re-queued with its remaining burst time. The simulator produces a full execution log, a Gantt chart of which process ran in each slot, and per-process metrics (completion time, turnaround time, waiting time). Run a full simulation or step through one quantum at a time to watch the queue evolve.',
    category: 'CPU Scheduling',
    concept: 'Round-Robin / Time Quantum',
    gradientFrom: '#3730a3',
    gradientTo: '#6d28d9',
  },
]

export const OS_CATEGORY_COLOR: Record<OSCategory, string> = {
  'CPU Scheduling': '#8b5cf6',
}

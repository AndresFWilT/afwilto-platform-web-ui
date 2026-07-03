export interface ActivityRow {
  id: number
  name: string
  duration: string
  predecessors: string
}

export const EXAMPLE_ACTIVITIES: ActivityRow[] = [
  { id: 1, name: 'A', duration: '9',  predecessors: '' },
  { id: 2, name: 'B', duration: '12', predecessors: 'A' },
  { id: 3, name: 'C', duration: '3',  predecessors: 'B' },
  { id: 4, name: 'D', duration: '7',  predecessors: 'C,H' },
  { id: 5, name: 'E', duration: '11', predecessors: 'A' },
  { id: 6, name: 'F', duration: '8',  predecessors: '' },
  { id: 7, name: 'G', duration: '14', predecessors: 'F' },
  { id: 8, name: 'H', duration: '5',  predecessors: 'E,G' },
]

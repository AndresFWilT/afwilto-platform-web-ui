export const UD_INFO = {
  name: 'Universidad Distrital Francisco José de Caldas',
  acronym: 'UD',
  career: 'Systems Engineering',
  careerEs: 'Ingeniería de Sistemas',
  location: 'Bogotá, Colombia',
  type: 'Public University',
  founded: '1948',
  accentColor: '#003DA5',
  goldColor: '#FFD100',
  logoUrl: '/logos/escudo-ud.svg',
  description:
    "Colombia's largest public university and one of its most prestigious technical institutions. The Faculty of Engineering and Technology houses Systems Engineering — a rigorous program spanning computer science theory, software engineering, artificial intelligence, networks, databases, and modern development paradigms. Projects developed here reflect the depth of public-university education, emphasizing fundamentals, algorithmic thinking, and practical system design.",
} as const

export type UDCategory =
  | 'CS Theory'
  | 'Software Engineering'
  | 'AI & Machine Learning'
  | 'Programming'
  | 'Networks'
  | 'Databases'
  | 'Physics'
  | 'Operations Research'
  | 'Operating Systems'

export interface UDSubject {
  slug: string
  title: string
  number: string
  category: UDCategory
  description: string
  icon: string
}

export const UD_SUBJECTS: UDSubject[] = [
  {
    slug: 'basic-programming',
    number: '01',
    title: 'Basic Programming',
    category: 'Programming',
    icon: '💻',
    description:
      'First steps in programming: variables, control flow, functions, and problem decomposition.',
  },
  {
    slug: 'object-oriented-programming',
    number: '02',
    title: 'Object-Oriented Programming',
    category: 'Programming',
    icon: '🧩',
    description:
      'OOP principles: encapsulation, inheritance, polymorphism, and foundational design patterns.',
  },
  {
    slug: 'advanced-programming',
    number: '03',
    title: 'Advanced Programming',
    category: 'Programming',
    icon: '⚡',
    description:
      'Advanced techniques: generics, metaprogramming, performance optimization, and complex data structures in code.',
  },
  {
    slug: 'programming-models-1',
    number: '04',
    title: 'Programming Models 1',
    category: 'Programming',
    icon: '🔷',
    description: 'Declarative, functional, and logic programming paradigms and their applications.',
  },
  {
    slug: 'programming-models-2',
    number: '05',
    title: 'Programming Models 2',
    category: 'Programming',
    icon: '🔶',
    description:
      'Concurrent, parallel, and distributed programming models for modern multi-core systems.',
  },
  {
    slug: 'computer-science-1',
    number: '06',
    title: 'Computer Science 1',
    category: 'CS Theory',
    icon: '🧮',
    description:
      'Foundations of computation: algorithms, data structures, and mathematical problem-solving.',
  },
  {
    slug: 'computer-science-2',
    number: '07',
    title: 'Computer Science 2',
    category: 'CS Theory',
    icon: '📐',
    description:
      'Algorithmic complexity, advanced data structures, and sorting and searching algorithms.',
  },
  {
    slug: 'computer-science-3',
    number: '08',
    title: 'Computer Science 3',
    category: 'CS Theory',
    icon: '🔬',
    description:
      'Computability theory, formal languages, automata theory, and Turing machines.',
  },
  {
    slug: 'software-engineer-fundamentals',
    number: '09',
    title: 'Software Engineer Fundamentals',
    category: 'Software Engineering',
    icon: '⚙️',
    description:
      'Core principles of software development life cycles, methodologies, and team collaboration practices.',
  },
  {
    slug: 'advanced-software-engineering',
    number: '10',
    title: 'Advanced Software Engineering Tendencies',
    category: 'Software Engineering',
    icon: '🚀',
    description:
      'Emerging trends: microservices, DevOps, cloud-native architectures, and AI-assisted development.',
  },
  {
    slug: 'artificial-intelligence-1',
    number: '11',
    title: 'Artificial Intelligence 1',
    category: 'AI & Machine Learning',
    icon: '🤖',
    description:
      'Introduction to AI: search algorithms, knowledge representation, and expert systems.',
  },
  {
    slug: 'artificial-intelligence-2',
    number: '12',
    title: 'Artificial Intelligence 2',
    category: 'AI & Machine Learning',
    icon: '🧠',
    description:
      'Machine learning fundamentals, neural networks, and practical AI engineering applications.',
  },
  {
    slug: 'network-communication-1',
    number: '13',
    title: 'Network Communication 1',
    category: 'Networks',
    icon: '🌐',
    description:
      'OSI model, physical and data link layers, network topologies, and basic protocols.',
  },
  {
    slug: 'network-communication-2',
    number: '14',
    title: 'Network Communication 2',
    category: 'Networks',
    icon: '📡',
    description:
      'TCP/IP stack, routing protocols, subnetting, and network layer architectures.',
  },
  {
    slug: 'network-communication-3',
    number: '15',
    title: 'Network Communication 3',
    category: 'Networks',
    icon: '🔒',
    description:
      'Application layer protocols, network security, and modern distributed network services.',
  },
  {
    slug: 'physics-lab',
    number: '18',
    title: 'Physics Lab',
    category: 'Physics',
    icon: '⚗️',
    description:
      'Step-by-step measurement reliability calculator: enter raw data, compute means and deviations, propagate errors, and fit a least-squares regression line.',
  },
  {
    slug: 'operations-research-1',
    number: '19',
    title: 'Operations Research I',
    category: 'Operations Research',
    icon: '📐',
    description:
      '2-variable LP via the graphical method (vertex enumeration) and N-variable Mixed Integer Programming via Simplex + Branch & Bound.',
  },
  {
    slug: 'database-1',
    number: '16',
    title: 'Database 1',
    category: 'Databases',
    icon: '🗄️',
    description:
      'Relational databases, SQL, schema normalization, and transaction management fundamentals.',
  },
  {
    slug: 'operative-systems',
    number: '20',
    title: 'Operative Systems',
    category: 'Operating Systems',
    icon: '⚙️',
    description:
      'CPU scheduling algorithms, process management, and OS fundamentals. Interactive Round-Robin scheduler with animated queue, Gantt chart, and step-by-step trace.',
  },
  {
    slug: 'databases-ii',
    number: '17',
    title: 'Databases II',
    category: 'Databases',
    icon: '📊',
    description:
      'Advanced queries, stored procedures, NoSQL paradigms, and distributed database concepts. Final project: TeatrosUD — a full theater management system.',
  },
]

export const UD_CATEGORY_STYLE: Record<UDCategory, { badge: string; gradient: string }> = {
  'CS Theory':           { badge: 'primary', gradient: 'from-primary-700 to-brand-900' },
  'Software Engineering':{ badge: 'neutral', gradient: 'from-cyan-900 to-brand-900' },
  'AI & Machine Learning': { badge: 'success', gradient: 'from-violet-900 to-brand-900' },
  'Programming':         { badge: 'neutral', gradient: 'from-teal-900 to-brand-900' },
  'Networks':            { badge: 'neutral', gradient: 'from-indigo-900 to-brand-900' },
  'Databases':           { badge: 'warning', gradient: 'from-orange-900 to-brand-900' },
  'Physics':             { badge: 'info',    gradient: 'from-sky-900 to-brand-900' },
  'Operations Research': { badge: 'success', gradient: 'from-emerald-900 to-brand-900' },
  'Operating Systems':   { badge: 'warning', gradient: 'from-violet-900 to-brand-900' },
}

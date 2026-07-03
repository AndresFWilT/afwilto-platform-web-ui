export const UNIANDES_INFO = {
  name: 'Universidad de los Andes',
  acronym: 'Uniandes',
  career: 'MATI',
  careerFull: 'Master in Information Technology Architectures',
  careerEs: 'Maestría en Arquitecturas de Tecnologías de Información',
  location: 'Bogotá, Colombia',
  type: 'Private Research University',
  founded: '1948',
  accentColor: '#C41E3A',
  goldColor: '#D4A017',
  logoUrl: 'https://donaciones.uniandes.edu.co/sites/default/files/logo-uniandes.png',
  description:
    'One of Latin America\'s top private research universities and consistently ranked among the best in Colombia. The MATI program (Maestría en Arquitecturas de Tecnologías de Información) is a graduate-level master\'s degree focused on enterprise technology architecture — bridging business strategy with advanced engineering. The curriculum covers every architecture domain: business, software, enterprise, cloud, security, and next-generation paradigms.',
} as const

export type UniandesCategory =
  | 'Architecture'
  | 'Cloud & Infrastructure'
  | 'Security'
  | 'AI & Data'
  | 'Capstone'

export interface UniandesSubject {
  slug: string
  title: string
  category: UniandesCategory
  description: string
  icon: string
  image?: string
}

export const UNIANDES_SUBJECTS: UniandesSubject[] = [
  {
    slug: 'business-architecture',
    title: 'Business Architecture',
    category: 'Architecture',
    icon: '🏢',
    image: '/logos/mati/business-architecture.png',
    description:
      'Aligning IT strategy with business goals through enterprise-wide capability modeling and value stream mapping.',
  },
  {
    slug: 'software-architecture',
    title: 'Software Architecture',
    category: 'Architecture',
    icon: '🏗️',
    description:
      'Designing scalable, maintainable software systems using proven architectural patterns and quality attribute trade-offs.',
  },
  {
    slug: 'enterprise-architecture',
    title: 'Enterprise Architecture',
    category: 'Architecture',
    icon: '🌐',
    image: '/logos/mati/enterprise-architecture.jpg',
    description:
      'Holistic EA frameworks (TOGAF, Zachman) for driving organizational transformation through structured architecture governance.',
  },
  {
    slug: 'architecting-for-the-cloud',
    title: 'Architecting for the Cloud',
    category: 'Cloud & Infrastructure',
    icon: '☁️',
    image: '/logos/mati/architecting-for-the-cloud.jpg',
    description:
      'Cloud-native design principles, multi-cloud strategies, serverless paradigms, and cost-optimized infrastructure design.',
  },
  {
    slug: 'security-architecture',
    title: 'Security Architecture',
    category: 'Security',
    icon: '🛡️',
    image: '/logos/mati/security-architecture.png',
    description:
      'Security-by-design principles, threat modeling, zero-trust architectures, and enterprise security governance frameworks.',
  },
  {
    slug: 'solution-architecture',
    title: 'Solution Architecture',
    category: 'Architecture',
    icon: '🔧',
    image: '/logos/mati/solutions-architecture.jpg',
    description:
      'End-to-end solution design bridging business requirements, technology constraints, and technical implementation.',
  },
  {
    slug: 'next-generation-architectures',
    title: 'Next-Generation Architectures',
    category: 'Architecture',
    icon: '⚡',
    image: '/logos/mati/Nest-Generation-Architectures.png',
    description:
      'Event-driven, service mesh, and AI-native architectural paradigms for modern distributed systems at scale.',
  },
  {
    slug: 'deep-learning-analysis',
    title: 'Deep Learning Analysis',
    category: 'AI & Data',
    icon: '🧠',
    image: '/logos/mati/Deep-Learning-Analysis.png',
    description:
      'Deep neural networks, CNNs, RNNs, and transformer models applied to enterprise data and architecture decisions.',
  },
  {
    slug: 'secure-coding',
    title: 'Secure Coding',
    category: 'Security',
    icon: '🔐',
    description:
      'Secure development practices, OWASP Top 10, static analysis, and vulnerability prevention in modern codebases.',
  },
  {
    slug: 'final-project',
    title: 'Final Project',
    category: 'Capstone',
    icon: '🎓',
    description:
      'Capstone integrating all MATI architecture disciplines into a comprehensive, production-ready enterprise solution.',
  },
]

export const UNIANDES_CATEGORY_STYLE: Record<UniandesCategory, { badge: string; gradient: string }> = {
  'Architecture':          { badge: 'primary',  gradient: 'from-brand-600 to-brand-900' },
  'Cloud & Infrastructure':{ badge: 'neutral',  gradient: 'from-sky-900 to-brand-900' },
  'Security':              { badge: 'error',    gradient: 'from-red-900 to-brand-900' },
  'AI & Data':             { badge: 'success',  gradient: 'from-violet-900 to-brand-900' },
  'Capstone':              { badge: 'warning',  gradient: 'from-amber-900 to-brand-900' },
}

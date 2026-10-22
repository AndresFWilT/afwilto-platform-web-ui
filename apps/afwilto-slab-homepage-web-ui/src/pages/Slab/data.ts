export const UD_INFO = {
  name: 'Universidad Distrital Francisco José de Caldas',
  acronym: 'UD',
  career: 'Systems Engineering',
  location: 'Bogotá, Colombia',
  type: 'Public University',
  founded: '1948',
  accentColor: '#003DA5',
  goldColor: '#FFD100',
  logoUrl: '/logos/escudo-ud.svg',
} as const

export const UNIANDES_INFO = {
  name: 'Universidad de los Andes',
  acronym: 'Uniandes',
  career: 'MATI',
  location: 'Bogotá, Colombia',
  type: 'Private Research University',
  founded: '1948',
  accentColor: '#C41E3A',
  goldColor: '#D4A017',
  logoUrl: 'https://donaciones.uniandes.edu.co/sites/default/files/logo-uniandes.png',
} as const

export interface SoftwareEngineeringProject {
  title: string
  to: string
  description: string
  tags: string[]
  accentColor: string
}

// Spec 17 FR-8 — one card per project in the "Software Engineering" section.
export const SE_PROJECTS: SoftwareEngineeringProject[] = [
  {
    title: 'CIDR Calculator',
    to: '/slab/cidr',
    description:
      'IPv4 and IPv6 subnet math: CIDR to range, range to minimal CIDR list, address aggregation and prefix tables — every calculation done by a hexagonal Ruby service.',
    tags: ['IPv4', 'IPv6', 'Ruby', 'Sinatra', 'Hexagonal'],
    accentColor: '#0EA5E9',
  },
]

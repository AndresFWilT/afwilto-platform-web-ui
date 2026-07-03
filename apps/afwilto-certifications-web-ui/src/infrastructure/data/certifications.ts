import type { Certification } from '@/application/ports'

export const CERTIFICATIONS: Certification[] = [
  {
    slug: 'oracle-java-se-8',
    name: 'Oracle Certified Associate, Java SE 8 Programmer',
    provider: 'Oracle',
    status: 'obtained',
    description:
      'Core Java language fundamentals: types, operators, flow control, OOP, inheritance, exceptions and the Java API surface.',
    skills: ['Java', 'OOP', 'Exception Handling', 'Collections'],
    icon: '☕',
    obtainedDate: '2023-11-15',
    link: 'https://education.oracle.com/java-se-8-programmer-i/pexam_1Z0-808',
  },
  {
    slug: 'scrum-fundamentals',
    name: 'Scrum Fundamentals Certified',
    provider: 'SCRUMstudy',
    status: 'obtained',
    description:
      'Agile principles, Scrum roles, events and artifacts for delivering iterative, incremental value.',
    skills: ['Scrum', 'Agile', 'Sprint Planning'],
    icon: '🔄',
    obtainedDate: '2022-06-01',
    link: 'https://www.scrumstudy.com/certification/scrum-fundamentals-certified',
  },
  {
    slug: 'aws-solutions-architect-associate',
    name: 'AWS Certified Solutions Architect — Associate',
    provider: 'Amazon Web Services',
    status: 'in-progress',
    description:
      'Designing resilient, high-performing, secure and cost-optimized architectures on AWS.',
    skills: ['AWS', 'VPC', 'IAM', 'S3', 'EC2', 'Well-Architected Framework'],
    icon: '☁️',
    targetDate: '2026-12-15',
  },
  {
    slug: 'cka',
    name: 'Certified Kubernetes Administrator',
    provider: 'Cloud Native Computing Foundation',
    status: 'planned',
    description:
      'Cluster architecture, installation, workloads, networking, storage and troubleshooting on Kubernetes.',
    skills: ['Kubernetes', 'Containers', 'Networking', 'Troubleshooting'],
    icon: '☸️',
    targetDate: '2027-06-30',
  },
  {
    slug: 'togaf-foundation',
    name: 'TOGAF Enterprise Architecture Foundation',
    provider: 'The Open Group',
    status: 'planned',
    description:
      'Enterprise architecture method and framework: ADM cycle, architecture governance and building blocks.',
    skills: ['Enterprise Architecture', 'ADM', 'Governance'],
    icon: '🏛️',
    targetDate: '2027-12-01',
  },
]

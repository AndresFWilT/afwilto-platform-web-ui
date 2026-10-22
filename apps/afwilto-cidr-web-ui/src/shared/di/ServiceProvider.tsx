import { createContext, useContext, type ReactNode } from 'react'
import type { ICidrCalculator } from '@/cidr/application/ports'

/** The ports pages depend on; app/di/container.ts provides the adapters. */
export interface ServiceContainer {
  calculator: ICidrCalculator
}

const ServiceContext = createContext<ServiceContainer | null>(null)

export function ServiceProvider({ value, children }: { value: ServiceContainer; children: ReactNode }) {
  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>
}

/** Only pages call this (frontend/CLAUDE.md, MFE standard rule 2). */
export function useServices(): ServiceContainer {
  const services = useContext(ServiceContext)
  if (!services) throw new Error('useServices() needs a <ServiceProvider>')
  return services
}

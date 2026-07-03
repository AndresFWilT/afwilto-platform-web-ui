import { createContext, useContext, type ReactNode } from 'react'
import { container, type ServiceContainer } from './container'

const ServiceContext = createContext<ServiceContainer>(container)

export function ServiceProvider({ children }: { children: ReactNode }) {
  return <ServiceContext.Provider value={container}>{children}</ServiceContext.Provider>
}

export function useServices(): ServiceContainer {
  return useContext(ServiceContext)
}

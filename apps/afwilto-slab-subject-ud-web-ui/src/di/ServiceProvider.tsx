import { createContext, useContext, type ReactNode } from 'react'
import { container, type ServiceContainer } from './container'

const ServiceContext = createContext<ServiceContainer>(container)

export function ServiceProvider({ children, services = container }: { children: ReactNode; services?: ServiceContainer }) {
  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>
}

export function useServices(): ServiceContainer {
  return useContext(ServiceContext)
}

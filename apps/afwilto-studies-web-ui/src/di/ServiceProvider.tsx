import { createContext, useContext, type ReactNode } from 'react'
import { container, type ServiceContainer } from './container'

const ServiceContext = createContext<ServiceContainer>(container)

export function ServiceProvider({ children, value = container }: { children: ReactNode; value?: ServiceContainer }) {
  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>
}

export function useServices(): ServiceContainer {
  return useContext(ServiceContext)
}

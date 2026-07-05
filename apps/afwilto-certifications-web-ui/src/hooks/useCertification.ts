import { useEffect, useState } from 'react'
import { useServices } from '@/di'
import type { Certification } from '@/application/ports'

interface State {
  certification: Certification | null
  loading: boolean
  error: Error | null
}

export function useCertification(id: string) {
  const { certificationJourneyService } = useServices()
  const [state, setState] = useState<State>({ certification: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ certification: null, loading: true, error: null })
    certificationJourneyService
      .getById(id)
      .then(cert => {
        if (!cancelled) setState({ certification: cert, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            certification: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          })
      })
    return () => { cancelled = true }
  }, [id])

  return state
}

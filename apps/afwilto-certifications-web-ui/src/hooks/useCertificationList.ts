import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useServices } from '@/di'
import type { Certification, ListMeta, ListQuery } from '@/application/ports'

function parseQuery(params: URLSearchParams): ListQuery {
  const query: ListQuery = {}
  const page = params.get('page')
  if (page) query.page = Number(page)
  const pageSize = params.get('pageSize')
  if (pageSize) query.pageSize = Number(pageSize)
  const search = params.get('search')
  if (search) query.search = search
  const status = params.get('status')
  if (status) query.status = status as ListQuery['status']
  const categoryPrefix = params.get('categoryPrefix')
  if (categoryPrefix) query.categoryPrefix = categoryPrefix
  const year = params.get('year')
  if (year) query.year = Number(year)
  const sortBy = params.get('sortBy')
  if (sortBy) query.sortBy = sortBy as ListQuery['sortBy']
  const sortOrder = params.get('sortOrder')
  if (sortOrder) query.sortOrder = sortOrder as 'asc' | 'desc'
  return query
}

function buildParams(query: ListQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.page && query.page !== 1) params.set('page', String(query.page))
  if (query.pageSize && query.pageSize !== 20) params.set('pageSize', String(query.pageSize))
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.categoryPrefix) params.set('categoryPrefix', query.categoryPrefix)
  if (query.year) params.set('year', String(query.year))
  if (query.sortBy) params.set('sortBy', query.sortBy)
  if (query.sortOrder) params.set('sortOrder', query.sortOrder)
  return params
}

interface State {
  items: Certification[]
  meta: ListMeta | null
  loading: boolean
  error: Error | null
}

export function useCertificationList() {
  const { certificationJourneyService } = useServices()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = parseQuery(searchParams)

  const [state, setState] = useState<State>({ items: [], meta: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))
    certificationJourneyService
      .list(query)
      .then(page => {
        if (!cancelled) setState({ items: page.items, meta: page.meta, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState(s => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          }))
      })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  function setQuery(q: ListQuery) {
    setSearchParams(buildParams(q), { replace: true })
  }

  return { ...state, query, setQuery }
}

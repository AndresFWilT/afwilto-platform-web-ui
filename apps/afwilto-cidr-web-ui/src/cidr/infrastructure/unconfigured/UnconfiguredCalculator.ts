import type { ICidrCalculator } from '@/cidr/application/ports'

const NOT_CONFIGURED = 'The CIDR API is not configured (VITE_API_URL).'

/**
 * Wired when no API URL is set. Calculations live only in the backend, so
 * there is no local fallback: every call explains what is missing.
 */
export class UnconfiguredCalculator implements ICidrCalculator {
  calculateRange = () => Promise.reject(new Error(NOT_CONFIGURED))
  summarizeRange = () => Promise.reject(new Error(NOT_CONFIGURED))
  aggregate = () => Promise.reject(new Error(NOT_CONFIGURED))
  prefixTable = () => Promise.reject(new Error(NOT_CONFIGURED))
}

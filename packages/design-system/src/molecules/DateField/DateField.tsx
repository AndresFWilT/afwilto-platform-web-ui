import { FormField } from '../FormField'
import type { DateFieldProps } from './DateField.types'

export function DateField(props: DateFieldProps) {
  return <FormField type="date" {...props} />
}

import type { FormFieldProps } from '../FormField'

// A DateField is a FormField locked to the native date input — no date-picker
// library by platform rule. Values are ISO date strings end-to-end.
export interface DateFieldProps extends Omit<FormFieldProps, 'type' | 'leftIcon' | 'rightIcon'> {
  value?: string
}

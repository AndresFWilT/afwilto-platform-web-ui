import { Input } from '../../atoms/Input'
import { Text } from '../../atoms/Text'
import type { FormFieldProps } from './FormField.types'

export function FormField({
  label,
  id,
  helperText,
  errorMessage,
  required,
  ...inputProps
}: FormFieldProps) {
  const hasError = Boolean(errorMessage)

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="flex items-center gap-1">
        <Text variant="small" weight="medium" color="default">
          {label}
        </Text>
        {required && (
          <Text variant="caption" color="error" aria-hidden>
            *
          </Text>
        )}
      </label>

      <Input id={id} error={hasError} {...inputProps} />

      {hasError && (
        <Text variant="caption" color="error" role="alert">
          {errorMessage}
        </Text>
      )}
      {!hasError && helperText && (
        <Text variant="caption" color="muted">
          {helperText}
        </Text>
      )}
    </div>
  )
}

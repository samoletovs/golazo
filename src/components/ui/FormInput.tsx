import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  as?: 'input'
}

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  as: 'textarea'
}

export function FormInput({ label, as, ...props }: FormInputProps | FormTextareaProps) {
  const baseClass = 'w-full text-sm p-2.5 rounded-lg'
  const baseStyle = {
    background: 'var(--color-field-input)',
    border: '1px solid var(--color-glass-border)',
  }

  return (
    <div>
      {label && <p className="section-label mb-1.5">{label}</p>}
      {as === 'textarea' ? (
        <textarea
          className={baseClass}
          style={baseStyle}
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={baseClass}
          style={baseStyle}
          {...(props as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
    </div>
  )
}

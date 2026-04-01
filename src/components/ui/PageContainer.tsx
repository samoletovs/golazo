import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`flex flex-col gap-4 p-4 pb-32 ${className}`.trim()}>
      {children}
    </div>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed top-4 right-4 z-50 rounded-lg border p-4 shadow-lg transition-all",
        {
          "bg-white border-gray-200 text-gray-900": variant === "default",
          "bg-red-50 border-red-200 text-red-900": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  )
)
Toast.displayName = "Toast"

const Toaster = () => {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(({ id, title, description, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          {title && (
            <div className="font-semibold">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </Toast>
      ))}
    </>
  )
}

// Simple hook implementation
function useToast() {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    variant?: "default" | "destructive"
  }>>([])

  const toast = React.useCallback(({ title, description, variant = "default" }: {
    title?: React.ReactNode
    description?: React.ReactNode
    variant?: "default" | "destructive"
  }) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { id, title, description, variant }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
    
    return { id }
  }, [])

  return { toasts, toast }
}

export { Toast, Toaster, useToast }

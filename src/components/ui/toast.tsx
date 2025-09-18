"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react'
import { Button } from "./button"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full p-4 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "border bg-card text-card-foreground",
        success: "border-success-500/50 bg-success-50/90 text-success-800 dark:border-success-500/30 dark:bg-success-950/90 dark:text-success-200",
        destructive: "border-error-500/50 bg-error-50/90 text-error-800 dark:border-error-500/30 dark:bg-error-950/90 dark:text-error-200",
        warning: "border-warning-500/50 bg-warning-50/90 text-warning-800 dark:border-warning-500/30 dark:bg-warning-950/90 dark:text-warning-200",
        info: "border-brand-500/50 bg-brand-50/90 text-brand-800 dark:border-brand-500/30 dark:bg-brand-950/90 dark:text-brand-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ToastProps extends VariantProps<typeof toastVariants> {
  className?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
  duration?: number
  onClose?: () => void
  showProgress?: boolean
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ 
    className, 
    variant, 
    title, 
    description, 
    action, 
    icon, 
    duration = 5000, 
    onClose,
    showProgress = false,
    ...props 
  }, ref) => {
    const [progress, setProgress] = React.useState(100)
    const startTimeRef = React.useRef<number>()
    const animationRef = React.useRef<number>()

    React.useEffect(() => {
      if (!showProgress || !duration) return

      startTimeRef.current = Date.now()

      const animate = () => {
        const elapsed = Date.now() - (startTimeRef.current || 0)
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
        setProgress(remaining)

        if (remaining > 0) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }, [duration, showProgress])

    const getIcon = () => {
      if (icon) return icon

      switch (variant) {
        case 'success':
          return <CheckCircle className="w-5 h-5 text-success-500" />
        case 'destructive':
          return <AlertCircle className="w-5 h-5 text-error-500" />
        case 'warning':
          return <AlertTriangle className="w-5 h-5 text-warning-500" />
        case 'info':
          return <Info className="w-5 h-5 text-brand-500" />
        default:
          return <Clock className="w-5 h-5 text-muted-foreground" />
      }
    }

    return (
      <motion.div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        {...props}
      >
        {/* Progress Bar */}
        {showProgress && duration && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 overflow-hidden">
            <motion.div
              className={cn(
                "h-full bg-current opacity-30",
                variant === 'success' && "bg-success-500",
                variant === 'destructive' && "bg-error-500",
                variant === 'warning' && "bg-warning-500",
                variant === 'info' && "bg-brand-500"
              )}
              initial={{ width: "100%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="mt-0.5 flex-shrink-0">
            {getIcon()}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <div className="font-semibold text-sm leading-tight">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm opacity-90 mt-1 leading-relaxed">
                {description}
              </div>
            )}
            {action && (
              <div className="mt-3">
                {action}
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-70 hover:opacity-100 shrink-0"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </motion.div>
    )
  }
)
Toast.displayName = "Toast"

// Enhanced Toaster with better positioning and animations
const Toaster = () => {
  const { toasts } = useToast()

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col-reverse gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Enhanced hook with better typing and features
interface ToastOptions {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "success" | "destructive" | "warning" | "info"
  action?: React.ReactNode
  icon?: React.ReactNode
  duration?: number
  showProgress?: boolean
}

interface ToastInstance extends ToastOptions {
  id: string
  onClose: () => void
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToastInstance[]>([])

  const toast = React.useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9)
    
    const dismiss = () => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }

    const newToast: ToastInstance = {
      ...options,
      id,
      onClose: dismiss,
      duration: options.duration ?? 5000,
      showProgress: options.showProgress ?? true,
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss()
      }, newToast.duration)
    }
    
    return { id, dismiss }
  }, [])

  // Convenience methods
  const success = React.useCallback((options: Omit<ToastOptions, 'variant'>) => 
    toast({ ...options, variant: 'success' }), [toast])

  const error = React.useCallback((options: Omit<ToastOptions, 'variant'>) => 
    toast({ ...options, variant: 'destructive' }), [toast])

  const warning = React.useCallback((options: Omit<ToastOptions, 'variant'>) => 
    toast({ ...options, variant: 'warning' }), [toast])

  const info = React.useCallback((options: Omit<ToastOptions, 'variant'>) => 
    toast({ ...options, variant: 'info' }), [toast])

  const dismiss = React.useCallback((toastId?: string) => {
    if (toastId) {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    } else {
      setToasts([])
    }
  }, [])

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    dismiss,
  }
}

export { Toast, Toaster, useToast }

import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shimmer = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "skeleton",
        shimmer && "skeleton-shimmer",
        className
      )}
      {...props}
    />
  )
)
Skeleton.displayName = "Skeleton"

// Common skeleton patterns
const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 space-y-4", className)} {...props}>
    <Skeleton className="h-4 w-3/4" shimmer />
    <Skeleton className="h-4 w-1/2" shimmer />
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  </div>
)

const SkeletonAvatar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton className={cn("w-10 h-10 rounded-full", className)} {...props} shimmer />
)

const SkeletonButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton className={cn("h-10 px-4 py-2 rounded-md", className)} {...props} shimmer />
)

const SkeletonText = ({ 
  lines = 3, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) => (
  <div className={cn("space-y-2", className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={cn(
          "h-3",
          i === lines - 1 ? "w-3/4" : "w-full"
        )} 
        shimmer 
      />
    ))}
  </div>
)

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonText 
}

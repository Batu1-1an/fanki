"use client"

import * as React from "react"
import Image, { ImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

type AvatarImageSrc = ImageProps['src'] | undefined

interface AvatarImageProps extends Omit<ImageProps, "alt" | "src"> {
  className?: string
  alt?: string
  src?: AvatarImageSrc
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt = "User avatar", sizes = "40px", src, ...props }, ref) => {
    if (!src) {
      return null
    }

    return (
      <Image
        ref={ref}
        alt={alt}
        sizes={sizes}
        src={src}
        className={cn("aspect-square h-full w-full object-cover", className)}
        fill
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600",
        className
      )}
      {...props}
    />
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }

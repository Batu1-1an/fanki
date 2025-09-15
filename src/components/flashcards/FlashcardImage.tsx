'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { FlashcardImageProps } from '@/types'
import { ImageOff, Loader2, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FlashcardImage({ 
  imageUrl, 
  alt, 
  className,
  priority = false 
}: FlashcardImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  const handleLoadComplete = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  const toggleZoom = useCallback(() => {
    setIsZoomed(!isZoomed)
  }, [isZoomed])

  if (!imageUrl) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20",
        className
      )}>
        <div className="text-center text-muted-foreground">
          <ImageOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No image available</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-red-50 rounded-lg border-2 border-dashed border-red-200",
        className
      )}>
        <div className="text-center text-red-600">
          <ImageOff className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Failed to load image</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-lg bg-muted/30 cursor-zoom-in group",
          className
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        onClick={toggleZoom}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Loading image...</p>
            </div>
          </div>
        )}

        {/* Zoom overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-20 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 rounded-full p-2">
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </div>
        </div>

        {/* Main image */}
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover transition-transform duration-300"
          onLoad={handleLoadComplete}
          onError={handleError}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </motion.div>

      {/* Zoomed modal */}
      {isZoomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={toggleZoom}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-4xl max-h-[90vh] w-full h-full"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className="object-contain"
              priority
            />
            
            {/* Close button */}
            <button
              onClick={toggleZoom}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

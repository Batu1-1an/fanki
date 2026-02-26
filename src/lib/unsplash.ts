import { createClientComponentClient } from './supabase'

const supabase = createClientComponentClient()

export interface UnsplashRateLimit {
  limit: string | null
  remaining: string | null
  reset: string | null
}

export interface UnsplashUser {
  id: string
  username: string
  name: string
  portfolio_url?: string | null
  profile_image?: Record<string, string>
  links?: Record<string, string>
}

export interface UnsplashPhoto {
  id: string
  slug?: string
  description?: string | null
  alt_description?: string | null
  width?: number
  height?: number
  color?: string | null
  blur_hash?: string | null
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
    small_s3?: string
  }
  links: {
    self: string
    html: string
    download: string
    download_location: string
  }
  user: UnsplashUser
  tags?: Array<{ title?: string; type?: string }>
  topic_submissions?: Record<string, unknown>
}

export interface UnsplashSearchResult {
  total: number
  totalPages: number
  results: UnsplashPhoto[]
  rateLimit?: UnsplashRateLimit
}

export async function searchUnsplashImages(
  query: string,
  options?: {
    page?: number
    perPage?: number
    orientation?: string
    orderBy?: string
    contentFilter?: 'low' | 'high'
    color?: string
    collections?: string
    topics?: string
  }
): Promise<UnsplashSearchResult> {
  const { page, perPage, orientation, orderBy, contentFilter, color, collections, topics } = options || {}

  const { data, error } = await supabase.functions.invoke('search-unsplash', {
    body: {
      query,
      page,
      perPage,
      orientation,
      orderBy,
      contentFilter,
      color,
      collections,
      topics
    }
  })

  if (error) {
    console.error('Unsplash search error:', error)
    throw new Error(error.message || 'Failed to search Unsplash')
  }

  const rateLimit: UnsplashRateLimit | undefined = data?.rateLimit

  if (rateLimit) {
    console.info('Unsplash rate limit', rateLimit)
  }

  const rawResults = Array.isArray(data?.results) ? data.results : []
  const results: UnsplashPhoto[] = rawResults.filter((photo: any) => {
    return Boolean(
      photo &&
      photo.id &&
      photo.urls?.small &&
      photo.urls?.regular &&
      photo.links?.download_location
    )
  })

  return {
    total: data?.total ?? 0,
    totalPages: data?.total_pages ?? 0,
    results,
    rateLimit
  }
}

export async function trackUnsplashDownload(downloadLocation: string): Promise<UnsplashRateLimit | undefined> {
  const { data, error } = await supabase.functions.invoke('search-unsplash', {
    body: {
      action: 'download',
      downloadLocation
    }
  })

  if (error) {
    console.error('Unsplash download tracking error:', error)
    throw new Error(error.message || 'Failed to register Unsplash download')
  }

  const rateLimit: UnsplashRateLimit | undefined = data?.rateLimit

  if (rateLimit) {
    console.info('Unsplash rate limit after download', rateLimit)
  }

  return rateLimit
}

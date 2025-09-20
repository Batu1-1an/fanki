/**
 * Utility functions for handling redirects securely
 */

/**
 * Validates if a redirect URL is safe to use
 * Only allows relative paths within the application
 * @param url - The URL to validate
 * @returns true if the URL is safe for redirect, false otherwise
 */
export function isValidRedirect(url: string | null | undefined): boolean {
  // Return false for null, undefined, or empty strings
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    // If the URL starts with '/', it's a relative path - this is safe
    if (url.startsWith('/')) {
      // Ensure it's not a protocol-relative URL (//example.com)
      return !url.startsWith('//')
    }

    // For any other format, parse as URL to check if it's external
    const parsedUrl = new URL(url)
    
    // Only allow URLs without host (relative paths) or same origin
    return !parsedUrl.host || parsedUrl.host === process.env.NEXT_PUBLIC_SITE_URL
  } catch {
    // If URL parsing fails, it's likely not a valid URL - reject it
    return false
  }
}

/**
 * Returns a safe redirect URL or a default fallback
 * @param url - The URL to validate and sanitize
 * @param fallback - The default URL to use if validation fails
 * @returns A safe URL for redirection
 */
export function getSafeRedirectUrl(
  url: string | null | undefined, 
  fallback: string = '/dashboard'
): string {
  return isValidRedirect(url) ? url! : fallback
}

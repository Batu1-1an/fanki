// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
}

const UNSPLASH_API_BASE = "https://api.unsplash.com"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const accessKey = Deno.env.get("UNSPLASH_ACCESS_KEY")
    if (!accessKey) {
      throw new Error("UNSPLASH_ACCESS_KEY not configured")
    }

    let requestBody
    try {
      requestBody = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const { action = "search" } = requestBody ?? {}

    if (action === "download") {
      const { downloadLocation } = requestBody ?? {}

      if (!downloadLocation || typeof downloadLocation !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing required field: downloadLocation" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        )
      }

      const downloadResponse = await fetch(downloadLocation, {
        headers: {
          "Accept-Version": "v1",
          Authorization: `Client-ID ${accessKey}`
        }
      })

      const rateLimit = {
        limit: downloadResponse.headers.get("X-Ratelimit-Limit"),
        remaining: downloadResponse.headers.get("X-Ratelimit-Remaining"),
        reset: downloadResponse.headers.get("X-Ratelimit-Reset")
      }

      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text()
        return new Response(
          JSON.stringify({
            error: "Unsplash download error",
            status: downloadResponse.status,
            details: errorText,
            rateLimit
          }),
          {
            status: downloadResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true, rateLimit }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const {
      query,
      page = 1,
      perPage = 12,
      orientation,
      orderBy = "relevant",
      contentFilter = "high",
      color,
      collections,
      topics
    } = requestBody ?? {}

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required field: query" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const params = new URLSearchParams({
      query: query.trim(),
      page: Math.max(1, Number(page) || 1).toString(),
      per_page: Math.min(30, Math.max(1, Number(perPage) || 12)).toString(),
      order_by: orderBy,
      content_filter: contentFilter
    })

    if (orientation) params.set("orientation", orientation)
    if (color) params.set("color", color)
    if (collections) params.set("collections", collections)
    if (topics) params.set("topics", topics)

    const upstreamResponse = await fetch(
      `${UNSPLASH_API_BASE}/search/photos?${params.toString()}`,
      {
        headers: {
          "Accept-Version": "v1",
          Authorization: `Client-ID ${accessKey}`
        }
      }
    )

    const rateLimit = {
      limit: upstreamResponse.headers.get("X-Ratelimit-Limit"),
      remaining: upstreamResponse.headers.get("X-Ratelimit-Remaining"),
      reset: upstreamResponse.headers.get("X-Ratelimit-Reset")
    }

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text()
      return new Response(
        JSON.stringify({
          error: "Unsplash API error",
          status: upstreamResponse.status,
          details: errorText,
          rateLimit
        }),
        {
          status: upstreamResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const data = await upstreamResponse.json()

    const simplifiedResults = Array.isArray(data?.results)
      ? data.results.map((photo: any) => ({
          id: photo?.id,
          slug: photo?.slug,
          width: photo?.width,
          height: photo?.height,
          color: photo?.color,
          blur_hash: photo?.blur_hash,
          description: photo?.description,
          alt_description: photo?.alt_description,
          urls: photo?.urls,
          links: photo?.links,
          user: photo?.user
            ? {
                id: photo.user.id,
                username: photo.user.username,
                name: photo.user.name,
                portfolio_url: photo.user.portfolio_url,
                profile_image: photo.user.profile_image,
                links: photo.user.links
              }
            : null,
          tags: photo?.tags?.map((tag: any) => ({
            title: tag?.title,
            type: tag?.type
          })),
          topic_submissions: photo?.topic_submissions
        }))
      : []

    return new Response(
      JSON.stringify({
        total: data?.total ?? 0,
        total_pages: data?.total_pages ?? 0,
        results: simplifiedResults,
        rateLimit
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300"
        }
      }
    )
  } catch (error) {
    console.error("Error in search-unsplash function:", error)

    const message =
      error instanceof Error ? error.message : "Unexpected error occurred"

    return new Response(
      JSON.stringify({
        error: "Failed to call Unsplash",
        message
      }),
      {
        status: message.includes("UNSPLASH_ACCESS_KEY") ? 500 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})

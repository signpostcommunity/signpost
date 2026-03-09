// Returns an embed URL for supported platforms, or null if unrecognized
export function getVideoEmbedUrl(url: string): string | null {
  if (!url?.trim()) return null
  // YouTube standard: youtube.com/watch?v=ID
  const ytWatch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/)
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`
  // YouTube short: youtu.be/ID
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`
  // YouTube Shorts: youtube.com/shorts/ID
  const ytShortsPage = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (ytShortsPage) return `https://www.youtube.com/embed/${ytShortsPage[1]}`
  // Vimeo: vimeo.com/ID
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  // Supabase storage URL (direct video file upload)
  if (url.includes('supabase.co/storage') &&
      /\.(mp4|webm|mov)(\?|$)/i.test(url)) return url
  return null
}

// Returns true if the URL is valid for saving (recognized platform or storage URL)
export function isValidVideoUrl(url: string): boolean {
  if (!url?.trim()) return true // empty is fine — field is optional
  return getVideoEmbedUrl(url) !== null
}

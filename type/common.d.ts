type NowPlayingInfo = {
  title: string
  artist: string
  thumbnail: string
  publishedAt: string
  id: string
  progress: number
  favorited: boolean
  favoriteCount: number
  volume: number
  reason: "priority_playlist" | "add_playlist" | "favorite" | undefined
}

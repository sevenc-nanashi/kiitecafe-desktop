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
  reason: "priority_playlist" | "add_playlist" | "favorite" | "none"
}

type Playlist = {
  list_id: string
  list_title: string
  quantity: number
  thumbnail: string
  created_at: string
  updated_at: string
  description: string
  status: "active" | "inactive"
}

type UpdateAvailable = { tag_name: string; html_url: string } | false

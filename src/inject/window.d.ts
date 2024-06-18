import type d3 from "d3"
declare global {
  interface Window {
    cafe_music: CafeMusic
    cafe_users: CafeUsers
    sns_user: SnsUser
    CafePlayer: Class<CafePlayer>
    CafeMusic: Class<CafeMusic>
    d3: d3
    YT?: unknown
    gon: Gon
  }

  interface Gon {
    user: User
    youtube_play: boolean
  }

  class CafeMusic {
    reason: { reasons: Reason[] }
    now_playing: CafeMusicInfo
    get_song_pos: (musicInfo: CafeMusicInfo) => number
    play: (musicInfo: CafeMusicInfo & { start_time: number }) => void
    pause: () => void
    now_playing_player: CafePlayer
    play_history: (musicInfo: CafeMusicInfo) => void
  }
  class CafeUsers {
    users: User[]
    me: User
  }

  class CafePlayer {
    constructor(video_id: string, start_time: number): void
    seekTo: (time: number) => number
    load: (player: Partial<CafePlayer>) => void
    pause: () => unknown
    onFirstPlay: () => void
    onPause: () => void
    remove: () => void
  }

  class CafeYtPlayer extends CafePlayer {
    constructor(video_id: string, start_time: number): void
  }

  type SnsUser = {
    get_api_playlists: Request<Playlist[]>
    get_api_playlist_songs: Request<{ songs: string[] }>
    post_song_to_playlist: MultiRequest<void>
  }
}
type ReasonBase = {
  user_id: number
}
type FavoriteReason = ReasonBase & {
  type: "favorite"
}
type PriPlaylistReason = ReasonBase & {
  type: "priority_playlist"
  list_id: number
  list_title: string
  playlist_comment?: string
}
type PlaylistReason = ReasonBase & {
  type: "add_playlist"
  list_id: number
}
type Reason = FavoriteReason | PriPlaylistReason | PlaylistReason

type User = {
  user_id: number
  nickname: string
  user_name: string
  avatar_url: string
  user_va: VA
}

type VA = {
  v: number
  a: number
}

type CafeMusicInfo = {
  id: number
  video_id: string
  yt_video_id: string
  title: string
  artist_id: number
  artist_name: string
  start_time: string
  msec_duration: number
  published_at: string
  request_user_ids: number[]
  created_at: string
  updated_at: string
  reasons: Reason[]
  thumbnail: string
  new_fav_user_ids: number[]
  baseinfo: {
    video_id: string
    title: string
    first_retrieve: string
    description: string
    genre: string
    length: string
    tags: string[]
    thumbnail_url: string
    view_counter: string
    comment_num: string
    mylist_counter: string
    embeddable: string
    no_live_play: string
    user_id: string
    user_icon_url: string
    user_nickname: string
  }
  colors: string[]
  presenter_user_ids: number[] | null
  belt_message: string | null
  now_message: string | null
  rotate_action: string | null
  bpm: number
  display_playlist_link: boolean
}

type Class<T> = new (...args: unknown[]) => T

type RequestCallback<T> = (response: T) => void
interface Request<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]): void
  (callback: RequestCallback<T>): void
}
interface MultiRequest<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]): void
  (callback: Record<string, RequestCallback<T>>): void
}

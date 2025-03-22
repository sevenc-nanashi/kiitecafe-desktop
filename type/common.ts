export type NowPlayingInfo = {
  title: string;
  artist: string;
  thumbnail: string;
  publishedAt: string;
  id: string;
  source: "youtube" | "nicovideo";
  progress: number;
  favorited: boolean;
  favoriteCount: number;
  volume: number;
  startedAt: number;
  endsAt: number;
  reason: "priority_playlist" | "add_playlist" | "favorite" | "none";
};

export type Playlist = {
  list_id: string;
  list_title: string;
  quantity: number;
  thumbnail: string;
  created_at: string;
  updated_at: string;
  description: string;
  status: "active" | "inactive";
};

export type UpdateAvailable = { tag_name: string; html_url: string } | false;

export type CyalumeSettings = {
  grow: boolean;
  colorType: "single" | "crypton" | "follow";
  singleColor: string;
  dim: boolean;
};

const colors = [
  {
    default: "#ff33aa",
    label: "お気に入り",
    name: "favorite",
  },
  {
    default: "#10d300",
    label: "プレイリスト",
    name: "playlist",
  },
  {
    default: "#00feff",
    label: "イチ推しリスト",
    name: "priority_playlist",
  },
  {
    default: "#ffef00",
    label: "テーマ",
    name: "primary",
  },
  {
    default: "#ff0000",
    label: "アクセント",
    name: "accent",
  },
] as const;

export default colors;

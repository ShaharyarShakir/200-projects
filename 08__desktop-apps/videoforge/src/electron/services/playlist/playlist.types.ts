export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  duration?: number;
}

export interface PlaylistData {
  id: string;
  title: string;
  uploader: string;
  thumbnail?: string;
  entries: PlaylistItem[];
}

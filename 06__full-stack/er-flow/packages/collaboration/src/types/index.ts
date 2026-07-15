export interface AwarenessUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
}

export interface Cursor {
  x: number;
  y: number;
}

export interface Selection {
  anchor: number;
  head: number;
}

export interface Presence {
  user: AwarenessUser;
  cursor?: Cursor;
  selection?: Selection;
  lastActive: number;
}

export interface Connection {
  clientId: number;
  presence: Presence;
}

export type CourseStatus =
  | 'draft'
  | 'published'
  | 'archived'

export type VideoStatus =
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'failed'

export interface VideoAsset {
  id: string
  status: VideoStatus
  mimeType: string
  durationSeconds?: number
  errorMessage?: string
}

export interface Lesson {
  id: string
  title: string
  position: number
  videoAsset?: VideoAsset | null
}

export interface Section {
  id: string
  title: string
  position: number
  lessons: Lesson[]
}

export interface Course {
  id: string
  title: string
  description: string
  status: CourseStatus
  sections: Section[]
}

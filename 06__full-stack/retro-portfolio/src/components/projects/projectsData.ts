// src/components/projects/projectsData.ts

export type ProjectTag = 'devops' | 'mlops' | 'fullstack' | 'mobile' | 'infra'

export interface StackBreakdown {
  name:    string
  percent: number
}

export interface Project {
  id:             string
  num:            string
  type:           ProjectTag
  name:           string
  desc:           string
  longDesc:       string
  stack:          string[]
  stackBreakdown: StackBreakdown[]
  image:          string
  github?:        string
  live?:          string
  featured:       boolean
  wip?:           boolean
percentileMetrics?: { label: string; value: number; description?: string }[]
overallPercentile?: number   // 0–100
stats?: { label: string; value: string }[]
}

export const PROJECTS: Project[] = [
  {
    id:       'youtube-sentiment-mlops',
    num:      '01',
    type:     'mlops',
    name:     'YouTube Sentiment Analysis',
    desc:     'End-to-end MLOps pipeline that predicts YouTube comment sentiment — DVC orchestration, MLflow tracking, FastAPI serving, and a Chrome extension for on-page analysis.',
    longDesc: 'Production-style MLOps system for classifying YouTube comments as positive, neutral, or negative. A DVC pipeline handles ingestion, preprocessing, LightGBM training, and evaluation; MLflow logs experiments and registers models. A FastAPI backend serves predictions and generates sentiment charts, word clouds, and trend graphs, with Prometheus metrics for monitoring. A Chrome extension scrapes comments from the active video, calls the API, and renders distributions and visualizations in the browser. Dependencies are managed with uv for reproducible environments.',
    stack:    [
      'Python',
      'LightGBM',
      'DVC',
      'MLflow',
      'FastAPI',
      'uv',
    ],
    stackBreakdown: [
      { name: 'Python / ML', percent: 28 },
      { name: 'DVC / MLflow', percent: 26 },
      { name: 'FastAPI', percent: 22 },
      { name: 'Prometheus / uv', percent: 8 },
    ],
    image:    '/projects/placeholder.svg',
    github:   'https://github.com/ShaharyarShakir/youtube-sentiment-analysis',
    featured: true,
  },
  {
    id:       'emotion-detection-app',
    num:      '02',
    type:     'mobile',
    name:     'Emotion Detection App',
    desc:     'Full-stack mobile application that detects emotions from text input using a FastAPI backend and a React Native Expo frontend.',
    longDesc: 'AI-powered mobile application for detecting emotions such as joy, sadness, anger, fear, and surprise from user-provided text. The backend is built with FastAPI and serves a scikit-learn machine learning pipeline for real-time predictions with confidence scores. The frontend is developed using React Native with Expo, providing a clean and responsive mobile experience. TailwindCSS integration via NativeWind enables modern UI styling, while uv ensures reproducible Python dependency management and streamlined backend workflows.',
    stack:    [
      'Python',
      'scikit-learn',
      'FastAPI',
      'Expo',
      'TailwindCSS',
      'uv',
    ],
    stackBreakdown: [
      { name: 'Python / scikit-learn', percent: 32 },
      { name: 'FastAPI', percent: 24 },
      { name: 'Expo', percent: 30 },
      { name: 'TailwindCSS / uv', percent: 14 },
    ],
    image:    '/projects/placeholder.svg',
    github:   'https://github.com/ShaharyarShakir/emotions_detections_app',
    featured: true,
  }
]

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id)
}

export const FILTER_TAGS: { label: string; value: ProjectTag | 'all' }[] = [
  { label: 'All',       value: 'all'      },
  { label: 'DevOps',    value: 'devops'   },
  { label: 'MLOps',     value: 'mlops'    },
  { label: 'Mobile',    value: 'mobile'   },
  { label: 'Infra',     value: 'infra'    },
  { label: 'Full-Stack',value: 'fullstack'},
]

export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured)

export const TAG_COLOR: Record<ProjectTag, string> = {
  devops:    '#c8f135',
  mlops:     '#7b61ff',
  mobile:    '#3ddc84',
  infra:     '#fbbf24',
  fullstack: '#e63222',
}

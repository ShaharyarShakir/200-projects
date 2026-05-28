// Simple Icons CDN slugs + brand colors for stack visuals
export const TECH_ICON: Record<string, { slug: string; color: string }> = {
  Go:           { slug: 'go',             color: '00ADD8' },
  Kubernetes:   { slug: 'kubernetes',     color: '326CE5' },
  Prometheus:   { slug: 'prometheus',     color: 'E6522C' },
  'Operator SDK': { slug: 'kubernetes',   color: '326CE5' },
  Python:       { slug: 'python',         color: '3776AB' },
  Kubeflow:     { slug: 'kubeflow',       color: '326CE5' },
  MLflow:       { slug: 'mlflow',         color: '0194E2' },
  FastAPI:      { slug: 'fastapi',        color: '009688' },
  Redis:        { slug: 'redis',          color: 'FF4438' },
  // 'React Native': { slug: 'react',        color: '61DAFB' },
  Expo:         { slug: 'expo',           color: 'ffffff' },
  WebSockets:   { slug: 'socketdotio',    color: '010101' },
  EAS:          { slug: 'expo',           color: '000020' },
  Terraform:    { slug: 'terraform',      color: '844FBA' },
  ArgoCD:       { slug: 'argo',           color: 'EF7B4D' },
  Helm:         { slug: 'helm',           color: '0F1689' },
  'AWS EKS':    { slug: 'amazonaws',      color: 'FF9900' },
  Vault:        { slug: 'vault',          color: 'FFEC6E' },
  PostgreSQL:   { slug: 'postgresql',     color: '4169E1' },
  Celery:       { slug: 'celery',         color: '37814A' },
  'EAS Build':  { slug: 'expo',           color: '000020' },
  'GitHub Actions': { slug: 'githubactions', color: '2088FF' },
  Sentry:       { slug: 'sentry',         color: '362D59' },
}

export function techIconUrl(name: string): string {
  const entry = TECH_ICON[name]
  if (entry) {
    return `https://cdn.simpleicons.org/${entry.slug}/${entry.color}`
  }
  const slug = name.toLowerCase().replace(/\s+/g, '')
  return `https://cdn.simpleicons.org/${slug}/c8f135`
}

export function techAccentColor(name: string): string {
  const entry = TECH_ICON[name]
  return entry ? `#${entry.color}` : '#c8f135'
}

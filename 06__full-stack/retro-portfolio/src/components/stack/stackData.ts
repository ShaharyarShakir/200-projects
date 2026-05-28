// src/components/stack/stackData.ts

export type StackCategory = 'devops' | 'mlops' | 'fullstack' | 'mobile' | 'cloud'

export type ProficiencyLevel = 'expert' | 'advanced' | 'intermediate'

export interface TechItem {
    name: string
    role: string          // e.g. "Container Orchestration"
    proficiency: ProficiencyLevel
    pct: number          // 0–100 for the bar
    description: string          // one line, shown on hover/expand
    since: string          // "2021", "2023" etc.
}

export interface StackSection {
    id: StackCategory
    num: string
    label: string
    headline: string
    tagline: string
    color: string
    items: TechItem[]
}

export const PROFICIENCY_COLOR: Record<ProficiencyLevel, string> = {
    expert: '#c8f135',
    advanced: '#3ddc84',
    intermediate: '#fbbf24',
}

export const STACK_DATA: StackSection[] = [
    // ── DevOps ───────────────────────────────────────────────────────
    {
        id: 'devops',
        num: '01',
        label: 'DevOps',
        headline: 'Ship Fast.\nBreak Nothing.',
        tagline: 'Container orchestration, CI/CD pipelines, IaC & observability.',
        color: '#c8f135',
        items: [
            { name: 'Kubernetes', role: 'Orchestration', proficiency: 'expert', pct: 95, since: '2022', description: 'Custom operators, HPA, Helm charts, multi-cluster management.' },
            { name: 'Docker', role: 'Containers', proficiency: 'expert', pct: 98, since: '2021', description: 'Multi-stage builds, layer caching, distroless images.' },
            { name: 'Terraform', role: 'IaC', proficiency: 'expert', pct: 92, since: '2022', description: 'Modular IaC for AWS, remote state, workspace management.' },
            { name: 'GitHub Actions', role: 'CI/CD', proficiency: 'expert', pct: 94, since: '2021', description: 'Reusable workflows, matrix builds, OIDC auth.' },
            { name: 'ArgoCD', role: 'GitOps', proficiency: 'intermediate', pct: 76, since: '2023', description: 'ApplicationSets, sync waves, rollback strategies.' },
            { name: 'Prometheus', role: 'Monitoring', proficiency: 'advanced', pct: 86, since: '2022', description: 'Custom metrics, alerting rules, recording rules.' },
            { name: 'Grafana', role: 'Observability', proficiency: 'intermediate', pct: 75, since: '2022', description: 'Custom dashboards, alerting, Loki log integration.' },
            { name: 'Helm', role: 'Package Manager', proficiency: 'expert', pct: 90, since: '2022', description: 'Chart authoring, library charts, values schema.' },
            { name: 'Vault', role: 'Secrets', proficiency: 'advanced', pct: 82, since: '2023', description: 'Dynamic secrets, K8s auth, secret injection.' },
            { name: 'Istio', role: 'Service Mesh', proficiency: 'intermediate', pct: 74, since: '2023', description: 'mTLS, traffic management, circuit breaking.' },
        ],
    },

    // ── MLOps ────────────────────────────────────────────────────────
    {
        id: 'mlops',
        num: '02',
        label: 'MLOps',
        headline: 'Models in\nProduction.',
        tagline: 'ML lifecycle, experiment tracking, model serving & feature stores.',
        color: '#7b61ff',
        items: [
            { name: 'MLflow', role: 'Experiment Tracking', proficiency: 'expert', pct: 93, since: '2023', description: 'Tracking, model registry, custom flavors, multi-server.' },
            { name: 'Kubeflow', role: 'ML Pipelines', proficiency: 'advanced', pct: 85, since: '2023', description: 'Pipeline authoring, recurring runs, artifact tracking.' },
            { name: 'Apache Airflow', role: 'Orchestration', proficiency: 'advanced', pct: 88, since: '2022', description: 'DAG design, custom operators, Celery executor.' },
            { name: 'Ray', role: 'Distributed Training', proficiency: 'intermediate', pct: 72, since: '2024', description: 'Ray Train, Tune hyperparameter search, Ray Serve.' },
            { name: 'Triton', role: 'Model Serving', proficiency: 'intermediate', pct: 74, since: '2023', description: 'Multi-framework serving, dynamic batching, GPU inference.' },
            { name: 'DVC', role: 'Data Versioning', proficiency: 'advanced', pct: 84, since: '2023', description: 'Pipeline stages, remote storage, experiment tracking.' },
            { name: 'Feast', role: 'Feature Store', proficiency: 'intermediate', pct: 76, since: '2024', description: 'Online/offline stores, point-in-time joins.' },
            { name: 'Python', role: 'ML Language', proficiency: 'expert', pct: 96, since: '2021', description: 'Data pipelines, model training, FastAPI serving.' },
        ],
    },

    // ── Full-Stack ───────────────────────────────────────────────────
    {
        id: 'fullstack',
        num: '03',
        label: 'Full-Stack',
        headline: 'API to\nPixel.',
        tagline: 'End-to-end web applications, APIs, databases & real-time systems.',
        color: '#e63222',
        items: [
            { name: 'React', role: 'UI Framework', proficiency: 'expert', pct: 94, since: '2021', description: 'Hooks, context, Suspense, Server Components.' },
            { name: 'TypeScript', role: 'Language', proficiency: 'expert', pct: 92, since: '2021', description: 'Strict mode, generics, discriminated unions.' },
            { name: 'Node.js', role: 'Runtime', proficiency: 'expert', pct: 91, since: '2021', description: 'Event loop, streams, cluster mode.' },
            { name: 'FastAPI', role: 'API Framework', proficiency: 'expert', pct: 93, since: '2022', description: 'Async routes, dependency injection, background tasks.' },
            { name: 'PostgreSQL', role: 'Database', proficiency: 'advanced', pct: 88, since: '2021', description: 'Query optimisation, indexes, partitioning, JSONB.' },
            { name: 'Redis', role: 'Cache / Queue', proficiency: 'advanced', pct: 86, since: '2022', description: 'Pub/sub, streams, Lua scripting, cluster mode.' },
            { name: 'GraphQL', role: 'Query Language', proficiency: 'intermediate', pct: 75, since: '2022', description: 'Schema design, dataloaders, subscriptions.' },
            { name: 'Next.js', role: 'Meta-Framework', proficiency: 'advanced', pct: 87, since: '2022', description: 'App router, RSC, ISR, edge runtime.' },
            { name: 'Astro', role: 'Static Framework', proficiency: 'intermediate', pct: 78, since: '2024', description: 'Islands architecture, Content Collections, MDX.' },
        ],
    },

    // ── Mobile ───────────────────────────────────────────────────────
    {
        id: 'mobile',
        num: '04',
        label: 'Mobile',
        headline: 'iOS &\nAndroid.',
        tagline: 'Cross-platform mobile apps with React Native & the Expo ecosystem.',
        color: '#3ddc84',
        items: [
            { name: 'React Native', role: 'Framework', proficiency: 'expert', pct: 93, since: '2022', description: 'New architecture, JSI, native modules, bridgeless.' },
            { name: 'Expo', role: 'Platform', proficiency: 'expert', pct: 92, since: '2022', description: 'Managed & bare workflow, config plugins, prebuild.' },
            { name: 'Expo Router', role: 'Navigation', proficiency: 'expert', pct: 90, since: '2023', description: 'File-based routing, typed routes, deep linking.' },
            { name: 'Reanimated', role: 'Animations', proficiency: 'intermediate', pct: 74, since: '2023', description: 'Shared values, worklets, gesture handler integration.' },
            { name: 'EAS Build', role: 'CI/CD Mobile', proficiency: 'expert', pct: 91, since: '2023', description: 'Custom build profiles, fingerprint, caching.' },
            { name: 'EAS Update', role: 'OTA Updates', proficiency: 'expert', pct: 90, since: '2023', description: 'Channels, rollout % control, rollback.' },
            { name: 'MMKV', role: 'Storage', proficiency: 'advanced', pct: 85, since: '2023', description: 'Fast key-value store, encryption, React Native bindings.' },
            { name: 'Zustand', role: 'State Management', proficiency: 'advanced', pct: 88, since: '2023', description: 'Slices, persistence, devtools, immer middleware.' },
        ],
    },

    // ── Cloud ────────────────────────────────────────────────────────
    {
        id: 'cloud',
        num: '05',
        label: 'Cloud',
        headline: 'Scale to\nInfinity.',
        tagline: 'Multi-cloud infra, serverless, networking & security posture.',
        color: '#fbbf24',
        items: [
            { name: 'AWS', role: 'Cloud Platform', proficiency: 'expert', pct: 93, since: '2022', description: 'EKS, ECS, Lambda, RDS, S3, CloudFront, IAM, VPC.' },
            { name: 'GCP', role: 'Cloud Platform', proficiency: 'intermediate', pct: 78, since: '2023', description: 'GKE, Cloud Run, Vertex AI, BigQuery.' },
            { name: 'Cloudflare', role: 'Edge / CDN', proficiency: 'intermediate', pct: 77, since: '2022', description: 'Workers, R2, Tunnels, WAF, Pages.' },
            { name: 'Pulumi', role: 'IaC', proficiency: 'intermediate', pct: 75, since: '2024', description: 'TypeScript stacks, component resources.' },
            { name: 'Datadog', role: 'Observability', proficiency: 'intermediate', pct: 75, since: '2023', description: 'APM, logs, synthetics, custom metrics.' },
            { name: 'Sentry', role: 'Error Tracking', proficiency: 'advanced', pct: 87, since: '2022', description: 'Source maps, releases, performance tracing.' },
        ],
    },
]
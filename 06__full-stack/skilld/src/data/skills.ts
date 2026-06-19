export const skills: SkillRecord[] = [
  {
    id: 'skill-001',
    title: 'Natural Language Planner',
    slug: 'natural-language-planner',
    description: 'Convert user goals into executable task plans using a composable planning engine.',
    category: 'Planning',
    tags: ['planning', 'nlp', 'workflow'],
    installCommand: 'npm install @skilld/nlp-planner',
    createdAt: '2026-06-01T12:00:00.000Z',
    authorClerkId: 'clerk_12345',
    authorEmail: 'planner@author.skilld'
  },
  {
    id: 'skill-002',
    title: 'Vector Search Retriever',
    slug: 'vector-search-retriever',
    description: 'Retrieve the most relevant documents from an embedding index with semantic ranking.',
    category: 'Retrieval',
    tags: ['search', 'vector', 'embeddings'],
    installCommand: 'npm install @skilld/vector-retriever',
    createdAt: '2026-06-05T08:30:00.000Z',
    authorClerkId: 'clerk_67890',
    authorEmail: 'search@author.skilld'
  },
  {
    id: 'skill-003',
    title: 'API Response Formatter',
    slug: 'api-response-formatter',
    description: 'Standardize API output to JSON schema contracts and enforce response consistency.',
    category: 'Transform',
    tags: ['api', 'formatter', 'json'],
    installCommand: 'npm install @skilld/api-formatter',
    createdAt: '2026-06-07T14:10:00.000Z',
    authorClerkId: null,
    authorEmail: 'formatter@author.skilld'
  },
  {
    id: 'skill-004',
    title: 'Event-Driven Notifier',
    slug: 'event-driven-notifier',
    description: 'Send notifications for workflow events through email and messaging channels.',
    category: 'Notifications',
    tags: ['events', 'notifications', 'messaging'],
    installCommand: 'npm install @skilld/event-notifier',
    createdAt: '2026-06-10T09:45:00.000Z',
    authorClerkId: 'clerk_24680',
    authorEmail: null
  },
  {
    id: 'skill-005',
    title: 'Secure Data Sanitizer',
    slug: 'secure-data-sanitizer',
    description: 'Filter and sanitize incoming payloads to prevent injection and enforce schema safety.',
    category: 'Security',
    tags: ['security', 'validation', 'sanitization'],
    installCommand: 'npm install @skilld/data-sanitizer',
    createdAt: null,
    authorClerkId: null,
    authorEmail: null
  }
];

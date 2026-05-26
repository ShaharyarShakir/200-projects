// src/components/blog/BlogList.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

// ── Types ─────────────────────────────────────────────────────────
export interface BlogPost {
    collection: 'blog' | 'devops' | 'fullstack' | 'mlops' | 'mobile' | 'series'
    slug: string
    title: string
    excerpt: string
    date: string       // pre-formatted: "MAY 2025"
    tag: 'devops' | 'mlops' | 'fullstack' | 'mobile' | 'machine-learning'
    readTime?: number
    featured?: boolean
}

interface BlogListProps {
    posts: BlogPost[]
    /** Total posts in the collection (e.g. home shows 4 but archive may have more). */
    totalPostCount?: number
}

// ── Tag config ────────────────────────────────────────────────────
const TAG_CONFIG = {
    devops: { label: 'DEVOPS', color: '#c8f135' },
    mlops: { label: 'MLOPS', color: '#7b61ff' },
    fullstack: { label: 'FULL-STACK', color: '#e63222' },
    mobile: { label: 'MOBILE', color: '#3ddc84' },
    'machine-learning': { label: 'MACHINE-LEARNING', color: '#4f8cff' },
}

// ── Tag pill ──────────────────────────────────────────────────────
function TagPill({ tag }: { tag: BlogPost['tag'] }) {
    const { label, color } = TAG_CONFIG[tag]
    return (
        <span
            className="inline-block bg-transparent px-2.5 py-1 border font-mono text-[9px] uppercase tracking-[1.5px] whitespace-nowrap"
            style={{ borderColor: color, color }}
        >
            {label}
        </span>
    )
}

// ── Single post row ───────────────────────────────────────────────
function PostRow({ post }: { post: BlogPost }) {
    return (
        <a
            href={`/blog/${post.collection}/${post.slug}`}
            className="group grid grid-cols-1 md:grid-cols-[minmax(72px,92px)_1fr_auto] gap-x-8 md:gap-x-12 gap-y-3 md:gap-y-0 md:items-center hover:bg-[#080808]/50 section-x py-6 sm:py-7 md:py-8 border-[#1e1e1e] border-b no-underline transition-colors duration-150 blog-row text-[13px] sm:text-[14px]"
        >
            <span className="font-mono text-[#555] text-[10px] uppercase tracking-[1px] md:pt-0">
                {post.date}
            </span>

            <div className="min-w-0 md:order-none order-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {post.featured && (
                        <span className="font-mono text-[#c8f135] text-[9px] uppercase tracking-[2px] shrink-0">
                            ★
                        </span>
                    )}
                    <p className="font-mono font-bold text-[#f0ede6] text-[14px] md:text-[15px] group-hover:text-[#c8f135] leading-snug transition-colors duration-150">
                        {post.title}
                    </p>
                </div>
                <p className="mt-1.5 font-mono text-[#555] text-[11px] md:text-[12px] line-clamp-2 leading-[1.65]">
                    {post.excerpt}
                </p>
            </div>

            <div className="flex justify-start md:justify-end md:order-none order-3 md:pt-0 pt-1">
                <TagPill tag={post.tag} />
            </div>
        </a>
    )
}

// ── Main component ────────────────────────────────────────────────
export default function BlogList({ posts, totalPostCount }: BlogListProps) {
    const archiveTotal = totalPostCount ?? posts.length
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const footerRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger)
        if (!headerRef.current || !listRef.current) return

        // Header children stagger in
        gsap.from(Array.from(headerRef.current.children), {
            y: 30,
            opacity: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: headerRef.current,
                start: 'top 85%',
                once: true,
            },
        })

        // Post rows stagger in
        const rows = listRef.current.querySelectorAll('.blog-row')
        gsap.from(Array.from(rows), {
            y: 24,
            opacity: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: listRef.current,
                start: 'top 85%',
                once: true,
            },
        })

        // Footer CTA
        if (footerRef.current) {
            gsap.from(footerRef.current, {
                y: 16,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: footerRef.current,
                    start: 'top 92%',
                    once: true,
                },
            })
        }

        requestAnimationFrame(() => {
            ScrollTrigger.refresh()
        })
    }, { scope: sectionRef, dependencies: [] })

    return (
        <section
            id="blog"
            ref={sectionRef}
            className="border-[#1e1e1e] border-b"
        >
            {/* ── Section header ── */}
            <div
                ref={headerRef}
                className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 lg:gap-8 section-x pt-10 md:pt-16 pb-8 md:pb-10 border-[#1e1e1e] border-b"
            >
                <div className="flex-1 min-w-0">
                    <p className="mb-3 font-mono text-[#333] text-[11px] sm:text-[12px] uppercase tracking-[3px]">
                        — Writing
                    </p>
                    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <h2 className="flex flex-wrap items-baseline gap-2 sm:gap-3 text-[#f0ede6] leading-none tracking-tight min-w-0">
                            <span className="font-mono text-xl sm:text-2xl text-[#c8f135] tabular-nums">
                                {String(archiveTotal).padStart(2, '0')}
                            </span>
                            <span className="text-[48px] sm:text-[56px] md:text-[64px]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                Field Notes
                            </span>
                        </h2>
                        <p className="flex items-baseline gap-2 font-mono text-[#c8f135] text-[12px] sm:text-[13px] uppercase tracking-[2px] sm:tracking-[3px]">
                            <span aria-hidden="true">|</span>
                            <span className="tabular-nums">{String(archiveTotal).padStart(2, '0')}</span>
                            <span>{archiveTotal === 1 ? 'Article' : 'Articles'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-stretch sm:items-center w-full sm:w-auto">
                    <a
                        href="/blog"
                        className="group flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 bg-[#0f0f0f] hover:bg-[#1a1a1a] px-4 py-2.5 border border-[#333] hover:border-[#c8f135] font-mono text-[#f0ede6] text-[12px] sm:text-[13px] hover:text-[#c8f135] no-underline uppercase tracking-[2px] transition-colors duration-150"
                    >
                        View all
                        <span
                            className="transition-transform group-hover:translate-x-0.5 duration-150"
                            aria-hidden="true"
                        >
                            →
                        </span>
                    </a>
                </div>
            </div>

            {/* ── Post list ── */}
            <div ref={listRef}>
                {posts.length === 0 ? (
                    <div className="section-x py-12 md:py-16 text-center">
                        <p className="font-mono text-[#333] text-[12px] uppercase tracking-[2px]">
              // No posts yet — check back soon
                        </p>
                    </div>
                ) : (
                    posts.map((post) => <PostRow key={post.slug} post={post} />)
                )}
            </div>

            {/* ── Footer CTA ── */}
            <div
                ref={footerRef}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 section-x py-6 md:py-8"
            >
                <p className="font-mono text-[#333] text-[11px]">
          // Thoughts on DevOps, MLOps, Full-Stack &amp; Mobile
                </p>
                <a
                    href="/blog"
                    className="group flex items-center gap-2 font-mono text-[#555] text-[11px] hover:text-[#c8f135] no-underline uppercase tracking-[2px] transition-colors duration-150"
                >
                    All posts
                    <span
                        className="transition-transform group-hover:translate-x-0.5 duration-150"
                        aria-hidden="true"
                    >
                        →
                    </span>
                </a>
            </div>
        </section>
    )
}
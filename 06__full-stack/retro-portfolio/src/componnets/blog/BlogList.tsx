// src/components/blog/BlogList.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

// ── Types ─────────────────────────────────────────────────────────
export interface BlogPost {
    slug: string
    title: string
    excerpt: string
    date: string       // pre-formatted: "MAY 2025"
    tag: 'devops' | 'mlops' | 'fullstack' | 'mobile'
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
    devops: { label: 'DevOps', color: '#c8f135' },
    mlops: { label: 'MLOps', color: '#7b61ff' },
    fullstack: { label: 'Full-Stack', color: '#e63222' },
    mobile: { label: 'Mobile', color: '#3ddc84' },
}

// ── Tag pill ──────────────────────────────────────────────────────
function TagPill({ tag }: { tag: BlogPost['tag'] }) {
    const { label, color } = TAG_CONFIG[tag]
    return (
        <span
            className="px-2.5 py-1 border font-mono text-[9px] uppercase tracking-[1.5px] whitespace-nowrap"
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
            href={`/blog/${post.slug}`}
            className="group items-start gap-8 grid grid-cols-[80px_1fr_auto] hover:bg-[#0f0f0f] px-12 py-7 border-[#1e1e1e] border-b no-underline transition-colors duration-150 blog-row"
        >
            {/* Date */}
            <span className="pt-0.5 font-mono text-[#333] text-[10px] uppercase tracking-[1px]">
                {post.date}
            </span>

            {/* Title + excerpt */}
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                    {post.featured && (
                        <span className="font-mono text-[#c8f135] text-[9px] uppercase tracking-[2px]">
                            ★ Featured
                        </span>
                    )}
                    <p className="font-mono font-bold text-[#f0ede6] text-[14px] group-hover:text-[#c8f135] leading-snug transition-colors duration-150">
                        {post.title}
                    </p>
                </div>
                <p className="font-mono text-[#555] text-[11px] line-clamp-2 leading-[1.7]">
                    {post.excerpt}
                </p>
                {post.readTime && (
                    <p className="mt-2 font-mono text-[#333] text-[10px] tracking-[1px]">
                        {post.readTime} min read
                    </p>
                )}
            </div>

            {/* Tag + arrow */}
            <div className="flex flex-col items-end gap-3 pt-0.5">
                <TagPill tag={post.tag} />
                <span
                    className="text-[#333] text-[14px] group-hover:text-[#c8f135] transition-all group-hover:translate-x-0.5 duration-150"
                    aria-hidden="true"
                >
                    →
                </span>
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
                className="flex justify-between items-start gap-8 px-12 pt-16 pb-10 border-[#1e1e1e] border-b"
            >
                <div>
                    <p className="mb-3 font-mono text-[#333] text-[10px] uppercase tracking-[3px]">
                        — Writing
                    </p>
                    <h2 className="flex flex-wrap items-baseline gap-3 text-[#f0ede6] leading-none tracking-tight">
                        <span className="font-mono text-2xl text-[#c8f135] tabular-nums">
                            {String(archiveTotal).padStart(2, '0')}
                        </span>
                        <span className="text-[64px]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                            Field Notes
                        </span>
                    </h2>
                    <p className="mt-4 font-mono text-[#333] text-[10px] uppercase tracking-[2px]">
                        {posts.length < archiveTotal
                            ? `Showing ${posts.length} of ${archiveTotal} articles`
                            : `${archiveTotal} article${archiveTotal === 1 ? '' : 's'}`}
                    </p>
                </div>

                <a
                    href="/blog"
                    className="group shrink-0 flex items-center gap-2 bg-[#0f0f0f] hover:bg-[#1a1a1a] px-4 py-2.5 border border-[#333] hover:border-[#c8f135] font-mono text-[#f0ede6] text-[10px] hover:text-[#c8f135] no-underline uppercase tracking-[2px] transition-colors duration-150"
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

            {/* ── Post list ── */}
            <div ref={listRef}>
                {posts.length === 0 ? (
                    <div className="px-12 py-16 text-center">
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
                className="flex justify-between items-center px-12 py-8"
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
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Footer from '../../components/Footer'
import { BLOG_POSTS, getBlogPost } from '../../../lib/blog-posts'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getBlogPost(params.slug)
  if (!post) return { title: 'Blog post not found', robots: { index: false, follow: false } }

  const canonical = `/blog/${post.slug}`
  return {
    title: `${post.title} - Escort.de`,
    description: post.description,
    alternates: { canonical },
    openGraph: { title: `${post.title} - Escort.de`, description: post.description, url: canonical, type: 'article' },
  }
}

function RenderContent({ slug }: { slug: string }) {
  const post = getBlogPost(slug)
  if (!post) notFound()

  return (
    <article className="prose prose-invert max-w-none">
      {post.content.map((block, idx) => {
        if (block.type === 'h2') return <h2 key={idx}>{block.text}</h2>
        if (block.type === 'p') return <p key={idx}>{block.text}</p>
        if (block.type === 'ul')
          return (
            <ul key={idx}>
              {block.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          )
        if (block.type === 'link')
          return (
            <p key={idx}>
              {block.prefix || ''}{' '}
              <Link href={block.href} className="text-[var(--accent-pink)] underline">
                {block.text}
              </Link>
              {block.suffix || ''}
            </p>
          )
        return null
      })}
    </article>
  )
}

export default function Page({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug)
  if (!post) notFound()

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/95 backdrop-blur-sm transition-colors">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-header font-semibold tracking-wider text-[var(--header-color)] hover:opacity-80 transition-opacity">
            ESCORT.DE
          </Link>
          <Link href="/blog" className="text-sm text-[var(--text-secondary)] hover:opacity-80 transition-opacity">
            Blog
          </Link>
        </div>
      </header>

      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <nav className="text-sm text-[var(--text-secondary)] mb-6">
          <Link href="/blog" className="hover:opacity-80 transition-opacity">
            Blog
          </Link>{' '}
          <span className="opacity-60">/</span> <span className="text-[var(--text-primary)]">{post.countryName}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2 text-[var(--text-primary)]">{post.title}</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">{post.date}</p>

        <RenderContent slug={params.slug} />

        <div className="mt-10">
          <Link href="/blog" className="text-[var(--accent-pink)] hover:opacity-80 transition-opacity font-medium">
            ← Back to Blog
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}

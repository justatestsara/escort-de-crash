import type { Metadata } from 'next'
import Link from 'next/link'
import Footer from '../components/Footer'
import { BLOG_POSTS } from '../../lib/blog-posts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog - Escort.de',
  description: 'Guides and location insights for browsing independent escort listings.',
  alternates: { canonical: '/blog' },
}

export default function Page() {
  const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1))

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
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6 text-[var(--text-primary)]">Blog</h1>
        <div className="space-y-4">
          {posts.map((p) => (
            <article key={p.slug} className="border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 rounded-lg">
              <h2 className="text-xl font-semibold mb-1">
                <Link href={`/blog/${p.slug}`} className="hover:opacity-80 transition-opacity">
                  {p.title}
                </Link>
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-3">{p.date}</p>
              <p className="text-[var(--text-secondary)] leading-relaxed">{p.description}</p>
              <div className="mt-4">
                <Link href={`/blog/${p.slug}`} className="text-[var(--accent-pink)] hover:opacity-80 transition-opacity font-medium">
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}

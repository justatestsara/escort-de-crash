'use client'

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Person' | 'BreadcrumbList'
  data: Record<string, any>
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  )
}


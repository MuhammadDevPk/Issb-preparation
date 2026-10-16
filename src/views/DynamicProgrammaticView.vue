<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'

import DefenseTemplate from '../components/programmatic/layouts/DefenseTemplate.vue'
import TechTemplate from '../components/programmatic/layouts/TechTemplate.vue'
import JobTemplate from '../components/programmatic/layouts/JobTemplate.vue'

// Synchronous flat-file glob import for deterministic, zero-latency SSG prerendering
const programmaticModules = import.meta.glob('../data/programmatic/**/*.json', { eager: true })

const route = useRoute()
const nicheParam = computed(() => String(route.params.niche || ''))
const slugParam = computed(() => String(route.params.slug || ''))

// Resolve dataset based on route params
const pageData = computed(() => {
  const niche = nicheParam.value
  const slug = slugParam.value
  if (!slug) return null

  const directKey = `../data/programmatic/${niche}/${slug}.json`
  if (programmaticModules[directKey]) {
    return programmaticModules[directKey].default || programmaticModules[directKey]
  }

  // Robust fallback: search by slug and niche across discovered JSON files
  for (const modulePath in programmaticModules) {
    const doc = programmaticModules[modulePath].default || programmaticModules[modulePath]
    if (doc && doc.slug === slug && (!niche || doc.niche === niche)) {
      return doc
    }
  }

  return null
})

// Resolve layout template based on data.niche with JobTemplate as fallback
const activeTemplate = computed(() => {
  if (!pageData.value) return null
  const niche = (pageData.value.niche || '').toLowerCase()
  if (niche === 'defense') return DefenseTemplate
  if (niche === 'tech') return TechTemplate
  return JobTemplate
})

// Canonical URL
const canonicalUrl = computed(() => {
  const n = pageData.value?.niche || nicheParam.value
  const s = pageData.value?.slug || slugParam.value
  return `https://issb-preparation.vercel.app/explore/${n}/${s}`
})

// Schema.org JSON-LD combining Article and FAQPage in @graph
const schemaOrgGraph = computed(() => {
  if (!pageData.value) return null

  const graph = [
    {
      '@type': 'Article',
      '@id': `${canonicalUrl.value}#article`,
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://issb-preparation.vercel.app/#website',
        name: 'ISSB Command',
        url: 'https://issb-preparation.vercel.app',
      },
      headline: pageData.value.title || pageData.value.headline,
      description: pageData.value.metaDescription,
      mainEntityOfPage: canonicalUrl.value,
      inLanguage: 'en-US',
      datePublished: '2026-01-01T00:00:00Z',
      dateModified: new Date().toISOString(),
      image: 'https://issb-preparation.vercel.app/og-image.png',
      author: {
        '@type': 'Organization',
        name: 'ISSB Command Editorial Team',
        url: 'https://issb-preparation.vercel.app',
      },
      publisher: {
        '@type': 'Organization',
        name: 'ISSB Command',
        url: 'https://issb-preparation.vercel.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://issb-preparation.vercel.app/favicon.svg',
        },
      },
    },
  ]

  if (pageData.value.faqs && pageData.value.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl.value}#faq`,
      mainEntity: pageData.value.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
})

// Unhead SEO Metadata Injection
useHead(() => {
  if (!pageData.value) {
    return {
      title: '404 - Document Not Found | ISSB Command',
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'description', content: 'The requested programmatic record could not be found.' },
      ],
    }
  }

  const p = pageData.value
  const title = p.title || `${p.headline} | ISSB Command`
  const description = p.metaDescription || ''

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl.value },
      { property: 'og:type', content: 'article' },
      { property: 'og:image', content: 'https://issb-preparation.vercel.app/og-image.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://issb-preparation.vercel.app/og-image.png' },
    ],
    link: [{ rel: 'canonical', href: canonicalUrl.value }],
    script: schemaOrgGraph.value
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify(schemaOrgGraph.value),
          },
        ]
      : [],
  }
})
</script>

<template>
  <main class="dynamic-programmatic-view">
    <!-- Active Niche Template Mount -->
    <component :is="activeTemplate" v-if="pageData && activeTemplate" :data="pageData" />

    <!-- 404 Fallback UI if Slug Does Not Exist -->
    <section v-else class="not-found-fallback glass-card">
      <div class="nf-badge">COORDINATES UNRESOLVED</div>
      <h1 class="nf-title">404 - Document Not Found</h1>
      <p class="nf-message">
        The requested career or military exploration guide (<code
          >/explore/{{ nicheParam }}/{{ slugParam }}</code
        >) does not exist in our flat-file directory.
      </p>
      <div class="nf-actions">
        <RouterLink to="/roadmap" class="btn btn-primary">
          <span>🗺️ Return to 5-Day Roadmap</span>
        </RouterLink>
        <RouterLink to="/" class="btn btn-secondary">
          <span>🏠 Return to Headquarters</span>
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.dynamic-programmatic-view {
  width: 100%;
  min-height: calc(100vh - 100px);
}

/* 404 Fallback State */
.not-found-fallback {
  max-width: 720px;
  margin: 4rem auto;
  padding: 3.5rem 2rem;
  text-align: center;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--border-radius-lg, 16px);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 24px rgba(239, 68, 68, 0.1);
}

.nf-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 9999px;
  margin-bottom: 1.25rem;
}

.nf-title {
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 1rem;
}

.nf-message {
  font-size: 1.05rem;
  color: #94a3b8;
  max-width: 540px;
  margin: 0 auto 2rem;
  line-height: 1.6;
}

.nf-message code {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.nf-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
</style>

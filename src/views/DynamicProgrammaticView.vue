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
      inLanguage: pageData.value.hreflang || 'en-US',
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
  const langCode = p.hreflang ? p.hreflang.split('-')[0] : 'en'

  return {
    title,
    htmlAttrs: {
      lang: langCode,
    },
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
  <div class="dynamic-programmatic-view">
    <!-- Standalone Clean Navigation Header -->
    <header class="programmatic-top-nav">
      <div class="nav-inner">
        <div class="nav-brand-group">
          <RouterLink to="/" class="brand-link" aria-label="Portal Home">
            <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 22 22 22 12 2" stroke="currentColor" stroke-linejoin="round" />
              <circle cx="12" cy="14" r="2.5" fill="currentColor" />
            </svg>
            <span class="brand-name">CAREER INTELLIGENCE</span>
          </RouterLink>
          <span class="nav-divider">/</span>
          <span class="niche-crumb">{{ nicheParam }}</span>
        </div>

        <div class="nav-action-group">
          <RouterLink to="/roadmap" class="nav-btn nav-btn-outline">
            <span>5-Day Roadmap</span>
          </RouterLink>
          <RouterLink to="/" class="nav-btn nav-btn-primary">
            <span>Platform Home ↗</span>
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Main Dynamic Content Container -->
    <main class="page-main-content">
      <!-- Active Niche Template Mount -->
      <component :is="activeTemplate" v-if="pageData && activeTemplate" :data="pageData" />

      <!-- 404 Fallback UI if Slug Does Not Exist -->
      <section v-else class="not-found-fallback glass-card">
        <div class="nf-badge">COORDINATES UNRESOLVED</div>
        <h1 class="nf-title">404 - Document Not Found</h1>
        <p class="nf-message">
          The requested career or military exploration guide (<code>/explore/{{ nicheParam }}/{{ slugParam }}</code>) does not exist in our flat-file directory.
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

    <!-- Standalone Clean Footer -->
    <footer class="programmatic-footer">
      <div class="footer-inner">
        <p class="footer-text">
          © 2026 Selection &amp; Career Intelligence Directory • Flat-File pSEO Engine
        </p>
        <div class="footer-quicklinks">
          <RouterLink to="/">Headquarters</RouterLink>
          <RouterLink to="/roadmap">5-Day Roadmap</RouterLink>
          <RouterLink to="/simulator/wat">WAT Simulator</RouterLink>
          <RouterLink to="/simulator/srt">SRT Crisis</RouterLink>
          <RouterLink to="/simulator/opi">OPI Profiler</RouterLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.dynamic-programmatic-view {
  width: 100%;
  min-height: 100vh;
  background-color: #080d1a;
  background-image:
    radial-gradient(circle at 10% 10%, rgba(2, 132, 199, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.1) 0%, transparent 40%),
    linear-gradient(rgba(14, 165, 233, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 165, 233, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* Standalone Top Navigation Header */
.programmatic-top-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(11, 19, 38, 0.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(14, 165, 233, 0.18);
  padding: 0.9rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.nav-brand-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #f8fafc;
  font-weight: 800;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.brand-link:hover {
  opacity: 0.85;
}

.brand-icon {
  width: 24px;
  height: 24px;
  color: #00e5ff;
}

.brand-name {
  font-family: var(--font-heading, sans-serif);
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  color: #f8fafc;
}

.nav-divider {
  color: #475569;
  font-size: 0.85rem;
}

.niche-crumb {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #38bdf8;
  background: rgba(14, 165, 233, 0.12);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.nav-action-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-btn-outline {
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.nav-btn-outline:hover {
  color: #ffffff;
  border-color: #00e5ff;
  background: rgba(14, 165, 233, 0.15);
}

.nav-btn-primary {
  color: #ffffff;
  background: linear-gradient(135deg, #0284c7 0%, #00e5ff 100%);
  border: 1px solid rgba(0, 229, 255, 0.4);
  box-shadow: 0 2px 10px rgba(0, 229, 255, 0.25);
}

.nav-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 229, 255, 0.4);
}

/* Main Content Area */
.page-main-content {
  flex: 1;
  width: 100%;
}

/* Standalone Footer */
.programmatic-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(11, 19, 38, 0.95);
  padding: 2.25rem 1.5rem;
  margin-top: auto;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.footer-text {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

.footer-quicklinks {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.footer-quicklinks a {
  font-size: 0.85rem;
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-quicklinks a:hover {
  color: #00e5ff;
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

@media (max-width: 640px) {
  .nav-inner,
  .footer-inner {
    flex-direction: column;
    text-align: center;
  }
  .nav-brand-group {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>

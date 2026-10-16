<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  data: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="programmatic-tech-page">
    <!-- Hero Header -->
    <header class="tech-hero glass-card">
      <div class="hero-badge">
        <span class="badge-icon">⚡</span>
        <span class="badge-text">{{ data.badge || 'TECH COMPENSATION & SKILLS' }}</span>
        <span v-if="data.country" class="country-pill">{{ data.country }}</span>
      </div>
      <h1 class="hero-title">{{ data.headline || data.title }}</h1>
      <p class="hero-desc">{{ data.metaDescription }}</p>

      <!-- Key Stats DL Grid -->
      <dl v-if="data.stats && data.stats.length" class="stats-grid">
        <div v-for="(stat, idx) in data.stats" :key="idx" class="stat-card">
          <dt class="stat-label">{{ stat.label }}</dt>
          <dd class="stat-value">{{ stat.value }}</dd>
        </div>
      </dl>
    </header>

    <!-- Body Sections -->
    <div class="content-sections">
      <section
        v-for="(section, idx) in data.sections"
        :key="idx"
        class="content-section glass-card"
      >
        <div class="section-tag">
          <span class="tag-marker">// 0{{ idx + 1 }}</span>
          <span>SYSTEMS ARCHITECTURE & METRICS</span>
        </div>
        <h2>{{ section.title }}</h2>
        <div class="section-text">
          <p>{{ section.content }}</p>
        </div>
      </section>
    </div>

    <!-- Tech Conversion CTA: Linking to /simulator/opi -->
    <section class="conversion-cta glass-card">
      <div class="cta-glow-bg"></div>
      <div class="cta-content">
        <span class="cta-badge">COGNITIVE & BEHAVIORAL PROFILER</span>
        <h2>Benchmark Your Analytical Aptitude & Personality Fit</h2>
        <p>
          High-velocity engineering roles and technical leadership positions demand cognitive
          adaptability, stress tolerance, and emotional resilience. Take our standardized
          150-question psychometric evaluation to audit your situational judgment.
        </p>
        <div class="cta-actions">
          <RouterLink to="/simulator/opi" class="btn btn-cyber">
            <span>🧠 Launch OPI Psychometric Profiler</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Semantic FAQ Section with DL -->
    <section v-if="data.faqs && data.faqs.length" class="faq-section glass-card">
      <div class="faq-badge">TECHNICAL FAQ & INSIGHTS</div>
      <h2>Frequently Asked Questions</h2>
      <dl class="faq-list">
        <div v-for="(faq, idx) in data.faqs" :key="idx" class="faq-item">
          <dt class="faq-question">
            <span class="q-icon">?</span>
            <span>{{ faq.q }}</span>
          </dt>
          <dd class="faq-answer">
            <p>{{ faq.a }}</p>
          </dd>
        </div>
      </dl>
    </section>
  </article>
</template>

<style scoped>
.programmatic-tech-page {
  max-width: 1140px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
}

/* Hero Section */
.tech-hero {
  padding: 2.5rem 2rem;
  text-align: center;
  background: radial-gradient(
    circle at top center,
    rgba(6, 182, 212, 0.15) 0%,
    rgba(15, 23, 42, 0.98) 70%
  );
  border: 1px solid rgba(6, 182, 212, 0.28);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 0 24px rgba(6, 182, 212, 0.12);
  border-radius: var(--border-radius-lg, 16px);
  position: relative;
  overflow: hidden;
}

.tech-hero::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #06b6d4, #3b82f6, transparent);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #38bdf8;
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  margin-bottom: 1.25rem;
}

.country-pill {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 800;
}

.hero-title {
  font-size: clamp(1.85rem, 3.8vw, 2.75rem);
  font-weight: 800;
  line-height: 1.2;
  color: #f8fafc;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.hero-desc {
  font-size: clamp(1rem, 1.8vw, 1.15rem);
  color: #cbd5e1;
  max-width: 820px;
  margin: 0 auto 2rem;
  line-height: 1.65;
}

/* Stats DL Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  max-width: 950px;
  margin: 0 auto;
}

.stat-card {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(6, 182, 212, 0.25);
  border-radius: 12px;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  backdrop-filter: blur(8px);
  transition:
    transform var(--transition-smooth, 0.2s ease),
    border-color var(--transition-smooth, 0.2s ease);
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.5);
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.2);
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: -0.01em;
}

/* Sections */
.content-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content-section {
  padding: 2.25rem 2rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(30, 41, 59, 0.8);
  border-radius: var(--border-radius-lg, 16px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.section-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #06b6d4;
  margin-bottom: 0.75rem;
  font-family: monospace;
}

.tag-marker {
  color: #38bdf8;
  opacity: 0.8;
}

.content-section h2 {
  font-size: clamp(1.4rem, 2.5vw, 1.85rem);
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 1rem;
}

.section-text {
  font-size: 1.05rem;
  line-height: 1.75;
  color: #94a3b8;
  white-space: pre-line;
}

/* Conversion CTA */
.conversion-cta {
  position: relative;
  overflow: hidden;
  padding: 3rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(6, 182, 212, 0.35);
  border-radius: var(--border-radius-lg, 16px);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(6, 182, 212, 0.15);
}

.cta-badge {
  display: inline-block;
  padding: 0.35rem 0.9rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #38bdf8;
  background: rgba(6, 182, 212, 0.15);
  border-radius: 9999px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  margin-bottom: 1rem;
}

.conversion-cta h2 {
  font-size: clamp(1.6rem, 3vw, 2.25rem);
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 1rem;
}

.conversion-cta p {
  max-width: 720px;
  margin: 0 auto 2rem;
  font-size: 1.05rem;
  line-height: 1.65;
  color: #cbd5e1;
}

.cta-actions {
  display: flex;
  justify-content: center;
}

.btn-cyber {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
  color: #ffffff;
  font-weight: 700;
  padding: 0.95rem 2rem;
  border-radius: var(--border-radius-md, 10px);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
  transition: all var(--transition-smooth, 0.2s ease);
}

.btn-cyber:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(6, 182, 212, 0.45);
  color: #ffffff;
}

/* FAQ Section */
.faq-section {
  padding: 2.5rem 2rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(30, 41, 59, 0.8);
  border-radius: var(--border-radius-lg, 16px);
}

.faq-badge {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #38bdf8;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.faq-section h2 {
  font-size: clamp(1.4rem, 2.5vw, 1.85rem);
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 2rem;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.faq-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(30, 41, 59, 0.9);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.faq-question {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 1.12rem;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.4;
}

.q-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(6, 182, 212, 0.2);
  color: #38bdf8;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 800;
  flex-shrink: 0;
  font-family: monospace;
}

.faq-answer {
  font-size: 1rem;
  line-height: 1.65;
  color: #94a3b8;
  padding-left: 2.25rem;
  margin: 0;
}

@media (max-width: 640px) {
  .tech-hero {
    padding: 2rem 1.25rem;
  }
  .content-section,
  .faq-section,
  .conversion-cta {
    padding: 1.75rem 1.25rem;
  }
  .faq-answer {
    padding-left: 0;
  }
}
</style>

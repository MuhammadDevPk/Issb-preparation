<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="not-found-container flex-center">
    <div class="glass-card not-found-card text-center">
      <div class="radar-scan-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon-radar">
          <circle cx="12" cy="12" r="10" stroke-dasharray="3 3" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <line x1="12" y1="2" x2="12" y2="12" stroke-width="2" class="radar-beam" />
        </svg>
      </div>

      <span class="badge badge-red">Status 404 • Tactical Anomaly</span>
      <h1 class="not-found-title">Target Coordinates Not Found</h1>
      <p class="not-found-desc">
        The mission route or intelligence briefing you requested does not exist at these coordinates. 
        It may have been relocated, classified, or decommissioned.
      </p>

      <div class="not-found-actions">
        <RouterLink to="/" class="btn btn-primary btn-large">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Return to Command Headquarters
        </RouterLink>
        <RouterLink to="/simulator/wat" class="btn btn-secondary btn-large">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Launch WAT Simulator
        </RouterLink>
      </div>

      <div class="quick-links">
        <span class="quick-links-label">Quick Waypoints:</span>
        <div class="quick-links-list">
          <RouterLink to="/simulator/sct" class="quick-link">SCT</RouterLink>
          <RouterLink to="/simulator/srt" class="quick-link">SRT</RouterLink>
          <RouterLink to="/simulator/opi" class="quick-link">OPI</RouterLink>
          <RouterLink to="/simulator/obstacles" class="quick-link">GTO Obstacles</RouterLink>
          <RouterLink to="/call-letter" class="quick-link">Call Notice</RouterLink>
          <RouterLink to="/deputy-interview" class="quick-link">DP Interview</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  min-height: 80vh;
  padding: 2rem 1rem;
}

.not-found-card {
  max-width: 680px;
  width: 100%;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  border: 1px solid rgba(255, 68, 68, 0.25);
  box-shadow: 0 0 35px rgba(255, 68, 68, 0.08);
}

.radar-scan-icon {
  width: 80px;
  height: 80px;
  color: var(--accent-red, #ff4444);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-radar {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 12px rgba(255, 68, 68, 0.4));
}

.radar-beam {
  transform-origin: 12px 12px;
  animation: radar-sweep 4s linear infinite;
}

@keyframes radar-sweep {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.badge-red {
  background: rgba(255, 68, 68, 0.15);
  color: #ff6b6b;
  border: 1px solid rgba(255, 68, 68, 0.35);
  font-family: var(--font-heading);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.75rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
}

.not-found-title {
  font-family: var(--font-heading);
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.not-found-desc {
  color: var(--text-secondary);
  font-size: 1.05rem;
  max-width: 520px;
  line-height: 1.6;
  margin: 0;
}

.not-found-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
  width: 100%;
}

.action-icon {
  width: 18px;
  height: 18px;
}

.quick-links {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.quick-links-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.quick-links-list {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-link {
  color: var(--accent-cyan);
  text-decoration: none;
  font-size: 0.88rem;
  padding: 0.35rem 0.75rem;
  border-radius: var(--border-radius-sm);
  background: rgba(0, 242, 254, 0.06);
  border: 1px solid rgba(0, 242, 254, 0.15);
  transition: all var(--transition-smooth);
}

.quick-link:hover {
  background: rgba(0, 242, 254, 0.15);
  color: #fff;
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .not-found-card {
    padding: 2rem 1.25rem;
  }
  .not-found-title {
    font-size: 1.6rem;
  }
  .not-found-actions {
    flex-direction: column;
  }
}
</style>

import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import RoadmapView from '../views/RoadmapView.vue'
import WatSimulator from '../views/WatSimulator.vue'
import SctSimulator from '../views/SctSimulator.vue'
import SrtSimulator from '../views/SrtSimulator.vue'
import ObstaclesSimulator from '../views/ObstaclesSimulator.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/roadmap',
      name: 'roadmap',
      component: RoadmapView,
    },
    {
      path: '/simulator/wat',
      name: 'wat-simulator',
      component: WatSimulator,
    },
    {
      path: '/simulator/sct',
      name: 'sct-simulator',
      component: SctSimulator,
    },
    {
      path: '/simulator/srt',
      name: 'srt-simulator',
      component: SrtSimulator,
    },
    {
      path: '/simulator/obstacles',
      name: 'obstacles-simulator',
      component: ObstaclesSimulator,
    },
  ],
})

export default router

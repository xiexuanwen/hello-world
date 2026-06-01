import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Children from './views/Children.vue'
import Tasks from './views/Tasks.vue'
import Rewards from './views/Rewards.vue'
import Game from './views/Game.vue'
import Records from './views/Records.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/children', name: 'Children', component: Children },
  { path: '/tasks', name: 'Tasks', component: Tasks },
  { path: '/rewards', name: 'Rewards', component: Rewards },
  { path: '/game', name: 'Game', component: Game },
  { path: '/records/:childId', name: 'Records', component: Records }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

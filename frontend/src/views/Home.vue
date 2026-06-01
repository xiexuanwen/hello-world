<template>
  <div class="home">
    <h1 class="title">🎈 欢迎来到积分乐园！</h1>
    <p class="subtitle">通过完成任务和玩游戏赚取积分，兑换喜欢的奖励！</p>
    
    <div class="children-section" v-if="children.length > 0">
      <h2>👨‍👩‍👧‍👦 选择孩子</h2>
      <div class="children-grid">
        <div 
          v-for="child in children" 
          :key="child.id" 
          class="child-card card"
          @click="selectChild(child)"
        >
          <div class="child-avatar">{{ child.avatar }}</div>
          <h3>{{ child.name }}</h3>
          <div class="points-badge">⭐ {{ child.points }} 积分</div>
          <div class="child-actions">
            <button class="btn btn-success" @click.stop="goToRecords(child)">📊 查看记录</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <p>还没有添加孩子，快去孩子档案添加吧！</p>
      <router-link to="/children" class="btn btn-primary">去添加孩子 👶</router-link>
    </div>

    <div class="quick-actions" v-if="selectedChild">
      <h2>⚡ 快捷操作 - {{ selectedChild.name }}</h2>
      <div class="actions-grid">
        <div class="action-card card">
          <div class="action-icon">🎮</div>
          <h3>玩认字游戏</h3>
          <p>打怪兽学认字，赚取积分！</p>
          <router-link to="/game" class="btn btn-primary">开始游戏</router-link>
        </div>
        <div class="action-card card">
          <div class="action-icon">📋</div>
          <h3>完成任务</h3>
          <p>完成日常任务获得积分</p>
          <router-link to="/tasks" class="btn btn-success">查看任务</router-link>
        </div>
        <div class="action-card card">
          <div class="action-icon">🎁</div>
          <h3>兑换奖励</h3>
          <p>用积分兑换喜欢的奖励</p>
          <router-link to="/rewards" class="btn btn-warning">去兑换</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const children = ref([])
const selectedChild = ref(null)

const fetchChildren = async () => {
  try {
    const response = await axios.get('/api/children')
    children.value = response.data
    if (children.value.length > 0) {
      selectedChild.value = children.value[0]
    }
  } catch (error) {
    console.error('获取孩子列表失败:', error)
  }
}

const selectChild = (child) => {
  selectedChild.value = child
}

const goToRecords = (child) => {
  router.push(`/records/${child.id}`)
}

onMounted(() => {
  fetchChildren()
})
</script>

<style scoped>
.home {
  text-align: center;
}

.title {
  font-size: 48px;
  color: white;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.2);
  margin-bottom: 10px;
}

.subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
}

.children-section h2 {
  color: white;
  margin-bottom: 20px;
}

.children-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.child-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.child-card:hover {
  transform: translateY(-5px);
}

.child-avatar {
  font-size: 64px;
  margin-bottom: 10px;
}

.child-card h3 {
  color: #667eea;
  margin-bottom: 15px;
}

.child-actions {
  margin-top: 15px;
}

.empty-state {
  color: white;
  font-size: 18px;
  margin: 60px 0;
}

.empty-state p {
  margin-bottom: 20px;
}

.quick-actions {
  margin-top: 40px;
}

.quick-actions h2 {
  color: white;
  margin-bottom: 20px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.action-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.action-card h3 {
  color: #667eea;
  margin-bottom: 10px;
}

.action-card p {
  color: #666;
  margin-bottom: 20px;
}
</style>

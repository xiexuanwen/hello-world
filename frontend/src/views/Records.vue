<template>
  <div class="records-page">
    <div class="page-header">
      <button class="btn btn-secondary" @click="$router.back()">← 返回</button>
      <h1>📊 积分记录</h1>
    </div>

    <div v-if="child" class="child-info card">
      <div class="child-avatar">{{ child.avatar }}</div>
      <div class="child-details">
        <h2>{{ child.name }}</h2>
        <div class="points-badge large">⭐ 当前积分：{{ child.points }}</div>
      </div>
    </div>

    <div v-if="summary" class="summary-grid">
      <div class="summary-card card">
        <div class="summary-icon">💵</div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.totalEarned }}</div>
          <div class="summary-label">总获得积分</div>
        </div>
      </div>
      <div class="summary-card card">
        <div class="summary-icon">💸</div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.totalSpent }}</div>
          <div class="summary-label">总消耗积分</div>
        </div>
      </div>
      <div class="summary-card card">
        <div class="summary-icon">✅</div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.completionCount }}</div>
          <div class="summary-label">完成任务数</div>
        </div>
      </div>
      <div class="summary-card card">
        <div class="summary-icon">🎁</div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.redemptionCount }}</div>
          <div class="summary-label">兑换奖励数</div>
        </div>
      </div>
    </div>

    <div class="records-list card">
      <h3>📝 详细记录</h3>
      <div v-if="records.length === 0" class="empty-list">
        暂无记录
      </div>
      <div v-else>
        <div v-for="record in records" :key="record.id" class="record-item">
          <div class="record-icon" :class="record.type">
            {{ record.type === 'earn' ? '+' : '-' }}
          </div>
          <div class="record-content">
            <div class="record-title">
              {{ record.description || record.game_name || record.reward_name }}
            </div>
            <div class="record-time">{{ formatTime(record.time || record.completed_at || record.redeemed_at) }}</div>
          </div>
          <div class="record-points" :class="record.type">
            {{ record.type === 'earn' ? '+' : '-' }}{{ record.points_earned || record.points_spent }} ⭐
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const child = ref(null)
const records = ref([])
const summary = ref(null)

const fetchChild = async () => {
  try {
    const response = await axios.get('/api/children')
    child.value = response.data.find(c => c.id === parseInt(route.params.childId))
  } catch (error) {
    console.error('获取孩子信息失败:', error)
  }
}

const fetchRecords = async () => {
  try {
    const response = await axios.get(`/api/children/${route.params.childId}/records`)
    records.value = response.data
  } catch (error) {
    console.error('获取记录失败:', error)
  }
}

const fetchSummary = async () => {
  try {
    const response = await axios.get(`/api/children/${route.params.childId}/summary`)
    summary.value = response.data
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchChild()
  fetchRecords()
  fetchSummary()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.page-header h1 {
  color: white;
  font-size: 36px;
}

.child-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.child-avatar {
  font-size: 64px;
}

.child-details h2 {
  color: #667eea;
  margin-bottom: 10px;
}

.points-badge.large {
  font-size: 20px;
  padding: 10px 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 15px;
}

.summary-icon {
  font-size: 40px;
}

.summary-value {
  font-size: 28px;
  font-weight: bold;
  color: #667eea;
}

.summary-label {
  color: #666;
  font-size: 14px;
}

.records-list h3 {
  color: #667eea;
  margin-bottom: 20px;
}

.empty-list {
  text-align: center;
  color: #999;
  padding: 40px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 10px;
  background: #f8f9fa;
  margin-bottom: 10px;
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.record-icon.earn {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.record-icon.spend {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.record-content {
  flex: 1;
}

.record-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-points {
  font-weight: bold;
  font-size: 18px;
}

.record-points.earn {
  color: #38ef7d;
}

.record-points.spend {
  color: #ff6b6b;
}
</style>

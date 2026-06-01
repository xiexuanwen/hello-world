<template>
  <div class="rewards-page">
    <div class="page-header">
      <h1>🎁 奖励商店</h1>
      <button class="btn btn-primary" @click="showAddModal = true">+ 添加奖励</button>
    </div>

    <div v-if="children.length > 0" class="child-selector card">
      <label>选择孩子：</label>
      <select v-model="selectedChildId" class="input" style="width: auto; display: inline-block; margin-left: 10px;">
        <option v-for="child in children" :key="child.id" :value="child.id">
          {{ child.name }} ({{ child.points }} 积分)
        </option>
      </select>
    </div>

    <div class="rewards-grid">
      <div v-for="reward in rewards" :key="reward.id" class="reward-card card">
        <div class="reward-icon">{{ reward.icon }}</div>
        <h3>{{ reward.title }}</h3>
        <p v-if="reward.description">{{ reward.description }}</p>
        <div class="points-badge">{{ reward.points_cost }} ⭐</div>
        <div class="reward-actions">
          <button 
            class="btn btn-success" 
            @click="redeemReward(reward)" 
            :disabled="!selectedChildId || (selectedChild && selectedChild.points < reward.points_cost)"
          >
            兑换
          </button>
          <button class="btn btn-secondary" @click="editReward(reward)">✏️</button>
          <button class="btn btn-danger" @click="deleteReward(reward.id)">🗑️</button>
        </div>
      </div>
    </div>

    <div v-if="rewards.length === 0" class="empty-state card">
      <p>还没有奖励，点击上方按钮添加吧！</p>
    </div>

    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal card" @click.stop>
        <h2>{{ showAddModal ? '添加奖励' : '编辑奖励' }}</h2>
        <div class="form-group">
          <label>奖励名称</label>
          <input v-model="formData.title" class="input" placeholder="请输入奖励名称" />
        </div>
        <div class="form-group">
          <label>描述（可选）</label>
          <textarea v-model="formData.description" class="input" placeholder="请输入奖励描述" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>所需积分</label>
          <input v-model.number="formData.points_cost" type="number" class="input" placeholder="请输入所需积分数" min="1" />
        </div>
        <div class="form-group">
          <label>图标</label>
          <div class="icon-picker">
            <span 
              v-for="icon in icons" 
              :key="icon"
              :class="['icon-option', { active: formData.icon === icon }]"
              @click="formData.icon = icon"
            >{{ icon }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>分类</label>
          <select v-model="formData.category" class="input">
            <option value="entertainment">娱乐</option>
            <option value="story">故事</option>
            <option value="toy">玩具</option>
            <option value="outing">出游</option>
            <option value="food">美食</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveReward">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const rewards = ref([])
const children = ref([])
const selectedChildId = ref(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingId = ref(null)
const formData = ref({
  title: '',
  description: '',
  points_cost: 20,
  category: 'entertainment',
  icon: '🎁'
})

const icons = ['🎁', '📺', '📖', '🧸', '🎡', '🍦', '🎮', '🎨', '⚽', '🎪', '🌟', '🎯']

const selectedChild = computed(() => {
  return children.value.find(c => c.id === selectedChildId.value)
})

const fetchRewards = async () => {
  try {
    const response = await axios.get('/api/rewards')
    rewards.value = response.data
  } catch (error) {
    console.error('获取奖励列表失败:', error)
  }
}

const fetchChildren = async () => {
  try {
    const response = await axios.get('/api/children')
    children.value = response.data
    if (children.value.length > 0) {
      selectedChildId.value = children.value[0].id
    }
  } catch (error) {
    console.error('获取孩子列表失败:', error)
  }
}

const redeemReward = async (reward) => {
  if (!selectedChildId.value) {
    alert('请先选择孩子！')
    return
  }
  if (confirm(`确定让 ${selectedChild.value?.name} 用 ${reward.points_cost} 积分兑换"${reward.title}"吗？`)) {
    try {
      await axios.post(`/api/children/${selectedChildId.value}/redeem`, {
        rewardId: reward.id,
        rewardName: reward.title,
        pointsCost: reward.points_cost
      })
      alert(`恭喜！成功兑换"${reward.title}"！`)
      fetchChildren()
    } catch (error) {
      console.error('兑换失败:', error)
      alert(error.response?.data?.error || '兑换失败，请重试')
    }
  }
}

const editReward = (reward) => {
  editingId.value = reward.id
  formData.value = { 
    title: reward.title, 
    description: reward.description, 
    points_cost: reward.points_cost,
    category: reward.category,
    icon: reward.icon
  }
  showEditModal.value = true
}

const deleteReward = async (id) => {
  if (confirm('确定要删除这个奖励吗？')) {
    try {
      await axios.delete(`/api/rewards/${id}`)
      fetchRewards()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}

const saveReward = async () => {
  try {
    if (showAddModal.value) {
      await axios.post('/api/rewards', formData.value)
    } else {
      await axios.put(`/api/rewards/${editingId.value}`, formData.value)
    }
    closeModal()
    fetchRewards()
  } catch (error) {
    console.error('保存失败:', error)
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  formData.value = { title: '', description: '', points_cost: 20, category: 'entertainment', icon: '🎁' }
}

onMounted(() => {
  fetchRewards()
  fetchChildren()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: white;
  font-size: 36px;
}

.child-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.reward-card {
  text-align: center;
  display: flex;
  flex-direction: column;
}

.reward-icon {
  font-size: 64px;
  margin-bottom: 10px;
}

.reward-card h3 {
  color: #667eea;
  margin-bottom: 10px;
}

.reward-card p {
  color: #666;
  margin-bottom: 15px;
  flex: 1;
}

.reward-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.reward-actions .btn-success {
  flex: 1;
}

.empty-state {
  text-align: center;
  color: #666;
  margin-top: 40px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 90%;
  max-width: 500px;
}

.modal h2 {
  color: #667eea;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #666;
  margin-bottom: 8px;
  font-weight: bold;
}

.icon-picker {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.icon-option {
  font-size: 32px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s;
}

.icon-option:hover {
  background: #f0f0f0;
}

.icon-option.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>

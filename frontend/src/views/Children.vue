<template>
  <div class="children-page">
    <div class="page-header">
      <h1>👨‍👩‍👧‍👦 孩子档案</h1>
      <button class="btn btn-primary" @click="showAddModal = true">+ 添加孩子</button>
    </div>

    <div class="children-grid">
      <div v-for="child in children" :key="child.id" class="child-card card">
        <div class="child-avatar">{{ child.avatar }}</div>
        <h3>{{ child.name }}</h3>
        <div class="points-badge">⭐ {{ child.points }} 积分</div>
        <div class="child-actions">
          <button class="btn btn-secondary" @click="editChild(child)">✏️ 编辑</button>
          <button class="btn btn-danger" @click="deleteChild(child.id)">🗑️ 删除</button>
          <router-link :to="`/records/${child.id}`" class="btn btn-success">📊 记录</router-link>
        </div>
      </div>
    </div>

    <div v-if="children.length === 0" class="empty-state card">
      <p>还没有添加孩子，点击上方按钮添加吧！</p>
    </div>

    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal card" @click.stop>
      <h2>{{ showAddModal ? '添加孩子' : '编辑孩子' }}</h2>
        <div class="form-group">
          <label>孩子姓名</label>
          <input v-model="formData.name" class="input" placeholder="请输入姓名" />
        </div>
        <div class="form-group">
          <label>头像 (emoji)</label>
          <div class="avatar-picker">
            <span 
              v-for="emoji in avatars" 
              :key="emoji"
              :class="['avatar-option', { active: formData.avatar === emoji }]"
              @click="formData.avatar = emoji"
            >{{ emoji }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveChild">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const children = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingId = ref(null)
const formData = ref({
  name: '',
  avatar: '😊'
})

const avatars = ['😊', '😎', '🤗', '😋', '🥳', '😇', '👧', '👦', '🧒', '🐱', '🐶', '🐰']

const fetchChildren = async () => {
  try {
    const response = await axios.get('/api/children')
    children.value = response.data
  } catch (error) {
    console.error('获取孩子列表失败:', error)
  }
}

const editChild = (child) => {
  editingId.value = child.id
  formData.value = { name: child.name, avatar: child.avatar }
  showEditModal.value = true
}

const deleteChild = async (id) => {
  if (confirm('确定要删除这个孩子吗？')) {
    try {
      await axios.delete(`/api/children/${id}`)
      fetchChildren()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}

const saveChild = async () => {
  try {
    if (showAddModal.value) {
      await axios.post('/api/children', formData.value)
    } else {
      await axios.put(`/api/children/${editingId.value}`, formData.value)
    }
    closeModal()
    fetchChildren()
  } catch (error) {
    console.error('保存失败:', error)
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  formData.value = { name: '', avatar: '😊' }
}

onMounted(() => {
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

.children-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.child-card {
  text-align: center;
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
  margin-top: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.child-actions .btn {
  flex: 1;
  min-width: 80px;
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

.avatar-picker {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.avatar-option {
  font-size: 32px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s;
}

.avatar-option:hover {
  background: #f0f0f0;
}

.avatar-option.active {
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

<template>
  <div class="tasks-page">
    <div class="page-header">
      <h1>📋 任务列表</h1>
      <button class="btn btn-primary" @click="showAddModal = true">+ 添加任务</button>
    </div>

    <div v-if="children.length > 0" class="child-selector card">
      <label>选择孩子：</label>
      <select v-model="selectedChildId" class="input" style="width: auto; display: inline-block; margin-left: 10px;">
        <option v-for="child in children" :key="child.id" :value="child.id">
          {{ child.name }} ({{ child.points }} 积分)
        </option>
      </select>
    </div>

    <div class="tasks-grid">
      <div v-for="task in tasks" :key="task.id" class="task-card card">
        <div class="task-header">
          <h3>{{ task.title }}</h3>
          <div class="points-badge">+{{ task.points }} ⭐</div>
        </div>
        <p v-if="task.description">{{ task.description }}</p>
        <div class="task-actions">
          <button class="btn btn-success" @click="completeTask(task)" :disabled="!selectedChildId">
            ✅ 完成
          </button>
          <button class="btn btn-secondary" @click="editTask(task)">✏️</button>
          <button class="btn btn-danger" @click="deleteTask(task.id)">🗑️</button>
        </div>
      </div>
    </div>

    <div v-if="tasks.length === 0" class="empty-state card">
      <p>还没有任务，点击上方按钮添加吧！</p>
    </div>

    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal card" @click.stop>
        <h2>{{ showAddModal ? '添加任务' : '编辑任务' }}</h2>
        <div class="form-group">
          <label>任务名称</label>
          <input v-model="formData.title" class="input" placeholder="请输入任务名称" />
        </div>
        <div class="form-group">
          <label>描述（可选）</label>
          <textarea v-model="formData.description" class="input" placeholder="请输入任务描述" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>积分奖励</label>
          <input v-model.number="formData.points" type="number" class="input" placeholder="请输入积分数" min="1" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveTask">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const tasks = ref([])
const children = ref([])
const selectedChildId = ref(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingId = ref(null)
const formData = ref({
  title: '',
  description: '',
  points: 10
})

const fetchTasks = async () => {
  try {
    const response = await axios.get('/api/tasks')
    tasks.value = response.data
  } catch (error) {
    console.error('获取任务列表失败:', error)
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

const completeTask = async (task) => {
  if (!selectedChildId.value) {
    alert('请先选择孩子！')
    return
  }
  if (confirm(`确定 ${children.value.find(c => c.id === selectedChildId.value)?.name} 完成了"${task.title}"吗？`)) {
    try {
      await axios.post(`/api/children/${selectedChildId.value}/complete-task`, {
        taskId: task.id,
        description: task.title,
        points: task.points
      })
      alert(`太棒了！获得 ${task.points} 积分！`)
      fetchChildren()
    } catch (error) {
      console.error('完成任务失败:', error)
      alert('完成任务失败，请重试')
    }
  }
}

const editTask = (task) => {
  editingId.value = task.id
  formData.value = { title: task.title, description: task.description, points: task.points }
  showEditModal.value = true
}

const deleteTask = async (id) => {
  if (confirm('确定要删除这个任务吗？')) {
    try {
      await axios.delete(`/api/tasks/${id}`)
      fetchTasks()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}

const saveTask = async () => {
  try {
    if (showAddModal.value) {
      await axios.post('/api/tasks', formData.value)
    } else {
      await axios.put(`/api/tasks/${editingId.value}`, formData.value)
    }
    closeModal()
    fetchTasks()
  } catch (error) {
    console.error('保存失败:', error)
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  formData.value = { title: '', description: '', points: 10 }
}

onMounted(() => {
  fetchTasks()
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

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.task-card {
  display: flex;
  flex-direction: column;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-header h3 {
  color: #667eea;
}

.task-card p {
  color: #666;
  margin-bottom: 20px;
  flex: 1;
}

.task-actions {
  display: flex;
  gap: 10px;
}

.task-actions .btn-success {
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

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>

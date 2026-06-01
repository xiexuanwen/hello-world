<template>
  <div class="game-page">
    <div class="page-header">
      <h1>🎮 汉字冒险岛</h1>
    </div>

    <div v-if="!gameStarted" class="start-screen card">
      <div class="game-intro">
        <div class="intro-icon">🐉</div>
        <h2>欢迎来到汉字冒险岛！</h2>
        <p>认识汉字，消灭怪兽，赢取积分！</p>
        
        <div v-if="children.length > 0" class="child-select">
          <label>选择孩子：</label>
          <select v-model="selectedChildId" class="input">
            <option v-for="child in children" :key="child.id" :value="child.id">
              {{ child.name }}
            </option>
          </select>
        </div>

        <div class="difficulty-select">
          <label>选择难度：</label>
          <div class="difficulty-buttons">
            <button 
              v-for="d in difficulties" 
              :key="d.level"
              :class="['btn', { 'btn-primary': difficulty === d.level, 'btn-secondary': difficulty !== d.level }]"
              @click="difficulty = d.level"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <button class="btn btn-success start-btn" @click="startGame" :disabled="!selectedChildId">
          开始游戏！
        </button>
      </div>
    </div>

    <div v-else-if="gameOver" class="game-over-screen card">
      <div class="game-over-content">
        <div class="result-icon">{{ score >= 50 ? '🎉' : '💪' }}</div>
        <h2>{{ score >= 50 ? '太棒了！' : '继续加油！' }}</h2>
        <p>你消灭了 {{ monstersKilled }} 只怪兽</p>
        <p>获得了 <span class="points-earned">+{{ totalPoints }}</span> 积分！</p>
        
        <div class="game-over-actions">
          <button class="btn btn-primary" @click="restartGame">再玩一次</button>
          <button class="btn btn-secondary" @click="backToHome">返回首页</button>
        </div>
      </div>
    </div>

    <div v-else class="game-container">
      <div class="game-hud card">
        <div class="hud-item">
          <span class="hud-icon">❤️</span>
          <span class="hud-value">{{ lives }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-icon">⭐</span>
          <span class="hud-value">{{ score }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-icon">🐉</span>
          <span class="hud-value">{{ monstersKilled }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-icon">⏱️</span>
          <span class="hud-value">{{ timeLeft }}s</span>
        </div>
      </div>

      <div ref="gameContainer" class="game-canvas-container">
        <canvas ref="gameCanvas"></canvas>
        
        <div v-if="currentMonster" class="question-overlay">
          <div class="question-box">
            <div class="question-character">{{ currentMonster.character }}</div>
            <p class="question-text">这个汉字怎么读？</p>
            <div class="answer-buttons">
              <button 
                v-for="(answer, index) in currentMonster.options" 
                :key="index"
                class="answer-btn"
                @click="answerQuestion(answer)"
              >
                {{ answer }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import * as THREE from 'three'

const router = useRouter()

const gameCanvas = ref(null)
const gameContainer = ref(null)

const children = ref([])
const selectedChildId = ref(null)
const difficulty = ref('easy')
const gameStarted = ref(false)
const gameOver = ref(false)
const lives = ref(3)
const score = ref(0)
const monstersKilled = ref(0)
const timeLeft = ref(60)
const totalPoints = ref(0)
const currentMonster = ref(null)

let scene, camera, renderer, player, monsters = [], bullets = [], particles = []
let animationId, timerId
let playerSpeed = 0.15
let keys = {}
let lastMonsterTime = 0

const difficulties = [
  { level: 'easy', label: '简单', monsterSpeed: 0.02, spawnRate: 4000, pointsPerKill: 5 },
  { level: 'medium', label: '中等', monsterSpeed: 0.03, spawnRate: 3000, pointsPerKill: 8 },
  { level: 'hard', label: '困难', monsterSpeed: 0.04, spawnRate: 2000, pointsPerKill: 12 }
]

const chineseCharacters = [
  { char: '一', pinyin: 'yī' },
  { char: '二', pinyin: 'èr' },
  { char: '三', pinyin: 'sān' },
  { char: '四', pinyin: 'sì' },
  { char: '五', pinyin: 'wǔ' },
  { char: '六', pinyin: 'liù' },
  { char: '七', pinyin: 'qī' },
  { char: '八', pinyin: 'bā' },
  { char: '九', pinyin: 'jiǔ' },
  { char: '十', pinyin: 'shí' },
  { char: '人', pinyin: 'rén' },
  { char: '大', pinyin: 'dà' },
  { char: '小', pinyin: 'xiǎo' },
  { char: '山', pinyin: 'shān' },
  { char: '水', pinyin: 'shuǐ' },
  { char: '火', pinyin: 'huǒ' },
  { char: '木', pinyin: 'mù' },
  { char: '日', pinyin: 'rì' },
  { char: '月', pinyin: 'yuè' },
  { char: '天', pinyin: 'tiān' }
]

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

const initThree = () => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87CEEB)
  
  camera = new THREE.PerspectiveCamera(75, gameContainer.value.clientWidth / gameContainer.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 10, 15)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ canvas: gameCanvas.value, antialias: true })
  renderer.setSize(gameContainer.value.clientWidth, gameContainer.value.clientHeight)
  renderer.shadowMap.enabled = true

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const groundGeometry = new THREE.PlaneGeometry(40, 40)
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const gridHelper = new THREE.GridHelper(40, 40, 0x228B22, 0x90EE90)
  scene.add(gridHelper)

  createPlayer()
}

const createPlayer = () => {
  const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8)
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4169E1 })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.castShadow = true

  const headGeometry = new THREE.SphereGeometry(0.4, 16, 16)
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDAB9 })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 1.2
  head.castShadow = true

  player = new THREE.Group()
  player.add(body)
  player.add(head)
  player.position.z = -10
  scene.add(player)
}

const createMonster = () => {
  const charData = chineseCharacters[Math.floor(Math.random() * chineseCharacters.length)]
  
  const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16)
  const colors = [0xFF6B6B, 0xFFE66D, 0x4ECDC4, 0x95E1D3, 0xF38181]
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.castShadow = true

  const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8)
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(-0.25, 0.2, 0.7)
  rightEye.position.set(0.25, 0.2, 0.7)

  const pupilGeometry = new THREE.SphereGeometry(0.08, 8, 8)
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
  leftPupil.position.set(-0.25, 0.2, 0.8)
  rightPupil.position.set(0.25, 0.2, 0.8)

  const monster = new THREE.Group()
  monster.add(body)
  monster.add(leftEye)
  monster.add(rightEye)
  monster.add(leftPupil)
  monster.add(rightPupil)

  const x = (Math.random() - 0.5) * 15
  monster.position.set(x, 0.8, 12)

  const wrongAnswers = chineseCharacters
    .filter(c => c.pinyin !== charData.pinyin)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => c.pinyin)
  
  monster.userData = {
    character: charData.char,
    pinyin: charData.pinyin,
    options: [charData.pinyin, ...wrongAnswers].sort(() => Math.random() - 0.5)
  }

  scene.add(monster)
  monsters.push(monster)
}

const shoot = () => {
  const bulletGeometry = new THREE.SphereGeometry(0.2, 8, 8)
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 })
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial)
  bullet.position.copy(player.position)
  bullet.position.y += 1
  scene.add(bullet)
  bullets.push(bullet)
}

const createExplosion = (position) => {
  const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4)
  const colors = [0xFF6B6B, 0xFFE66D, 0x4ECDC4, 0xFFE66D]
  
  for (let i = 0; i < 20; i++) {
    const particleMaterial = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
    const particle = new THREE.Mesh(particleGeometry, particleMaterial)
    particle.position.copy(position)
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 0.3
      ),
      life: 1
    }
    scene.add(particle)
    particles.push(particle)
  }
}

const showQuestion = (monster) => {
  currentMonster.value = {
    character: monster.userData.character,
    pinyin: monster.userData.pinyin,
    options: monster.userData.options,
    monster: monster
  }
}

const answerQuestion = (answer) => {
  if (!currentMonster.value) return
  
  if (answer === currentMonster.value.pinyin) {
    score.value += 10
    monstersKilled.value++
    createExplosion(currentMonster.value.monster.position)
    scene.remove(currentMonster.value.monster)
    monsters = monsters.filter(m => m !== currentMonster.value.monster)
  } else {
    lives.value--
    if (lives.value <= 0) {
      endGame()
    }
  }
  
  currentMonster.value = null
}

const gameLoop = () => {
  if (!gameStarted.value || gameOver.value) return

  if (keys['ArrowLeft'] || keys['a']) player.position.x -= playerSpeed
  if (keys['ArrowRight'] || keys['d']) player.position.x += playerSpeed
  if (keys['ArrowUp'] || keys['w']) player.position.z += playerSpeed
  if (keys['ArrowDown'] || keys['s']) player.position.z -= playerSpeed

  player.position.x = Math.max(-18, Math.min(18, player.position.x))
  player.position.z = Math.max(-18, Math.min(5, player.position.z))

  const now = Date.now()
  const diff = difficulties.find(d => d.level === difficulty.value)
  if (now - lastMonsterTime > diff.spawnRate && !currentMonster.value && monsters.length < 3) {
    createMonster()
    lastMonsterTime = now
  }

  monsters.forEach(monster => {
    const direction = new THREE.Vector3()
    direction.subVectors(player.position, monster.position)
    direction.normalize()
    monster.position.x += direction.x * diff.monsterSpeed
    monster.position.z += direction.z * diff.monsterSpeed
    monster.rotation.y = Math.atan2(direction.x, direction.z)

    const dist = monster.position.distanceTo(player.position)
    if (dist < 1.5 && !currentMonster.value) {
      showQuestion(monster)
    }
  })

  bullets = bullets.filter(bullet => {
    bullet.position.z += 0.3
    if (bullet.position.z > 20) {
      scene.remove(bullet)
      return false
    }

    for (let i = monsters.length - 1; i >= 0; i--) {
      if (bullet.position.distanceTo(monsters[i].position) < 1.2) {
        if (!currentMonster.value) {
          showQuestion(monsters[i])
        }
        scene.remove(bullet)
        return false
      }
    }
    return true
  })

  particles = particles.filter(particle => {
    particle.position.add(particle.userData.velocity)
    particle.userData.velocity.y -= 0.01
    particle.userData.life -= 0.02
    particle.scale.setScalar(particle.userData.life)
    if (particle.userData.life <= 0) {
      scene.remove(particle)
      return false
    }
    return true
  })

  renderer.render(scene, camera)
  animationId = requestAnimationFrame(gameLoop)
}

const handleKeyDown = (e) => {
  keys[e.key] = true
  if (e.key === ' ' && !currentMonster.value) {
    e.preventDefault()
    shoot()
  }
}

const handleKeyUp = (e) => {
  keys[e.key] = false
}

const startGame = () => {
  if (!selectedChildId.value) return
  
  gameStarted.value = true
  gameOver.value = false
  lives.value = 3
  score.value = 0
  monstersKilled.value = 0
  timeLeft.value = difficulty.value === 'easy' ? 60 : difficulty.value === 'medium' ? 45 : 30
  totalPoints.value = 0

  monsters.forEach(m => scene.remove(m))
  bullets.forEach(b => scene.remove(b))
  particles.forEach(p => scene.remove(p))
  monsters = []
  bullets = []
  particles = []

  nextTick(() => {
    initThree()
    gameLoop()
    
    timerId = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        endGame()
      }
    }, 1000)
  })
}

const endGame = async () => {
  gameOver.value = true
  cancelAnimationFrame(animationId)
  clearInterval(timerId)
  
  const diff = difficulties.find(d => d.level === difficulty.value)
  totalPoints.value = monstersKilled.value * diff.pointsPerKill
  
  if (totalPoints.value > 0 && selectedChildId.value) {
    try {
      await axios.post(`/api/children/${selectedChildId.value}/complete-game`, {
        gameName: '汉字冒险岛',
        description: `消灭了 ${monstersKilled.value} 只怪兽`,
        points: totalPoints.value
      })
    } catch (error) {
      console.error('保存游戏成绩失败:', error)
    }
  }
}

const restartGame = () => {
  gameOver.value = false
  gameStarted.value = false
  currentMonster.value = null
}

const backToHome = () => {
  router.push('/')
}

const handleResize = () => {
  if (camera && renderer && gameContainer.value) {
    camera.aspect = gameContainer.value.clientWidth / gameContainer.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(gameContainer.value.clientWidth, gameContainer.value.clientHeight)
  }
}

onMounted(() => {
  fetchChildren()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationId)
  clearInterval(timerId)
})
</script>

<style scoped>
.game-page {
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.page-header h1 {
  color: white;
  font-size: 36px;
}

.start-screen, .game-over-screen {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.game-intro, .game-over-content {
  padding: 30px;
}

.intro-icon, .result-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.game-intro h2, .game-over-content h2 {
  color: #667eea;
  margin-bottom: 15px;
  font-size: 28px;
}

.game-intro p, .game-over-content p {
  color: #666;
  margin-bottom: 20px;
  font-size: 18px;
}

.points-earned {
  color: #38ef7d;
  font-weight: bold;
  font-size: 24px;
}

.child-select, .difficulty-select {
  margin-bottom: 25px;
}

.child-select label, .difficulty-select label {
  display: block;
  color: #666;
  margin-bottom: 10px;
  font-weight: bold;
}

.difficulty-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.start-btn {
  font-size: 20px;
  padding: 15px 50px;
}

.game-over-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

.game-container {
  max-width: 1000px;
  margin: 0 auto;
}

.game-hud {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
}

.hud-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
}

.hud-icon {
  font-size: 28px;
}

.hud-value {
  font-weight: bold;
  color: #667eea;
}

.game-canvas-container {
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.game-canvas-container canvas {
  width: 100%;
  height: 100%;
}

.question-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-box {
  background: white;
  padding: 30px;
  border-radius: 20px;
  text-align: center;
  max-width: 400px;
}

.question-character {
  font-size: 80px;
  color: #667eea;
  margin-bottom: 10px;
}

.question-text {
  color: #666;
  margin-bottom: 20px;
  font-size: 18px;
}

.answer-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.answer-btn {
  padding: 15px;
  font-size: 20px;
  border: none;
  border-radius: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
  font-family: inherit;
}

.answer-btn:hover {
  transform: scale(1.05);
}
</style>

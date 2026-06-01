<template>
  <div class="app">
    <nav class="nav">
      <div class="nav-brand">🌟 育儿积分乐园</div>
      <div class="nav-links">
        <router-link to="/" class="nav-link">🏠 首页</router-link>
        <router-link to="/children" class="nav-link">👨‍👩‍👧‍👦 孩子档案</router-link>
        <router-link to="/tasks" class="nav-link">📋 任务</router-link>
        <router-link to="/rewards" class="nav-link">🎁 奖励</router-link>
        <router-link to="/game" class="nav-link">🎮 游戏</router-link>
      </div>
    </nav>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app {
  min-height: 100vh;
}

.nav {
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 10px;
}

.nav-link {
  padding: 10px 20px;
  text-decoration: none;
  color: #667eea;
  font-weight: bold;
  border-radius: 20px;
  transition: all 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.main {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'kids-points.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS task_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL,
    task_id INTEGER,
    game_name TEXT,
    points_earned INTEGER NOT NULL,
    description TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL,
    reward_id INTEGER,
    reward_name TEXT,
    points_spent INTEGER NOT NULL,
    redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id),
    FOREIGN KEY (reward_id) REFERENCES rewards(id)
  );
`);

const initData = () => {
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  if (taskCount.count === 0) {
    const tasks = [
      { title: '自己整理玩具', description: '把玩过的玩具收拾整齐', points: 10 },
      { title: '帮忙摆餐具', description: '吃饭前帮忙摆好碗筷', points: 5 },
      { title: '按时睡觉', description: '在约定时间上床睡觉', points: 15 },
      { title: '刷牙洗脸', description: '自己认真刷牙洗脸', points: 8 },
      { title: '阅读绘本', description: '阅读一本绘本', points: 12 }
    ];
    const insertTask = db.prepare('INSERT INTO tasks (title, description, points) VALUES (?, ?, ?)');
    tasks.forEach(task => insertTask.run(task.title, task.description, task.points));
  }

  const rewardCount = db.prepare('SELECT COUNT(*) as count FROM rewards').get();
  if (rewardCount.count === 0) {
    const rewards = [
      { title: '看一集动画片', description: '观看15分钟动画片', points: 20, category: 'entertainment', icon: '📺' },
      { title: '睡前故事', description: '妈妈/爸爸讲一个睡前故事', points: 15, category: 'story', icon: '📖' },
      { title: '买小玩具', description: '可以买一个小玩具', points: 100, category: 'toy', icon: '🧸' },
      { title: '周末出游', description: '周末去公园或游乐场', points: 200, category: 'outing', icon: '🎡' },
      { title: '买冰淇淋', description: '吃一支冰淇淋', points: 30, category: 'food', icon: '🍦' }
    ];
    const insertReward = db.prepare('INSERT INTO rewards (title, description, points_cost, category, icon) VALUES (?, ?, ?, ?, ?)');
    rewards.forEach(reward => insertReward.run(reward.title, reward.description, reward.points_cost, reward.category, reward.icon));
  }
};

initData();

module.exports = db;

const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/children', (req, res) => {
  const children = db.prepare('SELECT * FROM children ORDER BY created_at DESC').all();
  res.json(children);
});

app.post('/api/children', (req, res) => {
  const { name, avatar } = req.body;
  const result = db.prepare('INSERT INTO children (name, avatar) VALUES (?, ?)').run(name, avatar || '😊');
  const child = db.prepare('SELECT * FROM children WHERE id = ?').get(result.lastInsertRowid);
  res.json(child);
});

app.put('/api/children/:id', (req, res) => {
  const { name, avatar } = req.body;
  db.prepare('UPDATE children SET name = ?, avatar = ? WHERE id = ?').run(name, avatar, req.params.id);
  const child = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.id);
  res.json(child);
});

app.delete('/api/children/:id', (req, res) => {
  db.prepare('DELETE FROM children WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, description, points } = req.body;
  const result = db.prepare('INSERT INTO tasks (title, description, points) VALUES (?, ?, ?)').run(title, description, points);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const { title, description, points } = req.body;
  db.prepare('UPDATE tasks SET title = ?, description = ?, points = ? WHERE id = ?').run(title, description, points, req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/rewards', (req, res) => {
  const rewards = db.prepare('SELECT * FROM rewards ORDER BY created_at DESC').all();
  res.json(rewards);
});

app.post('/api/rewards', (req, res) => {
  const { title, description, points_cost, category, icon } = req.body;
  const result = db.prepare('INSERT INTO rewards (title, description, points_cost, category, icon) VALUES (?, ?, ?, ?, ?)').run(title, description, points_cost, category, icon);
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(result.lastInsertRowid);
  res.json(reward);
});

app.put('/api/rewards/:id', (req, res) => {
  const { title, description, points_cost, category, icon } = req.body;
  db.prepare('UPDATE rewards SET title = ?, description = ?, points_cost = ?, category = ?, icon = ? WHERE id = ?').run(title, description, points_cost, category, icon, req.params.id);
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id);
  res.json(reward);
});

app.delete('/api/rewards/:id', (req, res) => {
  db.prepare('DELETE FROM rewards WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/children/:childId/complete-task', (req, res) => {
  const { taskId, description, points } = req.body;
  db.prepare('UPDATE children SET points = points + ? WHERE id = ?').run(points, req.params.childId);
  const result = db.prepare('INSERT INTO task_completions (child_id, task_id, points_earned, description) VALUES (?, ?, ?, ?)').run(req.params.childId, taskId || null, points, description);
  const completion = db.prepare('SELECT * FROM task_completions WHERE id = ?').get(result.lastInsertRowid);
  const child = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.childId);
  res.json({ completion, child });
});

app.post('/api/children/:childId/complete-game', (req, res) => {
  const { gameName, description, points } = req.body;
  db.prepare('UPDATE children SET points = points + ? WHERE id = ?').run(points, req.params.childId);
  const result = db.prepare('INSERT INTO task_completions (child_id, game_name, points_earned, description) VALUES (?, ?, ?, ?)').run(req.params.childId, gameName, points, description);
  const completion = db.prepare('SELECT * FROM task_completions WHERE id = ?').get(result.lastInsertRowid);
  const child = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.childId);
  res.json({ completion, child });
});

app.post('/api/children/:childId/redeem', (req, res) => {
  const { rewardId, rewardName, pointsCost } = req.body;
  const child = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.childId);
  if (child.points < pointsCost) {
    return res.status(400).json({ error: '积分不足' });
  }
  db.prepare('UPDATE children SET points = points - ? WHERE id = ?').run(pointsCost, req.params.childId);
  const result = db.prepare('INSERT INTO redemptions (child_id, reward_id, reward_name, points_spent) VALUES (?, ?, ?, ?)').run(req.params.childId, rewardId || null, rewardName, pointsCost);
  const redemption = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(result.lastInsertRowid);
  const updatedChild = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.childId);
  res.json({ redemption, child: updatedChild });
});

app.get('/api/children/:childId/records', (req, res) => {
  const completions = db.prepare('SELECT * FROM task_completions WHERE child_id = ? ORDER BY completed_at DESC').all(req.params.childId);
  const redemptions = db.prepare('SELECT * FROM redemptions WHERE child_id = ? ORDER BY redeemed_at DESC').all(req.params.childId);
  
  const records = [
    ...completions.map(c => ({ ...c, type: 'earn', time: c.completed_at })),
    ...redemptions.map(r => ({ ...r, type: 'spend', time: r.redeemed_at }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time));
  
  res.json(records);
});

app.get('/api/children/:childId/summary', (req, res) => {
  const childId = req.params.childId;
  const totalEarned = db.prepare('SELECT COALESCE(SUM(points_earned), 0) as total FROM task_completions WHERE child_id = ?').get(childId).total;
  const totalSpent = db.prepare('SELECT COALESCE(SUM(points_spent), 0) as total FROM redemptions WHERE child_id = ?').get(childId).total;
  const completionCount = db.prepare('SELECT COUNT(*) as count FROM task_completions WHERE child_id = ?').get(childId).count;
  const redemptionCount = db.prepare('SELECT COUNT(*) as count FROM redemptions WHERE child_id = ?').get(childId).count;
  
  res.json({ totalEarned, totalSpent, completionCount, redemptionCount });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

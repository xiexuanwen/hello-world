const express = require('express');
const cors = require('cors');
const { dbPromise } = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/children', async (req, res) => {
  try {
    const children = await dbPromise.all('SELECT * FROM children ORDER BY created_at DESC');
    res.json(children);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/children', async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const result = await dbPromise.run('INSERT INTO children (name, avatar) VALUES (?, ?)', [name, avatar || '😊']);
    const child = await dbPromise.get('SELECT * FROM children WHERE id = ?', [result.lastID]);
    res.json(child);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/children/:id', async (req, res) => {
  try {
    const { name, avatar } = req.body;
    await dbPromise.run('UPDATE children SET name = ?, avatar = ? WHERE id = ?', [name, avatar, req.params.id]);
    const child = await dbPromise.get('SELECT * FROM children WHERE id = ?', [req.params.id]);
    res.json(child);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/children/:id', async (req, res) => {
  try {
    await dbPromise.run('DELETE FROM children WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await dbPromise.all('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, points } = req.body;
    const result = await dbPromise.run('INSERT INTO tasks (title, description, points) VALUES (?, ?, ?)', [title, description, points]);
    const task = await dbPromise.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, points } = req.body;
    await dbPromise.run('UPDATE tasks SET title = ?, description = ?, points = ? WHERE id = ?', [title, description, points, req.params.id]);
    const task = await dbPromise.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await dbPromise.run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rewards', async (req, res) => {
  try {
    const rewards = await dbPromise.all('SELECT * FROM rewards ORDER BY created_at DESC');
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rewards', async (req, res) => {
  try {
    const { title, description, points_cost, category, icon } = req.body;
    const result = await dbPromise.run('INSERT INTO rewards (title, description, points_cost, category, icon) VALUES (?, ?, ?, ?, ?)', [title, description, points_cost, category, icon]);
    const reward = await dbPromise.get('SELECT * FROM rewards WHERE id = ?', [result.lastID]);
    res.json(reward);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rewards/:id', async (req, res) => {
  try {
    const { title, description, points_cost, category, icon } = req.body;
    await dbPromise.run('UPDATE rewards SET title = ?, description = ?, points_cost = ?, category = ?, icon = ? WHERE id = ?', [title, description, points_cost, category, icon, req.params.id]);
    const reward = await dbPromise.get('SELECT * FROM rewards WHERE id = ?', [req.params.id]);
    res.json(reward);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rewards/:id', async (req, res) => {
  try {
    await dbPromise.run('DELETE FROM rewards WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/children/:childId/complete-task', async (req, res) => {
  try {
    const { taskId, description, points } = req.body;
    await dbPromise.run('UPDATE children SET points = points + ? WHERE id = ?', [points, req.params.childId]);
    const result = await dbPromise.run('INSERT INTO task_completions (child_id, task_id, points_earned, description) VALUES (?, ?, ?, ?)', [req.params.childId, taskId || null, points, description]);
    const completion = await dbPromise.get('SELECT * FROM task_completions WHERE id = ?', [result.lastID]);
    const child = await dbPromise.get('SELECT * FROM children WHERE id = ?', [req.params.childId]);
    res.json({ completion, child });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/children/:childId/complete-game', async (req, res) => {
  try {
    const { gameName, description, points } = req.body;
    await dbPromise.run('UPDATE children SET points = points + ? WHERE id = ?', [points, req.params.childId]);
    const result = await dbPromise.run('INSERT INTO task_completions (child_id, game_name, points_earned, description) VALUES (?, ?, ?, ?)', [req.params.childId, gameName, points, description]);
    const completion = await dbPromise.get('SELECT * FROM task_completions WHERE id = ?', [result.lastID]);
    const child = await dbPromise.get('SELECT * FROM children WHERE id = ?', [req.params.childId]);
    res.json({ completion, child });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/children/:childId/redeem', async (req, res) => {
  try {
    const { rewardId, rewardName, pointsCost } = req.body;
    const child = await dbPromise.get('SELECT * FROM children WHERE id = ?', [req.params.childId]);
    if (child.points < pointsCost) {
      return res.status(400).json({ error: '积分不足' });
    }
    await dbPromise.run('UPDATE children SET points = points - ? WHERE id = ?', [pointsCost, req.params.childId]);
    const result = await dbPromise.run('INSERT INTO redemptions (child_id, reward_id, reward_name, points_spent) VALUES (?, ?, ?, ?)', [req.params.childId, rewardId || null, rewardName, pointsCost]);
    const redemption = await dbPromise.get('SELECT * FROM redemptions WHERE id = ?', [result.lastID]);
    const updatedChild = await dbPromise.get('SELECT * FROM children WHERE id = ?', [req.params.childId]);
    res.json({ redemption, child: updatedChild });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/children/:childId/records', async (req, res) => {
  try {
    const completions = await dbPromise.all('SELECT * FROM task_completions WHERE child_id = ? ORDER BY completed_at DESC', [req.params.childId]);
    const redemptions = await dbPromise.all('SELECT * FROM redemptions WHERE child_id = ? ORDER BY redeemed_at DESC', [req.params.childId]);
    
    const records = [
      ...completions.map(c => ({ ...c, type: 'earn', time: c.completed_at })),
      ...redemptions.map(r => ({ ...r, type: 'spend', time: r.redeemed_at }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/children/:childId/summary', async (req, res) => {
  try {
    const childId = req.params.childId;
    const totalEarnedResult = await dbPromise.get('SELECT COALESCE(SUM(points_earned), 0) as total FROM task_completions WHERE child_id = ?', [childId]);
    const totalSpentResult = await dbPromise.get('SELECT COALESCE(SUM(points_spent), 0) as total FROM redemptions WHERE child_id = ?', [childId]);
    const completionCountResult = await dbPromise.get('SELECT COUNT(*) as count FROM task_completions WHERE child_id = ?', [childId]);
    const redemptionCountResult = await dbPromise.get('SELECT COUNT(*) as count FROM redemptions WHERE child_id = ?', [childId]);
    
    res.json({ 
      totalEarned: totalEarnedResult.total, 
      totalSpent: totalSpentResult.total, 
      completionCount: completionCountResult.count, 
      redemptionCount: redemptionCountResult.count 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

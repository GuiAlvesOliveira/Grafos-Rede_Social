import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getBFSSuggestions, getKosarajuCommunities, getDijkstraAffinity, getGraphRaw, getShortestPathBFS } from './graph.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super-secret-local-key'; // For local dev only

// Initialize SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create Vertices (Users) Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        interests TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Edges (Connections) Table
    db.run(`
      CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id_1 INTEGER,
        user_id_2 INTEGER,
        type TEXT DEFAULT 'friend',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id_1) REFERENCES users(id),
        FOREIGN KEY(user_id_2) REFERENCES users(id)
      )
    `);

    // Create Follows Table (Directed Graph)
    db.run(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER,
        followed_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(follower_id) REFERENCES users(id),
        FOREIGN KEY(followed_id) REFERENCES users(id),
        UNIQUE(follower_id, followed_id)
      )
    `);
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Graph API Server is running.' });
});

// Register Endpoint
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        
        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'User registered successfully', user: { id: this.lastID, name, email }, token });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      message: 'Logged in successfully', 
      user: { id: user.id, name: user.name, email: user.email },
      token 
    });
  });
});

// Get user's connections (Adjacency List)
app.get('/api/connections/:userId', (req, res) => {
  const { userId } = req.params;
  
  const query = `
    SELECT u.id, u.name, u.email, u.interests, c.type 
    FROM users u
    JOIN connections c ON (u.id = c.user_id_2)
    WHERE c.user_id_1 = ?
    UNION
    SELECT u.id, u.name, u.email, u.interests, c.type 
    FROM users u
    JOIN connections c ON (u.id = c.user_id_1)
    WHERE c.user_id_2 = ?
  `;

  db.all(query, [userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error fetching connections' });
    res.json(rows);
  });
});

// Get users not yet connected to the current user
app.get('/api/users/search/:userId', (req, res) => {
  const { userId } = req.params;
  const { q } = req.query;

  let query = `
    SELECT id, name, email, interests 
    FROM users 
    WHERE id != ? 
    AND id NOT IN (
      SELECT user_id_2 FROM connections WHERE user_id_1 = ?
      UNION 
      SELECT user_id_1 FROM connections WHERE user_id_2 = ?
    )
  `;
  const params = [userId, userId, userId];

  if (q) {
    query += ` AND name LIKE ?`;
    params.push(`%${q}%`);
  }

  query += ` LIMIT 10`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error searching users: ' + err.message });
    res.json(rows);
  });
});

// Add a new connection
app.post('/api/connections', (req, res) => {
  const { currentUserId, targetUserId } = req.body;
  if (!currentUserId || !targetUserId) return res.status(400).json({ error: 'Missing user IDs' });

  db.run(
    'INSERT INTO connections (user_id_1, user_id_2) VALUES (?, ?)',
    [currentUserId, targetUserId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Error creating connection' });
      res.json({ success: true, connectionId: this.lastID });
    }
  );
});

// Follows Endpoints (Directed Graph logic)
app.get('/api/follows/:userId', (req, res) => {
  const { userId } = req.params;

  // In-degree (Followers)
  const queryFollowers = `
    SELECT u.id, u.name, u.email, u.interests 
    FROM users u
    JOIN user_follows f ON u.id = f.follower_id
    WHERE f.followed_id = ?
  `;

  // Out-degree (Following)
  const queryFollowing = `
    SELECT u.id, u.name, u.email, u.interests 
    FROM users u
    JOIN user_follows f ON u.id = f.followed_id
    WHERE f.follower_id = ?
  `;

  db.all(queryFollowers, [userId], (err1, followers) => {
    if (err1) return res.status(500).json({ error: 'Erro ao buscar seguidores' });
    
    db.all(queryFollowing, [userId], (err2, following) => {
      if (err2) return res.status(500).json({ error: 'Erro ao buscar seguindo' });
      
      res.json({
        followers: followers, // In-degree relationships
        followersCount: followers.length, // In-degree
        following: following, // Out-degree relationships
        followingCount: following.length // Out-degree
      });
    });
  });
});

app.post('/api/follows/toggle', (req, res) => {
  const { followerId, followedId } = req.body;
  if (!followerId || !followedId) return res.status(400).json({ error: 'Faltam IDs de usuário' });

  // Verificar se a aresta já existe
  db.get('SELECT id FROM user_follows WHERE follower_id = ? AND followed_id = ?', [followerId, followedId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Erro ao checar conexão.' });

    if (row) {
      // Se já existe, remove (Unfollow - quebra de aresta)
      db.run('DELETE FROM user_follows WHERE id = ?', [row.id], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao deixar de seguir.' });
        res.json({ following: false });
      });
    } else {
      // Se não existe, cria (Follow - aresta direcionada)
      db.run('INSERT INTO user_follows (follower_id, followed_id) VALUES (?, ?)', [followerId, followedId], function(err) {
        if (err) return res.status(500).json({ error: 'Erro ao seguir.' });
        res.json({ following: true, followId: this.lastID });
      });
    }
  });
});

// Graph Algorithms Endpoints
app.get('/api/graph/suggestions/:userId', async (req, res) => {
  try {
    const suggestions = await getBFSSuggestions(db, req.params.userId);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: 'Erro no BFS (Sugestões)' });
  }
});

app.get('/api/graph/communities', async (req, res) => {
  try {
    const communities = await getKosarajuCommunities(db);
    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: 'Erro no Kosaraju (Comunidades)' });
  }
});

app.get('/api/graph/affinity/:userId', async (req, res) => {
  try {
    const affinity = await getDijkstraAffinity(db, req.params.userId);
    res.json(affinity);
  } catch (err) {
    res.status(500).json({ error: 'Erro no Dijkstra (Afinidade)' });
  }
});

// Directed Visualizations Endpoints (Follows)
app.get('/api/graph/follows/all', async (req, res) => {
  try {
    const { getDirGraphRaw } = await import('./graph.js');
    const data = await getDirGraphRaw(db);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar grafo dirigido bruto' });
  }
});

app.get('/api/graph/follows/path', async (req, res) => {
  try {
    const { source, target } = req.query;
    if (!source || !target) return res.status(400).json({ error: 'Faltam origiem/destino' });
    const { getShortestPathDirBFS } = await import('./graph.js');
    const data = await getShortestPathDirBFS(db, source, target);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar caminho direcionado' });
  }
});

// Visualization Endpoints
app.get('/api/graph/all', async (req, res) => {
  try {
    const data = await getGraphRaw(db);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar grafo bruto' });
  }
});

app.get('/api/graph/path', async (req, res) => {
  try {
    const { source, target } = req.query;
    if (!source || !target) return res.status(400).json({ error: 'Faltam origiem/destino' });
    const data = await getShortestPathBFS(db, source, target);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar caminho' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

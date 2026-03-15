export async function getGraphData(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', [], (err, users) => {
      if (err) return reject(err);
      db.all('SELECT * FROM connections', [], (err, connections) => {
        if (err) return reject(err);
        resolve({ users, connections });
      });
    });
  });
}

function buildAdjacencyList(users, connections) {
  const adj = new Map();
  const usersMap = new Map();
  
  users.forEach(u => {
    adj.set(u.id, []);
    usersMap.set(u.id, { ...u, password: null }); // Remove password for safety
  });

  // Directed edges: user_id_1 (follower) -> user_id_2 (followed)
  connections.forEach(c => {
    if (adj.has(c.user_id_1) && adj.has(c.user_id_2)) {
      adj.get(c.user_id_1).push(c.user_id_2);
    }
  });

  return { adj, usersMap };
}

// 1. BFS for Suggestions (2 or 3 degrees of separation)
export async function getBFSSuggestions(db, startUserId) {
  const { users, connections } = await getGraphData(db);
  const { adj, usersMap } = buildAdjacencyList(users, connections);
  
  startUserId = Number(startUserId);
  const visited = new Set();
  const queue = [{ id: startUserId, dist: 0 }];
  visited.add(startUserId);

  const suggestions = [];

  while (queue.length > 0) {
    const { id, dist } = queue.shift();
    
    // If it's 2 or 3 degrees precisely
    if (dist === 2 || dist === 3) {
      if (id !== startUserId) {
        suggestions.push({ ...usersMap.get(id), max_dist: dist });
      }
    }
    
    if (dist < 3) {
      const neighbors = adj.get(id) || [];
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, dist: dist + 1 });
        }
      }
    }
  }

  return suggestions;
}

// 2. Kosaraju's Algorithm for SCCs (Communities)
export async function getKosarajuCommunities(db) {
  const { users, connections } = await getGraphData(db);
  const { adj, usersMap } = buildAdjacencyList(users, connections);

  const stack = [];
  const visited = new Set();

  // Pass 1: compute finishing times
  function dfs1(u) {
    visited.add(u);
    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        dfs1(v);
      }
    }
    stack.push(u);
  }

  for (const u of usersMap.keys()) {
    if (!visited.has(u)) {
      dfs1(u);
    }
  }

  // Transpose the graph
  const adjT = new Map();
  users.forEach(u => adjT.set(u.id, []));
  connections.forEach(c => {
    if (adjT.has(c.user_id_2) && adjT.has(c.user_id_1)) {
      adjT.get(c.user_id_2).push(c.user_id_1);
    }
  });

  visited.clear();
  const communities = [];

  // Pass 2: DFS on transposed graph in order of finishing times
  function dfs2(u, component) {
    visited.add(u);
    component.push(usersMap.get(u));
    const neighbors = adjT.get(u) || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        dfs2(v, component);
      }
    }
  }

  while (stack.length > 0) {
    const u = stack.pop();
    if (!visited.has(u)) {
      const component = [];
      dfs2(u, component);
      // Only return communities of size > 1
      if (component.length > 1) {
        communities.push(component);
      }
    }
  }

  return communities;
}

// 3. Dijkstra's Algorithm for Affinity
function calculateAffinityContent(u1, u2) {
  const i1 = (u1.interests || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s);
  const i2 = (u2.interests || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s);
  let overlap = 0;
  for (const it of i1) {
    if (i2.includes(it)) overlap++;
  }
  
  // Base cost is 10. Subtract 3 for each shared interest to lower the cost (higher affinity).
  let weight = 10 - (overlap * 3);
  if (weight < 1) weight = 1; 
  return weight;
}

export async function getDijkstraAffinity(db, startUserId) {
  const { users, connections } = await getGraphData(db);
  const { adj, usersMap } = buildAdjacencyList(users, connections);
  
  startUserId = Number(startUserId);

  const dist = new Map();
  const pq = []; 

  for (const u of usersMap.keys()) {
    dist.set(u, Infinity);
  }
  dist.set(startUserId, 0);
  pq.push({ id: startUserId, weight: 0 });

  while (pq.length > 0) {
    pq.sort((a, b) => a.weight - b.weight); // basic min-heap queue
    const curr = pq.shift();

    if (curr.weight > dist.get(curr.id)) continue;

    const neighbors = adj.get(curr.id) || [];
    for (const neighborId of neighbors) {
      const u1 = usersMap.get(curr.id);
      const u2 = usersMap.get(neighborId);
      const edgeWeight = calculateAffinityContent(u1, u2);
      
      const newDist = curr.weight + edgeWeight;
      if (newDist < dist.get(neighborId)) {
        dist.set(neighborId, newDist);
        pq.push({ id: neighborId, weight: newDist });
      }
    }
  }

  const results = [];
  for (const [id, d] of dist.entries()) {
    if (id !== startUserId && d < Infinity) {
      results.push({ ...usersMap.get(id), affinityScore: d });
    }
  }
  results.sort((a, b) => a.affinityScore - b.affinityScore);
  return results.slice(0, 10);
}

// 4. Raw Graph Data for Visualization (react-force-graph-2d)
export async function getGraphRaw(db) {
  const { users, connections } = await getGraphData(db);
  
  const nodes = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    interests: u.interests,
    // Calculate degree (number of connections)
    val: connections.filter(c => c.user_id_1 === u.id || c.user_id_2 === u.id).length
  }));

  const links = connections.map(c => ({
    source: c.user_id_1,
    target: c.user_id_2
  }));

  return { nodes, links };
}

// 5. Shortest path computation BFS (for visualization)
export async function getShortestPathBFS(db, sourceId, targetId) {
  const { users, connections } = await getGraphData(db);
  const { adj } = buildAdjacencyList(users, connections);
  
  sourceId = Number(sourceId);
  targetId = Number(targetId);

  // We need an undirected view for routing normally, or let's use the undirected approach just for visual routing.
  const adjUndirected = new Map();
  users.forEach(u => adjUndirected.set(u.id, []));
  connections.forEach(c => {
    if(adjUndirected.has(c.user_id_1) && adjUndirected.has(c.user_id_2)) {
      adjUndirected.get(c.user_id_1).push(c.user_id_2);
      adjUndirected.get(c.user_id_2).push(c.user_id_1);
    }
  });

  const queue = [sourceId];
  const visited = new Set([sourceId]);
  const parent = new Map();
  parent.set(sourceId, null);

  let found = false;
  while(queue.length > 0) {
    const curr = queue.shift();
    if(curr === targetId) {
      found = true;
      break;
    }
    const neighbors = adjUndirected.get(curr) || [];
    for(const n of neighbors) {
      if(!visited.has(n)) {
        visited.add(n);
        parent.set(n, curr);
        queue.push(n);
      }
    }
  }

  if(!found) return { path: [] };

  const path = [];
  let curr = targetId;
  while(curr !== null) {
    path.unshift(curr);
    curr = parent.get(curr);
  }

  return { path, distance: path.length - 1 };
}

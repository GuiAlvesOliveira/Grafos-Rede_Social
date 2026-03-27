import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const db = new sqlite3.Database('./database.sqlite');

const rawUsers = [
  { name: 'Alice', interests: 'música, arte, cinema' },
  { name: 'Bruno', interests: 'esportes, tecnologia, games' },
  { name: 'Carlos', interests: 'viagens, culinária, fotografia' },
  { name: 'Camila', interests: 'música, leitura, viagens' },
  { name: 'Daniela', interests: 'literatura, música, pintura' },
  { name: 'Eduardo', interests: 'games, programação, tecnologia' },
  { name: 'Fernanda', interests: 'cinema, teatro, música' },
  { name: 'Gabriel', interests: 'futebol, basquete, natação' },
  { name: 'Helena', interests: 'viagens, fotografia, natureza' },
  { name: 'Igor', interests: 'tecnologia, robótica, IA' },
  { name: 'Julia', interests: 'culinária, moda, design' },
  { name: 'Kleber', interests: 'carros, esportes, viagens' },
  { name: 'Laura', interests: 'arte, pintura, escultura' },
  { name: 'Marcelo', interests: 'música, violão, bateria' },
  { name: 'Mariana', interests: 'leitura, fotografia, viagens' },
  { name: 'Natalia', interests: 'literatura, poesia, escrita' },
  { name: 'Otavio', interests: 'games, tecnologia, stream' },
  { name: 'Paula', interests: 'fotografia, cinema, edição' },
  { name: 'Rafael', interests: 'esportes, corrida, academia' },
  { name: 'Sofia', interests: 'culinária, doces, confeitaria' }
];

async function seed() {
  const passwordHash = await bcrypt.hash('123123', 10);
  const emailsUsed = new Set();
  
  // Format emails based on rules
  const users = rawUsers.map(u => {
    let first = u.name.charAt(0).toLowerCase();
    let email1 = `${first}@${first}.com`;
    
    if (!emailsUsed.has(email1)) {
      emailsUsed.add(email1);
      return { ...u, email: email1 };
    } else {
      let firstTwo = u.name.substring(0, 2).toLowerCase();
      let email2 = `${firstTwo}@${firstTwo}.com.br`;
      emailsUsed.add(email2);
      return { ...u, email: email2 };
    }
  });

  // Write text file
  let docContent = "========== USUÁRIOS DE TESTE ==========\n";
  docContent += "Para todas as contas a senha é: 123123\n\n";
  users.forEach((u, i) => {
    docContent += `${i + 1}. Nome: ${u.name.padEnd(10)} | E-mail: ${u.email.padEnd(16)} | Interesses: ${u.interests}\n`;
  });
  
  fs.writeFileSync('./usuarios_teste.txt', docContent);
  console.log('📄 Arquivo usuarios_teste.txt gerado com sucesso.');

  db.serialize(() => {
    // Garantir que as tabelas existem antes de tentar limpar
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, interests TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS connections (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id_1 INTEGER, user_id_2 INTEGER, type TEXT DEFAULT 'friend', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id_1) REFERENCES users(id), FOREIGN KEY(user_id_2) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS user_follows (id INTEGER PRIMARY KEY AUTOINCREMENT, follower_id INTEGER, followed_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(follower_id) REFERENCES users(id), FOREIGN KEY(followed_id) REFERENCES users(id), UNIQUE(follower_id, followed_id))`);

    db.run("DELETE FROM user_follows");
    db.run("DELETE FROM connections");
    db.run("DELETE FROM users");
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('users', 'connections', 'user_follows')");

    const stmtUser = db.prepare("INSERT INTO users (name, email, password, interests) VALUES (?, ?, ?, ?)");
    users.forEach(u => stmtUser.run(u.name, u.email, passwordHash, u.interests));
    stmtUser.finalize();

    // Strategic Connections to validation algorithms
    const connections = [
      // 1. Bolha (Strongly Connected Component) -> 1, 2, 3, 4 (Alice, Bruno, Carlos, Camila)
      [1, 2], [2, 3], [3, 4], [4, 1],

      // 2. BFS Distances from Alice (1)
      // 1 degree
      [1, 5], 
      // 2 degrees (Alice -> Daniela(5) -> Eduardo(6))
      [5, 6], 
      // 3 degrees (Alice -> Daniela(5) -> Eduardo(6) -> Fernanda(7))
      [6, 7], 
      // 4 degrees (Out of BFS scope just to test limits)
      [7, 8],

      // 3. Affinity paths (High weights/interests)
      // Alice (1): música, arte, cinema
      // Laura (13): arte, pintura, escultura
      // Marcelo (14): música, violão, bateria
      [1, 13], [13, 14], [1, 14],

      // Other structural edges
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], 
      [15, 16], [16, 17], [17, 18], [18, 15], // Bolha secundária
      [19, 20], [20, 1]
    ];

    const stmtConn = db.prepare("INSERT INTO connections (user_id_1, user_id_2) VALUES (?, ?)");
    connections.forEach(c => stmtConn.run(c[0], c[1]));
    stmtConn.finalize();

    // Strategic Follows (Directed Edges)
    const follows = [
      // Many following Alice (1) -> Alice possesses high In-Degree
      [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
      // Alice (1) following a few -> Alice has Out-Degree
      [1, 2], [1, 3],
      // Chain of follows
      [8, 9], [9, 10], [10, 11]
    ];

    const stmtFollows = db.prepare("INSERT INTO user_follows (follower_id, followed_id) VALUES (?, ?)");
    follows.forEach(f => stmtFollows.run(f[0], f[1]));
    stmtFollows.finalize();

    console.log('✅ Banco de dados populado com 20 usuários, conexões não dirigidas e follows direcionados!');
    db.close();
  });
}

seed();

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

const databases = new Map();

app.post('/api/databases', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Database name is required' });
    }

    const dbId = uuidv4();
    const db = new Database(':memory:');
    
    databases.set(dbId, {
      id: dbId,
      name: name.trim(),
      db: db,
      createdAt: new Date().toISOString()
    });

    res.json({
      id: dbId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      message: 'Database created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/databases', (req, res) => {
  try {
    const dbList = Array.from(databases.values()).map(({ id, name, createdAt }) => ({
      id,
      name,
      createdAt
    }));
    res.json(dbList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/databases/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!databases.has(id)) {
      return res.status(404).json({ error: 'Database not found' });
    }

    const dbInfo = databases.get(id);
    dbInfo.db.close();
    databases.delete(id);

    res.json({ message: 'Database deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/databases/:id/execute', (req, res) => {
  try {
    const { id } = req.params;
    const { sql } = req.body;

    if (!databases.has(id)) {
      return res.status(404).json({ error: 'Database not found' });
    }

    if (!sql || sql.trim() === '') {
      return res.status(400).json({ error: 'SQL statement is required' });
    }

    const dbInfo = databases.get(id);
    const db = dbInfo.db;

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let result = [];
    let totalAffectedRows = 0;
    let lastResult = [];

    for (const statement of statements) {
      const trimmedSql = statement.trim().toUpperCase();
      const isSelect = trimmedSql.startsWith('SELECT') || 
                       trimmedSql.startsWith('PRAGMA') ||
                       trimmedSql.startsWith('EXPLAIN');

      if (isSelect) {
        const stmt = db.prepare(statement);
        lastResult = stmt.all();
        result = lastResult;
      } else {
        const stmt = db.prepare(statement);
        const info = stmt.run();
        totalAffectedRows += info.changes;
        lastResult = [];
      }
    }

    const hasSelectResults = result.length > 0;
    
    res.json({
      success: true,
      data: result,
      affectedRows: totalAffectedRows,
      message: hasSelectResults 
        ? `Query returned ${result.length} row(s)` 
        : statements.length > 1
        ? `${statements.length} statement(s) executed, ${totalAffectedRows} row(s) affected`
        : `${totalAffectedRows} row(s) affected`
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/databases/:id/tables', (req, res) => {
  try {
    const { id } = req.params;

    if (!databases.has(id)) {
      return res.status(404).json({ error: 'Database not found' });
    }

    const dbInfo = databases.get(id);
    const db = dbInfo.db;

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();

    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/databases/:id/tables/:tableName/schema', (req, res) => {
  try {
    const { id, tableName } = req.params;

    if (!databases.has(id)) {
      return res.status(404).json({ error: 'Database not found' });
    }

    const dbInfo = databases.get(id);
    const db = dbInfo.db;

    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();

    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/databases/:id/relationships', (req, res) => {
  try {
    const { id } = req.params;

    if (!databases.has(id)) {
      return res.status(404).json({ error: 'Database not found' });
    }

    const dbInfo = databases.get(id);
    const db = dbInfo.db;

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();

    const relationships = [];

    tables.forEach(table => {
      try {
        const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all();
        
        foreignKeys.forEach(fk => {
          relationships.push({
            fromTable: table.name,
            fromColumn: fk.from,
            toTable: fk.table,
            toColumn: fk.to,
            onUpdate: fk.on_update,
            onDelete: fk.on_delete
          });
        });
      } catch (err) {
        console.error(`Error getting foreign keys for ${table.name}:`, err);
      }
    });

    res.json(relationships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username === adminUsername && password === adminPassword) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/delete-all', (req, res) => {
  try {
    const { username, password } = req.body;
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const count = databases.size;
    
    databases.forEach(dbInfo => {
      try {
        dbInfo.db.close();
      } catch (err) {
        console.error('Error closing database:', err);
      }
    });
    
    databases.clear();
    
    res.json({ 
      success: true, 
      message: `${count} database(s) deleted successfully` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

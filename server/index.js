require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const path = require('path');
const { Pool } = require('pg');

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

// ─── PostgreSQL – Clase BD (una sola instancia compartida) ────────────────────

let pgPool = null;

function getPgPool() {
  if (!process.env.PG_CONNECTION_URL) return null;
  if (!pgPool) {
    pgPool = new Pool({ connectionString: process.env.PG_CONNECTION_URL, ssl: { rejectUnauthorized: false } });
  }
  return pgPool;
}

function parsePgUrl(url) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port || '5432',
      database: u.pathname.replace('/', ''),
      user: u.username,
      password: u.password,
      connectionString: url
    };
  } catch {
    return null;
  }
}

// GET /api/pg/status  →  estado de la BD de clase y credenciales públicas
app.get('/api/pg/status', async (req, res) => {
  const url = process.env.PG_CONNECTION_URL;
  if (!url) return res.json({ configured: false });
  const pool = getPgPool();
  try {
    await pool.query('SELECT 1');
    const parsed = parsePgUrl(url);
    res.json({
      configured: true,
      connected: true,
      credentials: parsed
    });
  } catch (err) {
    res.json({ configured: true, connected: false, error: err.message });
  }
});

const DDL_KEYWORDS = /^\s*(CREATE|DROP|ALTER|TRUNCATE|RENAME|COMMENT|GRANT|REVOKE)\s/i;

function isDDL(sql) {
  return sql.split(';').map(s => s.trim()).filter(s => s.length > 0).some(s => DDL_KEYWORDS.test(s));
}

async function runPgSql(pool, sql, res) {
  const result = await pool.query(sql);
  res.json({
    success: true,
    data: result.rows || [],
    affectedRows: result.rowCount || 0,
    message: result.rows && result.rows.length > 0
      ? `Consulta retornó ${result.rows.length} fila(s)`
      : `${result.rowCount || 0} fila(s) afectadas`
  });
}

// POST /api/pg/execute  →  ejecutar DML sobre la BD de clase (estudiantes, DDL bloqueado)
app.post('/api/pg/execute', async (req, res) => {
  const pool = getPgPool();
  if (!pool) return res.status(503).json({ error: 'PostgreSQL no configurado' });

  const { sql } = req.body;
  if (!sql || sql.trim() === '') return res.status(400).json({ error: 'SQL requerido' });

  if (isDDL(sql)) {
    return res.status(403).json({
      success: false,
      error: 'Sentencias DDL no permitidas (CREATE, DROP, ALTER...). Solo se permiten INSERT, SELECT, UPDATE y DELETE.'
    });
  }

  try {
    await runPgSql(pool, sql, res);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/admin/pg/execute  →  ejecutar cualquier SQL (admin, DDL permitido)
app.post('/api/admin/pg/execute', async (req, res) => {
  const { username, password, sql } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const pool = getPgPool();
  if (!pool) return res.status(503).json({ error: 'PostgreSQL no configurado' });
  if (!sql || sql.trim() === '') return res.status(400).json({ error: 'SQL requerido' });

  try {
    await runPgSql(pool, sql, res);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/pg/tables  →  listar tablas del schema público
app.get('/api/pg/tables', async (req, res) => {
  const pool = getPgPool();
  if (!pool) return res.status(503).json({ error: 'PostgreSQL no configurado' });

  try {
    const result = await pool.query(
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pg/tables/:tableName/schema  →  esquema de una tabla
app.get('/api/pg/tables/:tableName/schema', async (req, res) => {
  const pool = getPgPool();
  if (!pool) return res.status(503).json({ error: 'PostgreSQL no configurado' });

  const { tableName } = req.params;
  try {
    const result = await pool.query(
      `SELECT
        ordinal_position AS cid,
        column_name AS name,
        data_type AS type,
        CASE WHEN is_nullable = 'NO' THEN 1 ELSE 0 END AS notnull,
        column_default AS dflt_value,
        CASE WHEN kcu.column_name IS NOT NULL THEN 1 ELSE 0 END AS pk
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
          AND tc.table_name = kcu.table_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1
      ) kcu ON c.column_name = kcu.column_name
      WHERE c.table_schema = 'public' AND c.table_name = $1
      ORDER BY ordinal_position`,
      [tableName]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pg/relationships  →  foreign keys del schema público
app.get('/api/pg/relationships', async (req, res) => {
  const pool = getPgPool();
  if (!pool) return res.status(503).json({ error: 'PostgreSQL no configurado' });

  try {
    const result = await pool.query(
      `SELECT
        kcu.table_name AS "fromTable",
        kcu.column_name AS "fromColumn",
        ccu.table_name AS "toTable",
        ccu.column_name AS "toColumn",
        rc.update_rule AS "onUpdate",
        rc.delete_rule AS "onDelete"
      FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu
        ON rc.constraint_name = kcu.constraint_name
        AND rc.constraint_schema = kcu.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
        ON rc.unique_constraint_name = ccu.constraint_name
        AND rc.unique_constraint_schema = ccu.constraint_schema
      WHERE kcu.constraint_schema = 'public'`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/pg/reset  →  eliminar todas las tablas (solo admin)
app.post('/api/admin/pg/reset', async (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const pool = getPgPool();
  if (!pool) return res.status(503).json({ error: 'PostgreSQL no configurado' });

  try {
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
    );
    if (tables.rows.length === 0) {
      return res.json({ success: true, message: 'No hay tablas que eliminar' });
    }
    const names = tables.rows.map(r => `"${r.table_name}"`).join(', ');
    await pool.query(`DROP TABLE IF EXISTS ${names} CASCADE`);
    res.json({ success: true, message: `${tables.rows.length} tabla(s) eliminadas` });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

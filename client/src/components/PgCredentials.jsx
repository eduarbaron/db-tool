import { useState } from 'react'
import { Copy, Check, Server, Key, Database, Link } from 'lucide-react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-white/10 text-purple-300 hover:text-white transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

function CredentialRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0">
      <Icon className="w-4 h-4 text-purple-400 shrink-0" />
      <span className="text-purple-300 text-sm w-24 shrink-0">{label}</span>
      <code className="flex-1 text-green-300 font-mono text-sm bg-black/20 px-2 py-0.5 rounded truncate">
        {value}
      </code>
      <CopyButton text={value} />
    </div>
  )
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative">
      <pre className="bg-slate-950 rounded-lg p-4 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 text-purple-300 hover:text-white transition-colors"
        title="Copiar código"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

function PgCredentials({ credentials }) {
  const [activeExample, setActiveExample] = useState('pool')

  if (!credentials) return null

  const { host, port, database, user, password, connectionString } = credentials

  const examples = {
    pool: `// npm install pg
const { Pool } = require('pg')

const pool = new Pool({
  host: '${host}',
  port: ${port},
  database: '${database}',
  user: '${user}',
  password: '${password}',
  ssl: { rejectUnauthorized: false }
})

// Ejemplo: SELECT
async function getUsers() {
  const result = await pool.query('SELECT * FROM usuarios')
  console.log(result.rows)
}

getUsers()`,
    url: `// npm install pg
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: '${connectionString}',
  ssl: { rejectUnauthorized: false }
})

// Ejemplo: INSERT
async function createUser(nombre, email) {
  const result = await pool.query(
    'INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING *',
    [nombre, email]
  )
  return result.rows[0]
}`,
    express: `// npm install express pg
const express = require('express')
const { Pool } = require('pg')

const app = express()
app.use(express.json())

const pool = new Pool({
  connectionString: '${connectionString}',
  ssl: { rejectUnauthorized: false }
})

app.get('/usuarios', async (req, res) => {
  const result = await pool.query('SELECT * FROM usuarios')
  res.json(result.rows)
})

app.post('/usuarios', async (req, res) => {
  const { nombre, email } = req.body
  const result = await pool.query(
    'INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING *',
    [nombre, email]
  )
  res.json(result.rows[0])
})

app.listen(3000, () => console.log('Servidor en puerto 3000'))`
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-lg p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-400" />
          Credenciales de conexión
        </h3>
        <div className="space-y-0">
          <CredentialRow label="Host" value={host} icon={Server} />
          <CredentialRow label="Puerto" value={port} icon={Server} />
          <CredentialRow label="Base de datos" value={database} icon={Database} />
          <CredentialRow label="Usuario" value={user} icon={Key} />
          <CredentialRow label="Contraseña" value={password} icon={Key} />
        </div>
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-start gap-3">
            <Link className="w-4 h-4 text-purple-400 shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <span className="text-purple-300 text-sm block mb-1">Connection String</span>
              <code className="block text-green-300 font-mono text-xs bg-black/20 px-3 py-2 rounded break-all">
                {connectionString}
              </code>
            </div>
            <CopyButton text={connectionString} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          Ejemplos de código Node.js
        </h3>
        <div className="flex gap-2 mb-3">
          {[
            { key: 'pool', label: 'Conexión por campos' },
            { key: 'url', label: 'Conexión por URL' },
            { key: 'express', label: 'API Express completa' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveExample(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeExample === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-purple-200 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <CodeBlock code={examples[activeExample]} />
      </div>
    </div>
  )
}

export default PgCredentials

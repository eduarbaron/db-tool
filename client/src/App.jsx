import { useState, useEffect } from 'react'
import axios from 'axios'
import { Database, Play, Trash2, Plus, AlertCircle, CheckCircle, Loader, Code, Wand2, LayoutGrid, Network, Shield } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import TableVisualizer from './components/TableVisualizer'
import DDLBuilder from './components/DDLBuilder'
import DMLBuilder from './components/DMLBuilder'
import DiagramView from './components/DiagramView'
import AdminPanel from './components/AdminPanel'

const API_URL = '/api'

function App() {
  const [databases, setDatabases] = useState([])
  const [selectedDb, setSelectedDb] = useState(null)
  const [newDbName, setNewDbName] = useState('')
  const [sqlQuery, setSqlQuery] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [mode, setMode] = useState('sql')
  const [builderType, setBuilderType] = useState('DDL')
  const [viewMode, setViewMode] = useState('cards')
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  useEffect(() => {
    fetchDatabases()
  }, [])

  useEffect(() => {
    if (selectedDb) {
      fetchTablesWithSchema()
    }
  }, [selectedDb])

  const fetchDatabases = async () => {
    try {
      const response = await axios.get(`${API_URL}/databases`)
      setDatabases(response.data)
    } catch (err) {
      setError('Error al cargar las bases de datos')
    }
  }

  const fetchTablesWithSchema = async () => {
    try {
      const response = await axios.get(`${API_URL}/databases/${selectedDb.id}/tables`)
      const tablesWithSchema = await Promise.all(
        response.data.map(async (table) => {
          const schemaResponse = await axios.get(
            `${API_URL}/databases/${selectedDb.id}/tables/${table.name}/schema`
          )
          return { ...table, schema: schemaResponse.data }
        })
      )
      setTables(tablesWithSchema)
    } catch (err) {
      console.error('Error al cargar las tablas:', err)
    }
  }

  const createDatabase = async (e) => {
    e.preventDefault()
    if (!newDbName.trim()) return

    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/databases`, { name: newDbName })
      setDatabases([...databases, response.data])
      setNewDbName('')
      setSuccess('Base de datos creada exitosamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la base de datos')
    } finally {
      setLoading(false)
    }
  }

  const deleteDatabase = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta base de datos?')) return

    try {
      await axios.delete(`${API_URL}/databases/${id}`)
      setDatabases(databases.filter(db => db.id !== id))
      if (selectedDb?.id === id) {
        setSelectedDb(null)
        setQueryResult(null)
        setTables([])
      }
      setSuccess('Base de datos eliminada exitosamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la base de datos')
    }
  }

  const executeQuery = async () => {
    if (!selectedDb || !sqlQuery.trim()) return

    try {
      setLoading(true)
      setError(null)
      const response = await axios.post(`${API_URL}/databases/${selectedDb.id}/execute`, {
        sql: sqlQuery
      })
      setQueryResult(response.data)
      setSuccess(response.data.message)
      setTimeout(() => setSuccess(null), 3000)
      
      // Wait a bit and refresh tables to show new/updated tables
      setTimeout(async () => {
        await fetchTablesWithSchema()
      }, 100)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al ejecutar la consulta')
      setQueryResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSQL = (sql) => {
    setSqlQuery(sql)
    setMode('sql')
  }

  const handleTableClick = (table) => {
    setSqlQuery(`SELECT * FROM ${table.name}`)
    setMode('sql')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-[95%] mx-auto py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-10 h-10 text-purple-400" />
                <h1 className="text-4xl font-bold text-white">DB Tool</h1>
              </div>
              <p className="text-purple-200">Herramienta de Base de Datos Online - Ejecuta sentencias DDL y DML</p>
            </div>
            <button
              onClick={() => setShowAdminPanel(true)}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-purple-500/30 text-purple-200 rounded-lg flex items-center gap-2 transition-colors"
              title="Panel de administración"
            >
              <Shield className="w-5 h-5" />
              Admin
            </button>
          </div>
        </header>

        <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2 text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-200 hover:text-white">×</button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-2 text-green-200">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-6">
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Crear base de datos</h2>
              <form onSubmit={createDatabase} className="space-y-3">
                <input
                  type="text"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  placeholder="Nombre de la base de datos"
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Crear
                </button>
              </form>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Bases de datos</h2>
              <div className="space-y-2">
                {databases.length === 0 ? (
                  <p className="text-purple-200 text-sm">No hay bases de datos</p>
                ) : (
                  databases.map((db) => (
                    <div
                      key={db.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedDb?.id === db.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-purple-100 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div onClick={() => setSelectedDb(db)} className="flex-1">
                          <div className="font-semibold">{db.name}</div>
                          <div className="text-xs opacity-75">
                            {new Date(db.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteDatabase(db.id)}
                          className="ml-2 p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            {!selectedDb ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-12 border border-white/20 text-center">
                <Database className="w-20 h-20 mx-auto mb-4 text-purple-400 opacity-50" />
                <h2 className="text-2xl font-semibold text-white mb-2">Bienvenido a DB Tool</h2>
                <p className="text-purple-200">
                  Crea o selecciona una base de datos para comenzar a practicar SQL
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Modo de trabajo</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode('visual')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                          mode === 'visual'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        <Wand2 className="w-4 h-4" />
                        Visual
                      </button>
                      <button
                        onClick={() => setMode('sql')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                          mode === 'sql'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        <Code className="w-4 h-4" />
                        SQL
                      </button>
                    </div>
                  </div>

                  {mode === 'visual' ? (
                    <div className="space-y-4">
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => setBuilderType('DDL')}
                          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                            builderType === 'DDL'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/5 text-purple-200 hover:bg-white/10'
                          }`}
                        >
                          DDL (Crear tablas)
                        </button>
                        <button
                          onClick={() => setBuilderType('DML')}
                          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                            builderType === 'DML'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/5 text-purple-200 hover:bg-white/10'
                          }`}
                        >
                          DML (Datos)
                        </button>
                      </div>

                      {builderType === 'DDL' ? (
                        <DDLBuilder onGenerateSQL={handleGenerateSQL} />
                      ) : (
                        <DMLBuilder tables={tables} onGenerateSQL={handleGenerateSQL} />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border-2 border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <CodeMirror
                          value={sqlQuery}
                          height="300px"
                          theme={oneDark}
                          extensions={[sql()]}
                          onChange={(value) => setSqlQuery(value)}
                          placeholder="Escribe tu consulta SQL aquí...

Ejemplos:
CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nombre TEXT, email TEXT);
INSERT INTO usuarios (nombre, email) VALUES ('Juan', 'juan@example.com');
SELECT * FROM usuarios;"
                          basicSetup={{
                            lineNumbers: true,
                            highlightActiveLineGutter: true,
                            highlightSpecialChars: true,
                            foldGutter: true,
                            drawSelection: true,
                            dropCursor: true,
                            allowMultipleSelections: true,
                            indentOnInput: true,
                            bracketMatching: true,
                            closeBrackets: true,
                            autocompletion: true,
                            rectangularSelection: true,
                            crosshairCursor: true,
                            highlightActiveLine: true,
                            highlightSelectionMatches: true,
                            closeBracketsKeymap: true,
                            searchKeymap: true,
                            foldKeymap: true,
                            completionKeymap: true,
                            lintKeymap: true,
                          }}
                          style={{
                            fontSize: '14px',
                            fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
                          }}
                        />
                      </div>
                      <button
                        onClick={executeQuery}
                        disabled={loading || !sqlQuery.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Ejecutando...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Ejecutar SQL
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white mb-4">Mis tablas</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm ${
                          viewMode === 'cards'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        Tarjetas
                      </button>
                      <button
                        onClick={() => setViewMode('diagram')}
                        className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm ${
                          viewMode === 'diagram'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        <Network className="w-4 h-4" />
                        Diagrama
                      </button>
                    </div>
                  </div>
                  {viewMode === 'cards' ? (
                    <TableVisualizer tables={tables} onTableClick={handleTableClick} />
                  ) : (
                    <DiagramView tables={tables} dbId={selectedDb?.id} />
                  )}
                </div>

                {queryResult && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
                    <h2 className="text-xl font-semibold text-white mb-4">Resultados</h2>
                    {queryResult.data && queryResult.data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs uppercase bg-purple-900/50 text-purple-200">
                            <tr>
                              {Object.keys(queryResult.data[0]).map((key) => (
                                <th key={key} className="px-6 py-3">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.data.map((row, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-white/10 hover:bg-white/5 text-purple-100"
                              >
                                {Object.values(row).map((value, i) => (
                                  <td key={i} className="px-6 py-4">
                                    {value !== null ? String(value) : 'NULL'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-purple-200">
                        {queryResult.message || 'Consulta ejecutada exitosamente'}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

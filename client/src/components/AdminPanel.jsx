import { useState, useEffect } from 'react'
import { Shield, Trash2, X, AlertTriangle, Server, Key, Database, Link, Copy, Check, Wifi, WifiOff, Play, Loader } from 'lucide-react'
import axios from 'axios'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLang } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="ml-2 p-1 rounded hover:bg-white/10 text-purple-300 hover:text-white transition-colors shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function CredRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
      <Icon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
      <span className="text-purple-300 text-xs w-20 shrink-0">{label}</span>
      <code className="flex-1 text-green-300 font-mono text-xs bg-black/20 px-2 py-0.5 rounded truncate">{value}</code>
      <CopyBtn text={value} />
    </div>
  )
}

function AdminPanel({ isOpen, onClose, onAuthChange }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [pgStatus, setPgStatus] = useState(null)
  const [adminSql, setAdminSql] = useState('')
  const [adminSqlResult, setAdminSqlResult] = useState(null)
  const [adminSqlLoading, setAdminSqlLoading] = useState(false)
  const [adminSqlError, setAdminSqlError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) fetchPgStatus()
  }, [isAuthenticated])

  const fetchPgStatus = async () => {
    try {
      const res = await axios.get('/api/pg/status')
      setPgStatus(res.data)
    } catch {
      setPgStatus({ configured: false })
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post('/api/admin/login', { username, password })
      if (response.data.success) {
        setIsAuthenticated(true)
        onAuthChange && onAuthChange(true)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('¿Eliminar TODAS las bases de datos SQLite? Esta acción no se puede deshacer.')) return
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post('/api/admin/delete-all', { username, password })
      setSuccess(response.data.message)
      setTimeout(() => { setSuccess(null); onClose(); window.location.reload() }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar las bases de datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminSqlExecute = async () => {
    if (!adminSql.trim()) return
    setAdminSqlLoading(true)
    setAdminSqlError(null)
    setAdminSqlResult(null)
    try {
      const res = await axios.post('/api/admin/pg/execute', { username, password, sql: adminSql })
      setAdminSqlResult(res.data)
      fetchPgStatus()
    } catch (err) {
      setAdminSqlError(err.response?.data?.error || 'Error al ejecutar SQL')
    } finally {
      setAdminSqlLoading(false)
    }
  }

  const handlePgReset = async () => {
    if (!confirm('¿Eliminar TODAS las tablas de PostgreSQL? Esta acción no se puede deshacer.')) return
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post('/api/admin/pg/reset', { username, password })
      setSuccess(response.data.message)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al resetear PostgreSQL')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setIsAuthenticated(false)
    onAuthChange && onAuthChange(false)
    setError(null)
    setSuccess(null)
    setPgStatus(null)
    setAdminSql('')
    setAdminSqlResult(null)
    setAdminSqlError(null)
    onClose()
  }

  if (!isOpen) return null

  const creds = pgStatus?.credentials

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/50 rounded-xl shadow-2xl w-full max-w-3xl relative max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Panel de administración</h2>
          </div>
          <button onClick={handleClose} className="text-purple-300 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2 text-red-200 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-sm">
              {success}
            </div>
          )}

          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto">
              <p className="text-purple-300 text-sm text-center mb-2">Ingresa tus credenciales para acceder al panel</p>
              <div>
                <label className="block text-purple-200 mb-1.5 text-sm font-semibold">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-purple-400/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-200 mb-1.5 text-sm font-semibold">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-purple-400/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Autenticando...' : 'Iniciar sesión'}
              </button>
            </form>
          ) : (
            <div className="space-y-5">

              {/* PostgreSQL status + credentials */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    Base de datos PostgreSQL de clase
                  </h3>
                  {pgStatus?.connected
                    ? <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold"><Wifi className="w-3.5 h-3.5" />Conectado</span>
                    : <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold"><WifiOff className="w-3.5 h-3.5" />{pgStatus?.configured ? 'Sin conexión' : 'No configurado'}</span>
                  }
                </div>

                {creds ? (
                  <div className="space-y-0">
                    <CredRow icon={Server} label="Host" value={creds.host} />
                    <CredRow icon={Server} label="Puerto" value={creds.port} />
                    <CredRow icon={Database} label="Base de datos" value={creds.database} />
                    <CredRow icon={Key} label="Usuario" value={creds.user} />
                    <CredRow icon={Key} label="Contraseña" value={creds.password} />
                    <div className="pt-2 mt-1">
                      <div className="flex items-start gap-2">
                        <Link className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-1" />
                        <code className="flex-1 text-green-300 font-mono text-xs bg-black/20 px-2 py-1 rounded break-all leading-relaxed">{creds.connectionString}</code>
                        <CopyBtn text={creds.connectionString} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-purple-400 text-xs">
                    {pgStatus?.configured ? pgStatus.error : 'Agrega PG_CONNECTION_URL en las variables de entorno.'}
                  </p>
                )}
              </div>

              {/* Admin SQL editor (DDL permitido) */}
              {pgStatus?.connected && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-400" />
                    Editor SQL — Admin (DDL permitido)
                  </h3>
                  <div className="rounded-lg overflow-hidden border border-slate-700 mb-2">
                    <CodeMirror
                      value={adminSql}
                      height="160px"
                      theme={oneDark}
                      extensions={[sqlLang()]}
                      onChange={(v) => setAdminSql(v)}
                      basicSetup={{ lineNumbers: true, autocompletion: true, bracketMatching: true }}
                      style={{ fontSize: '13px', fontFamily: "'Fira Code', monospace" }}
                    />
                  </div>
                  {adminSqlError && (
                    <p className="text-red-300 text-xs mb-2 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{adminSqlError}</p>
                  )}
                  {adminSqlResult && (
                    <div className="mb-2">
                      {adminSqlResult.data && adminSqlResult.data.length > 0 ? (
                        <div className="overflow-x-auto max-h-40 rounded border border-white/10">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-700 text-purple-200 sticky top-0">
                              <tr>{Object.keys(adminSqlResult.data[0]).map(k => <th key={k} className="px-3 py-1.5">{k}</th>)}</tr>
                            </thead>
                            <tbody>
                              {adminSqlResult.data.map((row, i) => (
                                <tr key={i} className="border-t border-white/5 text-purple-100">
                                  {Object.values(row).map((v, j) => <td key={j} className="px-3 py-1.5">{v !== null ? String(v) : 'NULL'}</td>)}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-green-300 text-xs bg-green-500/10 border border-green-500/30 rounded px-3 py-2">{adminSqlResult.message}</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleAdminSqlExecute}
                    disabled={adminSqlLoading || !adminSql.trim()}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-1.5 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 text-sm"
                  >
                    {adminSqlLoading ? <><Loader className="w-3.5 h-3.5 animate-spin" />Ejecutando...</> : <><Play className="w-3.5 h-3.5" />Ejecutar SQL</>}
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                  <p className="text-purple-300 text-xs font-semibold uppercase tracking-wide mb-2">SQLite (Práctica)</p>
                  <p className="text-purple-400 text-xs mb-3">Elimina todas las bases de datos creadas por los estudiantes en modo práctica.</p>
                  <button
                    onClick={handleDeleteAll}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    {loading ? 'Eliminando...' : 'Limpiar BDs SQLite'}
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                  <p className="text-purple-300 text-xs font-semibold uppercase tracking-wide mb-2">PostgreSQL (Clase)</p>
                  <p className="text-purple-400 text-xs mb-3">Elimina todas las tablas del schema público. Útil para resetear entre sesiones.</p>
                  <button
                    onClick={handlePgReset}
                    disabled={loading || !pgStatus?.connected}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    {loading ? 'Reseteando...' : 'Resetear tablas'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel

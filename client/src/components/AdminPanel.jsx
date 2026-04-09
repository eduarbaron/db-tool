import { useState } from 'react'
import { Shield, Trash2, X, AlertTriangle } from 'lucide-react'
import axios from 'axios'

function AdminPanel({ isOpen, onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/admin/login', { username, password })
      if (response.data.success) {
        setIsAuthenticated(true)
        setSuccess('Autenticación exitosa')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar TODAS las bases de datos? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/admin/delete-all', { username, password })
      setSuccess(response.data.message)
      setTimeout(() => {
        setSuccess(null)
        onClose()
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar las bases de datos')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setIsAuthenticated(false)
    setError(null)
    setSuccess(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/50 rounded-lg shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-purple-300 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Panel de administración</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2 text-red-200 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-sm">
            {success}
          </div>
        )}

        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-purple-200 mb-2 text-sm font-semibold">
                Usuario
              </label>
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
              <label className="block text-purple-200 mb-2 text-sm font-semibold">
                Contraseña
              </label>
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
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold mb-1">Advertencia</p>
                  <p>Esta acción eliminará todas las bases de datos creadas por todos los usuarios. Esta operación no se puede deshacer.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDeleteAll}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {loading ? 'Eliminando...' : 'Eliminar todas las bases de datos'}
            </button>

            <button
              onClick={handleClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel

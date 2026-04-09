import { useState } from 'react'
import { Plus, Trash2, Key, AlertCircle } from 'lucide-react'

function DDLBuilder({ onGenerateSQL }) {
  const [tableName, setTableName] = useState('')
  const [columns, setColumns] = useState([
    { name: '', type: 'TEXT', primaryKey: false, notNull: false, unique: false }
  ])

  const dataTypes = ['TEXT', 'INTEGER', 'REAL', 'BLOB', 'NUMERIC']

  const addColumn = () => {
    setColumns([...columns, { name: '', type: 'TEXT', primaryKey: false, notNull: false, unique: false }])
  }

  const removeColumn = (index) => {
    if (columns.length > 1) {
      setColumns(columns.filter((_, i) => i !== index))
    }
  }

  const updateColumn = (index, field, value) => {
    const newColumns = [...columns]
    newColumns[index][field] = value
    
    if (field === 'primaryKey' && value) {
      newColumns.forEach((col, i) => {
        if (i !== index) col.primaryKey = false
      })
    }
    
    setColumns(newColumns)
  }

  const generateSQL = () => {
    if (!tableName.trim()) {
      alert('Por favor ingresa un nombre para la tabla')
      return
    }

    const validColumns = columns.filter(col => col.name.trim())
    if (validColumns.length === 0) {
      alert('Por favor agrega al menos una columna')
      return
    }

    const columnDefinitions = validColumns.map(col => {
      let def = `${col.name} ${col.type}`
      if (col.primaryKey) def += ' PRIMARY KEY'
      if (col.notNull && !col.primaryKey) def += ' NOT NULL'
      if (col.unique && !col.primaryKey) def += ' UNIQUE'
      return def
    })

    const sql = `CREATE TABLE ${tableName} (\n  ${columnDefinitions.join(',\n  ')}\n);`
    onGenerateSQL(sql)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-purple-200 mb-2 font-semibold">
          Nombre de la tabla
        </label>
        <input
          type="text"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          placeholder="ej: estudiantes"
          className="w-full px-4 py-2 bg-slate-900/50 border border-purple-400/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-purple-200 font-semibold">Columnas</label>
          <button
            onClick={addColumn}
            className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        <div className="space-y-3">
          {columns.map((column, index) => (
            <div key={index} className="bg-slate-900/50 border border-purple-400/20 rounded-lg p-3">
              <div className="grid grid-cols-12 gap-2 mb-2">
                <input
                  type="text"
                  value={column.name}
                  onChange={(e) => updateColumn(index, 'name', e.target.value)}
                  placeholder="nombre_columna"
                  className="col-span-5 px-3 py-2 bg-slate-800/50 border border-purple-400/30 rounded text-white text-sm placeholder-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                
                <select
                  value={column.type}
                  onChange={(e) => updateColumn(index, 'type', e.target.value)}
                  className="col-span-4 px-3 py-2 bg-slate-800/50 border border-purple-400/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {dataTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <div className="col-span-2 flex items-center justify-center">
                  <button
                    onClick={() => updateColumn(index, 'primaryKey', !column.primaryKey)}
                    className={`p-2 rounded transition-colors ${
                      column.primaryKey
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400'
                        : 'bg-slate-800/50 text-purple-300 border border-purple-400/30 hover:bg-slate-700/50'
                    }`}
                    title="Primary Key"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => removeColumn(index)}
                  disabled={columns.length === 1}
                  className="col-span-1 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3 text-sm">
                <label className="flex items-center gap-1 text-purple-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={column.notNull}
                    onChange={(e) => updateColumn(index, 'notNull', e.target.checked)}
                    disabled={column.primaryKey}
                    className="rounded"
                  />
                  NOT NULL
                </label>
                <label className="flex items-center gap-1 text-purple-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={column.unique}
                    onChange={(e) => updateColumn(index, 'unique', e.target.checked)}
                    disabled={column.primaryKey}
                    className="rounded"
                  />
                  UNIQUE
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={generateSQL}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        Generar sentencia CREATE TABLE
      </button>

      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 flex gap-2">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200">
          <p className="font-semibold mb-1">Ayuda:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Primary Key: Identifica únicamente cada fila</li>
            <li>Not Null: El campo no puede estar vacío</li>
            <li>Unique: No puede haber valores duplicados</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DDLBuilder

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'

function DMLBuilder({ tables, onGenerateSQL }) {
  const [operation, setOperation] = useState('INSERT')
  const [selectedTable, setSelectedTable] = useState('')
  const [tableSchema, setTableSchema] = useState([])
  const [formData, setFormData] = useState({})
  const [whereConditions, setWhereConditions] = useState([{ column: '', operator: '=', value: '' }])
  const [selectedColumns, setSelectedColumns] = useState([])

  useEffect(() => {
    if (selectedTable && tables.length > 0) {
      const table = tables.find(t => t.name === selectedTable)
      if (table && table.schema) {
        setTableSchema(table.schema)
        const initialData = {}
        table.schema.forEach(col => {
          initialData[col.name] = ''
        })
        setFormData(initialData)
        setSelectedColumns(table.schema.map(col => col.name))
      }
    }
  }, [selectedTable, tables])

  const generateInsertSQL = () => {
    if (!selectedTable) return

    const values = tableSchema
      .map(col => {
        const value = formData[col.name]
        if (value === '') return 'NULL'
        if (col.type === 'TEXT') return `'${value}'`
        return value
      })
      .join(', ')

    const columns = tableSchema.map(col => col.name).join(', ')
    return `INSERT INTO ${selectedTable} (${columns}) VALUES (${values});`
  }

  const generateSelectSQL = () => {
    if (!selectedTable) return

    const cols = selectedColumns.length > 0 ? selectedColumns.join(', ') : '*'
    let sql = `SELECT ${cols} FROM ${selectedTable}`

    const validConditions = whereConditions.filter(c => c.column && c.value)
    if (validConditions.length > 0) {
      const conditions = validConditions.map(c => {
        const value = tableSchema.find(col => col.name === c.column)?.type === 'TEXT'
          ? `'${c.value}'`
          : c.value
        return `${c.column} ${c.operator} ${value}`
      }).join(' AND ')
      sql += ` WHERE ${conditions}`
    }

    return sql + ';'
  }

  const generateUpdateSQL = () => {
    if (!selectedTable) return

    const sets = tableSchema
      .filter(col => formData[col.name] !== '')
      .map(col => {
        const value = col.type === 'TEXT' ? `'${formData[col.name]}'` : formData[col.name]
        return `${col.name} = ${value}`
      })
      .join(', ')

    if (!sets) return 'UPDATE ' + selectedTable + ' SET ... WHERE ...;'

    let sql = `UPDATE ${selectedTable} SET ${sets}`

    const validConditions = whereConditions.filter(c => c.column && c.value)
    if (validConditions.length > 0) {
      const conditions = validConditions.map(c => {
        const value = tableSchema.find(col => col.name === c.column)?.type === 'TEXT'
          ? `'${c.value}'`
          : c.value
        return `${c.column} ${c.operator} ${value}`
      }).join(' AND ')
      sql += ` WHERE ${conditions}`
    }

    return sql + ';'
  }

  const generateDeleteSQL = () => {
    if (!selectedTable) return

    let sql = `DELETE FROM ${selectedTable}`

    const validConditions = whereConditions.filter(c => c.column && c.value)
    if (validConditions.length > 0) {
      const conditions = validConditions.map(c => {
        const value = tableSchema.find(col => col.name === c.column)?.type === 'TEXT'
          ? `'${c.value}'`
          : c.value
        return `${c.column} ${c.operator} ${value}`
      }).join(' AND ')
      sql += ` WHERE ${conditions}`
    }

    return sql + ';'
  }

  const handleGenerate = () => {
    let sql = ''
    switch (operation) {
      case 'INSERT':
        sql = generateInsertSQL()
        break
      case 'SELECT':
        sql = generateSelectSQL()
        break
      case 'UPDATE':
        sql = generateUpdateSQL()
        break
      case 'DELETE':
        sql = generateDeleteSQL()
        break
    }
    if (sql) onGenerateSQL(sql)
  }

  const addCondition = () => {
    setWhereConditions([...whereConditions, { column: '', operator: '=', value: '' }])
  }

  const updateCondition = (index, field, value) => {
    const newConditions = [...whereConditions]
    newConditions[index][field] = value
    setWhereConditions(newConditions)
  }

  const removeCondition = (index) => {
    if (whereConditions.length > 1) {
      setWhereConditions(whereConditions.filter((_, i) => i !== index))
    }
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-8 text-purple-200">
        <p>Primero crea una tabla para poder insertar datos</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {['INSERT', 'SELECT', 'UPDATE', 'DELETE'].map(op => (
          <button
            key={op}
            onClick={() => setOperation(op)}
            className={`py-2 px-4 rounded-lg font-semibold transition-all ${
              operation === op
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-purple-200 hover:bg-white/10'
            }`}
          >
            {op === 'INSERT' && <Plus className="w-4 h-4 inline mr-1" />}
            {op === 'SELECT' && <Search className="w-4 h-4 inline mr-1" />}
            {op === 'UPDATE' && <Edit className="w-4 h-4 inline mr-1" />}
            {op === 'DELETE' && <Trash2 className="w-4 h-4 inline mr-1" />}
            {op}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-purple-200 mb-2 font-semibold">Tabla</label>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900/50 border border-purple-400/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Selecciona una tabla</option>
          {tables.map(table => (
            <option key={table.name} value={table.name}>{table.name}</option>
          ))}
        </select>
      </div>

      {selectedTable && (
        <>
          {operation === 'SELECT' && (
            <div>
              <label className="block text-purple-200 mb-2 font-semibold">Columnas a mostrar</label>
              <div className="space-y-2">
                {tableSchema.map(col => (
                  <label key={col.name} className="flex items-center gap-2 text-purple-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColumns([...selectedColumns, col.name])
                        } else {
                          setSelectedColumns(selectedColumns.filter(c => c !== col.name))
                        }
                      }}
                      className="rounded"
                    />
                    {col.name} ({col.type})
                  </label>
                ))}
              </div>
            </div>
          )}

          {(operation === 'INSERT' || operation === 'UPDATE') && (
            <div>
              <label className="block text-purple-200 mb-2 font-semibold">
                {operation === 'INSERT' ? 'Valores a insertar' : 'Valores a actualizar'}
              </label>
              <div className="space-y-2">
                {tableSchema.map(col => (
                  <div key={col.name}>
                    <label className="block text-sm text-purple-200 mb-1">
                      {col.name} ({col.type})
                      {col.pk === 1 && <span className="text-yellow-400 ml-1">🔑</span>}
                      {col.notnull === 1 && <span className="text-red-300 ml-1">*</span>}
                    </label>
                    <input
                      type={col.type === 'INTEGER' || col.type === 'REAL' ? 'number' : 'text'}
                      value={formData[col.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [col.name]: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-purple-400/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder={col.type === 'INTEGER' || col.type === 'REAL' ? '0' : 'texto'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(operation === 'SELECT' || operation === 'UPDATE' || operation === 'DELETE') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-purple-200 font-semibold">Condiciones WHERE (opcional)</label>
                <button
                  onClick={addCondition}
                  className="text-sm px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded"
                >
                  + Condición
                </button>
              </div>
              <div className="space-y-2">
                {whereConditions.map((condition, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <select
                      value={condition.column}
                      onChange={(e) => updateCondition(index, 'column', e.target.value)}
                      className="col-span-4 px-2 py-2 bg-slate-900/50 border border-purple-400/30 rounded text-white text-sm"
                    >
                      <option value="">Columna</option>
                      {tableSchema.map(col => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                      ))}
                    </select>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      className="col-span-2 px-2 py-2 bg-slate-900/50 border border-purple-400/30 rounded text-white text-sm"
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">{'>'}</option>
                      <option value="<">{'<'}</option>
                      <option value=">=">{'>='}</option>
                      <option value="<=">{'<='}</option>
                    </select>
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="valor"
                      className="col-span-5 px-2 py-2 bg-slate-900/50 border border-purple-400/30 rounded text-white text-sm"
                    />
                    <button
                      onClick={() => removeCondition(index)}
                      disabled={whereConditions.length === 1}
                      className="col-span-1 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Generar {operation}
          </button>
        </>
      )}
    </div>
  )
}

export default DMLBuilder

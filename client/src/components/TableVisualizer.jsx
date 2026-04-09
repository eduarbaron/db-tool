import { Table2, Key, Type } from 'lucide-react'

function TableVisualizer({ tables, onTableClick }) {
  if (!tables || tables.length === 0) {
    return (
      <div className="text-center py-12 text-purple-200">
        <Table2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>No hay tablas creadas aún</p>
        <p className="text-sm mt-2">Crea tu primera tabla con CREATE TABLE</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tables.map((table) => (
        <div
          key={table.name}
          onClick={() => onTableClick(table)}
          className="bg-white/5 border border-purple-400/30 rounded-lg p-4 hover:bg-white/10 hover:border-purple-400/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-3">
            <Table2 className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-lg">{table.name}</h3>
          </div>
          
          {table.schema && table.schema.length > 0 && (
            <div className="space-y-2">
              {table.schema.map((column, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm bg-slate-900/50 rounded px-2 py-1"
                >
                  {column.pk === 1 && (
                    <Key className="w-3 h-3 text-yellow-400" />
                  )}
                  <Type className="w-3 h-3 text-blue-400" />
                  <span className="text-purple-100 font-mono">
                    {column.name}
                  </span>
                  <span className="text-purple-300 text-xs">
                    {column.type}
                  </span>
                  {column.notnull === 1 && (
                    <span className="text-red-300 text-xs">NOT NULL</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default TableVisualizer

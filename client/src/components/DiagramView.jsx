import { useEffect, useRef, useState } from 'react'
import { Key, Type, Link2, Move } from 'lucide-react'
import axios from 'axios'

function DiagramView({ tables, dbId }) {
  const containerRef = useRef(null)
  const [tablePositions, setTablePositions] = useState({})
  const [relationships, setRelationships] = useState([])
  const [dragging, setDragging] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [labelPositions, setLabelPositions] = useState({}) // stores t value (0-1) along the curve

  useEffect(() => {
    if (dbId) {
      fetchRelationships()
    }
  }, [dbId, tables])

  useEffect(() => {
    if (tables && tables.length > 0) {
      // Check if we have new tables that aren't positioned yet
      const currentTableNames = Object.keys(tablePositions)
      const newTableNames = tables.map(t => t.name)
      const hasNewTables = newTableNames.some(name => !currentTableNames.includes(name))
      
      if (currentTableNames.length === 0 || hasNewTables) {
        initializeTablePositions()
      }
    }
  }, [tables])

  const fetchRelationships = async () => {
    try {
      const response = await axios.get(`/api/databases/${dbId}/relationships`)
      setRelationships(response.data)
    } catch (err) {
      console.error('Error fetching relationships:', err)
    }
  }

  const initializeTablePositions = () => {
    const positions = {}
    const cols = Math.ceil(Math.sqrt(tables.length))
    const spacing = 280
    
    tables.forEach((table, idx) => {
      const row = Math.floor(idx / cols)
      const col = idx % cols
      
      positions[table.name] = {
        x: col * spacing + 100,
        y: row * spacing + 80,
        width: 240,
        height: 120
      }
    })
    
    setTablePositions(positions)
  }

  const handleMouseDown = (e, tableName) => {
    if (e.target.closest('.no-drag')) return
    
    const pos = tablePositions[tableName]
    const containerRect = containerRef.current.getBoundingClientRect()
    
    setDragging({ type: 'table', key: tableName })
    setDragOffset({
      x: e.clientX - containerRect.left - pos.x,
      y: e.clientY - containerRect.top - pos.y
    })
    e.preventDefault()
  }

  useEffect(() => {
    if (dragging) {
      const handleMouseMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left - dragOffset.x
        const y = e.clientY - rect.top - dragOffset.y
        
        if (dragging.type === 'table') {
          setTablePositions(prev => ({
            ...prev,
            [dragging.key]: {
              ...prev[dragging.key],
              x: Math.max(0, x),
              y: Math.max(0, y)
            }
          }))
        } else if (dragging.type === 'label') {
          // Find closest point on the bezier curve
          const { fromX, fromY, toX, toY, controlX1, controlY1, controlX2, controlY2 } = dragging.lineParams
          
          // Find parameter t (0 to 1) that gives closest point on curve to mouse
          let closestT = 0.5
          let minDist = Infinity
          
          // Sample the curve to find closest point
          for (let t = 0; t <= 1; t += 0.01) {
            const curveX = Math.pow(1-t, 3) * fromX + 
                          3 * Math.pow(1-t, 2) * t * controlX1 + 
                          3 * (1-t) * Math.pow(t, 2) * controlX2 + 
                          Math.pow(t, 3) * toX
            const curveY = Math.pow(1-t, 3) * fromY + 
                          3 * Math.pow(1-t, 2) * t * controlY1 + 
                          3 * (1-t) * Math.pow(t, 2) * controlY2 + 
                          Math.pow(t, 3) * toY
            
            const dist = Math.sqrt(Math.pow(x - curveX, 2) + Math.pow(y - curveY, 2))
            if (dist < minDist) {
              minDist = dist
              closestT = t
            }
          }
          
          setLabelPositions(prev => ({
            ...prev,
            [dragging.key]: closestT
          }))
        }
      }
      
      const handleMouseUp = () => {
        setDragging(null)
      }
      
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, dragOffset])

  const handleLabelMouseDown = (e, relKey, lineParams) => {
    e.stopPropagation()
    
    setDragging({ 
      type: 'label', 
      key: relKey,
      lineParams: lineParams // store curve parameters for constraint
    })
  }

  const drawRelationshipLine = (rel) => {
    const from = tablePositions[rel.fromTable]
    const to = tablePositions[rel.toTable]
    
    if (!from || !to) return null

    // Simple center-to-center connection
    const fromX = from.x + 120  // Center of 240px wide table
    const fromY = from.y + 60   // Center of 120px height table
    const toX = to.x + 120      // Center of 240px wide table
    const toY = to.y + 60       // Center of 120px height table

    // Control points for curved line
    const controlX1 = fromX + (toX - fromX) * 0.3
    const controlY1 = fromY
    const controlX2 = fromX + (toX - fromX) * 0.7
    const controlY2 = toY
    
    const relKey = `${rel.fromTable}-${rel.toTable}-${rel.fromColumn}`
    
    return (
      <path
        key={relKey}
        d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`}
        stroke="#a78bfa"
        strokeWidth="3"
        fill="none"
        strokeDasharray="8,5"
        opacity="0.8"
      />
    )
  }

  const renderLabel = (rel) => {
    const from = tablePositions[rel.fromTable]
    const to = tablePositions[rel.toTable]
    
    if (!from || !to) return null

    const fromX = from.x + 120
    const fromY = from.y + 60
    const toX = to.x + 120
    const toY = to.y + 60

    const controlX1 = fromX + (toX - fromX) * 0.3
    const controlY1 = fromY
    const controlX2 = fromX + (toX - fromX) * 0.7
    const controlY2 = toY
    
    const relKey = `${rel.fromTable}-${rel.toTable}-${rel.fromColumn}`
    const t = labelPositions[relKey] !== undefined ? labelPositions[relKey] : 0.5
    
    // Calculate position on bezier curve at parameter t
    const labelX = Math.pow(1-t, 3) * fromX + 
                   3 * Math.pow(1-t, 2) * t * controlX1 + 
                   3 * (1-t) * Math.pow(t, 2) * controlX2 + 
                   Math.pow(t, 3) * toX
    const labelY = Math.pow(1-t, 3) * fromY + 
                   3 * Math.pow(1-t, 2) * t * controlY1 + 
                   3 * (1-t) * Math.pow(t, 2) * controlY2 + 
                   Math.pow(t, 3) * toY
    
    const lineParams = { fromX, fromY, toX, toY, controlX1, controlY1, controlX2, controlY2 }
    
    return (
      <div
        key={relKey}
        className="absolute bg-[#1e1b4b] border-2 border-purple-400 rounded-md px-3 py-1 cursor-move select-none"
        style={{
          left: `${labelX - 70}px`,
          top: `${labelY - 13}px`,
          zIndex: 10,
          opacity: 0.95
        }}
        onMouseDown={(e) => handleLabelMouseDown(e, relKey, lineParams)}
      >
        <span className="text-purple-200 font-mono font-bold text-xs whitespace-nowrap">
          {rel.fromColumn} → {rel.toColumn}
        </span>
      </div>
    )
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="text-center py-12 text-purple-200">
        <p>No hay tablas para visualizar</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className="relative p-8 bg-slate-900/30 rounded-lg overflow-auto"
      style={{ minHeight: '700px', minWidth: '100%', cursor: dragging ? 'grabbing' : 'default' }}
    >
      {/* SVG for relationship lines */}
      {Object.keys(tablePositions).length > 0 && relationships.length > 0 && (
        <svg
          className="absolute top-0 left-0"
          style={{ 
            zIndex: 1,
            width: '100%',
            height: '100%',
            minWidth: '2000px',
            minHeight: '1200px',
            pointerEvents: 'none'
          }}
        >
          {relationships.map(rel => drawRelationshipLine(rel))}
        </svg>
      )}

      {/* Relationship Labels */}
      {Object.keys(tablePositions).length > 0 && relationships.length > 0 && (
        relationships.map(rel => renderLabel(rel))
      )}

      {/* Tables */}
      <div className="relative" style={{ zIndex: 2, minWidth: '2000px', minHeight: '1200px' }}>
        {tables.map((table, idx) => {
          const hasForeignKeys = relationships.some(r => r.fromTable === table.name)
          const isReferenced = relationships.some(r => r.toTable === table.name)
          const pos = tablePositions[table.name]
          
          if (!pos) return null
          
          return (
            <div
              key={table.name}
              data-table-name={table.name}
              onMouseDown={(e) => handleMouseDown(e, table.name)}
              className={`absolute bg-gradient-to-br from-slate-800 to-slate-900 border-2 rounded-lg shadow-xl w-[240px] ${
                dragging === table.name 
                  ? 'border-purple-400 shadow-2xl cursor-grabbing scale-105' 
                  : 'border-purple-500/50 cursor-grab hover:border-purple-400/70'
              }`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                animation: `fadeIn 0.3s ease-in ${idx * 0.1}s both`,
                transition: dragging === table.name ? 'none' : 'transform 0.2s, border-color 0.2s',
                userSelect: 'none'
              }}
            >
              {/* Table Header */}
              <div className={`px-4 py-3 rounded-t-lg ${
                hasForeignKeys && isReferenced ? 'bg-gradient-to-r from-purple-600 to-blue-600' :
                hasForeignKeys ? 'bg-blue-600' :
                isReferenced ? 'bg-purple-600' :
                'bg-purple-600'
              }`}>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Move className="w-4 h-4 text-purple-200 opacity-60" title="Arrastra para mover" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  {table.name}
                  {(hasForeignKeys || isReferenced) && (
                    <Link2 className="w-4 h-4 ml-auto" title="Tiene relaciones" />
                  )}
                </h3>
              </div>

              {/* Table Columns */}
              <div className="p-4">
                {table.schema && table.schema.length > 0 ? (
                  <div className="space-y-2">
                    {table.schema.map((column, colIdx) => {
                      const isForeignKey = relationships.some(
                        r => r.fromTable === table.name && r.fromColumn === column.name
                      )
                      const isReferencedColumn = relationships.some(
                        r => r.toTable === table.name && r.toColumn === column.name
                      )
                      
                      return (
                        <div
                          key={colIdx}
                          className={`flex items-center gap-2 p-2 rounded transition-all ${
                            column.pk === 1
                              ? 'bg-yellow-500/20 border border-yellow-500/50'
                              : isForeignKey
                              ? 'bg-blue-500/20 border border-blue-500/50'
                              : 'bg-slate-700/50 hover:bg-slate-700'
                          }`}
                        >
                          {/* Primary Key Icon */}
                          {column.pk === 1 && (
                            <Key className="w-4 h-4 text-yellow-400 flex-shrink-0" title="Primary Key" />
                          )}
                          
                          {/* Foreign Key Icon */}
                          {isForeignKey && (
                            <Link2 className="w-4 h-4 text-blue-400 flex-shrink-0" title="Foreign Key" />
                          )}
                          
                          {/* Type Icon */}
                          <Type className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          
                          {/* Column Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-white font-semibold truncate">
                                {column.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-blue-300">{column.type}</span>
                              {column.notnull === 1 && (
                                <span className="text-red-300 font-semibold">NOT NULL</span>
                              )}
                              {isForeignKey && (
                                <span className="text-blue-300 font-semibold">FK</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-purple-300 text-sm">Sin columnas</p>
                )}
              </div>

              {/* Table Footer - Stats */}
              <div className="bg-slate-800/50 px-4 py-2 rounded-b-lg border-t border-purple-500/30">
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <span>{table.schema?.length || 0} columnas</span>
                  <div className="flex items-center gap-2">
                    {table.schema?.some(col => col.pk === 1) && (
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-yellow-400" />
                        PK
                      </span>
                    )}
                    {hasForeignKeys && (
                      <span className="flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-blue-400" />
                        FK
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm relative" style={{ zIndex: 2 }}>
        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded">
          <Move className="w-4 h-4 text-purple-400" />
          <span className="text-purple-200">Arrastra para mover</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded">
          <Key className="w-4 h-4 text-yellow-400" />
          <span className="text-purple-200">Clave primaria</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded">
          <Link2 className="w-4 h-4 text-blue-400" />
          <span className="text-purple-200">Clave foránea</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded">
          <div className="w-8 h-0.5 bg-purple-400" style={{ borderTop: '2px dashed' }}></div>
          <span className="text-purple-200">Relación</span>
        </div>
      </div>

      {relationships.length > 0 && (
        <div className="mt-4 text-center text-sm text-purple-300 relative" style={{ zIndex: 2 }}>
          {relationships.length} relación{relationships.length !== 1 ? 'es' : ''} detectada{relationships.length !== 1 ? 's' : ''}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default DiagramView

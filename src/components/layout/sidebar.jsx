import React from 'react'
import { Nav } from 'react-bootstrap'

function Sidebar({ activeMenu, setActiveMenu }) {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'bi-speedometer2' },
    { id: 'emploi', label: 'Emploi du temps', icon: 'bi-calendar-week' },
    { id: 'filieres', label: 'Filières', icon: 'bi-diagram-3' },
    { id: 'modules', label: 'Modules', icon: 'bi-book' },
    { id: 'formateurs', label: 'Formateurs', icon: 'bi-people' },
    { id: 'groupes', label: 'Groupes', icon: 'bi-people-fill' },
    { id: 'salles', label: 'Salles', icon: 'bi-door-open' },
    { id: 'import', label: 'Import Excel', icon: 'bi-file-excel' },
  ]

  return (
    <div className="sidebar" style={{ width: '280px', position: 'fixed', height: '100vh', left: 0, top: 0 }}>
      <div className="p-4">
        <div className="text-center mb-4">
          <div className="bg-white bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
            <i className="bi bi-calendar-check" style={{ fontSize: '32px', color: '#667eea' }}></i>
          </div>
          <h5 className="text-white mb-1">OFPPT Gestion</h5>
          <p className="text-white-50 small">Emplois du temps</p>
        </div>
        
        <Nav className="flex-column">
          {menuItems.map(item => (
            <Nav.Link 
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`d-flex align-items-center gap-3 ${activeMenu === item.id ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <i className={`${item.icon} fs-5`}></i>
              <span>{item.label}</span>
            </Nav.Link>
          ))}
        </Nav>
      </div>
    </div>
  )
}

export default Sidebar
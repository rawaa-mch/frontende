import React from 'react'

function Header() {
  return (
    <div className="header-gradient py-3 px-4 d-flex justify-content-between align-items-center">
      <div>
        <h4 className="mb-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <i className="bi bi-calendar3 me-2"></i>{' '}
          Gestion des Emplois du Temps
        </h4>
        <p className="text-muted small mb-0">OFPPT - Direction de la Formation Professionnelle</p>
      </div>
      
      <div className="d-flex align-items-center gap-3">
        <div className="position-relative">
          <i className="bi bi-bell fs-5 text-secondary"></i>
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
            {3}
          </span>
        </div>
        
        <div className="dropdown">
          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} data-bs-toggle="dropdown">
            <div className="bg-gradient rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-person-fill text-white"></i>
            </div>
            <div>
              <span className="fw-semibold">Administrateur</span>
              <i className="bi bi-chevron-down ms-2 small"></i>
            </div>
          </div>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><button className="dropdown-item" onClick={() => {}}><i className="bi bi-person me-2"></i>Mon profil</button></li>
            <li><button className="dropdown-item" onClick={() => {}}><i className="bi bi-gear me-2"></i>Paramètres</button></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item text-danger" onClick={() => {}}><i className="bi bi-box-arrow-right me-2"></i>Déconnexion</button></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Header
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from 'react-bootstrap';
import api from '../api/axios';

const HomeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

function Header() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({ 
    name: '', 
    email: '', 
    password: ''
  });
  const [currentUser, setCurrentUser] = useState({ name: 'Administrateur', email: '', is_admin: false });
  const [, setModalMode] = useState('edit');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({ contact_info: '' });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      setUserData({ 
        name: user.name, 
        email: user.email, 
        password: ''
      });
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      console.error("Erreur settings header", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (err) { console.error(err); }
  };

  const openModal = (mode) => {
    setModalMode(mode);
    setMessage('');
    setError('');
    if (mode === 'edit') {
      setActiveTab('profile');
      setUserData({ 
        name: currentUser.name, 
        email: currentUser.email, 
        password: ''
      });
    } else {
      setActiveTab('add');
      setUserData({ name: '', email: '', password: '' });
    }
    if (currentUser.is_admin) loadUsers();
  };

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setMessage(''); setError('');
    try {
      const response = await api.put('/user/profile', userData);
      if (response.data.success) {
        setMessage(response.data.message);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setCurrentUser(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  const handleAdd = async () => {
    setMessage(''); setError('');
    if (!userData.password) {
      setError("Le mot de passe est obligatoire.");
      return;
    }
    try {
      const response = await api.post('/user/register', { ...userData, is_admin: true });
      if (response.data.success) {
        setMessage(response.data.message);
        setUserData({ name: '', email: '', password: '' });
        loadUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!globalThis.confirm("Supprimer cet utilisateur ?")) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data.success) {
        loadUsers();
        setMessage(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  return (
    <>
      <div className="header-custom no-print d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: 'var(--ofppt-blue)' }}>
              {settings.site_title || 'Gestion des Emplois du Temps'}
            </h4>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="dropdown">
            <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} data-bs-toggle="dropdown" role="button" tabIndex={0}>
              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border shadow-sm" style={{ width: '40px', height: '40px' }}>
                <span className="text-primary fw-bold">{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}</span>
              </div>
              <div className="d-none d-md-block text-start">
                <span className="fw-semibold d-block" style={{ fontSize: '14px', lineHeight: '1.2' }}>{currentUser.name || 'Administrateur'}</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>{currentUser.is_admin ? 'Directeur / Admin' : 'Formateur'}</span>
              </div>
            </div>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" role="menu">
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => navigate('/profil')} role="menuitem">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Gérer le profil
                </button>
              </li>
              {currentUser.is_admin && (
                <li>
                  <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => navigate('/parametres')} role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Paramètres
                  </button>
                </li>
              )}
              <li><hr className="dropdown-divider opacity-50" /></li>
              <li>
                <button className="dropdown-item text-danger py-2 d-flex align-items-center gap-2" onClick={handleLogout} role="menuitem">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Déconnexion
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="modal fade" id="profileModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header border-0 pb-0">
              <ul className="nav nav-tabs border-0 w-100" role="tablist">
                <li className="nav-item" role="none">
                  <button className={`nav-link border-0 fw-bold px-4 py-3 ${activeTab === 'profile' ? 'active text-primary border-bottom border-primary' : 'text-muted'}`} onClick={() => setActiveTab('profile')} role="tab" aria-selected={activeTab === 'profile'}>
                    Mon Profil
                  </button>
                </li>
                {currentUser.is_admin && (
                  <li className="nav-item" role="none">
                    <button className={`nav-link border-0 fw-bold px-4 py-3 ${activeTab === 'users' ? 'active text-primary border-bottom border-primary' : 'text-muted'}`} onClick={() => setActiveTab('users')} role="tab" aria-selected={activeTab === 'users'}>
                      Gestion des Utilisateurs
                    </button>
                  </li>
                )}
              </ul>
              <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body p-4">
              {message && <div className="alert alert-success border-0 shadow-sm mb-4">{message}</div>}
              {error && <div className="alert alert-danger border-0 shadow-sm mb-4">{error}</div>}

              {activeTab === 'profile' && (
                <div className="row g-4">
                  <div className="col-md-12">
                    <h6 className="fw-bold mb-3">Informations Personnelles</h6>
                    <div className="mb-3">
                      <label htmlFor="modal-name" className="form-label small fw-bold text-muted">Nom complet</label>
                      <input id="modal-name" type="text" className="form-control bg-light border-0" name="name" value={userData.name} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="modal-email" className="form-label small fw-bold text-muted">Email</label>
                      <input id="modal-email" type="email" className="form-control bg-light border-0" name="email" value={userData.email} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="modal-password" className="form-label small fw-bold text-muted">Mot de passe</label>
                      <input id="modal-password" type="password" className="form-control bg-light border-0" name="password" value={userData.password} onChange={handleChange} placeholder="Laisser vide pour ne pas changer" />
                    </div>
                  </div>
                  <div className="col-12 text-end mt-4">
                    <button type="button" className="btn btn-primary px-5" onClick={handleUpdate}>Enregistrer mon profil</button>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">Utilisateurs enregistrés</h6>
                    <button className="btn btn-sm btn-primary" onClick={() => { setActiveTab('add'); setUserData({ name: '', email: '', password: '', is_admin: true }); }}>+ Ajouter</button>
                  </div>
                  <div className="table-responsive" style={{ maxHeight: '300px' }}>
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr style={{ fontSize: '12px' }}>
                          <th>Nom</th>
                          <th>Email</th>
                          <th>Rôle</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id}>
                            <td className="fw-bold">{u.name}</td>
                            <td className="small">{u.email}</td>
                            <td><Badge bg={u.is_admin ? "primary" : "secondary"}>{u.is_admin ? "Admin" : "User"}</Badge></td>
                            <td className="text-end">
                              <button className="btn btn-sm text-danger" onClick={() => handleDeleteUser(u.id)} disabled={u.id === currentUser.id}>Supprimer</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'add' && (
                <div className="row justify-content-center">
                  <div className="col-md-8">
                    <h6 className="fw-bold mb-4">Créer un nouvel utilisateur</h6>
                    <div className="mb-3">
                      <label htmlFor="add-name" className="form-label small fw-bold text-muted">Nom complet</label>
                      <input id="add-name" type="text" className="form-control bg-light border-0" name="name" value={userData.name} onChange={handleChange} placeholder="Ex: Jean Dupont" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="add-email" className="form-label small fw-bold text-muted">Email</label>
                      <input id="add-email" type="email" className="form-control bg-light border-0" name="email" value={userData.email} onChange={handleChange} placeholder="jean@ofppt.com" />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="add-password" className="form-label small fw-bold text-muted">Mot de passe</label>
                      <input id="add-password" type="password" className="form-control bg-light border-0" name="password" value={userData.password} onChange={handleChange} placeholder="••••••••" />
                    </div>
                    <div className="mt-4 d-flex gap-2">
                      <button className="btn btn-light" onClick={() => setActiveTab('users')}>Annuler</button>
                      <button className="btn btn-primary px-5" onClick={handleAdd}>Créer l'utilisateur</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .nav-tabs .nav-link.active { border-bottom: 3px solid #0055A2 !important; color: #0055A2 !important; }
      `}</style>
    </>
  );
}

export default Header;
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    User, Search, Edit2, Trash2, RefreshCw, CheckCircle
} from 'lucide-react';

const ProfilePage = () => {
    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        is_admin: false,
        phone: ''
    });


    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Erreur users", err);
        } finally {
            setLoading(false);
        }
    };

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        const array = new Uint32Array(10);
        crypto.getRandomValues(array);
        let password = "";
        for (let i = 0; i < 10; i++) {
            password += charset[array[i] % charset.length];
        }
        setFormData({ ...formData, password });
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditMode(true);
            setSelectedUserId(user.id);
            setFormData({
                name: user.name,
                email: user.email,
                password: user.clear_password || '',
                is_admin: !!user.is_admin,
                phone: user.phone || ''
            });
        } else {
            setEditMode(false);
            setSelectedUserId(null);
            setFormData({ name: '', email: '', password: '', is_admin: false, phone: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (editMode) {
                const res = await api.put(`/users/${selectedUserId}`, formData);
                setUsers(users.map(u => u.id === selectedUserId ? res.data.user : u));
                
                // Si l'utilisateur modifié est l'utilisateur actuel, on met à jour le localStorage
                if (selectedUserId === currentUser.id) {
                    const updatedUser = res.data.user;
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setCurrentUser(updatedUser);
                }
                
                setMessage({ type: 'success', text: 'Utilisateur mis à jour avec succès !' });
            } else {
                const res = await api.post('/users', formData);
                setUsers([...users, res.data.user]);
                setMessage({ type: 'success', text: `Utilisateur créé ! Mot de passe : ${res.data.auto_password}` });
            }
            setShowModal(false);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Une erreur est survenue.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!globalThis.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
        
        setActionLoading(true);
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
            setMessage({ type: 'success', text: 'Utilisateur supprimé.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Impossible de supprimer cet utilisateur.' });
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-5 text-center">Chargement...</div>;

    return (
        <div className="container py-5">
            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} border-0 shadow-sm mb-5`} style={{ borderRadius: '15px' }}>
                    <div className="d-flex align-items-center gap-2 text-white">
                        <CheckCircle size={20} />
                        <span className="fw-bold text-dark">{message.text}</span>
                        <button type="button" className="btn-close ms-auto shadow-none" onClick={() => setMessage(null)}></button>
                    </div>
                </div>
            )}

            <div className="row g-4">
                {/* Profile Card */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '24px' }}>
                        <div className="card-body p-4 text-center">
                            <div className="position-relative d-inline-block mb-4">
                                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '120px', height: '120px' }}>
                                    <User size={60} className="text-primary opacity-75" />
                                </div>
                            </div>
                            <h4 className="fw-bold text-dark mb-1">{currentUser.name}</h4>
                            <p className="text-muted mb-4">{currentUser.is_admin ? 'Administrateur' : 'Formateur'}</p>
                            
                            <div className="text-start bg-light p-4 rounded-4 mb-4">
                                <div className="mb-3">
                                    <div className="small text-muted text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Email</div>
                                    <div className="fw-bold text-dark">{currentUser.email}</div>
                                </div>
                                <div>
                                    <div className="small text-muted text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Rôle Système</div>
                                    <div className="fw-bold text-dark">{currentUser.is_admin ? 'Accès Administrateur' : 'Accès Standard'}</div>
                                </div>
                            </div>

                            <button className="btn btn-primary w-100 py-3 fw-bold rounded-4 shadow-sm" onClick={() => handleOpenModal(currentUser)}>
                                <Edit2 size={18} className="me-2" /> Modifier mon profil
                            </button>
                        </div>
                    </div>
                </div>

                {/* Users Management */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: '24px' }}>
                        <div className="card-header bg-white border-0 p-4 d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-0 fw-bold text-dark">Utilisateurs</h5>
                                <p className="text-muted small mb-0">{users.length} membres actifs</p>
                            </div>
                            <button className="btn btn-dark btn-sm px-4 py-2 rounded-3 fw-bold" onClick={() => handleOpenModal()}>
                                Nouveau Membre
                            </button>
                        </div>
                        <div className="p-4 pt-0">
                            <div className="input-group bg-light rounded-3 p-1 mb-4">
                                <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
                                <input 
                                    type="text" className="form-control bg-transparent border-0 shadow-none py-2" 
                                    placeholder="Rechercher un utilisateur..." 
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle border-0">
                                    <thead className="text-muted small">
                                        <tr>
                                            <th className="border-0 pb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nom</th>
                                            <th className="border-0 pb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                                            <th className="border-0 pb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rôle</th>
                                            <th className="border-0 pb-3 text-end" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id}>
                                                <td className="py-3 fw-bold text-dark">{user.name}</td>
                                                <td className="py-3 text-muted">{user.email}</td>
                                                <td className="py-3">
                                                    <span className={`badge rounded-pill px-3 py-2 ${user.is_admin ? 'bg-danger bg-opacity-10 text-danger' : 'bg-primary bg-opacity-10 text-primary'}`}>
                                                        {user.is_admin ? 'Admin' : 'User'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-end">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button className="btn btn-light btn-sm text-primary rounded-2" onClick={() => handleOpenModal(user)}><Edit2 size={16} /></button>
                                                        <button className="btn btn-light btn-sm text-danger rounded-2" onClick={() => handleDeleteUser(user.id)} disabled={user.id === currentUser.id}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }}>
                            <div className="modal-header border-0 p-4">
                                <h5 className="modal-title fw-bold text-dark">
                                    {editMode ? 'Mise à jour' : 'Nouveau membre'}
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4 pt-0">
                                    <div className="mb-4">
                                        <label htmlFor="profile-name" className="form-label small fw-bold text-muted">NOM COMPLET</label>
                                        <input 
                                            id="profile-name" type="text" className="form-control bg-light border-0 py-3 px-4 rounded-4" required
                                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="profile-email" className="form-label small fw-bold text-muted">ADRESSE EMAIL</label>
                                        <input 
                                            id="profile-email" type="email" className="form-control bg-light border-0 py-3 px-4 rounded-4" required
                                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="profile-password" className="form-label small fw-bold text-muted">MOT DE PASSE</label>
                                        <div className="input-group bg-light rounded-4 overflow-hidden">
                                            <input 
                                                id="profile-password" type="text" className="form-control bg-transparent border-0 py-3 px-4" 
                                                required={!editMode}
                                                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                                placeholder={editMode ? "Laisser vide" : ""}
                                            />
                                            <button className="btn btn-light border-0 px-3" type="button" onClick={generatePassword}>
                                                <RefreshCw size={18} className="text-primary" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-4">
                                        <div className="fw-bold small text-dark">Droits Administrateur</div>
                                        <div className="form-check form-switch m-0">
                                            <input 
                                                className="form-check-input" type="checkbox"
                                                checked={formData.is_admin} onChange={e => setFormData({...formData, is_admin: e.target.checked})}
                                                style={{ width: '40px', height: '20px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light px-4 rounded-3 fw-bold" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary px-4 rounded-3 fw-bold" disabled={actionLoading}>
                                        {actionLoading ? 'Chargement...' : 'Confirmer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;

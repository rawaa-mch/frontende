import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Settings, CheckCircle, Image as ImageIcon, Mail, Save, Pencil } from 'lucide-react';
import defaultLogo from '../assets/Logo-OFPPT.png';
import defaultBg from '../assets/login-bg.jpg';

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        site_title: '',
        site_subtitle1: '',
        site_subtitle2: '',
        contact_info: '',
        logo: '',
        login_bg_image: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [bgPreview, setBgPreview] = useState(null);
    const [bgFile, setBgFile] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            // Fusionner les données de la DB avec les valeurs par défaut pour que les cases ne soient pas vides
            const data = {
                site_title: res.data.site_title || 'Gestion des Emplois du Temps',
                site_subtitle1: res.data.site_subtitle1 || 'Complexe Formation CF Ain Chock',
                site_subtitle2: res.data.site_subtitle2 || 'ISTA NTIC Sidi Maarouf',
                contact_info: res.data.contact_info || 'admin@ofppt.com',
                logo: res.data.logo || '',
                login_bg_image: res.data.login_bg_image || ''
            };
            setSettings(data);
            
            // Afficher le logo actuel (soit celui de la DB, soit celui par défaut)
            if (data.logo) {
                setLogoPreview(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${data.logo}`);
            } else {
                setLogoPreview(defaultLogo);
            }

            // Afficher l'image de fond actuelle
            if (data.login_bg_image) {
                setBgPreview(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${data.login_bg_image}`);
            } else {
                setBgPreview(defaultBg);
            }
        } catch (err) {
            console.error("Erreur lors du chargement des paramètres", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setIsEditing(true); // Activer le mode édition automatiquement
            if (type === 'logo') {
                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
            } else {
                setBgFile(file);
                setBgPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const formData = new FormData();
        if (logoFile) formData.append('logo', logoFile);
        if (bgFile) formData.append('login_bg_image', bgFile);
        
        formData.append('contact_info', settings.contact_info || '');
        formData.append('site_title', settings.site_title || '');
        formData.append('site_subtitle1', settings.site_subtitle1 || '');
        formData.append('site_subtitle2', settings.site_subtitle2 || '');

        try {
            const res = await api.post('/settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSettings(res.data.setting);
            setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès !' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'enregistrement.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
            </div>
        </div>
    );

    return (
        <div className="container py-5">
            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
                        <div className="card-body p-4 p-md-5">
                            <div className="d-flex align-items-center gap-3 mb-5">
                                <div className="bg-primary bg-opacity-10 p-3 rounded-4">
                                    <Settings className="text-primary" size={28} />
                                </div>
                                <div>
                                    <h4 className="fw-bold mb-1">Configuration du Site</h4>
                                    <p className="text-muted small mb-0">Personnalisez l'apparence et les titres de votre plateforme</p>
                                </div>
                            </div>

                            {message && (
                                <div className={`alert ${message.type === 'success' ? 'alert-success text-success' : 'alert-danger text-danger'} border-0 mb-4 bg-opacity-10`} style={{ borderRadius: '12px' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <CheckCircle size={18} />
                                        <span className="fw-medium">{message.text}</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row g-4">

                                    <div className="col-md-6">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <label htmlFor="settings-subtitle1" className="form-label fw-bold small text-uppercase text-muted mb-0">Sous-titre 1</label>
                                            {!isEditing && (
                                                <button type="button" className="btn btn-link btn-sm p-0 text-primary opacity-50 hover-opacity-100" onClick={() => setIsEditing(true)}>
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            id="settings-subtitle1" type="text" className={`form-control ${!isEditing ? 'bg-light bg-opacity-50 border-transparent cursor-default' : 'bg-light border-0'} py-3 rounded-3`} 
                                            placeholder="Ex: Complexe Formation CF Ain Chock"
                                            value={settings.site_subtitle1 || ''}
                                            onChange={(e) => setSettings({...settings, site_subtitle1: e.target.value})}
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <label htmlFor="settings-subtitle2" className="form-label fw-bold small text-uppercase text-muted mb-0">Sous-titre 2</label>
                                            {!isEditing && (
                                                <button type="button" className="btn btn-link btn-sm p-0 text-primary opacity-50 hover-opacity-100" onClick={() => setIsEditing(true)}>
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            id="settings-subtitle2" type="text" className={`form-control ${!isEditing ? 'bg-light bg-opacity-50 border-transparent cursor-default' : 'bg-light border-0'} py-3 rounded-3`} 
                                            placeholder="Ex: ISTA NTIC Sidi Maarouf"
                                            value={settings.site_subtitle2 || ''}
                                            onChange={(e) => setSettings({...settings, site_subtitle2: e.target.value})}
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <label htmlFor="settings-contact" className="form-label fw-bold small text-uppercase text-muted mb-0">Informations de Contact</label>
                                            {!isEditing && (
                                                <button type="button" className="btn btn-link btn-sm p-0 text-primary opacity-50 hover-opacity-100" onClick={() => setIsEditing(true)}>
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><Mail size={18} className="text-muted" /></span>
                                            <input 
                                                id="settings-contact" type="text" className={`form-control ${!isEditing ? 'bg-light bg-opacity-50 border-transparent cursor-default' : 'bg-light border-0'} py-3`} 
                                                placeholder="Email ou Téléphone"
                                                value={settings.contact_info || ''}
                                                onChange={(e) => setSettings({...settings, contact_info: e.target.value})}
                                                readOnly={!isEditing}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3 border-top">
                                    <button 
                                        type="submit" className="btn btn-primary px-5 py-3 fw-bold rounded-3 shadow-sm"
                                        disabled={saving || !isEditing}
                                        style={{ opacity: isEditing ? 1 : 0.6 }}
                                    >
                                        {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <Save size={18} className="me-2" />}
                                        Enregistrer les modifications
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
                        <div className="card-body p-4">
                            <h6 className="fw-bold mb-4">Identité Visuelle</h6>
                            
                            {/* Logo */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <label htmlFor="logoInput" className="form-label small fw-bold text-muted text-uppercase mb-0">Logo</label>
                                </div>
                                <div className="text-center p-4 border border-dashed rounded-4 bg-light">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="img-fluid mb-3" style={{ maxHeight: '80px' }} />
                                    ) : (
                                        <div className="mb-3 text-muted opacity-25"><ImageIcon size={48} /></div>
                                    )}
                                    <button 
                                        className="btn btn-sm btn-outline-primary w-100 rounded-pill" 
                                        onClick={() => document.getElementById('logoInput').click()}
                                    >
                                        Changer le logo
                                    </button>
                                    <input id="logoInput" type="file" className="d-none" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                </div>
                            </div>

                            {/* Background */}
                            <div>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <label htmlFor="bgInput" className="form-label small fw-bold text-muted text-uppercase mb-0">Image de fond (Login)</label>
                                </div>
                                <div className="text-center p-4 border border-dashed rounded-4 bg-light">
                                    {bgPreview ? (
                                        <div className="rounded-3 mb-3 overflow-hidden shadow-sm" style={{ height: '100px', backgroundImage: `url(${bgPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                    ) : (
                                        <div className="mb-3 text-muted opacity-25"><ImageIcon size={48} /></div>
                                    )}
                                    <button 
                                        className="btn btn-sm btn-outline-primary w-100 rounded-pill" 
                                        onClick={() => document.getElementById('bgInput').click()}
                                    >
                                        Changer l'image
                                    </button>
                                    <input id="bgInput" type="file" className="d-none" accept="image/*" onChange={(e) => handleFileChange(e, 'bg')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .hover-opacity-100:hover { opacity: 1 !important; }
                .group:hover .group-hover-opacity-100 { opacity: 1 !important; }
                .form-control:focus {
                    background-color: #fff !important;
                    box-shadow: 0 0 0 4px rgba(var(--bs-primary-rgb), 0.1) !important;
                    border-color: var(--bs-primary) !important;
                }
                .input-group-text {
                    border-color: #dee2e6;
                }
            `}</style>
        </div>
    );
};

export default SettingsPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/Logo-OFPPT.png';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [bgImage, setBgImage] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [contact, setContact] = useState('');
    const [siteTitle, setSiteTitle] = useState('');
    const [subtitle1, setSubtitle1] = useState('');
    const [subtitle2, setSubtitle2] = useState('');

    React.useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get(`/settings?t=${Date.now()}`);
            
            if (res.data.login_bg_image) {
                setBgImage(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${res.data.login_bg_image}`);
            }
            if (res.data.logo) {
                setLogoUrl(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${res.data.logo}`);
            }
            
            setContact(res.data.contact_info || '');
            setSiteTitle(res.data.site_title || 'Se connecter'); // Keep a fallback for the main title just in case
            setSubtitle1(res.data.site_subtitle1 || '');
            setSubtitle2(res.data.site_subtitle2 || '');
            
        } catch (err) {
            console.error("Erreur settings login", err);
            // Fallbacks in case of API error
            setSiteTitle('Se connecter');
            setSubtitle1('Erreur de connexion API');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/login', { email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.errors?.email?.[0] || 'Erreur de connexion : Identifiants invalides');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div 
                className="login-image-section" 
                style={bgImage ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${bgImage})` } : {}}
            >
                <div className="login-branding">
                    <h2>Bienvenue</h2>
                    <p>Système de Gestion et de Génération des Emplois du Temps et des Salles de Formation Professionnelle.</p>
                </div>
            </div>
            
            <div className="login-form-section">
                <div className="login-card">
                    <div className="login-header">
                        <img src={logoUrl || logo} alt="Logo" className="login-logo" />
                        <h1 className="login-title">{siteTitle}</h1>
                        <p className="login-subtitle">{subtitle1}</p>
                        <p className="login-subtitle">{subtitle2}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="login-email" className="form-label">Email</label>
                            <div className="input-wrapper">
                                <Mail size={20} className="input-icon" />
                                <input
                                    id="login-email"
                                    type="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre.email@ofppt.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-password" className="form-label">Mot de passe</label>
                            <div className="input-wrapper">
                                <Lock size={20} className="input-icon" />
                                <input
                                    id="login-password"
                                    type="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-button"
                        >
                            {loading ? (
                                'Connexion en cours...'
                            ) : (
                                <>
                                    <span>Se connecter</span>
                                    <LogIn size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>&copy; {new Date().getFullYear()} OFPPT. Tous droits réservés.</p>
                        <p>Contact : {contact}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
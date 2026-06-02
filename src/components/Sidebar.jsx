import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/Logo-OFPPT.png';

/* ── Icônes SVG modernes ──────────────────────────────────── */
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const GroupIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none', opacity: 0.6 }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

/* ── Couleurs ───────────────────────────────────────────────── */
const BLUE_OFPPT = '#0055A2';
const BG_START   = '#023c77';
const BG_END     = '#01285a';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.5)';

/* ── Sidebar ─────────────────────────────────────────────── */
function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [emploiOpen, setEmploiOpen] = useState(location.pathname.startsWith('/emploi-'));

  const isActive = (path) =>
    location.pathname === path || (path === '/dashboard' && location.pathname === '/');

  const inEmploi = location.pathname.startsWith('/emploi-');

  return (
    <div className="no-print" style={{
      width: collapsed ? 70 : 260, 
      height: '100vh', 
      position: 'fixed', 
      left: 0, 
      top: 0,
      background: `linear-gradient(180deg, ${BG_START} 0%, ${BG_END} 100%)`,
      display: 'flex', 
      flexDirection: 'column',
      boxShadow: '4px 0 25px rgba(0,0,0,0.25)', 
      zIndex: 1000,
      fontFamily: "'Segoe UI', sans-serif",
      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>

      {/* ── Floating Toggle Button (Outside Scroll) ── */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          right: -12,
          top: 32,
          width: 24,
          height: 24,
          background: BLUE_OFPPT,
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          border: '2px solid #f4f7f6',
          zIndex: 1001,
          transition: 'transform 0.3s'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
             style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }}>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </div>

      {/* ── SCROLLABLE AREA (Logo + Nav) ── */}
      <div className="sidebar-scroll" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* ── Logo Section ── */}
        <div style={{ 
          padding: collapsed ? '25px 0' : '30px 20px', 
          textAlign: 'center', 
          transition: 'all 0.4s',
          marginBottom: 10
        }}>
          <div style={{
            display: 'inline-block',
            padding: collapsed ? '6px' : '10px',
            background: 'white',
            borderRadius: collapsed ? '10px' : '16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            transition: 'all 0.4s'
          }}>
            <img src={logo} alt="OFPPT" style={{ 
              width: collapsed ? 32 : 55, 
              height: collapsed ? 32 : 55, 
              objectFit: 'contain',
              transition: 'all 0.4s'
            }} />
          </div>
          {!collapsed && (
            <div style={{ marginTop: 15, animation: 'slideIn 0.4s ease-out' }}>
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>CF Ain Chock</h2>
              <p style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: 500, margin: '2px 0 0', textTransform: 'uppercase' }}>ISTA NTIC Sidi Maarouf</p>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '10px 12px' }}>
          <SectionLabel collapsed={collapsed}>Menu</SectionLabel>
          <NavItem icon={<DashboardIcon />} label="Dashboard" active={isActive('/dashboard')} onClick={() => navigate('/dashboard')} collapsed={collapsed} />

          <SectionLabel style={{ marginTop: 20 }} collapsed={collapsed}>Planning</SectionLabel>
          <NavItem
            icon={<CalendarIcon />}
            label="Emploi du temps"
            active={inEmploi}
            onClick={() => {
              if (collapsed) { setCollapsed(false); setEmploiOpen(true); }
              else { setEmploiOpen(o => !o); }
            }}
            suffix={!collapsed && <ChevronIcon open={emploiOpen} />}
            collapsed={collapsed}
          />
          {emploiOpen && !collapsed && (
            <div style={{ marginLeft: 15, borderLeft: '1px solid rgba(255,255,255,0.1)', marginTop: 5, marginBottom: 10, animation: 'expandDown 0.3s ease-out' }}>
              <SubItem label="Formateurs" active={isActive('/emploi-formateur')} onClick={() => navigate('/emploi-formateur')} />
              <SubItem label="Groupes"    active={isActive('/emploi-groupe')}    onClick={() => navigate('/emploi-groupe')} />
              <SubItem label="Salles"     active={isActive('/emploi-salle')}     onClick={() => navigate('/emploi-salle')} />
            </div>
          )}

          <SectionLabel style={{ marginTop: 20 }} collapsed={collapsed}>Données</SectionLabel>
          <NavItem icon={<FolderIcon />} label="Filières"   active={isActive('/filieres')}   onClick={() => navigate('/filieres')} collapsed={collapsed} />
          <NavItem icon={<BookIcon />}   label="Modules"    active={isActive('/modules')}    onClick={() => navigate('/modules')} collapsed={collapsed} />
          <NavItem icon={<UsersIcon />}  label="Formateurs" active={isActive('/formateurs')} onClick={() => navigate('/formateurs')} collapsed={collapsed} />
          <NavItem icon={<GroupIcon />}  label="Groupes"    active={isActive('/groupes')}    onClick={() => navigate('/groupes')} collapsed={collapsed} />
          <NavItem icon={<HomeIcon />}   label="Salles"     active={isActive('/salles')}     onClick={() => navigate('/salles')} collapsed={collapsed} />
          
          <SectionLabel style={{ marginTop: 20 }} collapsed={collapsed}>Événements</SectionLabel>
          <NavItem icon={<CalendarIcon />} label="Gestion Événements" active={isActive('/events')} onClick={() => navigate('/events')} collapsed={collapsed} />
        </nav>

        {/* ── Footer / Bottom Section ── */}
        <div style={{ 
          marginTop: 'auto', 
          padding: '10px 12px 25px', 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <NavItem 
            icon={<LogoutIcon />} 
            label="Déconnexion" 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }} 
            collapsed={collapsed} 
            isLogout
          />
          
          {!collapsed && (
            <div style={{ 
              padding: '15px 0 10px', 
              textAlign: 'center',
              animation: 'fadeIn 0.6s'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, margin: 0, fontWeight: 500 }}>
                © 2025 OFPPT · GESTION EMPLOI
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes expandDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 200px; } }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
      `}</style>
    </div>
  );
}

/* ── Utility Components ───────────────────────────────────── */

function SectionLabel({ children, style = {}, collapsed }) {
  if (collapsed) return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '20px 10px', ...style }} />;
  return (
    <div style={{ 
      fontSize: 10, 
      fontWeight: 700, 
      color: 'rgba(255,255,255,0.25)', 
      textTransform: 'uppercase', 
      letterSpacing: '1.5px', 
      padding: '15px 15px 8px', 
      ...style 
    }}>
      {children}
    </div>
  );
}

function NavItem({ icon, label, active, onClick, suffix, collapsed, isLogout }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? label : ""}
      style={{
        display: 'flex', 
        alignItems: 'center', 
        gap: collapsed ? 0 : 15,
        padding: '12px 15px', 
        borderRadius: '12px', 
        marginBottom: 5,
        cursor: 'pointer', 
        position: 'relative',
        background: active ? 'rgba(255,255,255,0.1)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active || hovered ? (isLogout ? '#ff4d4d' : 'white') : 'rgba(255,255,255,0.6)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Active Indicator */}
      {active && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          height: '60%',
          width: 3,
          background: BLUE_OFPPT,
          borderRadius: '0 4px 4px 0',
          boxShadow: `0 0 10px ${BLUE_OFPPT}`
        }} />
      )}

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minWidth: 24,
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s'
      }}>
        {icon}
      </div>

      {!collapsed && (
        <span style={{ 
          flex: 1, 
          fontSize: 14, 
          fontWeight: active ? 600 : 500,
          whiteSpace: 'nowrap',
          animation: 'fadeIn 0.3s'
        }}>
          {label}
        </span>
      )}

      {!collapsed && suffix}
    </div>
  );
}

function SubItem({ label, active, onClick, isSpecial }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        padding: '10px 15px 10px 20px', 
        borderRadius: '8px', 
        margin: '2px 10px',
        cursor: 'pointer',
        color: active ? 'white' : hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
        background: active ? 'rgba(0,85,162,0.3)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        transition: 'all 0.2s',
        border: isSpecial && !active ? '1px dashed rgba(0,85,162,0.3)' : 'none'
      }}
    >
      <div style={{ 
        width: 6, 
        height: 6, 
        borderRadius: '50%', 
        background: active ? BLUE_OFPPT : 'currentColor',
        boxShadow: active ? `0 0 8px ${BLUE_OFPPT}` : 'none'
      }} />
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

export default Sidebar;
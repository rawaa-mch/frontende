import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import EmploiFormateur from './pages/EmploiFormateur';
import EmploiGroupe from './pages/EmploiGroupe';
import EmploiSalle from './pages/EmploiSalle';
import FilierePage from './pages/FilierePage';
import ModulePage from './pages/ModulePage';
import FormateurPage from './pages/FormateurPage';
import GroupePage from './pages/GroupePage';
import SallePage from './pages/SallePage';
import Login from './pages/login';
import FormationPage from './pages/FormationPage';
import AutomatedSchedule from './pages/AutomatedSchedule';
import EventPage from './pages/EventPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const location = useLocation();



  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return token && token !== 'undefined' && token !== 'null';
  };

  return (
    <div style={{ display: 'flex', width: '100%', background: '#f4f7f6', minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        
        <Route path="/*" element={
          isAuthenticated() ? (
            <>
              <Sidebar collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} />
              <div className="print-content" style={{ 
                marginLeft: isSidebarCollapsed ? '70px' : '260px', 
                transition: 'margin-left 0.3s ease',
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column' 
              }}>
                <Header />
                <div className="p-4 flex-grow-1">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Routes Emploi du temps */}
                    <Route path="/emploi-temps" element={<Navigate to="/emploi-formateur" replace />} />
                    <Route path="/emploi-formateur" element={<EmploiFormateur />} />
                    <Route path="/emploi-groupe" element={<EmploiGroupe />} />
                    <Route path="/emploi-salle" element={<EmploiSalle />} />

                    <Route path="/filieres" element={<FilierePage />} />
                    <Route path="/modules" element={<ModulePage />} />
                    <Route path="/formateurs" element={<FormateurPage />} />
                    <Route path="/groupes" element={<GroupePage />} />
                    <Route path="/salles" element={<SallePage />} />
                    <Route path="/formations" element={<FormationPage />} />
                    <Route path="/events" element={<EventPage />} />
                    <Route path="/emploi-ia" element={<AutomatedSchedule />} />

                    <Route path="/profil" element={<ProfilePage />} />
                    <Route path="/parametres" element={<SettingsPage />} />
                  </Routes>
                </div>
              </div>
            </>
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        } />
      </Routes>
    </div>
  );
}

export default App;
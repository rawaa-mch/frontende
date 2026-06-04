import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Spinner,
  Badge,
  ProgressBar,
  Accordion,
  Button,
  Alert,
  Dropdown,
} from "react-bootstrap";
import api from "../api/axios";
import { calcDuree } from "../hooks/useEmploi";

/* ── Icons ────────────────────────────────────────────────── */
const IconGroup = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconFiliere = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
);
const IconFormation = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
);
const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconUpload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);

const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

function Dashboard() {
  const formatTime = (hours) => {
    if (Number.isNaN(hours)) return "0h";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h${m}` : `${h}h`;
  };

  const [data, setData] = useState({
    groupes: [],
    modules: [],
    seances: [],
    formations: [],
    filieres: [],
    events: [],
    affectations: [],
    formateurs: [],
  });
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [progressSearchTerm, setProgressSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [g, m, s, f, fil, ev, aff, form] = await Promise.all([
        fetch("/api/groupes"),
        fetch("/api/modules"),
        fetch("/api/seances"),
        fetch("/api/formations"),
        fetch("/api/filieres"),
        fetch("/api/events"),
        fetch("/api/affectations"),
        fetch("/api/formateurs"),
      ]);
      const res = await Promise.all([
        g.json(),
        m.json(),
        s.json(),
        f.json(),
        fil.json(),
        ev.json(),
        aff.json(),
        form.json(),
      ]);
      setData({
        groupes: res[0].data || res[0] || [],
        modules: res[1].data || res[1] || [],
        seances: res[2].data || res[2] || [],
        formations: res[3].data || res[3] || [],
        filieres: res[4].data || res[4] || [],
        events: res[5].data || res[5] || [],
        affectations: res[6].data || res[6] || [],
        formateurs: res[7].data || res[7] || [],
      });
    } catch (e) {
      console.error("Erreur fetching dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const getGroupModules = (groupe) => {
    const filiereModules = data.modules.filter(
      (m) => m.filiere_id === groupe.filiere_id,
    );
    return filiereModules.map((m) => {
      const consomme = data.seances
        .filter((s) => s.groupe_id === groupe.id && s.module_id === m.id && s.validee === true)
        .reduce((acc, s) => {
          const d = calcDuree(s.debut, s.fin);
          return acc + (Number.isNaN(d) ? 0 : d);
        }, 0);
      const masse = Number.parseFloat(m.masse_horaire) || 0;
      const reste = Math.max(0, masse - consomme);

      const affectation = data.affectations.find(
        (a) => a.groupe_id == groupe.id && a.module_id == m.id
      );
      const formateur = affectation 
        ? data.formateurs.find((f) => f.id == affectation.formateur_id)
        : null;
      const formateurName = formateur 
        ? `${formateur.nom} ${formateur.prenom || ""}`.trim()
        : "";

      return {
        id: m.id,
        nom: m.nom || m.nom_module,
        totale: masse,
        consomme,
        reste,
        percent: Math.min(100, (consomme / masse) * 100),
        formateurName,
      };
    });
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    setImportMessage(null);

    try {
      const response = await api.post("/import-excel", formData);
      if (response.data.success) {
        setImportMessage({ type: "success", text: response.data.message });
        fetchData();
      }
    } catch (err) {
      setImportMessage({
        type: "danger",
        text: err.response?.data?.message || "Erreur lors de l'importation.",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearImport = async () => {
    if (!globalThis.confirm(
      'Attention ! Cette action va supprimer toutes les données (filières, groupes, formateurs, modules, séances, affectations, formations, événements).\n\nLes SALLES seront conservées.\n\nConfirmer ?'
    )) return;
    setClearing(true);
    setImportMessage(null);
    try {
      const response = await api.delete('/clear-import');
      if (response.data.success) {
        setImportMessage({ type: 'warning', text: response.data.message });
        fetchData();
      }
    } catch (err) {
      setImportMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Erreur lors de la suppression.',
      });
    } finally {
      setClearing(false);
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted fw-500">Chargement des données...</p>
        </div>
      </div>
    );

  const today = new Date().toLocaleDateString("en-CA");
  const activeFormations = data.formations.filter((f) => {
    const end = (f.date_fin || f.date_debut).split("T")[0];
    return end >= today;
  });

  const upcomingEvents = [...data.events.filter((e) => {
    return e.date?.split("T")[0] >= today;
  })].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  return (
    <div className="dashboard-container animate__animated animate__fadeIn">
      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-700 mb-1" style={{ color: "var(--ofppt-blue)", letterSpacing: "-0.5px" }}>Tableau de bord</h2>
          <p className="text-muted mb-0">Vue d'ensemble du système</p>
        </div>
        <div>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleImport}
          />
          <Dropdown align="end">
            <Dropdown.Toggle
              className="btn-premium d-flex align-items-center gap-2 border-0"
              id="dropdown-dashboard-actions"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              Actions
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow border-0">
              <Dropdown.Header className="fw-bold text-primary">Gestion des Données</Dropdown.Header>
              
              <Dropdown.Item 
                href="/api/import-blank-template" 
                download
                className="small d-flex align-items-center gap-2 py-2"
              >
                <IconDownload />
                <span>Télécharger modèle</span>
              </Dropdown.Item>

              <Dropdown.Item 
                href="/api/import-template" 
                download
                className="small d-flex align-items-center gap-2 py-2"
              >
                <IconDownload />
                <span>Export Données</span>
              </Dropdown.Item>

              <Dropdown.Item 
                as="button"
                onClick={() => fileInputRef.current?.click()} 
                disabled={importing}
                className="small d-flex align-items-center gap-2 py-2"
              >
                {importing ? <Spinner size="sm" animation="border" /> : <IconUpload />}
                <span>{importing ? "Importation..." : "Importer Excel"}</span>
              </Dropdown.Item>

              <Dropdown.Divider />

              <Dropdown.Item 
                as="button"
                onClick={handleClearImport} 
                disabled={clearing}
                className="text-danger small d-flex align-items-center gap-2 py-2"
              >
                {clearing ? <Spinner size="sm" animation="border" /> : <span style={{fontWeight:'bold'}}>✕</span>}
                <span>{clearing ? "Suppression..." : "Vider données"}</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {importing && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999,
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg text-center p-5"
            style={{ maxWidth: 360 }}
          >
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 mb-0 fw-600" style={{ color: 'var(--ofppt-blue)' }}>
              Importation en cours…
            </p>
            <p className="text-muted small mt-1 mb-0">Veuillez patienter</p>
          </div>
        </div>
      )}

      {importMessage && !importing && (
        <Alert
          variant={importMessage.type}
          onClose={() => setImportMessage(null)}
          dismissible
          className="border-0 shadow-sm mb-4"
        >
          {importMessage.text}
        </Alert>
      )}

      <Row className="g-4">
        {/* Colonne Gauche: Formations et Événements */}
        <Col lg={7}>
          <div className="d-flex flex-column gap-4">
            {/* ── Active Formations ── */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '14px' }}>
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-700 mb-0" style={{ color: "var(--ofppt-blue)", fontSize: '17px' }}>
                  Formateurs en formation
                </h5>
                <Badge bg="light" text="dark" className="border">Actuels</Badge>
              </Card.Header>
              <Card.Body className="px-4 pb-4">
                {activeFormations.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="mb-2 text-muted opacity-50"><IconFormation /></div>
                    <p className="text-muted small">Aucun formateur en formation.</p>
                  </div>
                ) : (
                  <Row className="g-3">
                    {[...activeFormations]
                      .sort((a, b) => a.date_debut.localeCompare(b.date_debut))
                      .slice(0, 4)
                      .map((f) => {
                        const start = f.date_debut.split("T")[0];
                        const end = (f.date_fin || f.date_debut).split("T")[0];
                        const isCurrent = today >= start && today <= end;

                        return (
                          <Col md={6} key={f.id}>
                            <div
                              className="p-3 rounded-3 border-start border-4 shadow-sm h-100"
                              style={{
                                backgroundColor: isCurrent ? '#f0fdf4' : '#f8fafc',
                                borderColor: isCurrent ? 'var(--ofppt-green)' : 'var(--ofppt-blue)',
                              }}
                            >
                              <div className="fw-700 text-dark mb-1 text-truncate">
                                {f.formateur?.nom} {f.formateur?.prenom}
                              </div>
                              <div className="small text-muted d-flex align-items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                                {start} → {end}
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                  </Row>
                )}
                <Button
                  variant="link"
                  className="w-100 mt-3 text-decoration-none small fw-600 p-0 text-center"
                  onClick={() => navigate("/formations")}
                >
                  Voir tout le calendrier →
                </Button>
              </Card.Body>
            </Card>

            {/* ── Upcoming Events ── */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '14px' }}>
              <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-700 mb-0" style={{ color: "#0055A2", fontSize: '17px' }}>
                  Événements à venir
                </h5>
                <Badge bg="info" className="text-white">Planning</Badge>
              </Card.Header>
              <Card.Body className="px-4 pb-4">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="mb-2 text-muted opacity-50">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <p className="text-muted small">Aucun événement prévu.</p>
                  </div>
                ) : (
                  <Row className="g-3">
                    {upcomingEvents.map((e) => (
                      <Col md={6} key={e.id}>
                        <div
                          className="p-3 rounded-3 border-start border-4 shadow-sm bg-light h-100"
                          style={{
                            borderColor: '#0055A2',
                          }}
                        >
                          <div className="fw-700 text-dark mb-1 text-truncate" title={e.title}>{e.title}</div>
                          <div className="small text-muted mb-1">
                            <Badge bg="secondary" className="me-1" style={{ fontSize: '9px' }}>{e.salle?.nom}</Badge>
                            {new Date(e.date).toLocaleDateString()} | {e.start_time}
                          </div>
                          <div className="small text-primary" style={{ fontSize: '10px' }}>
                            {e.groupes?.length} grp · {e.formateurs?.length} prof
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
                <Button
                  variant="link"
                  className="w-100 mt-3 text-decoration-none small fw-600 p-0 text-center"
                  onClick={() => navigate("/events")}
                >
                  Gérer les événements →
                </Button>
              </Card.Body>
            </Card>
          </div>
        </Col>

        {/* Colonne Droite: Progression des Groupes */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '14px' }}>
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="fw-700 mb-2" style={{ color: "var(--ofppt-blue)", fontSize: '17px' }}>
                Reste du module par groupe
              </h5>
              <input 
                type="text" 
                className="form-control form-control-sm mb-2" 
                placeholder="Rechercher par groupe ou module..." 
                value={progressSearchTerm} 
                onChange={e => setProgressSearchTerm(e.target.value)} 
                style={{ fontSize: '12px', borderRadius: '8px' }} 
              />
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {data.filieres.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted small">Aucune donnée disponible.</p>
                </div>
              ) : (
                <Accordion className="mt-2 custom-accordion">
                  {data.filieres.map((filiere) => {
                    const groupesDeCetteFiliere = data.groupes.filter(
                      (g) => g.filiere_id === filiere.id,
                    );
                    
                    const filteredGroupes = groupesDeCetteFiliere.filter((groupe) => {
                      const modules = getGroupModules(groupe);
                      const groupMatches = groupe.nom?.toLowerCase().includes(progressSearchTerm.toLowerCase());
                      const moduleMatches = modules.some(m => m.nom?.toLowerCase().includes(progressSearchTerm.toLowerCase()));
                      return !progressSearchTerm || groupMatches || moduleMatches;
                    });

                    if (filteredGroupes.length === 0) return null;

                    return (
                      <Accordion.Item
                        key={filiere.id}
                        eventKey={"f-" + filiere.id}
                        className="mb-3 border rounded-3 overflow-hidden"
                      >
                        <Accordion.Header>
                          <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                            <span className="fw-700 text-dark small">
                              {filiere.nom}
                            </span>
                            <Badge pill style={{ backgroundColor: 'var(--ofppt-blue)', fontSize: '10px' }}>
                              {filteredGroupes.length}
                            </Badge>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body className="p-1 bg-light">
                          <Accordion flush>
                            {filteredGroupes.map((groupe) => {
                              const modules = getGroupModules(groupe);
                              const filteredModules = modules.filter(m => {
                                const groupMatches = groupe.nom?.toLowerCase().includes(progressSearchTerm.toLowerCase());
                                const moduleMatches = m.nom?.toLowerCase().includes(progressSearchTerm.toLowerCase());
                                return !progressSearchTerm || groupMatches || moduleMatches;
                              });

                              return (
                                <Accordion.Item
                                  key={groupe.id}
                                  eventKey={"g-" + groupe.id}
                                  className="border-0 mb-1 rounded-2 overflow-hidden shadow-sm"
                                >
                                  <Accordion.Header className="inner-accordion-header">
                                    <span className="fw-700 text-primary x-small">
                                      {groupe.nom}
                                    </span>
                                  </Accordion.Header>
                                  <Accordion.Body className="p-3 bg-white">
                                    {filteredModules.map((m) => (
                                      <div key={m.id} className="mb-3 last-child-mb-0">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                          <span className="text-truncate x-small fw-600" style={{ maxWidth: '75%' }} title={m.formateurName ? `${m.nom} (${m.formateurName})` : m.nom}>
                                            {m.nom} {m.formateurName && <span className="text-success fw-bold ms-1" style={{ fontSize: '9px' }}>({m.formateurName})</span>}
                                          </span>
                                          <span className={`x-small fw-700 ${m.reste <= 2.5 && m.reste > 0 ? 'text-danger' : 'text-success'}`}>
                                            {formatTime(m.reste)}
                                          </span>
                                        </div>
                                        <ProgressBar 
                                          now={m.percent} 
                                          variant={m.reste <= 2.5 && m.reste > 0 ? "danger" : "success"}
                                          style={{ height: '5px', borderRadius: '10px' }}
                                        />
                                      </div>
                                    ))}
                                  </Accordion.Body>
                                </Accordion.Item>
                              );
                            })}
                          </Accordion>
                        </Accordion.Body>
                      </Accordion.Item>
                    );
                  })}
                </Accordion>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .custom-accordion .accordion-button { padding: 12px 15px; background-color: white; box-shadow: none !important; }
        .custom-accordion .accordion-button:not(.collapsed) { background-color: #f8fafc; color: var(--ofppt-blue); }
        .custom-accordion .inner-accordion-header .accordion-button { padding: 8px 12px; background-color: #ffffff; border-radius: 6px !important; }
        .custom-accordion .inner-accordion-header .accordion-button:not(.collapsed) { background-color: #e0e7ff !important; color: #4338ca !important; }
        .custom-accordion .accordion-item { border: 1px solid #edf2f7 !important; }
        .fw-700 { font-weight: 700; }
        .fw-600 { font-weight: 600; }
        .x-small { font-size: 10px; }
        .last-child-mb-0:last-child { margin-bottom: 0 !important; }
        .dashboard-container { animation-duration: 0.5s; }
      `}</style>
    </div>
  );
}

export default Dashboard;

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';

function FormateurPage() {
  const [formateurs, setFormateurs] = useState([]);
  const [modules, setModules] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [formData, setFormData] = useState({ nom: '', prenom: '', type: 'permanent', modules: [] });

  useEffect(() => { fetchFormateurs(); fetchModules(); fetchFilieres(); }, []);

  const fetchFormateurs = async () => {
    setLoading(true); try { const res = await fetch('/api/formateurs'); const data = await res.json(); setFormateurs(data.data || data || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchModules = async () => { const res = await fetch('/api/modules'); const data = await res.json(); setModules(data.data || data || []); };
  const fetchFilieres = async () => { const res = await fetch('/api/filieres'); const data = await res.json(); setFilieres(data.data || data || []); };

  const handleSave = async () => {
    if (!formData.nom) return;
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/formateurs/${editing}` : '/api/formateurs';
      const payload = { nom: formData.nom, prenom: formData.prenom, type: formData.type, modules_ids: formData.modules };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); alert(err.message || 'Erreur lors de la sauvegarde'); return; }
      await fetchFormateurs(); setShowModal(false); setEditing(null);
      setFormData({ nom: '', prenom: '', type: 'permanent', modules: [] });
      setSelectedFiliere('');
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleEdit = (f) => {
    setEditing(f.id);
    setFormData({ nom: f.nom, prenom: f.prenom || '', type: f.type, modules: f.modules?.map(m => m.id) || [] });
    setSelectedFiliere('');
    setShowModal(true);
  };

  const handleDelete = async (id) => { if (globalThis.confirm('Supprimer ?')) { await fetch(`/api/formateurs/${id}`, { method: 'DELETE' }); fetchFormateurs(); } };

  const handleModuleToggle = (id) => {
    setFormData(prev => ({ ...prev, modules: prev.modules.includes(id) ? prev.modules.filter(m => m !== id) : [...prev.modules, id] }));
  };

  const filtered = formateurs.filter(f => {
    const matchesSearch = 
      (`${f.nom} ${f.prenom || ""}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.modules?.some(m => (m.nom || "").toLowerCase().includes(searchTerm.toLowerCase())));
    return (!filterType || f.type === filterType) && matchesSearch;
  });

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: 'var(--ofppt-blue)' }}>Formateurs</h2>
        <Button className="btn-ofppt" onClick={() => { setShowModal(true); setEditing(null); setFormData({ nom: '', prenom: '', type: 'permanent', modules: [] }); setSelectedFiliere(''); }}>+ Ajouter</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex gap-2 mb-3 align-items-center">
            <input type="text" className="form-control" placeholder="Rechercher par nom..." aria-label="Rechercher un formateur" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ maxWidth: '300px' }} />
            <Form.Select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ maxWidth: '200px' }} aria-label="Filtrer par type">
              <option value="">Tous les types</option>
              <option value="permanent">Permanent</option>
              <option value="vacataire">Vacataire</option>
            </Form.Select>
          </div>
          <Table hover responsive>
            <thead className="table-light"><tr><th>Nom et Prénom</th><th>Type</th><th>Modules Affectés</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td className="fw-bold">{f.nom} {f.prenom}</td>
                  <td>{f.type}</td>
                  <td>
                    {f.modules?.length > 0 ? f.modules.map(m => m.nom).join(', ') : 'Aucun'}
                  </td>
                  <td>
                    <div className="d-flex">
                      <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(f)}>Modifier</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(f.id)}>Supprimer</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered scrollable>
        <Modal.Header closeButton><Modal.Title>{editing ? 'Modifier' : 'Ajouter'} un Formateur</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2"><Form.Label>Nom</Form.Label><Form.Control type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Prénom</Form.Label><Form.Control type="text" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} /></Form.Group>

            <Form.Group className="mb-2"><Form.Label>Type</Form.Label><Form.Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="permanent">Permanent</option><option value="vacataire">Vacataire</option></Form.Select></Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Filtrer les modules par Filière</Form.Label>
              <Form.Select value={selectedFiliere} onChange={e => setSelectedFiliere(e.target.value)}>
                <option value="">Toutes les filières</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-2"><Form.Label>Affecter des Modules</Form.Label>
              <div className="border p-2 rounded bg-light" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {modules.some(m => selectedFiliere === '' || m.filiere_id === Number.parseInt(selectedFiliere)) ? (
                  modules.filter(m => selectedFiliere === '' || m.filiere_id === Number.parseInt(selectedFiliere)).map(m => (
                    <Form.Check key={m.id} type="checkbox" label={m.nom} checked={formData.modules.includes(m.id)} onChange={() => handleModuleToggle(m.id)} />
                  ))
                ) : (
                  <div className="text-muted small p-2 text-center">Aucun module pour cette filière</div>
                )}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button><Button className="btn-ofppt" onClick={handleSave} disabled={saving}>Enregistrer</Button></Modal.Footer>
      </Modal>
    </div>
  );
}

export default FormateurPage;
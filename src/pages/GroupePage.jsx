import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';

function GroupePage() {
  const [groupes, setGroupes] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ nom: '', filiere_id: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');

  useEffect(() => { fetchGroupes(); fetchFilieres(); }, []);

  const fetchGroupes = async () => {
    setLoading(true); try { const res = await fetch('/api/groupes'); const data = await res.json(); setGroupes(data.data || data || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchFilieres = async () => { try { const res = await fetch('/api/filieres'); const data = await res.json(); setFilieres(data.data || data || []); } catch (e) { console.error(e); } };

  const handleSave = async () => {
    if (!formData.nom || !formData.filiere_id) return;
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/groupes/${editing}` : '/api/groupes';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) { const err = await res.json(); alert(err.message || 'Erreur lors de la sauvegarde'); return; }
      await fetchGroupes(); setShowModal(false); setEditing(null);
      setFormData({ nom: '', filiere_id: '' });
    } catch (e) { console.error(e); alert('Erreur réseau'); } finally { setSaving(false); }
  };

  const handleEdit = (g) => {
    setEditing(g.id);
    setFormData({ nom: g.nom, filiere_id: g.filiere_id });
    setShowModal(true);
  };

  const handleDelete = async (id) => { if (globalThis.confirm('Supprimer ?')) { await fetch(`/api/groupes/${id}`, { method: 'DELETE' }); fetchGroupes(); } };

  const filtered = groupes.filter(g => {
    const matchesSearch = 
      (g.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.filiere?.nom || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFiliere = !selectedFiliere || g.filiere_id === Number.parseInt(selectedFiliere);
    return matchesSearch && matchesFiliere;
  });

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: 'var(--ofppt-blue)' }}>Groupes</h2>
        <Button className="btn-ofppt" onClick={() => setShowModal(true)}>+ Ajouter</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex gap-2 mb-3 align-items-center">
            <input type="text" className="form-control" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ maxWidth: '300px' }} />
            <Form.Select value={selectedFiliere} onChange={e => setSelectedFiliere(e.target.value)} style={{ maxWidth: '200px' }}>
              <option value="">Toutes les filières</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </Form.Select>
          </div>
          <Table hover responsive>
            <thead className="table-light"><tr><th>Nom</th><th>Filière</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td className="fw-bold">{g.nom}</td>
                  <td>{g.filiere?.nom}</td>
                  <td>
                    <div className="d-flex">
                      <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(g)}>Modifier</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(g.id)}>Supprimer</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered scrollable>
        <Modal.Header closeButton><Modal.Title>{editing ? 'Modifier' : 'Ajouter'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2"><Form.Label>Nom du Groupe</Form.Label><Form.Control type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Filière</Form.Label><Form.Select value={formData.filiere_id} onChange={e => setFormData({...formData, filiere_id: e.target.value})}><option value="">Sélectionner</option>{filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</Form.Select></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button><Button className="btn-ofppt" onClick={handleSave} disabled={saving}>Enregistrer</Button></Modal.Footer>
      </Modal>
    </div>
  );
}

export default GroupePage;
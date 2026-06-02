import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';

function FilierePage() {
  const [filieres, setFilieres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ nom: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchFilieres(); }, []);

  const fetchFilieres = async () => {
    setLoading(true); try { const res = await fetch('/api/filieres'); const data = await res.json(); setFilieres(data.data || data || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.nom) return;
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/filieres/${editing}` : '/api/filieres';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) { const err = await res.json(); alert(err.message || 'Erreur lors de la sauvegarde'); return; }
      await fetchFilieres(); handleCloseModal();
    } catch (e) { console.error(e); alert('Erreur réseau'); } finally { setSaving(false); }
  };

  const handleEdit = (f) => {
    setEditing(f.id);
    setFormData({ nom: f.nom, description: f.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => { if (globalThis.confirm('Supprimer ?')) { await fetch(`/api/filieres/${id}`, { method: 'DELETE' }); fetchFilieres(); } };

  const handleCloseModal = () => { setShowModal(false); setEditing(null); setFormData({ nom: '', description: '' }); };

  const filtered = [...filieres]
    .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
    .filter(f => 
      f.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: 'var(--ofppt-blue)' }}>Filières</h2>
        <Button className="btn-ofppt" onClick={() => setShowModal(true)}>+ Ajouter</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <input type="text" className="form-control mb-3" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ maxWidth: '300px' }} />
          <Table hover responsive>
            <thead className="table-light"><tr><th>Nom</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td className="fw-bold">{f.nom}</td>

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

      <Modal show={showModal} onHide={handleCloseModal} centered scrollable>
        <Modal.Header closeButton><Modal.Title>{editing ? 'Modifier' : 'Ajouter'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2"><Form.Label>Nom de la Filière</Form.Label><Form.Control type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></Form.Group>

          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Annuler</Button><Button className="btn-ofppt" onClick={handleSave} disabled={saving}>Enregistrer</Button></Modal.Footer>
      </Modal>
    </div>
  );
}

export default FilierePage;
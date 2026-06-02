import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';

function SallePage() {
  const [salles, setSalles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ nom: '', type: 'SC', equipement: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchSalles(); }, []);

  const fetchSalles = async () => {
    setLoading(true); try { const res = await fetch('/api/salles'); const data = await res.json(); setSalles(data.data || data || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.nom) return;
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/salles/${editing}` : '/api/salles';
      const payload = { ...formData, equipement: Array.isArray(formData.equipement) ? formData.equipement.join(', ') : formData.equipement };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); alert(err.message || 'Erreur lors de la sauvegarde'); return; }
      await fetchSalles(); setShowModal(false); setEditing(null);
      setFormData({ nom: '', type: 'SC', equipement: [] });
    } catch (e) { console.error(e); alert('Erreur réseau'); } finally { setSaving(false); }
  };

  const handleEdit = (s) => {
    setEditing(s.id);
    let eq = [];
    if (s.equipement) { eq = typeof s.equipement === 'string' ? s.equipement.split(',').map(e => e.trim()) : s.equipement; }
    setFormData({ nom: s.nom, type: s.type, equipement: eq });
    setShowModal(true);
  };

  const handleDelete = async (id) => { if (globalThis.confirm('Supprimer ?')) { await fetch(`/api/salles/${id}`, { method: 'DELETE' }); fetchSalles(); } };

  const handleEquipementToggle = (val) => {
    setFormData(prev => {
      const eq = prev.equipement || [];
      return textToToggle(prev, val, eq);
    });
  };

  const textToToggle = (prev, val, eq) => {
      if (eq.includes(val)) {
        return { ...prev, equipement: eq.filter(e => e !== val) };
      } else {
        return { ...prev, equipement: [...eq, val] };
      }
  };

  const filtered = [...salles]
    .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
    .filter(s => 
      s.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.equipement?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: 'var(--ofppt-blue)' }}>Salles</h2>
        <Button className="btn-ofppt" onClick={() => setShowModal(true)}>+ Ajouter</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <input type="text" className="form-control mb-3" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ maxWidth: '300px' }} />
          <Table hover responsive>
            <thead className="table-light"><tr><th>Nom</th><th>Type</th><th>Équipement</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td className="fw-bold">{s.nom}</td>
                  <td>{s.type}</td>
                  <td>{s.equipement || '-'}</td>
                  <td>
                    <div className="d-flex">
                      <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(s)}>Modifier</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)}>Supprimer</Button>
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
            <Form.Group className="mb-2"><Form.Label>Nom de la Salle</Form.Label><Form.Control type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Type</Form.Label><Form.Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="SC">SC</option><option value="SP">SP</option><option value="Amphi">Amphi</option><option value="Labo">Labo</option><option value="à distance">à distance</option></Form.Select></Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Équipements</Form.Label>
              <div className="d-flex gap-3 mt-1">
                <Form.Check type="checkbox" label="Wifi" checked={formData.equipement.includes('Wifi')} onChange={() => handleEquipementToggle('Wifi')} />
                <Form.Check type="checkbox" label="PC" checked={formData.equipement.includes('PC')} onChange={() => handleEquipementToggle('PC')} />
                <Form.Check type="checkbox" label="Projecteur" checked={formData.equipement.includes('Projecteur')} onChange={() => handleEquipementToggle('Projecteur')} />
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button><Button className="btn-ofppt" onClick={handleSave} disabled={saving}>Enregistrer</Button></Modal.Footer>
      </Modal>
    </div>
  );
}

export default SallePage;
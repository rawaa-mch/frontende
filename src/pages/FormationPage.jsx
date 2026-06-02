import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';

const FormationPage = () => {
  const [db, setDb] = useState({ formations: [], formateurs: [] }), [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false), [edit, setEdit] = useState(null), [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ formateur_id: '', date_debut: '', date_fin: '', motif: '' }), [search, setSearch] = useState('');
  const [showRes, setShowRes] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [f, fr] = await Promise.all([fetch('/api/formations'), fetch('/api/formateurs')]);
      const [fd, frd] = await Promise.all([f.json(), fr.json()]);
      setDb({ formations: fd.data || [], formateurs: frd.data || [] });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const url = edit ? `/api/formations/${edit}` : '/api/formations';
    try {
      await fetch(url, { method: edit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      load(); setShow(false); setForm({ formateur_id: '', date_debut: '', date_fin: '', motif: '' }); setSearch('');
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleEdit = (f) => {
    setEdit(f.id); setForm({ ...f, date_debut: f.date_debut?.split('T')[0], date_fin: f.date_fin?.split('T')[0] });
    setSearch(f.formateur ? `${f.formateur.nom} ${f.formateur.prenom}` : ''); setShow(true);
  };

  const filtered = db.formateurs.filter(f => `${f.nom} ${f.prenom}`.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between mb-4">
        <h2 className="fw-bold text-primary">Suivi des Formations</h2>
        <Button className="btn-ofppt" onClick={() => { setEdit(null); setForm({formateur_id:'', date_debut:'', date_fin:'', motif:''}); setSearch(''); setShow(true); }}>+ Ajouter</Button>
      </div>
      <Card className="border-0 shadow-sm"><Card.Body>
        <Table hover responsive><thead className="table-light"><tr><th>Formateur</th><th>Début</th><th>Fin</th><th>Motif</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>{(() => {
            const today = new Date().toLocaleDateString('en-CA');
            return [...db.formations]
              .sort((a, b) => {
                const endA = (a.date_fin || a.date_debut).split('T')[0];
                const endB = (b.date_fin || b.date_debut).split('T')[0];
                const isFinishedA = endA < today;
                const isFinishedB = endB < today;
                if (isFinishedA && !isFinishedB) return 1;
                if (!isFinishedA && isFinishedB) return -1;
                return new Date(b.date_debut) - new Date(a.date_debut);
              })
              .map(f => {
                const start = f.date_debut.split('T')[0];
                const end = (f.date_fin || f.date_debut).split('T')[0];
                let status = { text: 'En cours', color: 'success' };
                if (end < today) status = { text: 'Terminée', color: 'secondary' };
                else if (start > today) status = { text: 'À venir', color: 'primary' };

                return (
                  <tr key={f.id}>
                    <td>{f.formateur?.nom} {f.formateur?.prenom}</td>
                    <td>{new Date(start).toLocaleDateString()}</td>
                    <td>{f.date_fin ? new Date(end).toLocaleDateString() : '-'}</td>
                    <td>{f.motif}</td>
                    <td><Badge bg={status.color}>{status.text}</Badge></td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(f)}>Modifier</Button>
                      <Button variant="outline-danger" size="sm" onClick={async () => { if(confirm('Supprimer?')){ await fetch(`/api/formations/${f.id}`,{method:'DELETE'}); load(); }}}>Supprimer</Button>
                    </td>
                  </tr>
                );
              });
          })()}</tbody></Table>
      </Card.Body></Card>

      <Modal show={show} onHide={() => setShow(false)} centered scrollable>
        <Modal.Header closeButton><Modal.Title>{edit ? 'Modifier' : 'Ajouter'} une formation</Modal.Title></Modal.Header>
        <Modal.Body><Form>
          <Form.Group className="mb-3 position-relative"><Form.Label>Formateur</Form.Label>
            <Form.Control type="text" value={search} onFocus={() => setShowRes(true)} onChange={e => { setSearch(e.target.value); setShowRes(true); if(!e.target.value) setForm({...form, formateur_id:''}); }} placeholder="Rechercher..." />
            {showRes && search && <div className="list-group position-absolute w-100 shadow-sm" style={{zIndex:1000, maxHeight:200, overflowY:'auto'}}>
              {filtered.map(f => <button key={f.id} type="button" className="list-group-item list-group-item-action text-start" onClick={() => { setForm({...form, formateur_id:f.id}); setSearch(`${f.nom} ${f.prenom}`); setShowRes(false); }}>{f.nom} {f.prenom}</button>)}
            </div>}
          </Form.Group>
          <Form.Group className="mb-3"><Form.Label>Début</Form.Label><Form.Control type="date" value={form.date_debut} onChange={e => setForm({...form, date_debut:e.target.value})} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Fin</Form.Label><Form.Control type="date" value={form.date_fin} onChange={e => setForm({...form, date_fin:e.target.value})} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Motif</Form.Label><Form.Control as="textarea" rows={2} value={form.motif} onChange={e => setForm({...form, motif:e.target.value})} /></Form.Group>
        </Form></Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={()=>setShow(false)}>Annuler</Button><Button className="btn-ofppt" onClick={save} disabled={saving || !form.formateur_id}>Enregistrer</Button></Modal.Footer>
      </Modal>
    </div>
  );
};
export default FormationPage;

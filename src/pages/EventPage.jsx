import React, { useState } from "react";
import { Row, Col, Card, Table, Button, Modal, Form, Badge, Spinner, Alert } from "react-bootstrap";
import { useEmploi } from "../hooks/useEmploi";
import Select from "react-select";

const EventPage = () => {
  const { db, loading, error, refreshSeances, showMessage, message } = useEmploi();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    start_time: "",
    end_time: "",
    salle_id: "",
    formateur_ids: [],
    groupe_ids: []
  });

  const handleShow = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        date: event.date?.split("T")[0],
        start_time: event.start_time,
        end_time: event.end_time,
        salle_id: event.salle_id,
        formateur_ids: event.formateurs.map(f => f.id),
        groupe_ids: event.groupes.map(g => g.id)
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: "",
        date: "",
        start_time: "",
        end_time: "",
        salle_id: "",
        formateur_ids: [],
        groupe_ids: []
      });
    }
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
    const method = editingEvent ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        await refreshSeances();
        handleClose();
        showMessage("success", data.message);
      } else {
        showMessage("danger", data.message || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      showMessage("danger", err.message || "Erreur réseau");
    }
  };

  const handleDelete = async (id) => {
    if (!globalThis.confirm("Supprimer cet événement ?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await refreshSeances();
        showMessage("success", data.message);
      }
    } catch (err) {
      showMessage("danger", err.message || "Erreur lors de la suppression");
    }
  };

  const filteredEvents = db.events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.salle?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupeOptions = db.groupes.map(g => ({ value: g.id, label: g.nom }));
  const formateurOptions = db.formateurs.map(f => ({ value: f.id, label: `${f.nom} ${f.prenom || ""}` }));

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;

  return (
    <div className="p-3">
      {message && <Alert variant={message.type} dismissible className="border-0 shadow-sm mb-3">{message.text}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-1">Gestion des Événements</h2>
          <p className="text-muted small mb-0">Planifiez vos séminaires, réunions et formations spéciales</p>
        </div>
        <Button className="btn-ofppt" onClick={() => handleShow()}>
          + Ajouter un événement
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="p-3 border-bottom">
            <Form.Control
              placeholder="Rechercher par titre ou salle..."
              className="w-25"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Titre</th>
                <th>Date & Heure</th>
                <th>Salle</th>
                <th>Participants</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(event => (
                <tr key={event.id}>
                  <td className="ps-3 fw-bold">{event.title}</td>
                  <td>
                    <div className="small fw-600">{new Date(event.date).toLocaleDateString()}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>{event.start_time} - {event.end_time}</div>
                  </td>
                  <td><Badge bg="info" className="fw-500">{event.salle?.nom}</Badge></td>
                  <td>
                    <div className="small text-muted mb-1">
                      {event.groupes?.length} groupes · {event.formateurs?.length} formateurs
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {event.groupes.slice(0, 2).map(g => <Badge key={g.id} bg="light" text="dark" className="border" style={{ fontSize: "9px" }}>{g.nom}</Badge>)}
                      {event.groupes.length > 2 && <span className="x-small text-muted">+{event.groupes.length - 2}</span>}
                    </div>
                  </td>
                  <td className="text-end pe-3">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShow(event)}>Modifier</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(event.id)}>Supprimer</Button>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr><td colSpan="5" className="text-center py-5 text-muted">Aucun événement trouvé</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{editingEvent ? "Modifier" : "Ajouter"} un Événement</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4">
            <Row>
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">Titre de l'événement</Form.Label>
                  <Form.Control
                    required
                    placeholder="Ex: Séminaire de fin de module"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">Date</Form.Label>
                  <Form.Control type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">Début</Form.Label>
                  <Form.Control type="time" required value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">Fin</Form.Label>
                  <Form.Control type="time" required value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">Salle</Form.Label>
                  <Form.Select required value={formData.salle_id} onChange={(e) => setFormData({ ...formData, salle_id: e.target.value })}>
                    <option value="">Sélectionner une salle</option>
                    {db.salles.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">Groupes participants</Form.Label>
                  <Select
                    isMulti
                    options={groupeOptions}
                    placeholder="Rechercher..."
                    value={groupeOptions.filter(opt => formData.groupe_ids.includes(opt.value))}
                    onChange={(selected) => setFormData({ ...formData, groupe_ids: selected ? selected.map(s => s.value) : [] })}
                  />
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="small fw-bold">Formateurs</Form.Label>
                  <Select
                    isMulti
                    options={formateurOptions}
                    placeholder="Rechercher..."
                    value={formateurOptions.filter(opt => formData.formateur_ids.includes(opt.value))}
                    onChange={(selected) => setFormData({ ...formData, formateur_ids: selected ? selected.map(s => s.value) : [] })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Annuler</Button>
            <Button className="btn-ofppt" type="submit">Enregistrer</Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <style>{`
        .fw-600 { font-weight: 600; }
        .fw-500 { font-weight: 500; }
        .x-small { font-size: 10px; }
      `}</style>
    </div>
  );
};

export default EventPage;

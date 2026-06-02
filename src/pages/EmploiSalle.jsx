import React from "react";
import { Form, Button, Alert, Spinner, Badge, Dropdown } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { useEmploi, JOURS, SLOTS, calcDuree } from "../hooks/useEmploi";
import logoOfppt from "../assets/Logo-OFPPT.png";

// ─── QuickAdd (spécifique à la vue Salle) ────────────────────────────────────
const QuickAdd = ({
  salleId,
  jour,
  date,
  slot,
  db,
  onSave,
  onCancel,
  initialData,
}) => {
  const [values, setValues] = React.useState(
    initialData
      ? {
          formateur_id: initialData.formateur_id,
          groupe_id: initialData.groupe_id,
          module_id: initialData.module_id,
          type: initialData.type,
        }
      : { formateur_id: "", groupe_id: "", module_id: "", type: "cours" },
  );
  const [selectedGroupes, setSelectedGroupes] = React.useState(
    initialData ? [Number.parseInt(initialData.groupe_id)] : [],
  );

  const calculateRemaining = (groupeId, moduleId) => {
    if (!groupeId || !moduleId) return null;
    const module = db.modules.find((m) => m.id === Number.parseInt(moduleId));
    if (!module) return 0;
    const consomme = db.seances
      .filter(
        (s) =>
          s.groupe_id === Number.parseInt(groupeId) &&
          s.module_id === Number.parseInt(moduleId) &&
          s.validee === true,
      )
      .reduce((acc, s) => acc + calcDuree(s.debut, s.fin), 0);
    return module.masse_horaire - consomme;
  };

  const reste = calculateRemaining(values.groupe_id, values.module_id);
  const isEFMRequired = reste !== null && reste <= 2.5 && reste > 0;

  React.useEffect(() => {
    if (isEFMRequired) setValues((v) => ({ ...v, type: "efm" }));
  }, [isEFMRequired]);

  const seancesExistantes = db.seances.filter(
    (s) =>
      s.date?.split("T")[0] === date &&
      s.debut?.substring(0, 5) === slot.start &&
      (!initialData || s.id !== initialData.id),
  );
  const isReady =
    values.formateur_id &&
    values.groupe_id &&
    values.module_id &&
    reste !== null &&
    (isEFMRequired ||
      reste >= slot.duree ||
      Math.abs(reste - slot.duree) < 0.1);

  const prof = db.formateurs.find(
    (f) => f.id === Number.parseInt(values.formateur_id),
  );
  const availableModules =
    prof?.modules?.length > 0
      ? db.modules.filter((m) => prof.modules.some((pm) => pm.id === m.id))
      : db.modules;

  return (
    <div
      className="bg-light p-2 border rounded shadow-sm"
      style={{ width: "130px" }}
    >
      <Form.Select
        size="sm"
        className="mb-1"
        value={values.formateur_id}
        onChange={(e) =>
          setValues({ ...values, formateur_id: e.target.value, module_id: "" })
        }
        style={{ fontSize: "10px" }}
      >
        <option value="">Formateur</option>
        {db.formateurs.map((f) => {
          const conflictingSeance = seancesExistantes.find(
            (s) => s.formateur_id === f.id,
          );
          let isOcc = !!conflictingSeance;

          if (
            conflictingSeance &&
            values.type === "teams" &&
            conflictingSeance.type === "teams" &&
            conflictingSeance.module_id === Number.parseInt(values.module_id)
          ) {
            isOcc = false;
          }

          let occGroupNom = "";
          if (isOcc && conflictingSeance) {
            const grp = db.groupes.find(
              (g) => g.id === conflictingSeance.groupe_id,
            );
            occGroupNom = grp ? grp.nom : "";
          }

          return (
            <option
              key={f.id}
              value={f.id}
              disabled={isOcc}
              style={{
                fontWeight: isOcc ? "normal" : "800",
                color: isOcc ? "red" : "#000",
              }}
            >
              {f.nom} {f.prenom || ""}{" "}
              {isOcc ? `(Occupé par ${occGroupNom})` : ""}
            </option>
          );
        })}
      </Form.Select>
      <Form.Select
        size="sm"
        className="mb-1"
        value={values.groupe_id}
        onChange={(e) => setValues({ ...values, groupe_id: e.target.value })}
        style={{ fontSize: "10px" }}
      >
        <option value="">Groupe</option>
        {db.groupes.map((g) => {
          const conflictingSeance = seancesExistantes.find(
            (s) => s.groupe_id === g.id,
          );
          const isOcc = !!conflictingSeance;
          let occProfNom = "";
          if (isOcc && conflictingSeance) {
            const p = db.formateurs.find(
              (f) => f.id === conflictingSeance.formateur_id,
            );
            occProfNom = p ? `${p.nom} ${p.prenom || ""}`.trim() : "";
          }
          return (
            <option
              key={g.id}
              value={g.id}
              disabled={isOcc}
              style={{
                fontWeight: isOcc ? "normal" : "800",
                color: isOcc ? "red" : "#000",
              }}
            >
              {g.nom} {isOcc ? `(Occupé avec ${occProfNom})` : ""}
            </option>
          );
        })}
      </Form.Select>
      <Form.Select
        size="sm"
        className="mb-1"
        value={values.module_id}
        onChange={(e) => setValues({ ...values, module_id: e.target.value })}
        style={{ fontSize: "10px" }}
      >
        <option value="">Module</option>
        {availableModules.map((m) => {
          const reste = calculateRemaining(values.groupe_id, m.id);
          return (
            <option
              key={m.id}
              value={m.id}
              style={{ fontWeight: "800", color: "#000" }}
            >
              {m.nom} ({reste ?? "?"}h)
            </option>
          );
        })}
      </Form.Select>
      <Form.Select
        size="sm"
        className="mb-2"
        value={values.type}
        onChange={(e) => setValues({ ...values, type: e.target.value })}
        style={{ fontSize: "10px" }}
      >
        {isEFMRequired ? (
          <option value="efm">EFM</option>
        ) : (
          <>
            <option value="cours">Cours</option>
            <option value="controle">Contrôle</option>
            <option value="teams">Teams</option>
            <option value="efm">EFM</option>
            <option value="eff">EFF</option>
          </>
        )}
      </Form.Select>

      {values.type === "teams" && (
        <div className="mb-2">
          <div className="fw-bold mb-1" style={{ fontSize: "9px" }}>
            Sélectionner les groupes :
          </div>
          <Form.Select
            multiple
            size="sm"
            style={{ fontSize: "9px", height: "80px" }}
            value={selectedGroupes.map(String)}
            onChange={(e) => {
              const options = [...e.target.options];
              const selected = options
                .filter((o) => o.selected)
                .map((o) => Number.parseInt(o.value));
              setSelectedGroupes(selected);
            }}
          >
            {db.groupes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom}
              </option>
            ))}
          </Form.Select>
          <div className="text-muted mt-1" style={{ fontSize: "8px" }}>
            Maintenir Ctrl pour plusieurs
          </div>
        </div>
      )}
      <div className="d-flex gap-1">
        <Button
          variant="success"
          size="sm"
          className="w-100 py-0"
          onClick={() => {
            let sid = salleId;
            if (values.type === "teams") {
              const remoteSalle = db.salles.find(
                (s) =>
                  s.type === "à distance" ||
                  s.nom.toLowerCase().includes("teams"),
              );
              if (remoteSalle) sid = remoteSalle.id;
            }

            if (values.type === "teams" && selectedGroupes.length > 0) {
              const schedule = selectedGroupes.map((gid) => ({
                date,
                debut: slot.start,
                fin: slot.end,
                type: values.type,
                groupe_id: gid,
                formateur_id: Number.parseInt(values.formateur_id),
                module_id: Number.parseInt(values.module_id),
                salle_id: sid,
              }));
              handleSaveBulk(schedule);
            } else {
              onSave(
                {
                  date,
                  debut: slot.start,
                  fin: slot.end,
                  type: values.type,
                  salle_id: sid,
                  formateur_id: Number.parseInt(values.formateur_id),
                  groupe_id: Number.parseInt(values.groupe_id),
                  module_id: Number.parseInt(values.module_id),
                },
                initialData?.id,
              );
            }
          }}
          disabled={
            !isReady &&
            !(
              values.type === "teams" &&
              selectedGroupes.length > 0 &&
              values.formateur_id &&
              values.module_id
            )
          }
        >
          {initialData ? "OK" : "Ajout"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="py-0"
          onClick={onCancel}
        >
          ✗
        </Button>
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
function EmploiSalle() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    db,
    loading,
    error,
    selectedDate,
    editingCell,
    message,
    setEditingCell,
    refreshSeances,
    getDateForJour,
    semainePrecedente,
    semaineSuivante,
    handleSaveSeance,
    handleSaveBulk,
    handleDeleteSeance,
    handleValiderSeance,
    exportExcel,
    handleClearAll,
    setSelectedDate,
  } = useEmploi();

  React.useEffect(() => {
    if (location.state?.week) {
      setSelectedDate(location.state.week);
    }
  }, [location.state, setSelectedDate]);

  const handleValiderTout = async () => {
    if (!globalThis.confirm("Valider toutes les séances de la semaine ?")) return;
    const end = new Date(selectedDate);
    end.setDate(end.getDate() + 6);
    const res = await fetch("/api/seances/valider-tout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_debut: selectedDate,
        date_fin: end.toISOString().split("T")[0],
      }),
    });
    if (res.ok) {
      await refreshSeances();
    }
  };

  const getSeanceForCell = (sId, jour, slot) => {
    const date = getDateForJour(jour);

    // Check for regular session
    const seance = db.seances.find(
      (se) =>
        se.salle_id === sId &&
        se.date?.split("T")[0] === date &&
        se.debut?.substring(0, 5) === slot.start,
    );
    if (seance) return { ...seance, _isEvent: false };

    // Check for event
    const event = db.events.find((ev) => {
      const evDate = ev.date?.split("T")[0];
      const isSameDate = evDate === date;
      if (!isSameDate) return false;

      const evStart = ev.start_time?.substring(0, 5);
      const evEnd = ev.end_time?.substring(0, 5);
      const isOverlapping = evStart < slot.end && evEnd > slot.start;

      const isSameSalle = ev.salle_id === sId;
      return isOverlapping && isSameSalle;
    });

    if (event) return { ...event, _isEvent: true };
    return null;
  };

  const handleExcel = () =>
    exportExcel(
      [
        "Salle",
        "Jour",
        "Date",
        "Début",
        "Fin",
        "Formateur",
        "Groupe",
        "Module",
        "Type",
        "Validée",
      ],
      (s, dayName) => [
        s.salle?.nom || "",
        dayName,
        s.date?.split("T")[0] || "",
        s.debut || "",
        s.fin || "",
        s.formateur
          ? `${s.formateur.nom} ${s.formateur.prenom || ""}`.trim()
          : "",
        s.groupe?.nom || "",
        s.module?.nom || "",
        s.type || "",
        s.validee ? "Oui" : "Non",
      ],
      "planning_salle",
    );

  if (loading)
    return (
      <div className="text-center py-5 no-print">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  if (error)
    return (
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );



  return (
    <div className="p-3 bg-white" style={{ minHeight: "100vh" }}>
      {/* Barre de navigation */}
      <div className="mb-4 no-print">
        <h2
          style={{
            color: "var(--ofppt-blue)",
            fontWeight: "bold",
            marginBottom: "15px",
          }}
        >
          Planning Salles
        </h2>
        <div className="d-flex gap-2 align-items-center">
          <Dropdown align="start" className="me-2">
            <Dropdown.Toggle
              variant="light"
              id="dropdown-basic"
              size="sm"
              className="border-0 bg-transparent p-1"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow border-0">
              <Dropdown.Header className="fw-bold text-primary">
                Actions
              </Dropdown.Header>
              <Dropdown.Item
                as="button"
                onClick={handleValiderTout}
                className="text-success small fw-bold"
              >
                <i className="bi bi-check-all me-2"></i>Valider la semaine
              </Dropdown.Item>
              <Dropdown.Item as="button" onClick={handleExcel} className="small">
                <i className="bi bi-file-earmark-excel me-2"></i>Exporter Excel
              </Dropdown.Item>
              <Dropdown.Item as="button"               onClick={() => globalThis.print()} className="small">
                <i className="bi bi-file-earmark-pdf me-2"></i>Imprimer PDF
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                as="button"
                onClick={() => navigate("/emploi-ia")}
                className="text-info small fw-bold"
              >
                <i className="bi bi-robot me-2"></i>Générer automatiquement
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                as="button"
                onClick={handleClearAll}
                className="text-danger small"
              >
                <i className="bi bi-trash me-2"></i>Vider tout l'emploi
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={semainePrecedente}
          >
            &lt;
          </Button>
          <span className="small px-2 fw-bold">
            Du {new Date(selectedDate).toLocaleDateString()}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={semaineSuivante}
          >
            &gt;
          </Button>
        </div>
      </div>

      {/* En-tête impression */}
      <div className="print-header d-none d-print-block mb-3 text-center">
        <div className="pb-2 border-bottom">
          <img src={logoOfppt} alt="OFPPT" style={{ height: "75px", marginBottom: "8px" }} />
          <h6 className="fw-bold m-0" style={{ fontSize: "12px", color: "#1e293b" }}>
            CF Ain Chock
          </h6>
          <div className="fw-semibold mb-2" style={{ fontSize: "11px", color: "#475569" }}>
            ISTA NTIC Sidi Maarouf
          </div>
          <div className="print-title fw-bold text-uppercase" style={{ fontSize: "15px", color: "#0f2f5b", letterSpacing: "0.5px" }}>
            Emploi du Temps Salles
          </div>
          <div className="print-subtitle fw-medium" style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
            Semaine du {new Date(selectedDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {message && (
        <Alert variant={message.type} className="py-2 no-print">
          {message.text}
        </Alert>
      )}

      <div
        className="table-responsive"
        style={{ maxHeight: "calc(100vh - 180px)" }}
      >
        <table
          className="table table-bordered table-sm table-sticky"
          style={{ minWidth: "100%", width: "100%", fontSize: "11px" }}
        >
          <thead>
            <tr
              className="bg-primary text-white"
              style={{ backgroundColor: "#0055A2" }}
            >
              <th
                rowSpan="2"
                className="sticky-col-header text-white"
                style={{ verticalAlign: "middle", backgroundColor: "#0055A2" }}
              >
                Salles
              </th>
              {JOURS.map((j, idx) => (
                <th
                  key={j}
                  colSpan={SLOTS.length}
                  className="text-center print-day-header"
                  style={{
                    backgroundColor: "#0055A2",
                    color: "white",
                  }}
                >
                  {j}
                  <br />
                  <small className="text-white">{getDateForJour(j)}</small>
                </th>
              ))}
            </tr>
            <tr className="text-white" style={{ backgroundColor: "#004a8f" }}>
              {JOURS.map((j) =>
                SLOTS.map((s) => (
                  <th
                    key={`${j}-${s.start}`}
                    className="text-center print-slot-header"
                    style={{
                      fontSize: "9px",
                      color: "white",
                      backgroundColor: "#004a8f",
                    }}
                  >
                    {s.label}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {db.salles.map((salle) => (
              <tr key={salle.id}>
                <td
                  className="fw-bold bg-light sticky-col"
                  style={{ width: "120px" }}
                >
                  {salle.nom}
                </td>
                {JOURS.map((jour) =>
                  SLOTS.map((slot) => {
                    const seance = getSeanceForCell(salle.id, jour, slot);
                    const isEditing =
                      editingCell?.salleId === salle.id &&
                      editingCell?.jour === jour &&
                      editingCell?.slotStart === slot.start;

                    if (isEditing)
                      return (
                        <td
                          key={`${salle.id}-${jour}-${slot.start}`}
                          className="bg-light no-print"
                        >
                          <QuickAdd
                            salleId={salle.id}
                            jour={jour}
                            date={getDateForJour(jour)}
                            slot={slot}
                            db={db}
                            onSave={handleSaveSeance}
                            onSaveBulk={handleSaveBulk}
                            onCancel={() => setEditingCell(null)}
                            initialData={editingCell.initialData}
                          />
                        </td>
                      );

                    if (seance) {
                      const isEFM = seance.type === "efm";
                      const isTeams = seance.type === "teams";
                      const cellClasses = [
                        "print-cell",
                        isEFM && isTeams ? "print-efm-teams" : "",
                        isEFM && !isTeams ? "print-efm" : "",
                        isTeams && !isEFM ? "print-teams" : "",
                        seance._isEvent ? "print-event" : "",
                        !isEFM && !isTeams && !seance._isEvent ? "print-normal" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <td
                          key={`${salle.id}-${jour}-${slot.start}`}
                          className={cellClasses}
                          style={{
                            backgroundColor: seance._isEvent
                              ? "#e7f3ff"
                              : seance.type === "efm"
                                ? "#fff3cd"
                                : "white",
                            minWidth: "100px",
                            borderLeft: seance._isEvent
                              ? "4px solid #0055A2"
                              : "",
                          }}
                        >
                          <div className="p-1 h-100 d-flex flex-column">
                            {seance._isEvent ? (
                              <>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <Badge
                                    bg="primary"
                                    style={{ fontSize: "8px" }}
                                  >
                                    ÉVÉNEMENT
                                  </Badge>
                                </div>
                                <div
                                  className="fw-bold text-dark mb-1"
                                  style={{ fontSize: "10px" }}
                                >
                                  {seance.title}
                                </div>
                                <div
                                  className="text-muted"
                                  style={{ fontSize: "9px" }}
                                >
                                  {seance.formateurs
                                    ?.map((f) => f.nom)
                                    .join(", ")}
                                </div>
                                <div
                                  className="mt-auto pt-1 d-flex justify-content-between align-items-center"
                                  style={{ fontSize: "9px" }}
                                >
                                  <span className="fw-bold text-success">
                                    {seance.groupes
                                      ?.map((g) => g.nom)
                                      .join(", ")}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="d-flex justify-content-between align-items-center mb-1 no-print">
                                  <Badge
                                    bg={seance.validee ? "success" : "warning"}
                                    text={seance.validee ? "white" : "dark"}
                                    style={{ fontSize: "8px" }}
                                  >
                                    {seance.validee ? "Validée" : "À valider"}
                                  </Badge>
                                  {seance.type === "efm" && (
                                    <Badge
                                      bg="danger"
                                      style={{ fontSize: "8px" }}
                                    >
                                      EFM
                                    </Badge>
                                  )}
                                </div>

                                <div className="d-print-block d-none mb-1">
                                  <div
                                    className="fw-bold"
                                    style={{
                                      fontSize: "10px",
                                      color:
                                        seance.type === "efm"
                                          ? "#dc3545"
                                          : "black",
                                    }}
                                  >
                                    {seance.type === "efm" ? "EFM" : ""}
                                  </div>
                                </div>

                                <div
                                  className="fw-bold text-primary mb-1 print-text-main"
                                  style={{ fontSize: "11px" }}
                                >
                                  {seance.formateur
                                    ? `${seance.formateur.nom} ${seance.formateur.prenom || ""}`
                                    : ""}
                                </div>
                                <div
                                  className="fw-bold text-success print-text-sub"
                                  style={{ fontSize: "10px" }}
                                >
                                  {seance.groupe?.nom}
                                </div>
                                <div
                                  className="text-muted small print-text-sub"
                                  style={{ fontSize: "10px" }}
                                >
                                  {seance.module?.nom || ""}
                                </div>
                                <div className="d-grid gap-1 mt-2 no-print">
                                  {!seance.validee && (
                                    <div className="d-flex gap-1">
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="py-0 px-1 flex-grow-1"
                                        style={{ fontSize: "9px" }}
                                        onClick={() =>
                                          setEditingCell({
                                            salleId: salle.id,
                                            jour,
                                            slotStart: slot.start,
                                            initialData: seance,
                                          })
                                        }
                                      >
                                        Modif
                                      </Button>
                                      <Button
                                        variant="outline-success"
                                        size="sm"
                                        className="py-0 px-1 flex-grow-1"
                                        style={{ fontSize: "9px" }}
                                        onClick={() =>
                                          handleValiderSeance(seance.id)
                                        }
                                      >
                                        Valider
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="py-0 px-1"
                                    style={{ fontSize: "9px" }}
                                    onClick={() =>
                                      handleDeleteSeance(seance.id)
                                    }
                                  >
                                    Supprimer
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${salle.id}-${jour}-${slot.start}`}
                        className="text-center align-middle cursor-pointer print-empty"
                        onClick={() =>
                          setEditingCell({
                            salleId: salle.id,
                            jour,
                            slotStart: slot.start,
                          })
                        }
                        style={{ color: "#eee" }}
                      >
                        <span className="no-print">+</span>
                      </td>
                    );
                  }),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @page {
          size: A4 landscape;
          margin: 5mm;
        }
        .table-sticky thead th {
          position: sticky;
          z-index: 10;
          color: white !important;
        }
        .table-sticky .print-day-header,
        .table-sticky .sticky-col-header {
          top: 0;
          background-color: #023B75 !important;
        }
        .table-sticky .print-slot-header {
          top: 34px;
          background-color: #012b56 !important;
        }
        .table-sticky .sticky-col {
          position: sticky;
          left: 0;
          z-index: 5;
          background-color: #f8f9fa !important;
          border-right: 2px solid #dee2e6 !important;
        }
        .table-sticky .sticky-col-header {
          position: sticky;
          left: 0;
          top: 0;
          z-index: 15 !important;
          background-color: #023B75 !important;
          color: white !important;
        }
        @media print {
          .no-print { display: none !important; }
          .d-print-block { display: block !important; }
          .table-sticky thead th, .table-sticky .sticky-col, .table-sticky .sticky-col-header {
            position: static !important;
            background-color: #023B75 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-slot-header {
            background-color: #012b56 !important;
          }
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .table {
            width: 100% !important;
            min-width: 100% !important;
            table-layout: fixed;
            border: 1px solid #333 !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #333 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            padding: 2px !important;
            word-wrap: break-word;
            overflow: hidden;
          }
          .print-day-header {
            background-color: #023B75 !important;
            color: white !important;
            font-size: 8.5px !important;
            font-weight: bold !important;
            text-align: center !important;
          }
          .print-slot-header {
            background-color: #012b56 !important;
            color: white !important;
            font-size: 7px !important;
            text-align: center !important;
            padding: 1px !important;
          }
          .sticky-col {
            background-color: #023B75 !important;
            color: white !important;
            font-weight: bold !important;
            font-size: 7.5px !important;
          }
          .sticky-col div {
            color: white !important;
          }
          .print-text-main {
            font-size: 7.5px !important;
            font-weight: bold !important;
            color: #023B75 !important;
            line-height: 1.1 !important;
          }
          .print-text-sub {
            font-size: 6.5px !important;
            color: #333 !important;
            line-height: 1.1 !important;
          }
          .print-cell {
            height: 48px !important;
            vertical-align: middle !important;
            padding: 1px !important;
          }
          .badge {
            border: 1px solid #ccc !important;
            color: black !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  );
}

export default EmploiSalle;

import React from "react";
import { Form, Button, Alert, Spinner, Badge, Dropdown } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import { useEmploi, JOURS, SLOTS, calcDuree } from "../hooks/useEmploi";
import logoOfppt from "../assets/Logo-OFPPT.png";

const GROUP_COLUMN_WIDTH = "120px";
const GROUP_COLUMN_PRINT_MIN_WIDTH = "40px";

// ─── QuickAdd (spécifique à la vue Groupe) ────────────────────────────────────
const QuickAdd = ({
  groupeId,
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
          module_id: initialData.module_id,
          salle_id: initialData.salle_id,
          type: initialData.type,
        }
      : { formateur_id: "", module_id: "", salle_id: "", type: "cours" },
  );
  const [selectedGroupes, setSelectedGroupes] = React.useState([
    Number.parseInt(groupeId),
  ]);

  const calculateRemaining = (moduleId) => {
    if (!moduleId) return null;
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

  const reste = calculateRemaining(values.module_id);
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
    values.module_id &&
    (values.type === "teams" || values.salle_id) &&
    reste !== null &&
    (isEFMRequired ||
      reste >= slot.duree ||
      Math.abs(reste - slot.duree) < 0.1);

  // Filtrer les affectations pour ce groupe
  const groupeAffectations =
    db.affectations?.filter((a) => a.groupe_id == groupeId) || [];

  // On filtre les formateurs : si affectations existent, on restreint.
  const availableFormateurs =
    groupeAffectations.length > 0
      ? db.formateurs.filter((f) =>
          groupeAffectations.some((a) => a.formateur_id == f.id),
        )
      : db.formateurs;

  // Idem pour les modules
  const availableModules =
    groupeAffectations.length > 0
      ? db.modules.filter((m) =>
          groupeAffectations.some(
            (a) =>
              a.module_id == m.id &&
              (!values.formateur_id || a.formateur_id == values.formateur_id),
          ),
        )
      : db.modules;

  const groupOptions = db.groupes.map((g) => ({
    value: g.id,
    label: g.nom,
    isDisabled: g.id === Number.parseInt(groupeId),
  }));

  return (
    <div
      className="bg-light p-2 border rounded shadow-sm"
      style={{ width: "160px" }}
    >
      <Form.Select
        size="sm"
        className="mb-2"
        value={values.type}
        onChange={(e) =>
          setValues({
            ...values,
            type: e.target.value,
            salle_id: e.target.value === "teams" ? "" : values.salle_id,
          })
        }
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
        {availableFormateurs.map((f) => {
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
        value={values.salle_id}
        onChange={(e) => setValues({ ...values, salle_id: e.target.value })}
        disabled={values.type === "teams"}
        style={{
          fontSize: "10px",
          backgroundColor: values.type === "teams" ? "#e9ecef" : "white",
        }}
      >
        <option value="">
          {values.type === "teams" ? "Distance" : "Salle"}
        </option>
        {db.salles.map((s) => {
          const conflictingSeance = seancesExistantes.find(
            (se) => se.salle_id === s.id,
          );
          const isOcc = !!conflictingSeance;
          let occGroupNom = "";
          if (isOcc && conflictingSeance) {
            const grp = db.groupes.find(
              (g) => g.id === conflictingSeance.groupe_id,
            );
            occGroupNom = grp ? grp.nom : "";
          }
          return (
            <option
              key={s.id}
              value={s.id}
              disabled={isOcc}
              style={{
                fontWeight: isOcc ? "normal" : "800",
                color: isOcc ? "red" : "#000",
              }}
            >
              {s.nom} {isOcc ? `(Occupé par ${occGroupNom})` : ""}
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
          const reste = calculateRemaining(m.id);
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

      {values.type === "teams" && (
        <div className="mb-2">
          <div className="fw-bold mb-1" style={{ fontSize: "9px" }}>
            Groupes :
          </div>
          <Select
            isMulti
            options={groupOptions}
            placeholder="Groupes"
            value={groupOptions.filter((o) =>
              selectedGroupes.includes(o.value),
            )}
            onChange={(selected) => {
              const vals = selected ? selected.map((s) => s.value) : [];
              if (!vals.includes(Number.parseInt(groupeId)))
                vals.push(Number.parseInt(groupeId));
              setSelectedGroupes(vals);
            }}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "25px",
                fontSize: "10px",
              }),
              menu: (base) => ({ ...base, fontSize: "10px" }),
            }}
          />
        </div>
      )}
      <div className="d-flex gap-1">
        <Button
          variant="success"
          size="sm"
          className="w-100 py-0"
          onClick={() =>
            onSave(
              {
                date,
                debut: slot.start,
                fin: slot.end,
                type: values.type,
                formateur_id: Number.parseInt(values.formateur_id),
                groupe_ids: selectedGroupes,
                module_id: Number.parseInt(values.module_id),
                salle_id: values.salle_id ? Number.parseInt(values.salle_id) : null,
              },
              initialData?.id,
            )
          }
          disabled={!isReady}
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
function EmploiGroupe() {
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
    handleDeleteSeance,
    handleValiderSeance,
    exportExcel,
    handleClearAll,
    setSelectedDate,
  } = useEmploi({ filieres: "/api/filieres" });

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

  const getSeanceForCell = (gId, jour, slot) => {
    const date = getDateForJour(jour);

    // Check for regular session
    const seance = db.seances.find(
      (se) =>
        se.groupe_id === gId &&
        se.date?.split("T")[0] === date &&
        se.debut?.substring(0, 5) === slot.start,
    );
    if (seance) {
      if (seance.type === "teams") {
        const relatedIds = db.seances
          .filter(
            (s) =>
              s.formateur_id === seance.formateur_id &&
              s.date?.split("T")[0] === date &&
              s.debut?.substring(0, 5) === slot.start,
          )
          .map((s) => s.id);
        return { ...seance, _ids: relatedIds, _isEvent: false };
      }
      return { ...seance, _isEvent: false };
    }

    // Check for event
    const event = db.events.find((ev) => {
      const evDate = ev.date?.split("T")[0];
      const isSameDate = evDate === date;
      if (!isSameDate) return false;

      // Overlap logic: event starts before slot ends AND event ends after slot starts
      const evStart = ev.start_time?.substring(0, 5);
      const evEnd = ev.end_time?.substring(0, 5);
      const isOverlapping = evStart < slot.end && evEnd > slot.start;

      const belongsToGroup = ev.groupes?.some((g) => g.id === gId);
      return isOverlapping && belongsToGroup;
    });

    if (event) return { ...event, _isEvent: true };
    return null;
  };

  const handleExcel = () =>
    exportExcel(
      [
        "Groupe",
        "Jour",
        "Date",
        "Début",
        "Fin",
        "Formateur",
        "Module",
        "Salle",
        "Type",
        "Validée",
      ],
      (s, dayName) => [
        s.groupe?.nom || "",
        dayName,
        s.date?.split("T")[0] || "",
        s.debut || "",
        s.fin || "",
        s.formateur
          ? `${s.formateur.nom} ${s.formateur.prenom || ""}`.trim()
          : "",
        s.module?.nom || "",
        s.salle?.nom || "",
        s.type || "",
        s.validee ? "Oui" : "Non",
      ],
      "planning_groupe",
    );

  const handlePdfExport = () => {
    document.body.classList.add("print-mode");

    const cleanup = () => {
      document.body.classList.remove("print-mode");
      globalThis.removeEventListener("afterprint", cleanup);
    };

    globalThis.addEventListener("afterprint", cleanup);
    globalThis.setTimeout(() => globalThis.print(), 50);
  };

  const calculateGroupWeeklyHours = (gId) => {
    const currentWeekDates = new Set(JOURS.map((j) => getDateForJour(j)));
    return db.seances
      .filter(
        (s) =>
          s.groupe_id === gId &&
          currentWeekDates.has(s.date?.split("T")[0]),
      )
      .reduce((acc, s) => acc + calcDuree(s.debut, s.fin), 0);
  };

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

  const groupesParFiliere = db.filieres
    .map((filiere) => ({
      ...filiere,
      groupes: db.groupes.filter((g) => g.filiere_id === filiere.id),
    }))
    .filter((f) => f.groupes.length > 0);



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
          Planning Groupes
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
              <Dropdown.Item as="button" onClick={handlePdfExport} className="small">
                <i className="bi bi-file-earmark-pdf me-2"></i>Exporter PDF
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

      {message && (
        <Alert variant={message.type} className="py-2 no-print">
          {message.text}
        </Alert>
      )}

      {/* Tables par filière */}
      <div>
        {groupesParFiliere.map((filiere) => (
          <div key={filiere.id} className="filiere-section mb-5">
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
                  Emploi du Temps — {filiere.nom}
                </div>
                <div className="print-subtitle fw-medium" style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                  Semaine du {new Date(selectedDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            <h5
              className="mb-3 p-2 bg-light border-start border-4 border-primary fw-bold no-print"
              style={{ fontSize: "1.1rem" }}
            >
              {filiere.nom}
            </h5>
            <div style={{ overflow: "visible" }}>
              <table
                className="table table-bordered table-sm table-sticky filiere-table"
                style={{ minWidth: "100%", width: "100%", fontSize: "11px" }}
              >
                <colgroup>
                  <col
                    className="group-column-size"
                    style={{ width: GROUP_COLUMN_WIDTH }}
                  />
                </colgroup>
                <thead>
                  <tr className="print-filiere-name-row">
                    <th colSpan={1 + JOURS.length * SLOTS.length}>
                      Filière : {filiere.nom}
                    </th>
                  </tr>
                  <tr
                    className="bg-primary text-white"
                    style={{ backgroundColor: "#0055A2" }}
                  >
                    <th
                      rowSpan="2"
                      className="sticky-col-header text-white"
                      style={{
                        verticalAlign: "middle",
                        width: GROUP_COLUMN_WIDTH,
                        maxWidth: GROUP_COLUMN_WIDTH,
                        minWidth: GROUP_COLUMN_WIDTH,
                        padding: "6px 4px",
                        fontSize: "11px",
                        overflow: "hidden",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        backgroundColor: "#0055A2",
                      }}
                    >
                      Groupes
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
                  <tr
                    className="text-white"
                    style={{ backgroundColor: "#004a8f" }}
                  >
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
                  {filiere.groupes.map((groupe) => {
                    const weeklyHours = calculateGroupWeeklyHours(groupe.id);
                    return (
                      <tr key={groupe.id} className="group-row">
                        <td className="bg-light align-middle sticky-col p-0">
                          <div
                            className="fw-bold text-dark group-name-label"
                            style={{
                              fontSize: "11px",
                              lineHeight: "1.25",
                              whiteSpace: "normal",
                              overflow: "hidden",
                              wordBreak: "break-word",
                            }}
                          >
                            {groupe.nom}
                          </div>
                          <div
                            className="d-flex align-items-center gap-1 mt-1 text-muted no-print"
                            style={{ fontSize: "10px" }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                backgroundColor:
                                  weeklyHours >= 20 ? "#198754" : "#ffc107",
                              }}
                            ></span>
                            {weeklyHours}h / 30h
                          </div>
                        </td>
                        {JOURS.map((jour) =>
                          SLOTS.map((slot) => {
                            const seance = getSeanceForCell(
                              groupe.id,
                              jour,
                              slot,
                            );
                            const isEditing =
                              editingCell?.groupeId === groupe.id &&
                              editingCell?.jour === jour &&
                              editingCell?.slotStart === slot.start;

                            if (isEditing)
                              return (
                                <td
                                  key={`${groupe.id}-${jour}-${slot.start}`}
                                  className="bg-light no-print"
                                >
                                  <QuickAdd
                                    groupeId={groupe.id}
                                    jour={jour}
                                    date={getDateForJour(jour)}
                                    slot={slot}
                                    db={db}
                                    onSave={handleSaveSeance}
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

                              let bgColor = "white";
                              if (isEFM && isTeams) bgColor = "#fff3cd";
                              else if (isEFM) bgColor = "#f8d7da";
                              else if (isTeams) bgColor = "#d1e7dd";
                              else if (seance._isEvent) bgColor = "#e7f3ff";

                              return (
                                <td
                                  key={`${groupe.id}-${jour}-${slot.start}`}
                                  className={cellClasses}
                                  style={{
                                    background: `${bgColor} !important`,
                                    backgroundColor: `${bgColor} !important`,
                                    minWidth: "100px",
                                    borderLeft: seance._isEvent
                                      ? "4px solid #0055A2"
                                      : "",
                                  }}
                                >
                                  <div className="print-cell-content p-1 h-100 d-flex flex-column">
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
                                            {seance.salle?.nom}
                                          </span>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="d-flex justify-content-between align-items-center mb-1 no-print">
                                          <Badge
                                            bg={
                                              seance.validee
                                                ? "success"
                                                : "warning"
                                            }
                                            text={
                                              seance.validee ? "white" : "dark"
                                            }
                                            style={{ fontSize: "8px" }}
                                          >
                                            {seance.validee
                                              ? "Validée"
                                              : "À valider"}
                                          </Badge>
                                          <div className="d-flex gap-1">
                                            {isEFM && (
                                              <Badge
                                                bg="danger"
                                                style={{ fontSize: "8px" }}
                                              >
                                                EFM
                                              </Badge>
                                            )}
                                            {isTeams && (
                                              <Badge
                                                bg="success"
                                                style={{ fontSize: "8px" }}
                                              >
                                                TEAMS
                                              </Badge>
                                            )}
                                          </div>
                                        </div>

                                        <div className="d-print-block d-none mb-1">
                                          <div
                                            className="fw-bold"
                                            style={{
                                              fontSize: "10px",
                                              color: isEFM
                                                ? "#dc3545"
                                                : isTeams
                                                  ? "#198754"
                                                  : "black",
                                            }}
                                          >
                                            {isEFM ? "EFM" : ""}{" "}
                                            {isTeams ? "TEAMS" : ""}
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
                                          className="fw-bold text-dark mb-1 print-text-sub"
                                          style={{
                                            fontSize: "10px",
                                            lineHeight: "1.2",
                                          }}
                                        >
                                          {seance.module?.nom || ""}
                                        </div>
                                        <div
                                          className="mt-auto pt-1 d-flex justify-content-between align-items-center"
                                          style={{ fontSize: "10px" }}
                                        >
                                          <span className="fw-bold text-success print-text-sub">
                                            {isTeams
                                              ? "DISTANCE"
                                              : seance.salle?.nom}
                                          </span>
                                          {seance.type !== "cours" && (
                                            <span
                                              className="badge bg-secondary text-white no-print"
                                              style={{ fontSize: "7px" }}
                                            >
                                              {seance.type.toUpperCase()}
                                            </span>
                                          )}
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
                                                    groupeId: groupe.id,
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
                                              handleDeleteSeance(
                                                seance._ids || seance.id,
                                              )
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
                                key={`${groupe.id}-${jour}-${slot.start}`}
                                className="text-center align-middle cursor-pointer print-empty"
                                onClick={() =>
                                  setEditingCell({
                                    groupeId: groupe.id,
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
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
        .print-filiere-name-row {
          display: none;
        }
        .group-row td {
          border-top: 2px solid #dee2e6;
        }
        .print-mode .no-print { display: none !important; }
        .print-mode .d-print-block { display: block !important; }
        body.print-mode {
          background-color: white !important;
          padding: 0 !important;
          margin: 0 !important;
            font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-mode .print-header {
          margin-bottom: 10px !important;
        }
        .print-mode .print-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f2f5b;
          letter-spacing: 0.3px;
          margin: 0;
        }
        .print-mode .print-subtitle {
          font-size: 12px;
          color: #475569;
          margin: 2px 0 0;
        }
        .print-mode .table-sticky thead th,
        .print-mode .table-sticky .sticky-col-header {
          position: static !important;
          background-color: #0f2f5b !important;
          color: #ffffff !important;
          padding: 0 !important;
          font-size: 9px !important;
          overflow: hidden;
          white-space: normal;
          word-break: break-word;
        }
        .print-mode .sticky-col-header {
          width: auto !important;
          min-width: ${GROUP_COLUMN_PRINT_MIN_WIDTH} !important;
          max-width: none !important;
          white-space: nowrap !important;
        }
        .print-mode .print-slot-header {
          background-color: #1b4d8f !important;
        }
        .print-mode .table {
          width: 100% !important;
          min-width: 100% !important;
          table-layout: auto !important;
          border: 1px solid black !important;
          border-collapse: collapse !important;
        }
        .print-mode th,
        .print-mode td {
          border: 1px solid black !important;
          padding: 3px !important;
          word-wrap: break-word;
          overflow: hidden;
          color: #0f172a !important;
          line-height: 1.25 !important;
        }
        .print-mode .filiere-table {
          font-size: 9.2px !important;
        }
        .print-mode .filiere-table th,
        .print-mode .filiere-table td {
          padding: 3px !important;
        }
        .print-mode .group-row td {
          border-top: 2px solid #a9b6c8 !important;
        }
        .print-mode .group-row:nth-child(even) td {
          background-color: #ffffff !important;
        }
        .print-mode .group-row:nth-child(even) td.print-efm {
          background-color: #fdf2f2 !important;
        }
        .print-mode .group-row:nth-child(even) td.print-teams {
          background-color: #f0fdf4 !important;
        }
        .print-mode .group-row:nth-child(even) td.print-event {
          background-color: #eff6ff !important;
        }
        .print-mode .print-day-header {
          background-color: #0f2f5b !important;
          color: white !important;
          font-size: 8.5px !important;
          font-weight: 700 !important;
          text-align: center !important;
          letter-spacing: 0.3px !important;
        }
        .print-mode .print-slot-header {
          background-color: #1b4d8f !important;
          color: white !important;
          font-size: 7px !important;
          text-align: center !important;
          letter-spacing: 0.2px !important;
          border-top: 1px solid #93a4bb !important;
          padding: 1px !important;
        }
        .print-mode .sticky-col {
          background-color: #eef2f7 !important;
          color: #0f172a !important;
          font-weight: 700 !important;
        width: auto !important;
        min-width: ${GROUP_COLUMN_PRINT_MIN_WIDTH} !important;
        max-width: none !important;
        padding: 0 !important;
        overflow: visible !important;
        white-space: nowrap;
        word-break: normal;
        }
        .print-mode .group-column-size {
          width: auto !important;
          min-width: ${GROUP_COLUMN_PRINT_MIN_WIDTH} !important;
          max-width: none !important;
        }
        .print-mode .sticky-col div {
          color: #0f172a !important;
        }
        .print-mode .group-name-label {
          white-space: nowrap !important;
          word-break: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          line-height: 1.1 !important;
        }
        .print-mode .print-cell,
        .print-mode .print-empty {
          height: 48px !important;
          vertical-align: middle !important;
          padding: 1px !important;
          min-width: 44px !important;
        }
        .print-mode .print-slot-header {
          min-width: 44px !important;
        }
        .print-mode .print-cell-content {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 1px;
        }
        .print-mode .print-cell-content .mt-auto {
          margin-top: 2px !important;
        }
        .print-mode .print-text-main {
          font-size: 7.5px !important;
          font-weight: 700 !important;
          color: #0f2f5b !important;
          line-height: 1.1 !important;
        }
        .print-mode .print-text-sub {
          font-size: 6.5px !important;
          color: #334155 !important;
          line-height: 1.1 !important;
        }
        .print-mode .filiere-section {
          margin-bottom: 0 !important;
          page-break-after: auto !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-mode .filiere-section:last-child {
          page-break-after: auto !important;
        }
        .print-mode .badge {
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          background: #f1f5f9 !important;
        }
        .print-mode .filiere-table td:nth-child(6),
        .print-mode .filiere-table td:nth-child(10),
        .print-mode .filiere-table td:nth-child(14),
        .print-mode .filiere-table td:nth-child(18),
        .print-mode .filiere-table td:nth-child(22),
        .print-mode .filiere-table th:nth-child(6),
        .print-mode .filiere-table th:nth-child(10),
        .print-mode .filiere-table th:nth-child(14),
        .print-mode .filiere-table th:nth-child(18),
        .print-mode .filiere-table th:nth-child(22) {
          border-left: 2px solid #94a3b8 !important;
        }
        .print-mode .print-filiere-name-row {
          display: table-row !important;
        }
        .print-mode .print-filiere-name-row th {
          background-color: #ffffff !important;
          color: #0f2f5b !important;
          text-align: center !important;
          font-size: 16px !important;
          font-weight: 800 !important;
          padding: 8px 12px !important;
          border: 1px solid black !important;
        }
        @media print {
          .no-print { display: none !important; }
          .d-print-block { display: block !important; }
          .table-sticky thead th, .table-sticky .sticky-col-header {
            position: static !important;
            background-color: #0f2f5b !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .sticky-col-header {
            width: auto !important;
            min-width: ${GROUP_COLUMN_PRINT_MIN_WIDTH} !important;
            max-width: none !important;
            white-space: nowrap !important;
          }
          .print-slot-header {
            background-color: #1b4d8f !important;
          }
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-header {
            margin-bottom: 10px !important;
          }
          .print-filiere-name-row {
            display: table-row !important;
          }
          .print-filiere-name-row th {
            background-color: #ffffff !important;
            color: #0f2f5b !important;
            text-align: center !important;
            font-size: 16px !important;
            font-weight: 800 !important;
            padding: 8px 12px !important;
            border: 1px solid black !important;
          }
          .print-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f2f5b;
            letter-spacing: 0.3px;
          }
          .print-subtitle {
            font-size: 12px;
            color: #475569;
            margin-top: 2px;
          }
          .table {
            width: 100% !important;
            min-width: 100% !important;
            table-layout: auto !important;
            border: 1px solid black !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            padding: 3px !important;
            word-wrap: break-word;
            overflow: hidden;
            color: #0f172a !important;
            line-height: 1.25 !important;
          }
          .filiere-table {
            font-size: 9.2px !important;
          }
          .filiere-table th,
          .filiere-table td {
            padding: 3px !important;
          }
          .group-row td {
            border-top: 2px solid #a9b6c8 !important;
          }
          .group-row:nth-child(even) td {
            background-color: #ffffff !important;
          }
          .group-row:nth-child(even) td.print-efm {
            background-color: #fdf2f2 !important;
          }
          .group-row:nth-child(even) td.print-teams {
            background-color: #f0fdf4 !important;
          }
          .group-row:nth-child(even) td.print-event {
            background-color: #eff6ff !important;
          }
          .print-day-header {
            background-color: #0f2f5b !important;
            color: white !important;
            font-size: 8.5px !important;
            font-weight: 700 !important;
            text-align: center !important;
            letter-spacing: 0.3px !important;
          }
          .print-slot-header {
            background-color: #1b4d8f !important;
            color: white !important;
            font-size: 7px !important;
            text-align: center !important;
            letter-spacing: 0.2px !important;
            border-top: 1px solid #93a4bb !important;
            padding: 1px !important;
          }
          .sticky-col {
            background-color: #eef2f7 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
            width: auto !important;
            min-width: ${GROUP_COLUMN_PRINT_MIN_WIDTH} !important;
            max-width: none !important;
            padding: 0 !important;
            overflow: visible !important;
            white-space: nowrap;
            word-break: normal;
          }
          .group-column-size {
            width: auto !important;
            min-width: ${GROUP_COLUMN_PRINT_MIN_WIDTH} !important;
            max-width: none !important;
          }
          .sticky-col div {
            color: #0f172a !important;
          }
          .group-name-label {
            white-space: nowrap !important;
            word-break: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            line-height: 1.1 !important;
          }
          .print-cell,
          .print-empty {
            height: 48px !important;
            vertical-align: middle !important;
            padding: 1px !important;
            min-width: 44px !important;
          }
          .print-slot-header {
            min-width: 44px !important;
          }
          .print-cell-content {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 1px;
          }
          .print-cell-content .mt-auto {
            margin-top: 2px !important;
          }
          .print-text-main {
            font-size: 7.5px !important;
            font-weight: 700 !important;
            color: #0f2f5b !important;
            line-height: 1.1 !important;
          }
          .print-text-sub {
            font-size: 6.5px !important;
            color: #334155 !important;
            line-height: 1.1 !important;
          }
          .filiere-section {
            margin-bottom: 0 !important;
            page-break-after: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .filiere-section:last-child {
            page-break-after: auto !important;
          }

          .badge {
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            background: #f1f5f9 !important;
          }
          .filiere-table td:nth-child(6),
          .filiere-table td:nth-child(10),
          .filiere-table td:nth-child(14),
          .filiere-table td:nth-child(18),
          .filiere-table td:nth-child(22),
          .filiere-table th:nth-child(6),
          .filiere-table th:nth-child(10),
          .filiere-table th:nth-child(14),
          .filiere-table th:nth-child(18),
          .filiere-table th:nth-child(22) {
            border-left: 2px solid #94a3b8 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default EmploiGroupe;

import React from "react";
import { Form, Button, Alert, Spinner, Badge, Dropdown } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { useEmploi, JOURS, SLOTS, calcDuree } from "../hooks/useEmploi";
import logoOfppt from "../assets/Logo-OFPPT.png";
import Select, { components } from "react-select";

// Composant d'option personnalisé avec case à cocher
const CheckboxOption = (props) => {
  return (
    <components.Option {...props}>
      <div className="d-flex align-items-center gap-2">
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => {}}
          disabled={props.isDisabled}
          style={{ cursor: props.isDisabled ? "not-allowed" : "pointer" }}
        />
        <span style={{ textDecoration: props.isDisabled ? "line-through" : "none" }}>
          {props.label}
        </span>
      </div>
    </components.Option>
  );
};


// ─── QuickAdd (spécifique à la vue Formateur) ─────────────────────────────────
const QuickAdd = ({
  profId,
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
          groupe_ids: [initialData.groupe_id],
          module_id: initialData.module_id,
          salle_id: initialData.salle_id,
          type: initialData.type,
        }
      : { groupe_ids: [], module_id: "", salle_id: "", type: "cours" },
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

  const reste =
    values.groupe_ids.length > 0 && values.module_id
      ? calculateRemaining(values.groupe_ids[0], values.module_id)
      : null;
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
    values.groupe_ids.length > 0 &&
    values.module_id &&
    (values.type === "teams" || values.salle_id) &&
    reste !== null &&
    (isEFMRequired ||
      reste >= slot.duree ||
      Math.abs(reste - slot.duree) < 0.1);

  const prof = db.formateurs.find((f) => f.id === Number.parseInt(profId));

  // Filtrer les affectations pour ce prof
  const profAffectations =
    db.affectations?.filter((a) => a.formateur_id == profId) || [];

  // On filtre les groupes : si le prof a des affectations, on restreint. Sinon on montre tout.
  const availableGroups =
    profAffectations.length > 0
      ? db.groupes.filter((g) =>
          profAffectations.some((a) => a.groupe_id == g.id),
        )
      : db.groupes;

  // Options pour le Select multi-groupes
  const groupOptions = availableGroups.map((g) => {
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
    return {
      value: g.id,
      label: isOcc ? `${g.nom} (Occupé avec ${occProfNom})` : g.nom,
      isDisabled: isOcc,
    };
  });

  // Idem pour les modules
  const availableModules =
    profAffectations.length > 0
      ? db.modules.filter((m) =>
          profAffectations.some(
            (a) =>
              a.module_id == m.id &&
              (values.groupe_ids.length === 0 ||
                values.groupe_ids.includes(Number.parseInt(a.groupe_id))),
          ),
        )
      : db.modules;

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

      {values.type === "teams" ? (
        <div className="mb-1">
          <Select
            isMulti
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            components={{ Option: CheckboxOption }}
            options={groupOptions}
            placeholder="Groupes"
            value={groupOptions.filter((o) =>
              values.groupe_ids.includes(o.value),
            )}
            onChange={(selected) =>
              setValues({
                ...values,
                groupe_ids: selected ? selected.map((s) => s.value) : [],
              })
            }
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "26px",
                fontSize: "10px",
                borderColor: "#cbd5e1",
                boxShadow: "none",
                "& hover": {
                  borderColor: "#94a3b8"
                }
              }),
              menu: (base) => ({ ...base, fontSize: "10px", zIndex: 9999 }),
              option: (base, state) => ({
                ...base,
                padding: "4px 8px",
                backgroundColor: state.isFocused ? "#f1f5f9" : "white",
                color: state.isDisabled ? "#cbd5e1" : "#333",
                cursor: state.isDisabled ? "not-allowed" : "pointer",
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: "#e2e8f0",
                borderRadius: "4px",
              }),
              multiValueLabel: (base) => ({
                ...base,
                fontSize: "8.5px",
                color: "#1e293b",
                paddingLeft: "4px",
                paddingRight: "4px",
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: "#64748b",
                "& hover": {
                  backgroundColor: "#cbd5e1",
                  color: "#0f172a",
                }
              })
            }}
          />
        </div>
      ) : (
        <Form.Select
          size="sm"
          className="mb-1"
          value={values.groupe_ids[0] || ""}
          onChange={(e) =>
            setValues({
              ...values,
              groupe_ids: e.target.value ? [Number.parseInt(e.target.value)] : [],
            })
          }
          style={{ fontSize: "10px" }}
        >
          <option value="">Groupe</option>
          {availableGroups.map((g) => {
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
      )}

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
          const r =
            values.groupe_ids.length > 0
              ? calculateRemaining(values.groupe_ids[0], m.id)
              : null;
          return (
            <option
              key={m.id}
              value={m.id}
              style={{ fontWeight: "800", color: "#000" }}
            >
              {m.nom} ({r ?? "?"}h)
            </option>
          );
        })}
      </Form.Select>
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
                formateur_id: profId,
                groupe_ids: values.groupe_ids,
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
function EmploiFormateur() {
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
    handleClearAll,
    handleValiderSeance,
    exportExcel,
    setSelectedDate,
  } = useEmploi({ formations: "/api/formations" });

  React.useEffect(() => {
    if (location.state?.week) {
      setSelectedDate(location.state.week);
    }
  }, [location.state, setSelectedDate]);

  const getSeanceForCell = (pId, jour, slot) => {
    const date = getDateForJour(jour);

    // On récupère toutes les séances pour ce créneau et ce formateur
    const seances = db.seances.filter(
      (se) =>
        se.formateur_id === pId &&
        se.date?.split("T")[0] === date &&
        se.debut?.substring(0, 5) === slot.start,
    );

    if (seances.length > 0) {
      // Si c'est du Teams, on groupe les infos
      const isTeams = seances.some((s) => s.type === "teams");
      if (isTeams) {
        return {
          ...seances[0],
          _isMulti: true,
          _ids: seances.map((s) => s.id),
          _groupes: seances.map((s) => s.groupe),
          _types: [...new Set(seances.map((s) => s.type))],
        };
      }
      return { ...seances[0], _isEvent: false };
    }

    // Check for event
    const event = db.events.find((ev) => {
      const evDate = ev.date?.split("T")[0];
      const isSameDate = evDate === date;
      if (!isSameDate) return false;

      const evStart = ev.start_time?.substring(0, 5);
      const evEnd = ev.end_time?.substring(0, 5);
      const isOverlapping = evStart < slot.end && evEnd > slot.start;

      const involvesTrainer = ev.formateurs?.some((f) => f.id === pId);
      return isOverlapping && involvesTrainer;
    });

    if (event) return { ...event, _isEvent: true };
    return null;
  };

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

  const handleExcel = () =>
    exportExcel(
      [
        "Formateur",
        "Jour",
        "Date",
        "Début",
        "Fin",
        "Groupe",
        "Module",
        "Salle",
        "Type",
        "Validée",
      ],
      (s, dayName) => [
        s.formateur
          ? `${s.formateur.nom} ${s.formateur.prenom || ""}`.trim()
          : "",
        dayName,
        s.date?.split("T")[0] || "",
        s.debut || "",
        s.fin || "",
        s.groupe?.nom || "",
        s.module?.nom || "",
        s.salle?.nom || "",
        s.type || "",
        s.validee ? "Oui" : "Non",
      ],
      "planning_formateur",
    );

  const calculateProfWeeklyHours = (pId) => {
    const currentWeekDates = new Set(JOURS.map((j) => getDateForJour(j)));
    return db.seances
      .filter(
        (s) =>
          s.formateur_id === pId &&
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
          Planning Formateurs
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
              <Dropdown.Item as="button" onClick={() => globalThis.print()} className="small">
                <i className="bi bi-file-earmark-pdf me-2"></i>Imprimer PDF
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                as="button"
                onClick={() =>
                  navigate("/emploi-ia", {
                    state: { week: selectedDate, autoGenerate: true },
                  })
                }
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
            Emploi du Temps Formateurs
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

      <div style={{ overflow: "visible" }}>
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
                Enseignants
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
            {db.formateurs.map((prof) => {
              const weeklyHours = calculateProfWeeklyHours(prof.id);
              return (
                <tr key={prof.id}>
                  <td
                    className="bg-light sticky-col p-2"
                    style={{ width: "65px" }}
                  >
                    <div
                      className="fw-bold text-dark"
                      style={{ fontSize: "11px" }}
                    >
                      {prof.nom} {prof.prenom || ""}
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
                          backgroundColor: "#0d6efd",
                        }}
                      ></span>
                      {weeklyHours}h
                    </div>
                  </td>
                  {JOURS.map((jour) =>
                    SLOTS.map((slot) => {
                      const dateCell = getDateForJour(jour);
                      const isEnFormation = db.formations?.some(
                        (f) =>
                          f.formateur_id === prof.id &&
                          dateCell >= f.date_debut &&
                          dateCell <= (f.date_fin || f.date_debut),
                      );
                      const seance = getSeanceForCell(prof.id, jour, slot);
                      const isEditing =
                        editingCell?.profId === prof.id &&
                        editingCell?.jour === jour &&
                        editingCell?.slotStart === slot.start;

                      if (isEditing)
                        return (
                          <td
                            key={`${prof.id}-${jour}-${slot.start}`}
                            className="bg-light no-print"
                          >
                            <QuickAdd
                              profId={prof.id}
                              jour={jour}
                              date={dateCell}
                              slot={slot}
                              db={db}
                              onSave={handleSaveSeance}
                              onCancel={() => setEditingCell(null)}
                              initialData={editingCell.initialData}
                            />
                          </td>
                        );

                      if (isEnFormation)
                        return (
                          <td
                            key={`${prof.id}-${jour}-${slot.start}`}
                            className="text-center align-middle bg-danger bg-opacity-10 text-danger fw-bold"
                            style={{ fontSize: "9px" }}
                          >
                            FORMATION
                          </td>
                        );

                      if (seance) {
                        const isEFM =
                          seance.type === "efm" ||
                          seance._types?.includes("efm");
                        const isTeams =
                          seance.type === "teams" ||
                          seance._types?.includes("teams");

                        let bgColor = "white";
                        if (isEFM && isTeams) bgColor = "#fff3cd";
                        else if (isEFM) bgColor = "#f8d7da";
                        else if (isTeams) bgColor = "#d1e7dd";
                        else if (seance._isEvent) bgColor = "#e7f3ff";

                        const cellClasses = [
                          "print-cell",
                          isEFM && isTeams ? "print-efm-teams" : "",
                          isEFM && !isTeams ? "print-efm" : "",
                          isTeams && !isEFM ? "print-teams" : "",
                          seance._isEvent ? "print-event" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <td
                            key={`${prof.id}-${jour}-${slot.start}`}
                            className={cellClasses}
                            style={{
                              background: `${bgColor} !important`,
                              backgroundColor: `${bgColor} !important`,
                              minWidth: "65px",
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
                                    {seance.groupes
                                      ?.map((g) => g.nom)
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
                                        seance.validee ? "success" : "warning"
                                      }
                                      text={seance.validee ? "white" : "dark"}
                                      style={{ fontSize: "8px" }}
                                    >
                                      {seance.validee ? "Validée" : "À valider"}
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
                                    <span
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
                                    </span>
                                  </div>

                                  <div
                                    className="fw-bold text-dark print-text-main"
                                    style={{ fontSize: "11px" }}
                                  >
                                    {seance._isMulti
                                      ? seance._groupes
                                          .map((g) => g.nom)
                                          .join(" + ")
                                      : seance.groupe?.nom}
                                  </div>
                                  <div
                                    className="text-muted small fw-bold print-text-sub"
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
                                      {isTeams ? "DISTANCE" : seance.salle?.nom}
                                    </span>
                                    {seance.type !== "cours" &&
                                      !seance._isMulti && (
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
                                              profId: prof.id,
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
                          key={`${prof.id}-${jour}-${slot.start}`}
                          className="text-center align-middle cursor-pointer print-empty"
                          onClick={() =>
                            setEditingCell({
                              profId: prof.id,
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
          border: 1px solid #dee2e6 !important;
        }
        .table-sticky .sticky-col-header {
          position: sticky;
          left: 0;
          top: 0;
          z-index: 15 !important;
          background-color: #023B75 !important;
          color: white !important;
          border: 1px solid #dee2e6 !important;
          width: 65px;
          min-width: 65px;
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
            width: 65px !important;
            min-width: 65px !important;
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

export default EmploiFormateur;

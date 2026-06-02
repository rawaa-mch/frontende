import { useState, useEffect } from "react";

// ─── Constantes partagées ─────────────────────────────────────────────────────
export const JOURS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];

export const SLOTS = [
  { start: "08:30", end: "10:30", label: "08:30 - 10:30", duree: 2.5 },
  { start: "10:30", end: "13:00", label: "10:30 - 13:00", duree: 2.5 },
  { start: "13:30", end: "16:30", label: "13:30 - 16:30", duree: 3 },
  { start: "16:30", end: "18:30", label: "16:30 - 18:30", duree: 2 },
];

export const calcDuree = (debut, fin) => {
  const start = String(debut ?? "").substring(0, 5);
  const end = String(fin ?? "").substring(0, 5);
  if (!start || !end) return 0;

  if (start === "08:30" && end === "10:30") return 2.5;
  if (start === "08:30" && end === "13:00") return 5;

  const startDate = new Date(`1970-01-01T${start}:00`);
  const endDate = new Date(`1970-01-01T${end}:00`);
  const hours = (endDate - startDate) / 3600000;
  return Number.isFinite(hours) ? hours : 0;
};

// Retourne le lundi de la semaine courante au format YYYY-MM-DD (heure locale)
// Si on est dimanche, on prend le lundi de la semaine suivante (demain)
const getLundi = () => {
  const today = new Date();
  const day = today.getDay(); // 0=dim, 1=lun, ..., 6=sam
  const diffToMonday = day === 0 ? 1 : 1 - day; // si dimanche, on avance de 1 jour (demain)
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const year  = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date  = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useEmploi(extraEndpoints = {}) {
  const [db, setDb] = useState({
    formateurs: [],
    groupes: [],
    modules: [],
    salles: [],
    seances: [],
    events: [],
    affectations: [],
    ...Object.fromEntries(Object.keys(extraEndpoints).map((k) => [k, []])),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getLundi);
  const [editingCell, setEditingCell] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chargement de toutes les données ────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrls = [
        "/api/formateurs",
        "/api/groupes",
        "/api/modules",
        "/api/salles",
        "/api/seances",
        "/api/events",
        "/api/affectations",
      ];
      const extraUrls = Object.values(extraEndpoints);
      const extraKeys = Object.keys(extraEndpoints);

      const allResponses = await Promise.all(
        [...baseUrls, ...extraUrls].map((url) => fetch(url))
      );
      const allData = await Promise.all(allResponses.map((r) => r.json()));

      const [formateurs, groupes, modules, salles, seances, events, affectations, ...extraData] = allData;

      const extraState = {};
      extraKeys.forEach((key, i) => {
        extraState[key] = extraData[i]?.data || extraData[i] || [];
      });

      setDb({
        formateurs: formateurs.data || formateurs,
        groupes: groupes.data || groupes,
        modules: modules.data || modules,
        salles: salles.data || salles,
        seances: seances.data || seances,
        events: events.data || events,
        affectations: affectations.data || affectations,
        ...extraState,
      });
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les données. Vérifiez la connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  // ── Rafraîchir uniquement les séances ───────────────────────────────────────
  const refreshSeances = async () => {
    try {
      const [sRes, eRes] = await Promise.all([
        fetch("/api/seances"),
        fetch("/api/events")
      ]);
      const [sData, eData] = await Promise.all([sRes.json(), eRes.json()]);
      setDb((prev) => ({
        ...prev,
        seances: sData.data || sData,
        events: eData.data || eData
      }));
    } catch (e) {
      console.error(e);
      showMessage("danger", "Erreur lors du rafraîchissement");
    }
  };

  // ── Utilitaires de date ──────────────────────────────────────────────────────
  const getDateForJour = (jour) => {
    const map = { LUNDI: 0, MARDI: 1, MERCREDI: 2, JEUDI: 3, VENDREDI: 4, SAMEDI: 5 };
    const d = new Date(selectedDate + "T00:00:00"); // Forcer le minuit local
    d.setDate(d.getDate() + map[jour]);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const semainePrecedente = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${date}`);
  };

  const semaineSuivante = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${date}`);
  };

  // ── Affichage de message temporaire ─────────────────────────────────────────
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // ── CRUD Séances ─────────────────────────────────────────────────────────────
  const handleSaveSeance = async (body, editId) => {
    const url = editId ? `/api/seances/${editId}` : "/api/seances";
    const method = editId ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await refreshSeances();
        setEditingCell(null);
        showMessage("success", editId ? "Séance modifiée ✓" : "Séance ajoutée ✓");
      } else {
        const data = await res.json();
        showMessage("danger", data.message || "Erreur lors de l'enregistrement");
      }
    } catch (e) {
      console.error(e);
      showMessage("danger", "Erreur réseau");
    }
  };

  const handleSaveBulk = async (schedule) => {
    try {
      const res = await fetch("/api/schedule/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });
      if (res.ok) {
        await refreshSeances();
        setEditingCell(null);
        showMessage("success", `${schedule.length} séances ajoutées ✓`);
      } else {
        const data = await res.json();
        showMessage("danger", data.message || "Erreur lors de l'enregistrement groupé");
      }
    } catch (e) {
      console.error(e);
      showMessage("danger", "Erreur réseau");
    }
  };

  const handleDeleteSeance = async (id) => {
    if (!globalThis.confirm("Supprimer cette séance ?")) return;
    
    const ids = Array.isArray(id) ? id : [id];
    
    try {
      const results = await Promise.all(
        ids.map(i => fetch(`/api/seances/${i}`, { method: "DELETE" }))
      );
      
      if (results.every(res => res.ok)) {
        await refreshSeances();
        showMessage("success", ids.length > 1 ? "Séances supprimées ✓" : "Séance supprimée ✓");
      } else {
        showMessage("danger", "Erreur lors de la suppression d'une ou plusieurs séances");
      }
    } catch (e) {
      console.error(e);
      showMessage("danger", "Erreur réseau");
    }
  };

  const handleClearAll = async () => {
    if (!globalThis.confirm("Êtes-vous sûr de vouloir supprimer TOUTES les séances de la base de données ? Cette action est irréversible !")) return;
    try {
      const res = await fetch(`/api/seances/clear`, { method: "DELETE" });
      if (res.ok) {
        await refreshSeances();
        showMessage("success", "Toutes les séances ont été supprimées ✓");
      } else {
        showMessage("danger", "Erreur lors de la suppression globale");
      }
    } catch (e) {
      console.error(e);
      showMessage("danger", "Erreur réseau");
    }
  };

  const handleValiderSeance = async (id) => {
    try {
      const res = await fetch(`/api/seances/${id}/valider`, { method: "PUT" });
      if (res.ok) {
        await refreshSeances();
        showMessage("success", "Séance validée ✓");
      } else {
        const data = await res.json();
        showMessage("danger", data.message || "Erreur lors de la validation");
      }
    } catch (e) {
      console.error(e);
      showMessage("danger", "Erreur réseau");
    }
  };

  // ── Export CSV ───────────────────────────────────────────────────────────────
  const exportExcel = (headers, rowMapper, filename) => {
    const rows = db.seances.map((s) => {
      const d = new Date(s.date);
      const dayName = JOURS[d.getDay() === 0 ? 5 : d.getDay() - 1];
      return rowMapper(s, dayName);
    });
    const csvContent =
      "\uFEFF" + [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${selectedDate}.csv`;
    a.click();
  };

  return {
    db,
    loading,
    error,
    selectedDate,
    editingCell,
    message,
    setEditingCell,
    loadData,
    refreshSeances,
    getDateForJour,
    semainePrecedente,
    semaineSuivante,
    handleSaveSeance,
    handleSaveBulk,
    handleDeleteSeance,
    handleClearAll,
    handleValiderSeance,
    exportExcel,
    showMessage,
    setSelectedDate,
  };
}

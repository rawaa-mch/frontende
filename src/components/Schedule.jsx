import { useState } from "react";

function Schedule() {
  const [week, setWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(null);

  const generateSchedule = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/generate-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          week: week
        })
      });

      const data = await response.json();
      console.log("Result:", data);

      setSchedule(data);

    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🤖 Générateur d'emploi du temps</h2>

      {/* Sélection semaine */}
      <select value={week} onChange={(e) => setWeek(e.target.value)}>
        <option value="1">Semaine 1</option>
        <option value="2">Semaine 2</option>
        <option value="3">Semaine 3</option>
      </select>

      <br /><br />

      {/* Bouton generate */}
      <button onClick={generateSchedule}>
        {loading ? "Generating..." : "Generate Schedule"}
      </button>

      <hr />

      {/* Affichage résultat */}
      {schedule && (
        <pre style={{ background: "#f4f4f4", padding: "10px" }}>
          {JSON.stringify(schedule, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default Schedule;
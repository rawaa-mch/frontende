import React, { useEffect, useState } from 'react';

export default function TestSimple() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/formateurs`)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div style={{ color: 'red', padding: 20 }}>❌ ERREUR: {error}</div>;
  if (!data) return <div style={{ padding: 20 }}>⏳ CHARGEMENT...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>✅ API CONNECTÉE !</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
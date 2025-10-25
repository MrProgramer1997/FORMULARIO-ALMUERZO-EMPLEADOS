// netlify/functions/get-cupos.js
import fetch from "node-fetch";

export const handler = async () => {
  const NETLIFY_API = "https://api.netlify.com/api/v1";
  const SITE_ID = process.env.SITE_ID; // lo configuras en Netlify → Build settings → Environment variables
  const TOKEN = process.env.NETLIFY_AUTH_TOKEN; // token personal de Netlify

  try {
    // Obtener todos los formularios del sitio
    const formsRes = await fetch(`${NETLIFY_API}/sites/${SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const forms = await formsRes.json();
    const form = forms.find(f => f.name === "inscripcion-almuerzo");

    if (!form) {
      return { statusCode: 404, body: JSON.stringify({ error: "Formulario no encontrado" }) };
    }

    // Obtener las respuestas del formulario
    const submissionsRes = await fetch(`${NETLIFY_API}/forms/${form.id}/submissions`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const submissions = await submissionsRes.json();

    // Contar inscripciones por horario
    const conteo = {};
    submissions.forEach(sub => {
      const horario = sub.data?.horario;
      if (horario) conteo[horario] = (conteo[horario] || 0) + 1;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(conteo),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

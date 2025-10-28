// netlify/functions/get-cupos.js
import fetch from "node-fetch";

export const handler = async () => {
  const NETLIFY_API = "https://api.netlify.com/api/v1";
  const TOKEN = process.env.NETLIFY_AUTH_TOKEN;
  const FORM_ID = "AQUI_EL_ID_DEL_FORMULARIO"; // ⚠️ tu API ID real del form

  const MAX_CUPOS = 64;

  try {
    const submissionsRes = await fetch(`${NETLIFY_API}/forms/${FORM_ID}/submissions`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const submissions = await submissionsRes.json();

    const conteo = {};
    submissions.forEach(sub => {
      const horario = sub.data?.horario?.trim();
      if (horario) conteo[horario] = (conteo[horario] || 0) + 1;
    });

    // 🔒 Reforzamos el límite en backend
    Object.keys(conteo).forEach(horario => {
      if (conteo[horario] > MAX_CUPOS) conteo[horario] = MAX_CUPOS;
    });

    return { statusCode: 200, body: JSON.stringify(conteo) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

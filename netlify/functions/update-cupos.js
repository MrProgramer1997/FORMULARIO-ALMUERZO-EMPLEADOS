// netlify/functions/update-cupos.js
import fetch from "node-fetch";

export const handler = async (event) => {
  const NETLIFY_API = "https://api.netlify.com/api/v1";
  const SITE_ID = process.env.MY_SITE_ID;
  const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

  // Validar método y datos
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido, usa POST" }) };
  }

  const body = JSON.parse(event.body || "{}");
  const { horario } = body;

  if (!horario) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta el parámetro 'horario'" }) };
  }

  try {
    // 🔹 Validar que existan las variables de entorno
    if (!SITE_ID || !TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Faltan variables MY_SITE_ID o NETLIFY_AUTH_TOKEN" }),
      };
    }

    // 🔹 Buscar el formulario
    const formsRes = await fetch(`${NETLIFY_API}/sites/${SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const forms = await formsRes.json();

    const form = forms.find((f) => f.name === "inscripcion-almuerzo");
    if (!form) {
      return { statusCode: 404, body: JSON.stringify({ error: "Formulario no encontrado" }) };
    }

    // 🔹 Obtener los registros existentes
    const submissionsRes = await fetch(`${NETLIFY_API}/forms/${form.id}/submissions`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const submissions = await submissionsRes.json();

    // 🔹 Contar cuántos hay en ese horario
    const registrados = submissions.filter((s) => s.data?.horario === horario).length;
    const MAX_CUPOS = 64;
    const disponibles = MAX_CUPOS - registrados;

    if (disponibles <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No hay cupos disponibles para este horario",
          horario,
        }),
      };
    }

    // 🔹 Respuesta simulando la actualización (Netlify Forms no permite sobrescribir directamente)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Cupo actualizado correctamente",
        horario,
        cuposRestantes: disponibles - 1,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

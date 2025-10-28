// netlify/functions/check-cedula.js
import fetch from "node-fetch";

export const handler = async (event) => {
  const NETLIFY_API = "https://api.netlify.com/api/v1";
  const SITE_ID = process.env.SITE_ID;
  const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

  const cedula = event.queryStringParameters?.cedula;
  if (!cedula) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Falta el parámetro 'cedula'" }),
    };
  }

  try {
    // Buscar el formulario correcto
    const formsRes = await fetch(`${NETLIFY_API}/sites/${SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const forms = await formsRes.json();
    const form = forms.find(f => f.name === "inscripcion-almuerzo");
    if (!form) {
      return { statusCode: 404, body: JSON.stringify({ error: "Formulario no encontrado" }) };
    }

    // Traer los registros existentes
    const submissionsRes = await fetch(`${NETLIFY_API}/forms/${form.id}/submissions`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const submissions = await submissionsRes.json();

    // Filtrar por cédula
    const registros = submissions.filter(sub => sub.data?.cedula === cedula);
    const totalRegistros = registros.length;

    // 🔓 PERMITIR cambios de horario
    // Ya no bloqueamos si la persona ya está inscrita
    return {
      statusCode: 200,
      body: JSON.stringify({
        existe: totalRegistros > 0,
        puedeCambiar: true, // <-- se permite cambio de horario
        totalRegistros,
      }),
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

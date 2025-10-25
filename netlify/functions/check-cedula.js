// netlify/functions/check-cedula.js
import fetch from "node-fetch";

export const handler = async (event) => {
  const NETLIFY_API = "https://api.netlify.com/api/v1";
  const SITE_ID = process.env.SITE_ID;
  const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

  // Tomar la cédula desde los parámetros de la URL (?cedula=12345)
  const cedula = event.queryStringParameters?.cedula;

  if (!cedula) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Falta el parámetro 'cedula'" }),
    };
  }

  try {
    // Obtener todos los formularios del sitio
    const formsRes = await fetch(`${NETLIFY_API}/sites/${SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const forms = await formsRes.json();
    const form = forms.find((f) => f.name === "inscripcion-almuerzo");

    if (!form) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Formulario no encontrado" }),
      };
    }

    // Obtener todas las respuestas del formulario
    const submissionsRes = await fetch(`${NETLIFY_API}/forms/${form.id}/submissions`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const submissions = await submissionsRes.json();

    // Buscar si la cédula ya existe
    const registros = submissions.filter(
      (sub) => sub.data?.cedula?.toString().trim() === cedula.toString().trim()
    );

    let resultado = { existe: false };

    if (registros.length > 0) {
      resultado.existe = true;
      resultado.totalRegistros = registros.length;
      resultado.ultimoHorario = registros[registros.length - 1].data?.horario || null;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resultado),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

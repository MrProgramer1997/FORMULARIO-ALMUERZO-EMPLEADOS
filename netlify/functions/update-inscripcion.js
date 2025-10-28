// netlify/functions/update-inscripcion.js
import fetch from "node-fetch";

export const handler = async (event) => {
  const NETLIFY_API = "https://api.netlify.com/api/v1";
  const SITE_ID = process.env.SITE_ID;
  const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método no permitido" };
  }

  try {
    const { cedula, nombre, area, horario, proteina } = JSON.parse(event.body);

    // 1️⃣ Buscar el formulario
    const formsRes = await fetch(`${NETLIFY_API}/sites/${SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const forms = await formsRes.json();
    const form = forms.find(f => f.name === "inscripcion-almuerzo");
    if (!form) {
      return { statusCode: 404, body: JSON.stringify({ error: "Formulario no encontrado" }) };
    }

    // 2️⃣ Obtener TODAS las inscripciones
    const submissionsRes = await fetch(`${NETLIFY_API}/forms/${form.id}/submissions`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const submissions = await submissionsRes.json();

    // 3️⃣ Filtrar por cédula
    const registros = submissions.filter(sub => sub.data?.cedula === cedula);

    // 4️⃣ Eliminar TODOS los registros anteriores si existen
    for (const reg of registros) {
      try {
        await fetch(`${NETLIFY_API}/submissions/${reg.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${TOKEN}` },
        });
        // Pequeña pausa de seguridad (200ms) para evitar límite de API
        await new Promise(r => setTimeout(r, 200));
      } catch (delErr) {
        console.warn(`No se pudo eliminar registro ${reg.id}:`, delErr.message);
      }
    }

    // 5️⃣ Crear el nuevo registro actualizado
    const nuevo = await fetch(`${NETLIFY_API}/forms/${form.id}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        data: { cedula, nombre, area, horario, proteina },
      }),
    });

    if (!nuevo.ok) {
      throw new Error("Error creando el nuevo registro");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Registro actualizado correctamente.",
        cedula,
        horario,
        eliminados: registros.length,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

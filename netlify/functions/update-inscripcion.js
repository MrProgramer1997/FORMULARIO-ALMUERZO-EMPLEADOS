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

    // 1️⃣ Buscar el formulario principal
    const formsRes = await fetch(`${NETLIFY_API}/sites/${SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const forms = await formsRes.json();
    const form = forms.find(f => f.name === "inscripcion-almuerzo");
    if (!form) {
      return { statusCode: 404, body: JSON.stringify({ error: "Formulario no encontrado" }) };
    }

    // 2️⃣ Obtener todas las inscripciones existentes
    const submissionsRes = await fetch(`${NETLIFY_API}/forms/${form.id}/submissions`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const submissions = await submissionsRes.json();

    // 3️⃣ Buscar registros con la misma cédula
    const registros = submissions.filter(sub => sub.data?.cedula === cedula);

    // 4️⃣ Si ya existe, eliminar el registro anterior
    for (const reg of registros) {
      await fetch(`${NETLIFY_API}/submissions/${reg.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
    }

    // 5️⃣ Crear un nuevo registro con los datos actualizados
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
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

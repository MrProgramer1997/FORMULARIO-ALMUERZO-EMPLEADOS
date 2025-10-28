// main.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  const cedulaInput = document.getElementById("cedula");
  const nombreInput = document.getElementById("nombre");
  const areaSelect = document.getElementById("area");
  const horarioSelect = document.getElementById("horario");
  const proteinaSelect = document.getElementById("proteina");
  const mensajeBloqueo = document.getElementById("mensaje-bloqueo");
  const MAX_CUPOS = 64;

  // === 1️⃣ Obtener el conteo actual de cupos ===
  async function actualizarCupos() {
    try {
      const res = await fetch("/.netlify/functions/get-cupos");
      const conteo = await res.json();

      horarioSelect.querySelectorAll("option").forEach(opt => {
        const horario = opt.value;
        if (horario === "" || horario.includes("Selecciona")) return;

        const inscritos = conteo[horario] || 0;
        const disponibles = MAX_CUPOS - inscritos;

        // Bloquear manualmente horarios llenos
        if (
          horario.includes("12:00 p.m. a 12:30 p.m.") ||
          horario.includes("1:00 p.m. a 1:30 p.m.")
        ) {
          opt.disabled = true;
          return;
        }

        if (disponibles <= 0) opt.disabled = true;
      });
    } catch (err) {
      console.error("Error obteniendo cupos:", err);
    }
  }

  // === 2️⃣ Envío por API ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cedula = cedulaInput.value.trim();
    const nombre = nombreInput.value.trim();
    const area = areaSelect.value;
    const horario = horarioSelect.value;
    const proteina = proteinaSelect.value;

    if (!cedula || !nombre || !area || !horario || !proteina) {
      alert("Por favor completa todos los campos.");
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/update-inscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, nombre, area, horario, proteina }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ " + data.message);
        form.reset();
        await actualizarCupos();
      } else {
        alert("⚠️ Error: " + data.error);
      }
    } catch (err) {
      console.error("Error enviando:", err);
      alert("⚠️ Hubo un problema al enviar el registro.");
    }
  });

  // === 3️⃣ Cargar cupos al inicio ===
  await actualizarCupos();
});

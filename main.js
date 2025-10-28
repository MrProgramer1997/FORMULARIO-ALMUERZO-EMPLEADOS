// main.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  const horarioSelect = document.getElementById("horario");
  const cuposInfo = document.getElementById("cupos-info");
  const mensajeBloqueo = document.getElementById("mensaje-bloqueo");

  const MAX_CUPOS = 64; // Máximo por turno

  // === 1️⃣ Obtener cupos actuales ===
  async function actualizarCupos() {
    try {
      const res = await fetch("/.netlify/functions/get-cupos");
      const conteo = await res.json();

      let totalLlenos = 0;
      let infoHTML = "<h4>Cupos disponibles por horario:</h4><ul>";

      horarioSelect.querySelectorAll("option").forEach(opt => {
        const horario = opt.value;
        if (horario === "" || horario.includes("Selecciona")) return;

        const inscritos = conteo[horario] || 0;
        const disponibles = MAX_CUPOS - inscritos;

        if (disponibles <= 0) {
          opt.disabled = true;
          infoHTML += `<li><strong>${horario}:</strong> Cupos llenos ❌</li>`;
          totalLlenos++;
        } else {
          opt.disabled = false;
          infoHTML += `<li><strong>${horario}:</strong> ${disponibles} cupos disponibles ✅</li>`;
        }
      });

      infoHTML += "</ul>";
      cuposInfo.innerHTML = infoHTML;

      if (totalLlenos >= horarioSelect.options.length - 1) {
        form.style.display = "none";
        mensajeBloqueo.style.display = "block";
      } else {
        form.style.display = "block";
        mensajeBloqueo.style.display = "none";
      }
    } catch (err) {
      console.error("Error obteniendo cupos:", err);
      cuposInfo.innerHTML = "<p style='color:red;'>Error cargando los cupos disponibles.</p>";
    }
  }

  // === 2️⃣ Manejar envío del formulario (sin bloquear por duplicado) ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cedula = document.getElementById("cedula").value.trim();
    const horario = horarioSelect.value;

    if (!cedula || !horario) {
      alert("Por favor completa todos los campos.");
      return;
    }

    // Solo verificamos si el horario tiene cupos
    const res = await fetch("/.netlify/functions/get-cupos");
    const conteo = await res.json();
    const inscritos = conteo[horario] || 0;

    if (inscritos >= MAX_CUPOS) {
      alert("🚫 Este horario ya alcanzó el límite de cupos. Por favor selecciona otro.");
      return;
    }

    // Si todo está bien, enviar formulario normalmente
    alert("✅ Registro enviado correctamente.");
    form.submit();
  });

  // === 3️⃣ Cargar info inicial de cupos ===
  await actualizarCupos();
});

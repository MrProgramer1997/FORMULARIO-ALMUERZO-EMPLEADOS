// main.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  const cedulaInput = document.getElementById("cedula");
  const horarioSelect = document.getElementById("horario");
  const cuposInfo = document.getElementById("cupos-info");
  const mensajeBloqueo = document.getElementById("mensaje-bloqueo");

  const MAX_CUPOS = 64; // Cupos máximos por turno

  // === 1️⃣ Obtener el conteo actual de cupos ===
  async function actualizarCupos() {
    try {
      const res = await fetch("/.netlify/functions/get-cupos");
      const conteo = await res.json();

      let totalLlenos = 0;
      let infoHTML = "<h4>Cupos disponibles por horario:</h4><ul>";

      horarioSelect.querySelectorAll("option").forEach((opt) => {
        const horario = opt.value;
        if (!horario || horario.includes("Selecciona")) return;

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

  // === 2️⃣ Verificar si una cédula ya está registrada ===
  async function verificarCedula(cedula) {
    try {
      const res = await fetch(`/.netlify/functions/check-cedula?cedula=${cedula}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Error verificando cédula:", err);
      return { existe: false };
    }
  }

  // === 3️⃣ Actualizar cupos en Netlify ===
  async function actualizarCupoBackend(horario) {
    try {
      const res = await fetch("/.netlify/functions/update-cupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horario }),
      });
      const data = await res.json();
      console.log("Actualización de cupo:", data);
    } catch (err) {
      console.error("Error actualizando cupo:", err);
    }
  }

  // === 4️⃣ Envío del formulario ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cedula = cedulaInput.value.trim();
    const horario = horarioSelect.value;

    if (!cedula || !horario) {
      alert("Por favor completa todos los campos.");
      return;
    }

    // Verificar si ya está registrado
    const data = await verificarCedula(cedula);

    if (data.existe) {
      if (data.totalRegistros >= 2) {
        alert("⚠️ Ya realizaste un cambio de horario. No puedes modificarlo más de una vez.");
        return;
      }

      const confirmar = confirm(
        `Ya estás inscrito en el horario ${data.ultimoHorario}. ¿Deseas cambiarte al horario ${horario}?`
      );
      if (!confirmar) return;
    }

    // Verificar cupos disponibles antes de enviar
    try {
      const res = await fetch("/.netlify/functions/update-cupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horario }),
      });
      const cupoData = await res.json();

      if (cupoData.error && cupoData.error.includes("No hay cupos")) {
        alert("🚫 No hay cupos disponibles para este horario. Por favor elige otro.");
        await actualizarCupos();
        return;
      }
    } catch (err) {
      console.error("Error verificando cupos:", err);
      alert("Hubo un error verificando los cupos. Intenta nuevamente.");
      return;
    }

    // Si pasa todas las validaciones, enviar formulario a Netlify Forms
    alert("✅ Registro enviado correctamente.");
    form.submit();

    // Actualizar visualmente los cupos (sin esperar al reload)
    await actualizarCupos();
  });

  // === 5️⃣ Cargar los cupos al inicio ===
  await actualizarCupos();
});

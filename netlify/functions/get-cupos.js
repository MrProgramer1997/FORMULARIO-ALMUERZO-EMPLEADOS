// main.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  const cedulaInput = document.getElementById("cedula");
  const horarioSelect = document.getElementById("horario");
  const cuposInfo = document.getElementById("cupos-info"); // Contenedor donde se muestran los cupos
  const mensajeBloqueo = document.getElementById("mensaje-bloqueo"); // Mensaje si se llena todo

  const MAX_CUPOS = 64; // Máximo permitido por horario

  // === 1. Obtener el conteo actual de cupos desde la función de Netlify ===
  async function actualizarCupos() {
    try {
      const res = await fetch("/.netlify/functions/get-cupos");
      const conteo = await res.json();

      let totalLlenos = 0;
      let infoHTML = "<h4>Cupos disponibles por horario:</h4><ul>";

      horarioSelect.querySelectorAll("option").forEach(opt => {
        const horario = opt.value;
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

      // Si todos los horarios están llenos
      if (totalLlenos === horarioSelect.options.length) {
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

  // === 2. Validar si la cédula ya está registrada ===
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

  // === 3. Manejar envío del formulario ===
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

    // Si pasa las validaciones, enviar el formulario
    alert("✅ Registro enviado correctamente.");
    form.submit();
  });

  // === 4. Cargar la información inicial de cupos ===
  await actualizarCupos();
});

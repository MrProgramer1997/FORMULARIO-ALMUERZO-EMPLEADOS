// main.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  const cedulaInput = document.getElementById("cedula");
  const horarioSelect = document.getElementById("horario");
  const cuposInfo = document.getElementById("cupos-info");
  const mensajeBloqueo = document.getElementById("mensaje-bloqueo");

  const MAX_CUPOS = 64;

  // Normaliza texto de horarios (para que coincida con los datos del backend)
  const normalizarTexto = (texto) =>
    texto
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\./g, "")
      .replace(" ", " ");

  // === 1️⃣ Obtener cupos desde la función de Netlify ===
  async function actualizarCupos() {
    try {
      const res = await fetch("/.netlify/functions/get-cupos");
      const conteo = await res.json();

      let totalLlenos = 0;
      let infoHTML = "<h4>Cupos disponibles por horario:</h4><ul>";

      horarioSelect.querySelectorAll("option").forEach((opt) => {
        const horarioOriginal = opt.value;
        if (!horarioOriginal || horarioOriginal.includes("Selecciona")) return;

        const horario = normalizarTexto(horarioOriginal);
        const inscritos = conteo[horario] || 0;
        const disponibles = MAX_CUPOS - inscritos;

        if (disponibles <= 0) {
          opt.disabled = true;
          infoHTML += `<li><strong>${horarioOriginal}:</strong> Cupos llenos ❌</li>`;
          totalLlenos++;
        } else {
          opt.disabled = false;
          infoHTML += `<li><strong>${horarioOriginal}:</strong> ${disponibles} cupos disponibles ✅</li>`;
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
      cuposInfo.innerHTML =
        "<p style='color:red;'>Error cargando los cupos disponibles.</p>";
    }
  }

  // === 2️⃣ Verificar si la cédula ya está registrada ===
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

  // === 3️⃣ Manejar envío del formulario ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cedula = cedulaInput.value.trim();
    const horario = horarioSelect.value;

    if (!cedula || !horario) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const data = await verificarCedula(cedula);

    if (data.existe) {
      if (data.totalRegistros >= 2) {
        alert(
          "⚠️ Ya realizaste un cambio de horario. No puedes modificarlo más de una vez."
        );
        return;
      }

      const confirmar = confirm(
        `Ya estás inscrito en el horario ${data.ultimoHorario}. ¿Deseas cambiarte al horario ${horario}?`
      );
      if (!confirmar) return;
    }

    alert("✅ Registro enviado correctamente.");
    form.submit();
  });

  // === 4️⃣ Cargar información inicial de cupos ===
  await actualizarCupos();
});

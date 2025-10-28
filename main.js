// main.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  const cedulaInput = document.getElementById("cedula");
  const horarioSelect = document.getElementById("horario");
  const mensajeBloqueo = document.getElementById("mensaje-bloqueo");
  const MAX_CUPOS = 64;

  // === 1️⃣ Obtener el conteo actual de cupos ===
  async function actualizarCupos() {
    try {
      const res = await fetch("/.netlify/functions/get-cupos");
      const conteo = await res.json();

      let totalLlenos = 0;

      horarioSelect.querySelectorAll("option").forEach(opt => {
        const horario = opt.value;
        if (horario === "" || horario.includes("Selecciona")) return;

        const inscritos = conteo[horario] || 0;
        const disponibles = MAX_CUPOS - inscritos;

        // Bloquear manualmente horarios llenos o excedidos
        if (
          horario.includes("1:00 p.m. a 1:30 p.m.") ||
          horario.includes("12:00 p.m. a 12:30 p.m.")
        ) {
          opt.disabled = true;
          return;
        }

        // Bloquear si el horario está lleno
        if (disponibles <= 0) {
          opt.disabled = true;
          totalLlenos++;
        } else {
          opt.disabled = false;
        }
      });

      // Si todos los horarios están llenos
      if (totalLlenos >= horarioSelect.options.length - 1) {
        form.style.display = "none";
        mensajeBloqueo.style.display = "block";
      } else {
        form.style.display = "block";
        mensajeBloqueo.style.display = "none";
      }
    } catch (err) {
      console.error("Error obteniendo cupos:", err);
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

    // Bloquear usuarios ya registrados
    if (data.existe) {
      alert("⚠️ Ya estás registrado. No es posible cambiar tu horario.");
      return;
    }

    alert("✅ Registro enviado correctamente.");
    form.submit();
  });

  // === 4️⃣ Cargar información inicial ===
  await actualizarCupos();
});

// main.js
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("form");
  const cedulaInput = document.getElementById("cedula");
  const horarioSelect = document.getElementById("horario");
  const mensajeBloqueo = document.getElementById("mensaje-bloqueo");

  const MAX_CUPOS = 64;

  // === 1️⃣ Obtener cupos actuales ===
  async function actualizarCupos() {
    try {
      const res = await fetch("/.netlify/functions/get-cupos");
      const conteo = await res.json();

      let totalLlenos = 0;

      horarioSelect.querySelectorAll("option").forEach(opt => {
        const horario = opt.value.trim();
        if (!horario || opt.disabled) return;
        const inscritos = conteo[horario] || 0;
        const disponibles = MAX_CUPOS - inscritos;

        if (disponibles <= 0) {
          opt.disabled = true;
          opt.textContent = `${horario} (lleno)`;
          totalLlenos++;
        }
      });

      if (totalLlenos >= horarioSelect.options.length - 1) {
        form.style.display = "none";
        mensajeBloqueo.style.display = "block";
      }
    } catch (err) {
      console.error("Error obteniendo cupos:", err);
    }
  }

  // === 2️⃣ Verificar si ya está inscrito ===
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

  // === 3️⃣ Envío del formulario ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cedula = cedulaInput.value.trim();
    const horario = horarioSelect.value;

    if (!cedula || !horario) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const data = await verificarCedula(cedula);

    // ✅ Ahora SÍ se permite cambiar de turno sin límite
    if (data.existe) {
      const confirmar = confirm(
        `Ya estás inscrito en el horario ${data.ultimoHorario}. ¿Deseas cambiarte al horario ${horario}?`
      );
      if (!confirmar) return;
    }

    alert("✅ Registro enviado correctamente.");
    form.submit();
  });

  await actualizarCupos();
});

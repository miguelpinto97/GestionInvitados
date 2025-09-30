const apiBase = "/.netlify/functions/invitados";

async function apiPost(accion, payload) {
  const res = await fetch(apiBase, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion, ...payload }),
  });
  return await res.json();
}

async function cargarInvitados() {
  const invitados = await apiPost("listar", {});
  const tbody = document.querySelector("#tablaInvitados tbody");
  tbody.innerHTML = "";

  invitados.forEach(inv => {
    tbody.innerHTML += `
      <tr>
        <td>${inv.Nombre}</td>
        <td>${inv.Cantidad}</td>
        <td>${inv.Telefono || ""}</td>
        <td>${inv.Vehiculo ? "✅" : "❌"}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editarInvitado('${inv.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarInvitado('${inv.id}')">🗑️</button>
          <button class="btn btn-sm btn-info" onclick="verDetalle('${inv.id}')">👥 Integrantes</button>
        </td>
      </tr>
    `;
  });
}

document.getElementById("formInvitado").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    Id: document.getElementById("Id").value,
    Nombre: document.getElementById("Nombre").value,
    Cantidad: parseInt(document.getElementById("Cantidad").value),
    Telefono: parseInt(document.getElementById("Telefono").value) || null,
    Mesa: 1,
    Vehiculo: document.getElementById("Vehiculo").checked
  };

  await apiPost("guardar", { data });
  document.getElementById("formInvitado").reset();
  document.getElementById("Id").value = "";
  cargarInvitados();
});

window.editarInvitado = async (id) => {
  const res = await apiPost("obtener", { id });
  document.getElementById("Id").value = id;
  document.getElementById("Nombre").value = res.Nombre;
  document.getElementById("Cantidad").value = res.Cantidad;
  document.getElementById("Telefono").value = res.Telefono || "";
  document.getElementById("Vehiculo").checked = res.Vehiculo || false;
};

window.eliminarInvitado = async (id) => {
  if (confirm("¿Eliminar invitado?")) {
    await apiPost("eliminar", { id });
    cargarInvitados();
  }
};

// -------------------------
// Manejo del Detalle
// -------------------------
let invitadoActual = null;

window.verDetalle = async (id) => {
  invitadoActual = id;
  const res = await apiPost("obtener", { id });
  const detalle = res.Detalle || [];
  const tbody = document.querySelector("#tablaDetalle tbody");
  tbody.innerHTML = "";

  detalle.forEach((d, idx) => {
    tbody.innerHTML += `
      <tr>
        <td>${d.Integrante}</td>
        <td>${d.Civil ? "✅" : "❌"}</td>
        <td>${d.Sellamiento ? "✅" : "❌"}</td>
        <td>${d.Recepcion ? "✅" : "❌"}</td>
        <td>${d.BusGrupal ? "✅" : "❌"}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="eliminarIntegrante(${idx})">🗑️</button>
        </td>
      </tr>
    `;
  });

  new bootstrap.Modal(document.getElementById("modalDetalle")).show();
};

window.agregarIntegrante = async () => {
  const nombre = prompt("Nombre del integrante:");
  if (!nombre) return;

  const res = await apiPost("obtener", { id: invitadoActual });
  const detalle = res.Detalle || [];

  // 🔹 Se agregan con bools en false
  detalle.push({ Integrante: nombre, Civil: false, Sellamiento: false, Recepcion: false, BusGrupal: false });

  await apiPost("guardar", { data: { ...res, Detalle: detalle }, Id: invitadoActual });
  verDetalle(invitadoActual);
};

window.eliminarIntegrante = async (idx) => {
  const res = await apiPost("obtener", { id: invitadoActual });
  let detalle = res.Detalle || [];
  detalle.splice(idx, 1);

  await apiPost("guardar", { data: { ...res, Detalle: detalle }, Id: invitadoActual });
  verDetalle(invitadoActual);
};

// -------------------------
cargarInvitados();

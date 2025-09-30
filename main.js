const modalInvitado = new bootstrap.Modal(document.getElementById("modalInvitado"));
const modalDetalle = new bootstrap.Modal(document.getElementById("modalDetalle"));
const form = document.getElementById("formInvitado");

let invitadoDetalleActual = null;

// Helpers
async function apiPost(payload) {
  const res = await fetch("/.netlify/functions/invitados", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return res.json();
}

// Cargar invitados agrupados
async function cargarInvitados() {
  const lista = await apiPost({ accion: "listar" });

  const grupos = {};
  lista.forEach(inv => {
    const mesa = inv.Mesa || "Sin asignar";
    if (!grupos[mesa]) grupos[mesa] = [];
    grupos[mesa].push(inv);
  });

  const cont = document.getElementById("contenedor-invitados");
  cont.innerHTML = "";

  Object.keys(grupos).sort((a, b) => {
    if (a === "Sin asignar") return 1;
    if (b === "Sin asignar") return -1;
    const numA = parseInt(a.replace("Mesa ", "")) || 0;
    const numB = parseInt(b.replace("Mesa ", "")) || 0;
    return numA - numB;
  }).forEach(mesa => {
    const invitadosMesa = grupos[mesa];

    const bloque = document.createElement("div");
    bloque.className = "card mb-4";
    bloque.innerHTML = `<div class="card-header">Mesa ${mesa}</div>`;
    const tabla = document.createElement("table");
    tabla.classList.add("table", "table-striped", "m-0");
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cantidad</th>
          <th>Mesa</th>
          <th>Vehículo</th>
          <th>Teléfono</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${invitadosMesa.map(inv => `
          <tr>
            <td>${inv.Nombre}</td>
            <td>${inv.Cantidad}</td>
            <td>
              <select data-id="${inv.id}" class="mesa-select form-select form-select-sm">
                ${Array.from({ length: 12 }, (_, i) => i + 1).map(opt => `
                  <option value="${opt}" ${inv.Mesa === opt ? "selected" : ""}>${opt}</option>
                `).join("")}
                <option value="Sin asignar" ${!inv.Mesa ? "selected" : ""}>Sin asignar</option>
              </select>
            </td>
            <td>${inv.Vehiculo ? "Sí" : "No"}</td>
            <td>${inv.Telefono || ""}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editarInvitado('${inv.id}')">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="eliminarInvitado('${inv.id}')">🗑️</button>
              <button class="btn btn-sm btn-info" onclick="verDetalle('${inv.id}')">👥 Detalle</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    `;
    bloque.appendChild(tabla);
    cont.appendChild(bloque);
  });

  // Eventos de cambio de mesa
  document.querySelectorAll(".mesa-select").forEach(sel => {
    sel.addEventListener("change", async e => {
      const id = e.target.getAttribute("data-id");
      const nuevaMesa = e.target.value;
      await apiPost({ accion: "guardar", Id: id, data: { Mesa: nuevaMesa } });
      cargarInvitados();
    });
  });
}

// Guardar invitado
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const Id = document.getElementById("Id").value;
  const data = {
    Nombre: document.getElementById("Nombre").value,
    Cantidad: parseInt(document.getElementById("Cantidad").value),
    Telefono: parseInt(document.getElementById("Telefono").value),
    Vehiculo: document.getElementById("Vehiculo").checked,
    Mesa: "Sin asignar"
  };

  await apiPost({ accion: "guardar", Id, data });
  form.reset();
  modalInvitado.hide();
  cargarInvitados();
});

// Editar invitado
window.editarInvitado = async (id) => {
  const res = await apiPost({ accion: "obtener", id });
  if (res) {
    document.getElementById("Id").value = res.id;
    document.getElementById("Nombre").value = res.Nombre;
    document.getElementById("Cantidad").value = res.Cantidad;
    document.getElementById("Telefono").value = res.Telefono;
    document.getElementById("Vehiculo").checked = !!res.Vehiculo;
    document.getElementById("modalTitle").textContent = "Editar Invitado";
    modalInvitado.show();
  }
};

// Eliminar invitado
window.eliminarInvitado = async (id) => {
  if (confirm("¿Eliminar invitado?")) {
    await apiPost({ accion: "eliminar", id });
    cargarInvitados();
  }
};

// Ver detalle
window.verDetalle = async (id) => {
  invitadoDetalleActual = id;
  const res = await apiPost({ accion: "obtener", id });
  const tbody = document.querySelector("#tablaDetalle tbody");
  tbody.innerHTML = "";
  (res.Detalle || []).forEach((d, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${d.Integrante}</td>
      <td>${d.Civil ? "✔" : "✖"}</td>
      <td>${d.Sellamiento ? "✔" : "✖"}</td>
      <td>${d.Recepcion ? "✔" : "✖"}</td>
      <td>${d.BusGrupal ? "✔" : "✖"}</td>
      <td><button class="btn btn-sm btn-danger" onclick="quitarIntegrante(${idx})">Quitar</button></td>
    `;
    tbody.appendChild(row);
  });
  modalDetalle.show();
};

// Agregar integrante
window.agregarIntegrante = async () => {
  const nombre = prompt("Nombre del integrante:");
  if (!nombre) return;
  const res = await apiPost({ accion: "obtener", id: invitadoDetalleActual });
  const detalle = res.Detalle || [];
  detalle.push({ Integrante: nombre, Civil: false, Sellamiento: false, Recepcion: false, BusGrupal: false });
  await apiPost({ accion: "guardar", Id: invitadoDetalleActual, data: { Detalle: detalle } });
  verDetalle(invitadoDetalleActual);
};

// Quitar integrante
window.quitarIntegrante = async (idx) => {
  const res = await apiPost({ accion: "obtener", id: invitadoDetalleActual });
  const detalle = res.Detalle || [];
  detalle.splice(idx, 1);
  await apiPost({ accion: "guardar", Id: invitadoDetalleActual, data: { Detalle: detalle } });
  verDetalle(invitadoDetalleActual);
};

// Inicial
cargarInvitados();

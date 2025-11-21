
const modalInvitado = new bootstrap.Modal(document.getElementById("modalInvitado"));
const modalDetalle = new bootstrap.Modal(document.getElementById("modalDetalle"));
const form = document.getElementById("formInvitado");
var lista = null;

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
  lista = await apiPost({ accion: "listar" });
  const grupos = {};
  lista.forEach(inv => {
    const mesa = inv.Mesa || "Sin asignar";
    if (!grupos[mesa]) grupos[mesa] = [];
    grupos[mesa].push(inv);
  });

  const cont = document.getElementById("contenedor-invitados");
  cont.innerHTML = "";

  Object.keys(grupos).sort((a, b) => {
    if (a === "Sin asignar") return 1;   // "Sin asignar" va al final
    if (b === "Sin asignar") return -1;  // "Sin asignar" va al final
    return parseInt(a) - parseInt(b);    // orden numérico normal
  }).forEach(mesa => {
    const invitadosMesa = grupos[mesa];

    const bloque = document.createElement("div");
    bloque.className = "card mb-4";

    // Header
    const header = document.createElement("div");
    header.className = "card-header";
    header.textContent = `Mesa ${mesa}`;
    bloque.appendChild(header);

    // Contenedor responsive
    const responsive = document.createElement("div");
    responsive.className = "table-responsive";

    // Tabla
    const tabla = document.createElement("table");
    tabla.classList.add("table", "table-striped", "m-0");
    tabla.innerHTML = `
<thead>
  <tr>
    <th>Id</th>
    <th>Acciones</th>
    <th>Nombre</th>
    <th>Cant.</th>
    <th>Mesa</th>
    <th>Vehículo</th>
    <th>Teléfono</th>
    <th>Bus</th>
    <th>F. Límite</th>
  </tr>
</thead>

<tbody>
  ${invitadosMesa.map(inv => `
    <tr>
      <td>${inv.id}</td>

      <td>
          <button class="btn btn-sm btn-outline-primary" onclick="copiarEnlace('${inv.id}')">🔗</button>
          <button class="btn btn-sm btn-warning" onclick="editarInvitado('${inv.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarInvitado('${inv.id}')">🗑️</button>
          <button class="btn btn-sm btn-info" onclick="verDetalle('${inv.id}')">👥</button>

          <!-- Bloqueo -->
          ${inv.BloquearEdicion ? `
            <button class="btn btn-sm btn-outline-primary" onclick="desbloquearInvitado('${inv.id}')">🔓🔄</button>
          ` : `
            <button class="btn btn-sm btn-outline-primary" onclick="bloquearInvitado('${inv.id}')">🔒🚫</button>
          `}

          <!-- PagoBus -->
          ${inv.PagoBus ? `
            <button class="btn btn-sm btn-outline-primary" onclick="marcarNoPagado('${inv.id}')">💸❌</button>
          ` : `
            <button class="btn btn-sm btn-outline-primary" onclick="marcarPagado('${inv.id}')">💸✔️</button>
          `}
      </td>

      <td>${inv.Nombre}</td>
      <td>${inv.Detalle?.length ?? 0}</td>

      <td>
        <select data-id="${inv.id}" class="mesa-select form-select form-select-sm">
           <option value="Sin asignar">Sin asignar</option>
         ${Array.from({ length: 25 }, (_, i) => i).map(opt => `
            <option value="${opt}" ${Number(inv.Mesa) === opt ? "selected" : ""}>${opt}</option>
          `).join("")}
        </select>
      </td>

      <td>${inv.Vehiculo ? "Sí" : "No"}</td>
      <td>${inv.Telefono || ""}</td>

      <!-- Nueva columna Bus con ícono -->
      <td style="font-size: 1.2em;">
        ${inv.PagoBus ? "💸✔️" : "💸❌"}
      </td>

      <td>${inv.FechaLimite || "11 de Octubre"}</td>
    </tr>
  `).join("")}
</tbody>

`;

    // Armar estructura
    responsive.appendChild(tabla);
    bloque.appendChild(responsive);

    cont.appendChild(bloque);
  });

  // Eventos de cambio de mesa
  document.querySelectorAll(".mesa-select").forEach(sel => {
    sel.addEventListener("change", async e => {
      const id = e.target.getAttribute("data-id");
      const nuevaMesa = e.target.value;
      await apiPost({ accion: "guardar", Id: id, data: { Mesa: nuevaMesa } });
      cargarInvitados();
      showSuccessToast("Realizado Correctamente");
    });
  });
}

// Guardar invitado
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  var ConDetalle = document.getElementById("ConDetalle").checked;
  var MostrarSellamiento = document.getElementById("MostrarSellamiento").checked;
  var OcultarRecepcion = document.getElementById("OcultarRecepcion").checked;
  var OcultarTransporte = document.getElementById("OcultarTransporte").checked;

  const inputId = document.getElementById("Id");
  let Id = (inputId.value || "").trim();
  console.log(inputId);

  if (!Id) {
    Id = generarId(lista);     // lista puede ser array de strings o de objetos con .id
    inputId.value = Id;
  }

  console.log(Id);

  const data = {
    Nombre: document.getElementById("Nombre").value,
    Telefono: parseInt(document.getElementById("Telefono").value),
    FechaLimite: document.getElementById("FechaLimite").value,
    Mesa: lista.find(x => x.id === Id)?.Mesa ?? "0",
    Detalle: ConDetalle ? (lista.find(x => x.id === Id)?.Detalle ?? []) : [],
    MostrarSellamiento: MostrarSellamiento,
    OcultarRecepcion:OcultarRecepcion,
    OcultarTransporte: OcultarTransporte
  };

  await apiPost({ accion: "guardar", Id, data });
  form.reset();
  document.getElementById("Id").value = "";
  modalInvitado.hide();
  showSuccessToast("Realizado Correctamente");

  console.log(ConDetalle)
  if (!ConDetalle) {
    generarSinDetalle(Id);
  }

  cargarInvitados();
});


window.abrirNuevoInvitado = () => {
  document.getElementById("modalTitle").textContent = "Agregar Invitado";
  form.reset();
  document.getElementById("Id").value = "";
  modalInvitado.show();
}

// Editar invitado
window.editarInvitado = async (id) => {
  const res = await apiPost({ accion: "obtener", id });
  console.log("Detalle:")
  console.log(res.Detalle?.length ?? 0)
  if (res) {
    document.getElementById("Id").value = res.id;
    document.getElementById("Nombre").value = res.Nombre;
    document.getElementById("Telefono").value = res.Telefono;
    document.getElementById("FechaLimite").value = res.FechaLimite || "11 de Octubre" ;
    document.getElementById("modalTitle").textContent = "Editar Invitado";
    document.getElementById("ConDetalle").checked = (res.Detalle?.length ?? 0) > 1;
    document.getElementById("MostrarSellamiento").checked = res.MostrarSellamiento;
    document.getElementById("OcultarRecepcion").checked = res.OcultarRecepcion;
    document.getElementById("OcultarTransporte").checked = res.OcultarTransporte;
    modalInvitado.show();
  }
};

// Eliminar invitado
window.eliminarInvitado = async (id) => {
  if (confirm("¿Eliminar invitado?")) {
    await apiPost({ accion: "eliminar", id });
    cargarInvitados();
    showSuccessToast("Realizado Correctamente");
  }
};
window.bloquearInvitado = async (id) => {
  if (confirm("Bloquear edición del invitado?")) {
    await apiPost({ accion: "BloquearEdicion", id });
    cargarInvitados();
    showSuccessToast("Edición bloqueada");
  }
};

window.desbloquearInvitado = async (id) => {
  if (confirm("Desbloquear edición del invitado?")) {
    await apiPost({ accion: "DesbloquearEdicion", id });
    cargarInvitados();
    showSuccessToast("Edición desbloqueada");
  }
};

// Ver detalle
window.verDetalle = async (id) => {
  invitadoDetalleActual = id;
  const res = await apiPost({ accion: "obtener", id });
  const tbody = document.querySelector("#tablaDetalle tbody");
  tbody.innerHTML = "";

  // Ocultar columna Sellamiento (th y td)
const ocultarSellamiento = res.MostrarSellamiento !== true;

if (ocultarSellamiento) {
  const thSellamiento = document.getElementById("thSellamiento");
  if (thSellamiento) thSellamiento.style.display = "none";
}else{
  const thSellamiento = document.getElementById("thSellamiento");
  if (thSellamiento) thSellamiento.style.display = "";
}


  (res.Detalle || []).forEach((d, idx) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${d.Integrante === "UNICO" ? res.Nombre : d.Integrante}</td>
      <td><button class="btn btn-sm btn-danger" onclick="quitarIntegrante(${idx})">Quitar</button></td>
      <td>${d.Civil ? "✔" : "✖"}</td>
      ${ocultarSellamiento ? "" : `<td>${d.Sellamiento ? "✔" : "✖"}</td>`}
      <td>${d.Recepcion ? "✔" : "✖"}</td>
      <td>${d.BusGrupal ? "✔" : "✖"}</td>
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
  showSuccessToast("Realizado Correctamente");
  cargarInvitados();
  verDetalle(invitadoDetalleActual);
};

// Quitar integrante
window.quitarIntegrante = async (idx) => {
  const res = await apiPost({ accion: "obtener", id: invitadoDetalleActual });
  const detalle = res.Detalle || [];
  detalle.splice(idx, 1);
  await apiPost({ accion: "guardar", Id: invitadoDetalleActual, data: { Detalle: detalle } });
  showSuccessToast("Realizado Correctamente");
  cargarInvitados();
  verDetalle(invitadoDetalleActual);
};

window.generarSinDetalle = async (idx) => {
  const nombre = "UNICO";
  if (!nombre) return;
  const res = await apiPost({ accion: "obtener", id: idx });
  const detalle = res.Detalle || [];

  if (detalle?.length ?? 0 >= 1) {
    showSuccessToast("Esta invitación ya cuenta con detalle.");
  } else {
    detalle.push({ Integrante: nombre, Civil: false, Sellamiento: false, Recepcion: false, BusGrupal: false });
    console.log(detalle);
    await apiPost({ accion: "guardar", Id: idx, data: { Detalle: detalle } });
    showSuccessToast("Realizado Correctamente");
    cargarInvitados();
  }

};

window.marcarPagado = async (id) => {
  if (confirm("Marcar como pagado el Bus?")) {
    await apiPost({ accion: "MarcarPagoBus", id });
    cargarInvitados();
    showSuccessToast("Pago registrado");
  }
};

window.marcarNoPagado = async (id) => {
  if (confirm("Quitar registro de pago del Bus?")) {
    await apiPost({ accion: "DesmarcarPagoBus", id });
    cargarInvitados();
    showSuccessToast("Pago removido");
  }
};

// Inicial
cargarInvitados();

window.copiarEnlace = function (id) {
  const url = `https://camila-y-miguel.netlify.app/?Id=${id}`;
  navigator.clipboard.writeText(url).then(() => {
    showSuccessToast("Enlace copiado: " + url);
  }).catch(err => {
    showSuccessToast("Error al copiar: ", err);
  });
};


function showSuccessToast(mensaje) {
  Toastify({
    text: mensaje,
    duration: 1500,
    gravity: "bottom",
    position: "center",
    style: {
      fontSize: "12px",        // más pequeño
      padding: "4px 10px"      // menos alto/ancho
    }
  }).showToast();

}

function generarId(lista) {
  const prefijo = "INV";

  // Extrae números usados (1..100) protegiendo distintos formatos de entrada
  const usados = new Set();
  const existingIds = new Set();

  if (Array.isArray(lista)) {
    for (const item of lista) {
      let str = null;

      if (typeof item === "string") {
        str = item;
      } else if (item && typeof item === "object") {
        // intenta coger propiedades comunes que pueden contener el id
        str = item.id ?? item.Id ?? item.ID ?? null;
      }

      if (typeof str === "string") {
        existingIds.add(str);

        // Buscar 1-3 dígitos al final (por si no tiene exactamente 3)
        const m = str.match(/-(\d{1,3})$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!Number.isNaN(n) && n >= 1 && n <= 130) usados.add(n);
        }
      }
    }
  }

  // Buscar primer hueco disponible del 1 al 100
  let numero = null;
  for (let i = 1; i <= 130; i++) {
    if (!usados.has(i)) {
      numero = i;
      console.log("Usados:")
      console.log(usados)
      console.log("Generado:")
      console.log(numero)
      break;
    }
  }
  if (numero === null) {
    throw new Error("Se alcanzó el máximo de 130 IDs");
  }

  const numeroStr = String(numero).padStart(3, "0");

  // Generar letras aleatorias y asegurar unicidad completa del ID
  const randLetters = () =>
    Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");

  let intento = 0;
  let letras, candidato;
  do {
    letras = randLetters();
    candidato = `${prefijo}-${letras}-${numeroStr}`;
    intento++;
    if (intento > 1000) throw new Error("No se pudo generar un ID único (demasiados intentos)");
  } while (existingIds.has(candidato));

  return candidato;
}

window.exportarExcel = async () => {

  if (!lista) {
    lista = await apiPost({ accion: "listar" });
  }

  const filas = [];

  lista.forEach(inv => {
    const telefono = inv.Telefono || "";
    const mesa = inv.Mesa || "Sin asignar";
    const nombreInv = inv.Nombre || "";
    const id = inv.id;
    const detalle = inv.Detalle || [];
    const busGrupal = inv.BusGrupal;
    const pagoBus = inv.PagoBus;


    // Si no tiene detalle, igual se exporta una fila con "UNICO"
    if (detalle.length === 0) {
      filas.push({
        InvitadoId: id,
        Invitado: nombreInv,
        Integrante: nombreInv,
        Telefono: telefono,
        Mesa: mesa,
        BusGrupal:busGrupal,
        PagoBus: pagoBus
      });
    } else {
      detalle.forEach(d => {
        filas.push({
          InvitadoId: id,
          Invitado: nombreInv,
          Integrante: d.Integrante === "UNICO" ? nombreInv : d.Intergrante || d.Integrante,
          Telefono: telefono,
          Mesa: mesa,
          BusGrupal:d.BusGrupal,
          PagoBus: pagoBus
        });
      });
    }

  });

  // Crear hoja Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(filas);

  XLSX.utils.book_append_sheet(wb, ws, "Invitados");

  XLSX.writeFile(wb, "InvitadosDetalle.xlsx");
};

// Helper para llamar a tu backend en Netlify
async function apiPost(payload) {
  const res = await fetch("/.netlify/functions/invitados", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return res.json();
}

function checkmark(valor) {
  return valor ? "✔️" : "❌";
}

// Función para contar confirmaciones (true = confirmado)
function contarConfirmaciones(detalle) {
  let total = 0;
  if (detalle.Civil) total++;
  if (detalle.Sellamiento) total++;
  if (detalle.Recepcion) total++;
  if (detalle.BusGrupal) total++;
  return total;
}

// Cargar todos los invitados con su detalle
async function cargarConfirmaciones() {
  const lista = await apiPost({ accion: "listar" });

  const cont = document.getElementById("contenedor-confirmaciones");
  cont.innerHTML = "";

  let items = [];
  lista.forEach(inv => {
    (inv.Detalle || []).forEach(d => {
      items.push({
        Nombre: inv.Nombre,
        Integrante: d.Integrante,
        Civil: d.Civil,
        Sellamiento: d.Sellamiento,
        Recepcion: d.Recepcion,
        BusGrupal: d.BusGrupal,
        Mesa: inv.Mesa,
        Confirmaciones: contarConfirmaciones(d),
        PagoBus: inv.PagoBus ?? false
      });
    });
  });

  items.sort((a, b) =>
    a.Mesa.toString().localeCompare(b.Mesa.toString(), "es", { numeric: true })
  );

  const totales = {
    Civil: items.filter(i => i.Civil).length,
    Sellamiento: items.filter(i => i.Sellamiento).length,
    Recepcion: items.filter(i => i.Recepcion).length,
    BusGrupal: items.filter(i => i.BusGrupal).length
  };

  const tabla = document.createElement("table");
  tabla.id = "tabla-confirmaciones"; // <-- necesario para DataTable
  tabla.className = "table table-bordered table-striped";
  tabla.innerHTML = `
    <thead class="table-dark">
      <tr>
        <th>Invitado</th>
        <th>Integrante</th>
        <th>Civil (${totales.Civil})</th>
        <th>Sellamiento (${totales.Sellamiento})</th>
        <th>Recepción (${totales.Recepcion})</th>
        <th>Bus (${totales.BusGrupal})</th>
        <th>Pagado</th>
        <th>Total Confirmaciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = tabla.querySelector("tbody");

  items.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.Nombre}</td>
      <td>${item.Integrante}</td>
      <td class="text-center">${checkmark(item.Civil)}</td>
      <td class="text-center">${checkmark(item.Sellamiento)}</td>
      <td class="text-center">${checkmark(item.Recepcion)}</td>
      <td class="text-center">${checkmark(item.BusGrupal)}</td>
      <td class="text-center">
      ${ item.BusGrupal 
          ? (item.PagoBus ? "💸✔️" : "❌") 
          : "" 
      }
      </td>
      <td class="text-center fw-bold">${item.Confirmaciones}</td>

    `;
    tbody.appendChild(row);
  });

  cont.appendChild(tabla);

  // -----------------------------------------
  //  3. Inicializar DataTables
  // -----------------------------------------

  // Si ya había datatable antes → destruirlo
  if ($.fn.DataTable.isDataTable('#tabla-confirmaciones')) {
    $('#tabla-confirmaciones').DataTable().destroy();
  }

  // Inicializar DataTable
  $('#tabla-confirmaciones').DataTable({
    pageLength: 100,
    responsive: true,
    order: [], // sin orden inicial, respeta tu sort
    columnDefs: [
      { targets: "_all", orderable: true } // habilita sorting en todas las columnas
    ]
  });
}

// Inicial
cargarConfirmaciones();

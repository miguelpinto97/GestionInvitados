import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc
} from "firebase/firestore";

import { randomUUID } from "crypto";

const firebaseConfig = {
  apiKey: "AIzaSyDdljWjfJnpnEN4JGA8IXDIYa1IUyJ71LU",
  authDomain: "ladecisiondelheroe.firebaseapp.com",
  projectId: "ladecisiondelheroe",
  storageBucket: "ladecisiondelheroe.firebasestorage.app",
  messagingSenderId: "667836434780",
  appId: "1:667836434780:web:012b3afd8bcd09c5b31999",
  measurementId: "G-GHRYFMQWDB"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function generarCodigo() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}
function generarSecreto() {
  return randomUUID();
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};


function apiResponse(ok, mensaje, data = null) {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      ok,
      mensaje,
      data
    })
  };
}




export async function handler(event) {

  // -----------------------------
  // CORS PREFLIGHT
  // -----------------------------
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const accion = body.accion ?? "";
  const data = body.data ?? {};

  // -----------------------------
  // CREAR SALA
  // accion: "" o "crear"
  // -----------------------------
  if (accion === "crear") {
    let codigo;
    let existe = true;

    while (existe) {
      codigo = generarCodigo();
      const snap = await getDoc(doc(db, "salas", codigo));
      existe = snap.exists();
    }

    const secreto = generarSecreto();

    await setDoc(doc(db, "salas", codigo), {
      activa: true,
      iniciada: false,
      secreto,
      createdAt: new Date(),
    });

    return apiResponse(true, "Sala creada correctamente", {
      codigo,
      secreto
    });
  }

  // -----------------------------
  // UNIRSE A SALA
  // -----------------------------
  if (accion === "unirse") {
    const { codigo, nickname } = data;

    if (!codigo || !nickname) {
      return apiResponse(false, "Datos incompletos");
    }

    const salaRef = doc(db, "salas", codigo);
    const salaSnap = await getDoc(salaRef);

    if (!salaSnap.exists() || !salaSnap.data().activa) {
      return apiResponse(false, "Sala no válida");
    }

    if (salaSnap.data().iniciada) {
      return apiResponse(false, "El juego ya ha iniciado");
    }

    const userId = randomUUID();

    await setDoc(doc(db, "salas", codigo, "usuarios", userId), {
      nickname,
      joinedAt: new Date(),
      rol: "",
      equipo: ""
    });

    return apiResponse(true, "Usuario unido a la sala", {
      userId
    });
  }

  // -----------------------------
  // LISTAR USUARIOS
  // -----------------------------
  if (accion === "usuarios") {
    const { codigo } = data;

    if (!codigo) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: "Código requerido"
      };
    }

    const usersRef = collection(db, "salas", codigo, "usuarios");
    const snap = await getDocs(usersRef);

    const usuarios = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(usuarios)
    };
  }

  // -----------------------------
  // VALIDAR SALA
  // -----------------------------
  if (accion === "validar") {
    const { codigo } = data;

    if (!codigo) {
      return apiResponse(false, "Código requerido");
    }

    const salaSnap = await getDoc(doc(db, "salas", codigo));

    if (!salaSnap.exists()) {
      return apiResponse(false, "La sala no existe");
    }

    const sala = salaSnap.data();

    if (!sala.activa) {
      return apiResponse(false, "La sala ya no está activa");
    }

    if (sala.iniciada) {
      return apiResponse(false, "El juego ya ha iniciado");
    }

    return apiResponse(true, "Sala disponible");
  }

  // -----------------------------
  // SALIR DE SALA
  // -----------------------------
  if (accion === "salir") {
    const { codigo, userId } = data;

    if (!codigo || !userId) {
      return apiResponse(false, "Datos incompletos");
    }

    const userRef = doc(db, "salas", codigo, "usuarios", userId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      await deleteDoc(userRef);
    }

    return apiResponse(true, "Usuario eliminado de la sala");
  }

  // -----------------------------
  // INICIAR JUEGO
  // -----------------------------
  if (accion === "iniciar") {
    const { codigo, secreto } = data;

    if (!codigo || !secreto) {
      return apiResponse(false, "Código y secreto son requeridos");
    }

    const salaRef = doc(db, "salas", codigo);
    const salaSnap = await getDoc(salaRef);

    if (!salaSnap.exists()) {
      return apiResponse(false, "La sala no existe");
    }

    const sala = salaSnap.data();

    if (!sala.activa) {
      return apiResponse(false, "La sala no está activa");
    }

    if (sala.iniciada) {
      return apiResponse(false, "El juego ya fue iniciado");
    }

    if (sala.secreto !== secreto) {
      return apiResponse(false, "La sala debe ser iniciada por el host");
    }

    // -----------------------------
    // OBTENER JUGADORES
    // -----------------------------
    const usersSnap = await getDocs(collection(db, "salas", codigo, "usuarios"));

    if (usersSnap.size < 3) {
      return apiResponse(false, "Se requieren al menos 3 jugadores");
    }

    const jugadores = usersSnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    // -----------------------------
    // SHUFFLE
    // -----------------------------
    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    };

    shuffle(jugadores);

    // -----------------------------
    // ASIGNAR JUEZ
    // -----------------------------
    const juez = jugadores.shift();

    const asignaciones = {
      [juez.id]: {
        rol: "rol_0001", // Juez
        equipo: 0
      }
    };

    // -----------------------------
    // DIVIDIR EQUIPOS
    // -----------------------------
    const equipo1 = [];
    const equipo2 = [];

    jugadores.forEach((j, index) => {
      (index % 2 === 0 ? equipo1 : equipo2).push(j);
    });

    // -----------------------------
    // ROLES DISPONIBLES (SIN JUEZ)
    // -----------------------------
    const ROLES_DISPONIBLES = [
      "rol_0002", // Abogado
      "rol_0003",
      "rol_0004",
      "rol_0005",
      "rol_0006",
      "rol_0007",
      "rol_0008",
      "rol_0009"
    ];

    const asignarEquipo = (equipo, numeroEquipo) => {
      shuffle(equipo);

      // Abogado
      const abogado = equipo.shift();
      asignaciones[abogado.id] = {
        rol: "rol_0002",
        equipo: numeroEquipo
      };

      // Resto de jugadores
      equipo.forEach(j => {
        const rolRandom =
          ROLES_DISPONIBLES[Math.floor(Math.random() * ROLES_DISPONIBLES.length)];

        asignaciones[j.id] = {
          rol: rolRandom,
          equipo: numeroEquipo
        };
      });
    };

    asignarEquipo(equipo1, 1);
    asignarEquipo(equipo2, 2);

    // -----------------------------
    // GUARDAR EN FIRESTORE
    // -----------------------------
    const batch = [];

    for (const userId in asignaciones) {
      const ref = doc(db, "salas", codigo, "usuarios", userId);
      batch.push(
        setDoc(
          ref,
          {
            rol: asignaciones[userId].rol,
            equipo: asignaciones[userId].equipo
          },
          { merge: true }
        )
      );
    }

    await Promise.all(batch);

    // -----------------------------
    // MARCAR SALA COMO INICIADA
    // -----------------------------
    await setDoc(
      salaRef,
      {
        iniciada: true,
        iniciadaAt: new Date()
      },
      { merge: true }
    );

    return apiResponse(true, "El juego ha iniciado correctamente");
  }



  // -----------------------------
  // ACCIÓN NO SOPORTADA
  // -----------------------------
  return apiResponse(false, "Acción no soportada");

}

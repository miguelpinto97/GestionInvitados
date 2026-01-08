import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc
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
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

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

    await setDoc(doc(db, "salas", codigo), {
      activa: true,
      createdAt: new Date(),
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ codigo }),
    };
  }

  // -----------------------------
  // UNIRSE A SALA
  // -----------------------------
  if (accion === "unirse") {
    const { codigo, nickname } = data;

    if (!codigo || !nickname) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: "Datos incompletos"
      };
    }

    const salaRef = doc(db, "salas", codigo);
    const salaSnap = await getDoc(salaRef);

    if (!salaSnap.exists() || !salaSnap.data().activa) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: "Sala no válida"
      };
    }

    const userId = randomUUID();

    await setDoc(doc(db, "salas", codigo, "usuarios", userId), {
      nickname,
      joinedAt: new Date(),
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ userId }),
    };
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
  // ACCIÓN NO SOPORTADA
  // -----------------------------
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: "Acción no soportada",
  };
}

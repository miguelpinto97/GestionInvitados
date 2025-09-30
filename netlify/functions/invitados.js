// netlify/functions/invitados.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  query,
  orderBy
} from "firebase/firestore";

// ✅ TU CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyC6Di7CyehlsNI08PGpBHU75VJhVMWxEJs",
  authDomain: "invitadosboda-e1314.firebaseapp.com",
  projectId: "invitadosboda-e1314",
  storageBucket: "invitadosboda-e1314.firebasestorage.app",
  messagingSenderId: "159250168397",
  appId: "1:159250168397:web:aa693cd4472ba0bf2f3a04",
  measurementId: "G-6Y772NVW4S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 Helpers
async function generarIdInvitado() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomLetras = "";
  for (let i = 0; i < 3; i++) {
    randomLetras += letras.charAt(Math.floor(Math.random() * letras.length));
  }

  const snapshot = await getDocs(collection(db, "Invitados"));
  let numeros = [];
  snapshot.forEach(docSnap => {
    const partes = docSnap.id.split("-");
    if (partes.length === 3) {
      const numero = parseInt(partes[2], 10);
      if (!isNaN(numero)) numeros.push(numero);
    }
  });

  numeros.sort((a, b) => a - b);
  let secuencia = 1;
  for (let i = 0; i < numeros.length; i++) {
    if (numeros[i] !== secuencia) break;
    secuencia++;
  }

  const numeroFormateado = String(secuencia).padStart(3, "0");
  return `INV-${randomLetras}-${numeroFormateado}`;
}

// 🔹 CRUD atómico
async function listar() {
  const invitadosQuery = query(collection(db, "Invitados"), orderBy("Mesa", "asc"));
  const querySnapshot = await getDocs(invitadosQuery);
  const lista = [];
  querySnapshot.forEach(docSnap => lista.push({ id: docSnap.id, ...docSnap.data() }));
  return lista;
}

async function obtener(id) {
  const docRef = doc(db, "Invitados", id);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function guardar(data) {
  let id = data.Id;
  if (!id) id = await generarIdInvitado();
  delete data.Id;
  await setDoc(doc(db, "Invitados", id), data);
  return { ok: true, id };
}

async function eliminar(id) {
  await deleteDoc(doc(db, "Invitados", id));
  return { ok: true };
}

async function actualizarMesa(id, mesa) {
  await updateDoc(doc(db, "Invitados", id), { Mesa: mesa });
  return { ok: true };
}

// 🔹 Handler principal Netlify
export async function handler(event) {
  try {
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const { action, id, data, mesa } = body;

    if (method === "GET") {
      const lista = await listar();
      return { statusCode: 200, body: JSON.stringify(lista) };
    }

    if (method === "POST") {
      if (action === "guardar") {
        const res = await guardar(data);
        return { statusCode: 200, body: JSON.stringify(res) };
      }
      if (action === "eliminar") {
        const res = await eliminar(id);
        return { statusCode: 200, body: JSON.stringify(res) };
      }
      if (action === "obtener") {
        const res = await obtener(id);
        return { statusCode: 200, body: JSON.stringify(res) };
      }
      if (action === "mesa") {
        const res = await actualizarMesa(id, mesa);
        return { statusCode: 200, body: JSON.stringify(res) };
      }
    }

    return { statusCode: 400, body: "Acción inválida" };
  } catch (err) {
    console.error("Error en function:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

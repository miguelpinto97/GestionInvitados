import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";

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

export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { accion, id, data, Id } = body;

    if (accion === "listar") {
      const snap = await getDocs(collection(db, "Invitados"));
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return { statusCode: 200, body: JSON.stringify(lista) };
    }

    if (accion === "guardar") {
      let docId = Id || id || Date.now().toString();
      await setDoc(doc(db, "Invitados", docId), data, { merge: true });
      return { statusCode: 200, body: JSON.stringify({ ok: true, id: docId }) };
    }

    if (accion === "obtener") {
      const snap = await getDoc(doc(db, "Invitados", id));
      return { statusCode: 200, body: JSON.stringify(snap.exists() ? { id: snap.id, ...snap.data() } : null) };
    }

    if (accion === "eliminar") {
      await deleteDoc(doc(db, "Invitados", id));
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (accion === "BloquearEdicion") {
      const docId = Id || id;

      await setDoc(
        doc(db, "Invitados", docId),
        { BloquearEdicion: true },
        { merge: true }
      );

      return { statusCode: 200, body: JSON.stringify({ ok: true, id: docId }) };
    }

    if (accion === "DesbloquearEdicion") {
      const docId = Id || id;

      await setDoc(
        doc(db, "Invitados", docId),
        { BloquearEdicion: false },
        { merge: true }
      );
      return { statusCode: 200, body: JSON.stringify({ ok: true, id: docId }) };
    }
    
    if (accion === "MarcarPagoBus") {
      const docId = Id || id;

      await setDoc(
        doc(db, "Invitados", docId),
        { PagoBus: true },
        { merge: true }
      );

      return { statusCode: 200, body: JSON.stringify({ ok: true, id: docId }) };
    }
    
    if (accion === "DesmarcarPagoBus") {
      const docId = Id || id;

      await setDoc(
        doc(db, "Invitados", docId),
        { PagoBus: false },
        { merge: true }
      );

      return { statusCode: 200, body: JSON.stringify({ ok: true, id: docId }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Acción inválida" }) };
  } catch (err) {
    console.error("Error en function:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

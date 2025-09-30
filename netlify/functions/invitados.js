import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

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

export default async function handler(req, res) {
  try {
    const body = JSON.parse(req.body);
    const { accion } = body;

    if (accion === "listar") {
      const snap = await getDocs(collection(db, "Invitados"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(data);
    }

    if (accion === "guardar") {
      let id = body.data.Id || body.Id;
      if (!id) {
        id = Date.now().toString(); // simple id único
      }
      delete body.data.Id;
      await setDoc(doc(db, "Invitados", id), body.data, { merge: true });
      return res.status(200).json({ ok: true, id });
    }

    if (accion === "obtener") {
      const snap = await getDoc(doc(db, "Invitados", body.id));
      return res.status(200).json(snap.exists() ? snap.data() : {});
    }

    if (accion === "eliminar") {
      await deleteDoc(doc(db, "Invitados", body.id));
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Acción no válida" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error en servidor" });
  }
}

import { db } from "./shared/firebaseClient.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export async function handler() {
  try {
    const invitadosQuery = query(collection(db, "Invitados"), orderBy("Mesa", "asc"));
    const querySnapshot = await getDocs(invitadosQuery);

    const invitados = [];
    querySnapshot.forEach(docSnap => {
      invitados.push({ id: docSnap.id, ...docSnap.data() });
    });

    return { statusCode: 200, body: JSON.stringify(invitados) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}

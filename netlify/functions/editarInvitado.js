import { db } from "./firebaseClient.js";
import { doc, getDoc } from "firebase/firestore";

export async function handler(event) {
  try {
    const { id } = JSON.parse(event.body);
    const docRef = doc(db, "Invitados", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { statusCode: 404, body: "No encontrado" };
    }
    return { statusCode: 200, body: JSON.stringify(docSnap.data()) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}

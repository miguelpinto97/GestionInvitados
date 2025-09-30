import { db } from "./shared/firebaseClient.js";
import { doc, deleteDoc } from "firebase/firestore";

export async function handler(event) {
  try {
    const { id } = JSON.parse(event.body);
    await deleteDoc(doc(db, "Invitados", id));
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}

import { db } from "./shared/firebaseClient.js";
import { doc, updateDoc } from "firebase/firestore";

export async function handler(event) {
  try {
    const { id, mesa } = JSON.parse(event.body);
    await updateDoc(doc(db, "Invitados", id), { Mesa: mesa });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}

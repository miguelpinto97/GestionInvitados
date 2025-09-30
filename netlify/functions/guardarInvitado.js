import { db } from "./firebaseClient.js";
import { doc, setDoc } from "firebase/firestore";

export async function handler(event) {
  try {
    const { id, data } = JSON.parse(event.body);
    await setDoc(doc(db, "Invitados", id), data);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}

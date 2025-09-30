import { db } from "./shared/firebaseClient.js";
import { collection, getDocs } from "firebase/firestore";

export async function handler() {
  try {
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
    const id = `INV-${randomLetras}-${numeroFormateado}`;

    return { statusCode: 200, body: JSON.stringify({ id }) };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
}

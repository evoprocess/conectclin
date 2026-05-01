import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// ==================== APP CHECK ====================
// Em desenvolvimento, o App Check pode falhar no localhost.
// Se quiser desativar temporariamente, comente as 3 linhas abaixo.
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_APP_CHECK_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
} catch (error) {
  console.warn("⚠️ App Check não inicializado:", error.message);
}

// ==================== FIREBASE SERVICES ====================
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

// ==================== IMGBB ====================
let imgbbApiKey = null;

export async function getImgbbApiKey() {
  if (imgbbApiKey) return imgbbApiKey;
  try {
    const configRef = doc(db, "config", "api");
    const configDoc = await getDoc(configRef);
    if (configDoc.exists()) {
      imgbbApiKey = configDoc.data().imgbb_key_desafio_fotos;
      return imgbbApiKey;
    }
  } catch (error) {
    console.error("Erro ao carregar chave ImgBB:", error);
  }
  return null;
}

export async function uploadParaImgbb(imagemBase64) {
  const apiKey = await getImgbbApiKey();
  if (!apiKey) throw new Error("API key do ImgBB não configurada");

  const base64Data = imagemBase64.split(",")[1] || imagemBase64;
  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", base64Data);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  if (result.success) {
    return {
      success: true,
      url: result.data.url,
      delete_url: result.data.delete_url,
      thumb: result.data.thumb,
    };
  }
  throw new Error(result.error?.message || "Erro no upload");
}
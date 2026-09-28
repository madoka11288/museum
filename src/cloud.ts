import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import config from "../firebase-applet-config.json";

const app = initializeApp(config);
export const auth = getAuth(app);
const db = getFirestore(app);

export const login = () => signInWithPopup(auth, new GoogleAuthProvider());
export const onUser = (cb: (u: any) => void) => onAuthStateChanged(auth, cb);

const col = () => collection(db, "users", auth.currentUser!.uid, "items");

export const saveItem = (item: any) => setDoc(doc(col(), item.id), item);
export const removeItem = (id: string) => deleteDoc(doc(col(), id));
export const loadItems = async () =>
  (await getDocs(col())).docs.map((d) => d.data());

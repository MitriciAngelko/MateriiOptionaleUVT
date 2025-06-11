import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export { login, register };

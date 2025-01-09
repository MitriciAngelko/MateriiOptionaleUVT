import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

function AuthForm(props) {
  const { isRegister } = props;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Cont creat cu succes!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/"); // Redirect to homepage
    } catch (err) {
      setError(err.message);
    }
  };

  return React.createElement(
    "form",
    { className: "bg-white p-6 rounded-lg shadow-md", onSubmit: handleSubmit },
    React.createElement(
      "h2",
      { className: "text-xl font-bold text-center mb-4" },
      isRegister ? "Creează un cont" : "Autentifică-te"
    ),
    error &&
      React.createElement(
        "p",
        { className: "text-red-500 text-sm mb-4" },
        error
      ),
    React.createElement(
      "div",
      { className: "mb-4" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-600" },
        "Email"
      ),
      React.createElement("input", {
        type: "email",
        value: email,
        onChange: (e) => setEmail(e.target.value),
        required: true,
        className: "w-full px-4 py-2 border rounded-lg",
      })
    ),
    React.createElement(
      "div",
      { className: "mb-4" },
      React.createElement(
        "label",
        { className: "block text-sm font-medium text-gray-600" },
        "Parolă"
      ),
      React.createElement("input", {
        type: "password",
        value: password,
        onChange: (e) => setPassword(e.target.value),
        required: true,
        className: "w-full px-4 py-2 border rounded-lg",
      })
    ),
    React.createElement(
      "button",
      {
        type: "submit",
        className:
          "w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700",
      },
      isRegister ? "Înregistrează-te" : "Autentifică-te"
    )
  );
}

export default AuthForm;


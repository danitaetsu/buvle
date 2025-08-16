import React, { useState } from "react";
import { View } from "react-native";
import Login from "./components/Login";
import Register from "./components/Register";
import PersonalArea from "./pages/PersonalArea";
import Horario from "./pages/Horario";


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nombre, setNombre] = useState("");
  const [idAlumno, setIdAlumno] = useState(null); // 👈 guardamos el id del usuario
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {isRegistering ? (
        <Register setIsRegistering={setIsRegistering} />
      ) : isLoggedIn ? (
        // 👇 tras login mandamos directo a Horario con el id del alumno
        <Horario id_alumno={idAlumno} />
      ) : (
        <Login
          setIsLoggedIn={setIsLoggedIn}
          setNombre={setNombre}
          setIdAlumno={setIdAlumno} // 👈 pasamos este setter al login
          setIsRegistering={setIsRegistering}
        />
      )}
    </View>
  );
}

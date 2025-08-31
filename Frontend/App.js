// App.js - CORREGIDO

import React, { useState } from 'react';
import { View } from 'react-native';
import Login from './components/Login';
import Register from './components/Register';
import PersonalArea from './pages/PersonalArea';
import Password from './components/Password';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nombre, setNombre] = useState('');
  const [idAlumno, setIdAlumno] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const [tipoPago, setTipoPago] = useState(null);
  const [mesMatricula, setMesMatricula] = useState(null);
  const [planClases, setPlanClases] = useState(null);

  // --- 👇 NUEVA FUNCIÓN ---
  // Esta función actualiza el estado cuando el plan cambia en Formato.js
  const handlePlanChange = (nuevoPlan) => {
    setPlanClases(nuevoPlan);
  };

  return (
    <View style={{ flex: 1 }}>
      {isRegistering ? (
        <Register setIsRegistering={setIsRegistering} />
      ) : isRecovering ? (
        <Password setIsRecovering={setIsRecovering} />
      ) : isLoggedIn ? (
        <PersonalArea
          nombre={nombre}
          idAlumno={idAlumno}
          setIsLoggedIn={setIsLoggedIn}
          tipoPago={tipoPago}
          mesMatricula={mesMatricula}
          planClases={planClases}
          // --- 👇 PASAMOS LA NUEVA FUNCIÓN ---
          onPlanChanged={handlePlanChange}
        />
      ) : (
        <Login
          setIsLoggedIn={setIsLoggedIn}
          setNombre={setNombre}
          setIdAlumno={setIdAlumno}
          setIsRegistering={setIsRegistering}
          setIsRecovering={setIsRecovering}
          setTipoPago={setTipoPago}
          setMesMatricula={setMesMatricula}
          setPlanClases={setPlanClases}
        />
      )}
    </View>
  );
}
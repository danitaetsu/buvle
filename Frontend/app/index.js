import React, { useState } from 'react';
import { View } from 'react-native';
import Login from '../components/Login';
import Register from '../components/Register';
import PersonalArea from '../pages/PersonalArea';
import Password from '../components/Password'; // 👈 pantalla de recuperación de contraseña

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nombre, setNombre] = useState('');
  const [idAlumno, setIdAlumno] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // 👉 nuevos estados globales
  const [tipoPago, setTipoPago] = useState(null);       // 1 = App, 2 = Domiciliación
  const [mesMatricula, setMesMatricula] = useState(null); // 0 = Clases sueltas, 1-12 = meses
  const [planClases, setPlanClases] = useState(null);     // 0, 2, 4, ...

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
          // 👇 pasamos también los nuevos datos al área personal
          tipoPago={tipoPago}
          mesMatricula={mesMatricula}
          planClases={planClases}
        />
      ) : (
        <Login
          setIsLoggedIn={setIsLoggedIn}
          setNombre={setNombre}
          setIdAlumno={setIdAlumno}
          setIsRegistering={setIsRegistering}
          setIsRecovering={setIsRecovering}
          // 👇 pasamos los setters al login para guardar los valores
          setTipoPago={setTipoPago}
          setMesMatricula={setMesMatricula}
          setPlanClases={setPlanClases}
        />
      )}
    </View>
  );
}

//funciona
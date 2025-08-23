import React, { useState } from 'react';
import { View } from 'react-native';
import Login from './components/Login';
import Register from './components/Register';
import PersonalArea from './pages/PersonalArea';
import Password from './components/Password'; // 👈 importamos la nueva pantalla

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nombre, setNombre] = useState('');
  const [idAlumno, setIdAlumno] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false); // 👈 nuevo estado

  return (
    <View style={{ flex: 1 }}>
      {isRegistering ? (
        <Register setIsRegistering={setIsRegistering} />
      ) : isRecovering ? ( // 👈 si está en recuperación, mostramos Password
        <Password setIsRecovering={setIsRecovering} />
      ) : isLoggedIn ? (
        <PersonalArea
          nombre={nombre}
          idAlumno={idAlumno}
          setIsLoggedIn={setIsLoggedIn}
        />
      ) : (
        <Login
          setIsLoggedIn={setIsLoggedIn}
          setNombre={setNombre}
          setIdAlumno={setIdAlumno}
          setIsRegistering={setIsRegistering}
          setIsRecovering={setIsRecovering} // 👈 pasamos el nuevo setter
        />
      )}
    </View>
  );
}

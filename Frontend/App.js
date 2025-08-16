import React, { useState } from 'react';
import { View } from 'react-native';
import Login from './components/Login';
import Register from './components/Register';
import PersonalArea from './pages/PersonalArea';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nombre, setNombre] = useState('');
  const [idAlumno, setIdAlumno] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {isRegistering ? (
        <Register setIsRegistering={setIsRegistering} />
      ) : isLoggedIn ? (
        <PersonalArea
          nombre={nombre}
          idAlumno={idAlumno}     // 👈 lo pasamos aquí
          setIsLoggedIn={setIsLoggedIn}
        />
      ) : (
        <Login
          setIsLoggedIn={setIsLoggedIn}
          setNombre={setNombre}
          setIdAlumno={setIdAlumno} // 👈 lo guardamos en login
          setIsRegistering={setIsRegistering}
        />
      )}
    </View>
  );
}

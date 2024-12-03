import React, { useState } from 'react';
import { View } from 'react-native';
import Login from './components/Login';
import PersonalArea from './pages/PersonalArea';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nombre, setNombre] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Nuevo estado para controlar el registro

  // Controlar qué pantalla mostrar
  if (isRegistering) {
    return <Register setIsRegistering={setIsRegistering} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isLoggedIn ? (
        <PersonalArea nombre={nombre} setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <Login
          setIsLoggedIn={setIsLoggedIn}
          setNombre={setNombre}
          setIsRegistering={setIsRegistering} // Pasamos el setter para manejar el registro
        />
      )}
    </View>
  );
}

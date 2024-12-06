import React, { useState } from 'react';
import { View } from 'react-native';
import Login from './components/Login';
import Register from './components/Register'; // Importamos el componente de registro
import PersonalArea from './pages/PersonalArea';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado de login
  const [nombre, setNombre] = useState(''); // Nombre del usuario logueado
  const [isRegistering, setIsRegistering] = useState(false); // Estado para alternar entre Login y Register

  return (
    <View style={{ flex: 1 }}>
      {isRegistering ? (
        // Mostrar la pantalla de registro
        <Register setIsRegistering={setIsRegistering} />
      ) : isLoggedIn ? (
        // Mostrar el área personal si el usuario está logueado
        <PersonalArea nombre={nombre} setIsLoggedIn={setIsLoggedIn} />
      ) : (
        // Mostrar el login por defecto
        <Login
          setIsLoggedIn={setIsLoggedIn}
          setNombre={setNombre}
          setIsRegistering={setIsRegistering} // Pasamos la función para alternar a la pantalla de registro
        />
      )}
    </View>
  );
}


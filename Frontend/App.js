import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Login from './components/Login';
import PersonalArea from './pages/PersonalArea';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nombre, setNombre] = useState('');

  return (
    <View style={{ flex: 1 }}>
      {isLoggedIn ? (
        <PersonalArea nombre={nombre} setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <Login setIsLoggedIn={setIsLoggedIn} setNombre={setNombre} />
      )}
    </View>
  );
}

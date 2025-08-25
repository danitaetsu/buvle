import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Este es un componente temporal para la web
export default function PagosWeb() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Página de Pagos (Versión Web)
      </Text>
      <Text>Aquí irá el formulario de Stripe para la web.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
import React, { useState } from 'react';
// Importamos componentes de React Native que funcionan bien en la web
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
// Importamos las librerías de Stripe específicas para React web
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// --- Configuración ---
const API_URL = "https://buvle-backend.onrender.com";
// 👇 ¡CRÍTICO! Asegúrate de que aquí está tu clave publicable REAL de Stripe
const PUBLISHABLE_KEY = "pk_live_51Q2sLs04VOrKio1OOc0cM0yNNrMAFuOqRIuM4Vrh8QqhqSdyNUB8fPj5jVdZauiOjyAA8pWxFMtvdarnzPeHic2m00IiftIRS1"; 

// Carga la instancia de Stripe una sola vez.
const stripePromise = loadStripe(PUBLISHABLE_KEY);

// --- Estilos para el campo de la tarjeta ---
const cardElementOptions = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSize: "16px",
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: { color: "#fa755a", iconColor: "#fa755a" },
  },
};

// --- Componente interno que maneja el formulario de pago ---
// Usamos elementos HTML puros (<form>, <button>) para la máxima compatibilidad con Stripe.
const CheckoutForm = ({ setPaymentStatus, amount, setLastError }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPaymentStatus('processing');
    setLastError(''); // Limpiamos errores anteriores

    if (!stripe || !elements) {
      const errorMsg = "Stripe no está listo.";
      setLastError(errorMsg);
      setPaymentStatus('error');
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const res = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100) }),
      });

      const { clientSecret, error: backendError } = await res.json();

      if (backendError || !clientSecret) {
        const errorMsg = backendError || "Error del servidor al iniciar el pago.";
        setLastError(errorMsg);
        setPaymentStatus('error');
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        setLastError(error.message);
        setPaymentStatus('error');
      } else {
        console.log('Pago exitoso:', paymentIntent);
        setPaymentStatus('success');
      }
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      const errorMsg = "No se pudo conectar con el servidor de pagos.";
      setLastError(errorMsg);
      setPaymentStatus('error');
    }
  };

  return (
    // SOLUCIÓN: Usamos un <form> de HTML. Esto crea un entorno estable para Stripe.
    <form onSubmit={handleSubmit} style={styles.formContainer}>
      {/* SOLUCIÓN: Usamos <p> para el texto. Esto evita el error "Unexpected text node". */}
      <p style={styles.formTitle}>Introduce los datos de tu tarjeta</p>
      <div style={styles.cardElementWrapper}>
        <CardElement options={cardElementOptions} />
      </div>
      <div style={styles.buttonContainer}>
        {/* SOLUCIÓN: Usamos un <button> de HTML. Esto soluciona el "IntegrationError". */}
        <button type="submit" style={styles.button} disabled={!stripe}>
          {`Pagar ${amount.toFixed(2)} €`}
        </button>
      </div>
    </form>
  );
};

// --- Componente Principal que exportas ---
export default function Pagos({ tipoPago, mesMatricula, planClases }) {
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentAmount, setPaymentAmount] = useState(0.05); // Cantidad restaurada
  const [lastError, setLastError] = useState('');

  if (Number(tipoPago) !== 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Tu plan de pago es por domiciliación bancaria.</Text>
      </View>
    );
  }

  // Renderiza diferentes vistas según el estado del pago
  switch (paymentStatus) {
    case 'processing':
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.statusTitle}>Procesando tu pago...</Text>
        </View>
      );
    case 'success':
      return (
        <View style={styles.container}>
          <Text style={styles.statusTitle}>✅ ¡Pago realizado con éxito!</Text>
          <Button title="Realizar otro pago" onPress={() => setPaymentStatus('idle')} />
        </View>
      );
    case 'error':
      return (
        <View style={styles.container}>
          <Text style={styles.statusTitle}>❌ Hubo un error</Text>
          <Text style={styles.errorText}>{lastError}</Text>
          <Button title="Intentar de nuevo" onPress={() => setPaymentStatus('idle')} />
        </View>
      );
    default: // 'idle'
      return (
        <View style={styles.container}>
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              setPaymentStatus={setPaymentStatus} 
              setLastError={setLastError}
              amount={paymentAmount} 
            />
          </Elements>
        </View>
      );
  }
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
    color: '#333',
  },
  // Estilos para elementos web (se usan con la prop 'style' en elementos como <form>, <div>, <p>)
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    fontFamily: 'sans-serif',
  },
  cardElementWrapper: {
    padding: 10,
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
  errorText: {
    color: '#dc3545',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'sans-serif',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
});

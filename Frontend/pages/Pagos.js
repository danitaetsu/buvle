import React, { useEffect } from "react";
import { View, Button, Alert } from "react-native";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";

const API_URL = "https://buvle-backend.onrender.com"; // tu backend

export default function Pagos({ tipoPago }) {
  const stripe = useStripe();

  const handlePayPress = async () => {
    try {
      // 1. Crear PaymentIntent en tu backend
      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000 }), // 10€ en céntimos
      });

      const { clientSecret } = await response.json();

      if (!clientSecret) {
        Alert.alert("Error", "No se pudo iniciar el pago");
        return;
      }

      // 2. Confirmar pago con Stripe
      const { error, paymentIntent } = await stripe.confirmPayment(clientSecret, {
        paymentMethodType: "Card",
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else if (paymentIntent) {
        Alert.alert("Éxito", "Pago completado con éxito ✅");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Hubo un problema al procesar el pago");
    }
  };

  if (tipoPago !== "1") {
    return (
      <View style={{ padding: 20 }}>
        <Button title="No necesitas pagar (Domiciliación)" disabled />
      </View>
    );
  }

  return (
    <StripeProvider publishableKey="pk_test_xxx"> 
      <View style={{ padding: 20 }}>
        <Button title="Pagar 10€" onPress={handlePayPress} />
      </View>
    </StripeProvider>
  );
}

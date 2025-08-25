import React, { useEffect, useState } from "react";
import { View, Button, Alert, Platform } from "react-native";

const API_URL = "https://buvle-backend.onrender.com";
const PUBLISHABLE_KEY = "pk_test_xxx"; // 👉 pon tu publishable real

export default function Pagos({ tipoPago, mesMatricula, planClases }) {
  const [stripe, setStripe] = useState(null);
  const [stripeModule, setStripeModule] = useState(null);

  // Cargar Stripe dinámicamente según plataforma
  useEffect(() => {
    if (Platform.OS === "web") {
      import("@stripe/stripe-js").then(({ loadStripe }) => {
        loadStripe(PUBLISHABLE_KEY).then((s) => setStripe(s));
      });
    } else {
      import("@stripe/stripe-react-native").then((mod) => {
        setStripeModule(mod);
      });
    }
  }, []);

  const handlePayPress = async () => {
    try {
      // 1. Crear PaymentIntent en tu backend
      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000 }), // 💶 10€ (céntimos)
      });

      const { clientSecret } = await response.json();
      if (!clientSecret) return Alert.alert("Error", "No se pudo iniciar el pago");

      if (Platform.OS === "web") {
        if (!stripe) return Alert.alert("Error", "Stripe aún no cargó");
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: { token: "tok_visa" }, // ⚠️ Solo pruebas
          },
        });
        if (error) Alert.alert("Error", error.message);
        else if (paymentIntent) Alert.alert("✅ Éxito", "Pago completado en Web");
      } else {
        if (!stripeModule) return Alert.alert("Error", "Stripe RN no cargó");
        const { useStripe } = stripeModule;
        const { confirmPayment } = useStripe();

        const { error, paymentIntent } = await confirmPayment(clientSecret, {
          paymentMethodType: "Card",
        });
        if (error) Alert.alert("Error", error.message);
        else if (paymentIntent) Alert.alert("✅ Éxito", "Pago completado en Móvil");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Hubo un problema al procesar el pago");
    }
  };

  // 👉 Si el alumno tiene domiciliación (tipoPago != 1)
  if (Number(tipoPago) !== 1) {
    return (
      <View style={{ padding: 20 }}>
        <Button title="No necesitas pagar (Domiciliación)" disabled />
      </View>
    );
  }

  // 👉 Si es tipoPago = 1 (App) → puede pagar
  if (Platform.OS === "web") {
    return (
      <View style={{ padding: 20 }}>
        <Button title="Pagar 10€ (Web)" onPress={handlePayPress} />
      </View>
    );
  }

  if (!stripeModule) return null; // espera a que cargue en móvil

  const { StripeProvider } = stripeModule;

  return (
    <StripeProvider publishableKey={PUBLISHABLE_KEY}>
      <View style={{ padding: 20 }}>
        <Button title="Pagar 10€ (Móvil)" onPress={handlePayPress} />
      </View>
    </StripeProvider>
  );
}

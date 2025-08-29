const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const { Resend } = require("resend");

const app = express();
const port = process.env.PORT || 3000;

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);



// 👇 CAMBIO 1: El webhook necesita el 'body' en formato raw.
// Esto debe ir ANTES que app.use(bodyParser.json()).
app.post('/stripe-webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`❌ Error de verificación de webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento de pago exitoso
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const idAlumno = paymentIntent.metadata.id_alumno;

    if (!idAlumno) {
      console.log("⚠️ Webhook recibido sin id_alumno en metadata.");
      return res.status(400).send("Metadata incompleta.");
    }
    
    console.log(`✅ Webhook: Pago exitoso para el alumno: ${idAlumno}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // Iniciar transacción

      // 1. Actualizar las clases disponibles del alumno
      const updateResult = await client.query(
        `UPDATE alumnos 
         SET clases_disponibles = clases_disponibles + plan_clases
         WHERE id_alumno = $1
         RETURNING nombre, clases_disponibles`,
        [idAlumno]
      );
      
      console.log(`   -> Clases actualizadas para ${updateResult.rows[0].nombre}. Ahora tiene ${updateResult.rows[0].clases_disponibles}.`);
      
      // 2. Insertar el registro del pago en la nueva tabla 'pagos'
      await client.query(
        `INSERT INTO pagos (id_alumno, stripe_payment_intent_id, monto, moneda, estado)
         VALUES ($1, $2, $3, $4, $5)`,
        [idAlumno, paymentIntent.id, paymentIntent.amount, paymentIntent.currency, paymentIntent.status]
      );
      
      console.log(`   -> Registro de pago creado en la tabla 'pagos'.`);
      
      await client.query('COMMIT'); // Confirmar transacción
    } catch (dbError) {
      await client.query('ROLLBACK'); // Revertir en caso de error
      console.error('❌ Error en la transacción del webhook:', dbError);
      return res.status(500).json({ error: "Error de base de datos" });
    } finally {
      client.release();
    }
  } else {
    console.log(`Evento no manejado: ${event.type}`);
  }

  res.json({received: true});
});




app.use(bodyParser.json());
app.use(cors({ origin: '*' }));;


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});




// inicializar resend con tu API KEY (añádela en Render → Environment)
const resend = new Resend(process.env.RESEND_API_KEY);

(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Conectado a Supabase PostgreSQL correctamente");
  } catch (err) {
    console.error("❌ Error de conexión a la base de datos:", err.message);
  }
})();

app.get("/", (req, res) => {
  res.send("API funcionando con PostgreSQL (Supabase)");
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
const result = await pool.query(
  `SELECT id_alumno, nombre, clases_disponibles, plan_clases, tipo_pago, mes_matricula 
   FROM alumnos 
   WHERE email = $1 AND password = $2`,
  [email, password]
);

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, alumno: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// REGISTER
app.post("/register", async (req, res) => {
  const { nombre, email, password, confirmPassword, plan_clases, tipo_pago, mes_matricula } = req.body;

  if (!nombre || !email || !password || !confirmPassword || !plan_clases || !tipo_pago || mes_matricula === undefined) {
    return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Las contraseñas no coinciden" });
  }

  try {
    const checkEmail = await pool.query("SELECT * FROM alumnos WHERE email = $1", [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: "El correo ya está registrado" });
    }

       // ✨ Hacemos el valor explícito para que no haya dudas.
    const clasesDisponiblesIniciales = 0;

    // ✨ AÑADIMOS ESTE CONSOLE.LOG PARA DEPURAR
    console.log(`Intentando registrar a ${email} con plan ${plan_clases} y ${clasesDisponiblesIniciales} clases disponibles.`);

    await pool.query(
      `INSERT INTO alumnos 
        (nombre, email, password, clases_disponibles, plan_clases, tipo_pago, mes_matricula) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nombre, email, password, clasesDisponiblesIniciales, plan_clases, tipo_pago, mes_matricula]
    );

    res.status(201).json({ success: true, message: "Alumno registrado con éxito" });
  } catch (err) {
    console.error("❌ Error en /register:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});


// --- NUEVO ENDPOINT PARA VERIFICAR SI UN MES ESTÁ PAGADO ---
app.get("/estado-mes/:idAlumno/:anio/:mes", async (req, res) => {
  // 1. Recogemos los datos que nos preguntan: quién, qué año y qué mes.
  const { idAlumno, anio, mes } = req.params;

  // Imprimimos en la consola de Render para que veas la pregunta que llega.
  console.log(`Consultando estado para Alumno: ${idAlumno}, Año: ${anio}, Mes: ${mes}`);

  try {
    // 2. Buscamos en nuestro "cuaderno" de meses_pagados.
    const result = await pool.query(
      `SELECT id_acceso FROM meses_pagados 
       WHERE id_alumno = $1 AND anio = $2 AND mes = $3`,
      [idAlumno, anio, mes]
    );

    // 3. Respondemos la pregunta.
    // Si la consulta encontró una fila (result.rows.length > 0), significa que está pagado.
    if (result.rows.length > 0) {
      res.json({ pagado: true }); // Respondemos: SÍ, está pagado.
    } else {
      res.json({ pagado: false }); // Respondemos: NO, no está pagado.
    }
  } catch (err) {
    console.error("❌ Error en /estado-mes:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// FORGOT PASSWORD
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email requerido" });

  try {
    const result = await pool.query("SELECT id_alumno, nombre FROM alumnos WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No existe usuario con ese correo" });
    }

    // generar contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8);

    // actualizar en BD
    await pool.query("UPDATE alumnos SET password = $1 WHERE email = $2", [tempPassword, email]);

    // enviar correo con Resend
    await resend.emails.send({
      from: "Buvle <onboarding@resend.dev>", // puedes usar dominio verificado
      to: email,
      subject: "Recuperación de contraseña",
      text: `Hola ${result.rows[0].nombre},\n\nTu nueva contraseña temporal es: ${tempPassword}\n\nPor favor cámbiala después de iniciar sesión.`,
    });

    res.json({ success: true, message: "Se ha enviado una nueva contraseña al correo" });
  } catch (err) {
    console.error("❌ Error en /forgot-password:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// TURNOS
app.get("/turnos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_turno, dia, hora_inicio, hora_fin, max_alumnos FROM turnos ORDER BY dia, hora_inicio"
    );
    res.json({ success: true, turnos: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al obtener turnos" });
  }
});

// RESERVAS POR RANGO
app.get("/reservas-rango", async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ success: false, message: "from y to requeridos" });
  }

  try {
    const result = await pool.query(
      `SELECT r.id_reserva, r.fecha_clase, r.id_turno, r.id_alumno,
              a.nombre, t.hora_inicio, t.hora_fin
       FROM reservas r
       JOIN alumnos a ON r.id_alumno = a.id_alumno
       JOIN turnos t ON r.id_turno = t.id_turno
       WHERE r.fecha_clase BETWEEN $1 AND $2
       ORDER BY r.fecha_clase, t.hora_inicio`,
      [from, to]
    );

    const events = result.rows.map(row => ({
      id: row.id_reserva,
      title: row.nombre,
      start: `${row.fecha_clase.toISOString().split("T")[0]}T${row.hora_inicio}:00`,
      end: `${row.fecha_clase.toISOString().split("T")[0]}T${row.hora_fin}:00`,
      id_turno: row.id_turno,
      id_alumno: row.id_alumno
    }));

    res.json({ success: true, events });
  } catch (err) {
    console.error("❌ Error en /reservas-rango:", err);
    res.status(500).json({ success: false, message: "Error al obtener reservas" });
  }
});

// RESERVAR
app.post("/reservar", async (req, res) => {
  const { id_alumno, id_turno, fecha_clase } = req.body;
  try {
    const count = await pool.query(
      "SELECT COUNT(*) FROM reservas WHERE id_turno = $1 AND fecha_clase = $2",
      [id_turno, fecha_clase]
    );
    const turnoInfo = await pool.query(
      "SELECT max_alumnos FROM turnos WHERE id_turno = $1",
      [id_turno]
    );
    if (parseInt(count.rows[0].count) >= turnoInfo.rows[0].max_alumnos) {
      return res.status(400).json({ success: false, message: "Turno completo" });
    }

    const alumno = await pool.query(
      "SELECT clases_disponibles FROM alumnos WHERE id_alumno = $1",
      [id_alumno]
    );
    if (alumno.rows[0].clases_disponibles <= 0) {
      return res.status(400).json({ success: false, message: "No tienes clases disponibles" });
    }

    const insert = await pool.query(
      "INSERT INTO reservas (id_alumno, id_turno, fecha_clase) VALUES ($1, $2, $3) RETURNING id_reserva",
      [id_alumno, id_turno, fecha_clase]
    );

    await pool.query(
      "UPDATE alumnos SET clases_disponibles = clases_disponibles - 1 WHERE id_alumno = $1",
      [id_alumno]
    );

    res.json({ success: true, id_reserva: insert.rows[0].id_reserva, message: "Reserva creada" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// CANCELAR RESERVA
app.post("/cancelar", async (req, res) => {
  const { id_alumno, id_turno, fecha_clase } = req.body;

  try {
    const reserva = await pool.query(
      "SELECT id_reserva FROM reservas WHERE id_alumno = $1 AND id_turno = $2 AND fecha_clase = $3",
      [id_alumno, id_turno, fecha_clase]
    );

    if (reserva.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No se encontró la reserva" });
    }

    await pool.query("DELETE FROM reservas WHERE id_reserva = $1", [reserva.rows[0].id_reserva]);

    await pool.query(
      "UPDATE alumnos SET clases_disponibles = clases_disponibles + 1 WHERE id_alumno = $1",
      [id_alumno]
    );

    res.json({ success: true, message: "Reserva cancelada correctamente" });
  } catch (err) {
    console.error("❌ Error en /cancelar:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// REFILL mensual
app.post("/refill", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE alumnos 
       SET clases_disponibles = clases_disponibles + plan_clases
       RETURNING id_alumno, nombre, clases_disponibles, plan_clases`
    );

    res.json({ success: true, message: "Refill mensual aplicado (acumulativo)", updated: result.rows });
  } catch (err) {
    console.error("❌ Error en /refill:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// GET alumno
app.get("/alumno/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT id_alumno, nombre, clases_disponibles FROM alumnos WHERE id_alumno = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Alumno no encontrado" });
    }

    res.json({
      success: true,
      alumno: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error en GET /alumno/:id:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// CAMBIO DE CONTRASEÑA
app.post("/change-password", async (req, res) => {
  const { idAlumno, oldPassword, newPassword } = req.body;

  if (!idAlumno || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Todos los campos son requeridos" });
  }

  try {
    const result = await pool.query("SELECT password FROM alumnos WHERE id_alumno = $1", [idAlumno]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Alumno no encontrado" });
    }

    if (result.rows[0].password !== oldPassword) {
      return res.status(400).json({ success: false, message: "La contraseña actual no es correcta" });
    }

    await pool.query("UPDATE alumnos SET password = $1 WHERE id_alumno = $2", [newPassword, idAlumno]);

    res.json({ success: true, message: "Contraseña cambiada correctamente" });
  } catch (err) {
    console.error("❌ Error en /change-password:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

//ENDPOINT PARA PAYMENT

// 👇 CAMBIO 2: Actualizamos el endpoint de payment
app.post("/create-payment-intent", async (req, res) => {
  const { idAlumno } = req.body; 

  if (!idAlumno) {
    return res.status(400).json({ error: "Falta el ID del alumno." });
  }

  try {
    // 1. Buscar el plan de clases del alumno
    const result = await pool.query(
      "SELECT plan_clases FROM alumnos WHERE id_alumno = $1",
      [idAlumno]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    const planClases = result.rows[0].plan_clases;

    // 2. Tabla de precios (en céntimos)
    const precios = {
      0: 100,  // 1 €
      2: 150,  // 1,5 €
      4: 200   // 2 €
    };

    const amount = precios[planClases];

    if (!amount) {
      return res.status(400).json({ error: "Plan de clases no válido." });
    }

    // 3. Crear PaymentIntent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: { id_alumno: idAlumno },
    });

    res.send({
  clientSecret: paymentIntent.client_secret,
  amount: amount / 100 // lo devolvemos en euros para el frontend
});

  } catch (err) {
    console.error("❌ Error en Stripe:", err);
    res.status(500).json({ error: err.message });
  }
});



app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});


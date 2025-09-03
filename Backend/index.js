const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const { Resend } = require("resend");

const app = express();
const port = process.env.PORT || 3000;

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// --- CONFIGURACIÓN DE MIDDLEWARE ---

// ✨ ACTUALIZADO: Webhook de Stripe mejorado para diferenciar pagos
app.post('/stripe-webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // ✨ NUEVO: Leemos 'tipo_pago' de los metadatos para diferenciar
    const { id_alumno, anio_pago, mes_pago, tipo_pago } = paymentIntent.metadata;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insertar en la tabla 'pagos' (esto es común a ambos tipos)
      await client.query(
        `INSERT INTO pagos (id_alumno, stripe_payment_intent_id, monto, moneda, estado) VALUES ($1, $2, $3, $4, $5)`,
        [id_alumno, paymentIntent.id, paymentIntent.amount, paymentIntent.currency, paymentIntent.status]
      );

      // 2. Lógica específica según el tipo de pago
      if (tipo_pago === 'matricula') {
        if (!id_alumno || !anio_pago) {
          throw new Error("Metadata incompleta para pago de matrícula.");
        }
        const mesDePagoMatricula = new Date().getMonth() + 1;
        await client.query(
          `INSERT INTO matriculas_pagadas (id_alumno, anio, mes, stripe_payment_intent_id) VALUES ($1, $2, $3, $4)`,
          [id_alumno, anio_pago, mesDePagoMatricula, paymentIntent.id]
        );
        console.log(`✅ MATRÍCULA PAGADA para alumno ${id_alumno}, año ${anio_pago}.`);

      } else { // Si no es matrícula, es un pago de mes normal
        if (!id_alumno || !anio_pago || !mes_pago) {
          throw new Error("Metadata incompleta para pago mensual.");
        }
        await client.query(
          `UPDATE alumnos SET clases_disponibles = clases_disponibles + plan_clases WHERE id_alumno = $1`,
          [id_alumno]
        );
        await client.query(
          `INSERT INTO meses_pagados (id_alumno, anio, mes) VALUES ($1, $2, $3)`,
          [id_alumno, anio_pago, mes_pago]
        );
        console.log(`✅ MES PAGADO para alumno ${id_alumno}, mes ${mes_pago}/${anio_pago}.`);
      }

      await client.query('COMMIT');
      console.log(`✅ TRANSACCIÓN COMPLETADA para payment_intent ${paymentIntent.id}.`);

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('❌ Error en transacción del webhook, ROLLBACK ejecutado:', dbError);
      return res.status(500).json({ error: "Error de base de datos procesando el webhook" });
    } finally {
      client.release();
    }
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

    const clasesDisponiblesIniciales = 0;

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


// --- ENDPOINT PARA ACTUALIZAR EL PLAN DE CLASES ---
app.post("/update-plan", async (req, res) => {
  const { idAlumno, nuevoPlan } = req.body;

  if (!idAlumno || !nuevoPlan) {
    return res.status(400).json({ success: false, message: "Faltan datos." });
  }

  try {
    await pool.query(
      "UPDATE alumnos SET plan_clases = $1 WHERE id_alumno = $2",
      [nuevoPlan, idAlumno]
    );
    res.json({ success: true, message: "¡Plan actualizado con éxito!" });
  } catch (err) {
    console.error("❌ Error en /update-plan:", err);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

// Endpoint para que el frontend consulte los meses pagados
app.get("/meses-pagados/:idAlumno", async (req, res) => {
  const { idAlumno } = req.params;
  try {
    const result = await pool.query(
      "SELECT anio, mes FROM meses_pagados WHERE id_alumno = $1",
      [idAlumno]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en /meses-pagados:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ✨ NUEVO: Endpoint para verificar si la matrícula de un año está pagada
app.get("/matricula-pagada/:idAlumno/:anio", async (req, res) => {
  const { idAlumno, anio } = req.params;
  try {
    const result = await pool.query(
      "SELECT id_matricula FROM matriculas_pagadas WHERE id_alumno = $1 AND anio = $2",
      [idAlumno, anio]
    );
    // Devuelve true si encuentra al menos una fila, false si no.
    res.json({ pagada: result.rows.length > 0 });
  } catch (err) {
    console.error("❌ Error en /matricula-pagada:", err);
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

    const tempPassword = Math.random().toString(36).slice(-8);

    await pool.query("UPDATE alumnos SET password = $1 WHERE email = $2", [tempPassword, email]);

    await resend.emails.send({
      from: "Buvle <onboarding@resend.dev>",
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
      start: `${row.fecha_clase.toISOString().split("T")[0]}T${row.hora_inicio}`,
      end: `${row.fecha_clase.toISOString().split("T")[0]}T${row.hora_fin}`,
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
      "SELECT id_alumno, nombre, clases_disponibles, mes_matricula FROM alumnos WHERE id_alumno = $1",
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

//--- ENDPOINTS PARA PAGOS ---

// Endpoint para iniciar un pago para un mes específico
app.post("/create-payment-intent", async (req, res) => {
  const { idAlumno, anio, mes } = req.body;

  if (!idAlumno || !anio || !mes) {
    return res.status(400).json({ error: "Faltan datos para procesar el pago." });
  }

  try {
    const alumnoResult = await pool.query("SELECT plan_clases FROM alumnos WHERE id_alumno = $1", [idAlumno]);
    if (alumnoResult.rows.length === 0) return res.status(404).json({ error: "Alumno no encontrado." });
    
    const planDelAlumno = alumnoResult.rows[0].plan_clases;
    const precios = { 0: 100, 2: 150, 4: 200 }; // Precios en céntimos
    const amount = precios[planDelAlumno];
    
    if (!amount) return res.status(400).json({ error: "Plan de clases no válido." });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        id_alumno: idAlumno,
        anio_pago: anio,
        mes_pago: mes,
        // tipo_pago: 'mensual' (opcional, ya que es el default)
      },
    });

    res.send({ 
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100 
    });
  } catch (err) {
    console.error("❌ Error en /create-payment-intent:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ✨ NUEVO: Endpoint para iniciar un pago de matrícula
app.post("/create-matricula-payment-intent", async (req, res) => {
  const { idAlumno, anio } = req.body;

  if (!idAlumno || !anio) {
    return res.status(400).json({ error: "Faltan datos para procesar el pago de matrícula." });
  }

  // Asumimos un precio fijo para la matrícula, por ejemplo 50€ (5000 céntimos)
  const amount = 250;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        id_alumno: idAlumno,
        anio_pago: anio,
        tipo_pago: 'matricula' // ¡Clave para diferenciarlo en el webhook!
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100
    });
  } catch (err) {
    console.error("❌ Error en /create-matricula-payment-intent:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

//listo
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Configurar la base de datos SQLite
const db = new sqlite3.Database('./Buvle.db', (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
    } else {
        console.log('Conexión a la base de datos fue exitosa');
    }
});

// Endpoint de prueba
app.get('/', (req, res) => {
    res.send('API funcionando');
});

// Este es el login si ya tienes una cuenta

app.post('/login', (req, res) => {
    const { email, password } = req.body; // Captura email y password desde el cuerpo de la solicitud

    const query = 'SELECT * FROM Alumnos WHERE email = ? AND password = ?'; // Consulta SQL
    db.get(query, [email, password], (err, row) => {
        if (err) {
            console.error('Error en la consulta:', err);
            res.status(500).json({ error: 'Error en el servidor' });
        } else if (row) {
            res.status(200).json({ success: true, nombre: row.nombre }); // Responde con el nombre del alumno
        } else {
            res.status(401).json({ success: false, message: 'Usuario no registrado o contraseña incorrecta' }); // Credenciales incorrectas
        }
    });
});

// este es para crear una cuenta si eres nuevo usuario.

app.post('/register', (req, res) => {
    const { nombre, email, password, confirmPassword } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !email || !password || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
    }

    // Verificar si el correo ya existe
    const checkEmailQuery = 'SELECT * FROM Alumnos WHERE email = ?';
    db.get(checkEmailQuery, [email], (err, row) => {
        if (err) {
            console.error('Error al verificar el correo:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor al verificar el correo' });
        }

        if (row) {
            console.log('Correo ya registrado:', email);
            return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
        }

        // Insertar el nuevo alumno en la base de datos
        const insertQuery = 'INSERT INTO Alumnos (nombre, email, password) VALUES (?, ?, ?)';
        db.run(insertQuery, [nombre, email, password], (err) => {
            if (err) {
                console.error('Error al registrar el alumno:', err);
                return res.status(500).json({ success: false, message: 'Error al registrar al usuario' });
            }

            // Registro exitoso
            console.log('Alumno registrado con éxito:', nombre, email);
            res.status(201).json({ success: true, message: 'Alumno registrado con éxito' });
        });
    });
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

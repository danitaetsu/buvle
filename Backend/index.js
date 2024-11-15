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

// Endpoint para el login
app.post('/login', (req, res) => {
    const { email, password } = req.body; // Captura email y password desde el cuerpo de la solicitud

    const query = 'SELECT * FROM Alumnos WHERE email = ? AND password = ?'; // Consulta SQL
    db.get(query, [email, password], (err, row) => {
        if (err) {
            console.error('Error en la consulta:', err);
            res.status(500).json({ error: 'Error en el servidor' });
        } else if (row) {
            res.status(200).json({ success: true, alumno: row }); // Responde con los datos del alumno
        } else {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' }); // Credenciales incorrectas
        }
    });
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

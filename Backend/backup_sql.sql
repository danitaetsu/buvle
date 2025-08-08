PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE Alumnos (
    id_alumno INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
, clases_disponibles INTEGER NOT NULL DEFAULT 4);
INSERT INTO Alumnos VALUES(1,'Ana García','ana@example.com','password1',4);
INSERT INTO Alumnos VALUES(2,'Luis Martínez','luis@example.com','password2',4);
INSERT INTO Alumnos VALUES(3,'María López','maria@example.com','password3',4);
INSERT INTO Alumnos VALUES(4,'Carlos Sánchez','carlos@example.com','password4',4);
INSERT INTO Alumnos VALUES(5,'Lucía Fernández','lucia@example.com','password5',4);
INSERT INTO Alumnos VALUES(6,'Juan Pérez','juan.perez@example.com','123456',4);
INSERT INTO Alumnos VALUES(7,'Santos','santosdaniel@yo','gematech',4);
INSERT INTO Alumnos VALUES(8,'nombreinventao','mailinventao','gematech',4);
INSERT INTO Alumnos VALUES(9,'Julio Iglesias','jeje@julioiglesias.com','jeje',4);
INSERT INTO Alumnos VALUES(10,'Fernández','mucia@example.com','password6',4);
INSERT INTO Alumnos VALUES(11,'Daniela','danielacamacho@gmail.com','abc',4);
INSERT INTO Alumnos VALUES(12,'a','b','c',4);
CREATE TABLE IF NOT EXISTS "Turnos" (
    id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
    dia INTEGER NOT NULL CHECK(dia BETWEEN 1 AND 5),
    hora_inicio TEXT NOT NULL CHECK(hora_inicio IN ('12:00', '17:00', '19:00')),
    hora_fin TEXT NOT NULL CHECK(hora_fin IN ('14:00', '19:00', '21:00')),
    max_alumnos INTEGER NOT NULL DEFAULT 6
);
INSERT INTO Turnos VALUES(21,3,'12:00','14:00',6);
INSERT INTO Turnos VALUES(22,3,'17:00','19:00',6);
INSERT INTO Turnos VALUES(23,1,'17:00','19:00',6);
INSERT INTO Turnos VALUES(24,2,'17:00','19:00',6);
INSERT INTO Turnos VALUES(25,4,'17:00','19:00',6);
INSERT INTO Turnos VALUES(26,5,'17:00','19:00',6);
INSERT INTO Turnos VALUES(27,1,'19:00','21:00',6);
INSERT INTO Turnos VALUES(28,2,'19:00','21:00',6);
INSERT INTO Turnos VALUES(29,3,'19:00','21:00',6);
INSERT INTO Turnos VALUES(30,4,'19:00','21:00',6);
INSERT INTO Turnos VALUES(31,5,'19:00','21:00',6);
CREATE TABLE IF NOT EXISTS "Reservas" (
    id_reserva INTEGER PRIMARY KEY AUTOINCREMENT,
    id_alumno INTEGER NOT NULL,
    id_turno INTEGER NOT NULL,
    fecha_clase DATE NOT NULL,
    FOREIGN KEY (id_alumno) REFERENCES Alumnos(id_alumno) ON DELETE CASCADE,
    FOREIGN KEY (id_turno) REFERENCES Turnos(id_turno) ON DELETE CASCADE
);
INSERT INTO Reservas VALUES(1,1,1,'2025-06-29');
INSERT INTO Reservas VALUES(2,2,2,'2025-06-29');
INSERT INTO Reservas VALUES(3,3,3,'2025-06-29');
INSERT INTO Reservas VALUES(4,4,4,'2025-06-29');
INSERT INTO Reservas VALUES(5,5,5,'2025-06-29');
INSERT INTO Reservas VALUES(6,10,1,'2025-06-29');
INSERT INTO Reservas VALUES(7,11,2,'2025-06-29');
INSERT INTO Reservas VALUES(8,6,2,'2025-06-29');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('Alumnos',12);
INSERT INTO sqlite_sequence VALUES('Turnos',31);
INSERT INTO sqlite_sequence VALUES('Reservas',8);
COMMIT;

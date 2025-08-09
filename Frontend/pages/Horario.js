import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Horario.css";

const Horario = ({ idAlumno }) => {
  const [turnos, setTurnos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [mesActual, setMesActual] = useState(new Date());

  const diasSemana = ["L", "M", "X", "J", "V"];

  useEffect(() => {
    obtenerTurnos();
    obtenerReservas();
  }, [mesActual]);

  const obtenerTurnos = async () => {
    try {
      const res = await axios.get("http://localhost:3000/turnos");
      setTurnos(res.data);
    } catch (error) {
      console.error("Error obteniendo turnos", error);
    }
  };

  const obtenerReservas = async () => {
    try {
      const res = await axios.get("http://localhost:3000/reservas", {
        params: { id_alumno: idAlumno }
      });
      setReservas(res.data);
    } catch (error) {
      console.error("Error obteniendo reservas", error);
    }
  };

  const generarFechasMes = () => {
    const fechas = [];
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);

    let fecha = new Date(primerDia);
    while (fecha <= ultimoDia) {
      if (fecha.getDay() >= 1 && fecha.getDay() <= 5) {
        fechas.push(new Date(fecha));
      }
      fecha.setDate(fecha.getDate() + 1);
    }
    return fechas;
  };

  const estaReservado = (fecha, idTurno) => {
    return reservas.some(
      (r) =>
        r.id_turno === idTurno &&
        new Date(r.fecha_clase).toDateString() === fecha.toDateString()
    );
  };

  const manejarClick = async (fecha, idTurno) => {
    const reservado = estaReservado(fecha, idTurno);

    if (!reservado) {
      if (window.confirm("¿Quieres reservar este turno?")) {
        try {
          await axios.post("http://localhost:3000/reservar", {
            id_alumno: idAlumno,
            id_turno: idTurno,
            fecha_clase: fecha.toISOString().split("T")[0],
          });
          obtenerReservas();
        } catch (error) {
          console.error("Error reservando", error);
        }
      }
    } else {
      if (window.confirm("¿Quieres cancelar esta reserva?")) {
        try {
          await axios.post("http://localhost:3000/cancelar", {
            id_alumno: idAlumno,
            id_turno: idTurno,
            fecha_clase: fecha.toISOString().split("T")[0],
          });
          obtenerReservas();
        } catch (error) {
          console.error("Error cancelando", error);
        }
      }
    }
  };

  const fechasMes = generarFechasMes();
  const horasUnicas = [...new Set(turnos.map(t => t.hora_inicio))];

  return (
    <div className="horario-container">
      <h2>
        {mesActual.toLocaleString("es-ES", { month: "long", year: "numeric" })}
      </h2>
      <div className="horario-scroll">
        <table className="horario-tabla">
          <thead>
            <tr>
              <th>Hora</th>
              {fechasMes.map((fecha, idx) => (
                <th key={idx}>
                  {diasSemana[fecha.getDay() - 1]}<br />
                  {fecha.getDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horasUnicas.map((hora) => (
              <tr key={hora}>
                <td>{hora}</td>
                {fechasMes.map((fecha, idx) => {
                  const turno = turnos.find(
                    (t) =>
                      t.hora_inicio === hora &&
                      t.dia === fecha.getDay()
                  );
                  return (
                    <td key={idx} className="celda">
                      {turno ? (
                        <input
                          type="checkbox"
                          checked={estaReservado(fecha, turno.id_turno)}
                          onChange={() => manejarClick(fecha, turno.id_turno)}
                        />
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Horario;

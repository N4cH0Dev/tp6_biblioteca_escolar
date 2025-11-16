// index.js
const express = require("express");
const pool = require("./db");

const app = express();

// Para que funcione req.body con JSON
app.use(express.json());

// ---------------------- ALUMNOS ----------------------

// Registrar alumno
app.post("/alumnos", async (req, res) => {
  try {
    const { nombre, curso, dni } = req.body;

    if (!nombre || !curso || !dni) {
      return res
        .status(400)
        .json({ error: "nombre, curso y dni son obligatorios" });
    }

    const [result] = await pool.query(
      "INSERT INTO alumnos (nombre, curso, dni) VALUES (?, ?, ?)",
      [nombre, curso, dni]
    );

    res.status(201).json({ id: result.insertId, nombre, curso, dni });
  } catch (error) {
    console.error("Error al crear alumno:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Listar alumnos
app.get("/alumnos", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM alumnos");
    res.json(rows);
  } catch (error) {
    console.error("Error al listar alumnos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ---------------------- LIBROS ----------------------

// Registrar libro
app.post("/libros", async (req, res) => {
  try {
    const { titulo, autor, categoria, ejemplares_disponibles } = req.body;

    if (!titulo || !autor || ejemplares_disponibles == null) {
      return res.status(400).json({
        error: "titulo, autor y ejemplares_disponibles son obligatorios",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO libros (titulo, autor, categoria, ejemplares_disponibles) VALUES (?, ?, ?, ?)",
      [titulo, autor, categoria, ejemplares_disponibles]
    );

    res.status(201).json({
      id: result.insertId,
      titulo,
      autor,
      categoria,
      ejemplares_disponibles,
    });
  } catch (error) {
    console.error("Error al crear libro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Listar libros
app.get("/libros", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM libros");
    res.json(rows);
  } catch (error) {
    console.error("Error al listar libros:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ---------------------- PRESTAMOS ----------------------
/*
Body esperado:
{
  "libro_id": 1,
  "alumno_id": 2,
  "fecha_entrega": "2025-11-16",
  "fecha_devolucion": "2025-11-30"   // opcional, puede ser fecha estimada
}
*/
app.post("/prestamos", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { libro_id, alumno_id, fecha_entrega, fecha_devolucion } = req.body;

    if (!libro_id || !alumno_id || !fecha_entrega) {
      return res.status(400).json({
        error: "libro_id, alumno_id y fecha_entrega son obligatorios",
      });
    }

    await connection.beginTransaction();

    // Verificar que el libro exista y tenga ejemplares disponibles
    const [rowsLibro] = await connection.query(
      "SELECT ejemplares_disponibles FROM libros WHERE id = ?",
      [libro_id]
    );

    if (rowsLibro.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "El libro no existe" });
    }

    const libro = rowsLibro[0];

    if (libro.ejemplares_disponibles <= 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "No hay ejemplares disponibles de este libro" });
    }

    // Verificar que el alumno exista
    const [rowsAlumno] = await connection.query(
      "SELECT id FROM alumnos WHERE id = ?",
      [alumno_id]
    );

    if (rowsAlumno.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "El alumno no existe" });
    }

    // Insertar movimiento en prestamos
    const [resultPrestamo] = await connection.query(
      `
        INSERT INTO prestamos (libro_id, alumno_id, fecha_entrega, fecha_devolucion, devuelto)
        VALUES (?, ?, ?, ?, 0)
      `,
      [libro_id, alumno_id, fecha_entrega, fecha_devolucion || null]
    );

    // Descontar 1 ejemplar
    await connection.query(
      "UPDATE libros SET ejemplares_disponibles = ejemplares_disponibles - 1 WHERE id = ?",
      [libro_id]
    );

    await connection.commit();

    res.status(201).json({
      mensaje: "Préstamo registrado correctamente",
      prestamo_id: resultPrestamo.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar préstamo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    connection.release();
  }
});

// Listar préstamos (con info de libro y alumno)
app.get("/prestamos", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.fecha_entrega,
        p.fecha_devolucion,
        p.devuelto,
        l.titulo AS libro_titulo,
        l.autor AS libro_autor,
        a.nombre AS alumno_nombre,
        a.curso AS alumno_curso,
        a.dni AS alumno_dni
      FROM prestamos p
        JOIN libros l ON l.id = p.libro_id
        JOIN alumnos a ON a.id = p.alumno_id
      ORDER BY p.fecha_entrega DESC;
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error al listar préstamos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Registrar devolución de un préstamo
/*
PUT /prestamos/1/devolver
Body opcional:
{
  "fecha_devolucion": "2025-11-20"   // si no se envía, se usa la fecha actual del sistema
}
*/
app.put("/prestamos/:id/devolver", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const prestamoId = req.params.id;
    const { fecha_devolucion } = req.body;

    await connection.beginTransaction();

    // Buscar el préstamo
    const [rowsPrestamo] = await connection.query(
      "SELECT * FROM prestamos WHERE id = ?",
      [prestamoId]
    );

    if (rowsPrestamo.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Préstamo no encontrado" });
    }

    const prestamo = rowsPrestamo[0];

    if (prestamo.devuelto === 1) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "El préstamo ya está marcado como devuelto" });
    }

    // Actualizar préstamo como devuelto
    const fechaDev = fecha_devolucion || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    await connection.query(
      `
        UPDATE prestamos
        SET devuelto = 1,
            fecha_devolucion = ?
        WHERE id = ?
      `,
      [fechaDev, prestamoId]
    );

    // Devolver el ejemplar al stock
    await connection.query(
      "UPDATE libros SET ejemplares_disponibles = ejemplares_disponibles + 1 WHERE id = ?",
      [prestamo.libro_id]
    );

    await connection.commit();

    res.json({
      mensaje: "Devolución registrada correctamente",
      fecha_devolucion: fechaDev,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar devolución:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    connection.release();
  }
});

// ---------------------- SERVIDOR ----------------------
const PORT = 3001; // por ejemplo, para no chocar con el TP1
app.listen(PORT, () => {
  console.log(`Servidor biblioteca escuchando en http://localhost:${PORT}`);
});

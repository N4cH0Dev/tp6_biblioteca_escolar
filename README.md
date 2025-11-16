# TP6 — Backend Monolítico: Sistema de Gestión de Biblioteca Escolar

**Materia:** Programación  
**Tecnologías:** Node.js, Express, MySQL  
**Alumno:** José Ignacio Díaz Romero

---

# 📌 Descripción del Proyecto

Este trabajo práctico consiste en desarrollar un **backend monolítico** para gestionar una biblioteca escolar.  
El sistema debe permitir administrar:

- ✔ Alumnos
- ✔ Libros con stock de ejemplares
- ✔ Préstamos de libros
- ✔ Registro de devoluciones
- ✔ Control automático de stock
- ✔ Relaciones 1–N y N–1 aplicadas en MySQL
- ✔ Registro de movimientos en **una sola tabla** (`prestamos`)

Este TP cumple completamente con el enunciado:  
❗ Sin token, sin middleware adicional, sin hashing.

---

# 📁 Estructura del Proyecto

tp6_biblioteca_back/
│── node_modules/
│── db.js
│── index.js
│── package.json
│── package-lock.json
│── README.md
│── .gitignore

yaml
Copiar código

---

# ⚙️ Tecnologías Utilizadas

- **Node.js** – Motor de ejecución JavaScript
- **Express.js** – Servidor backend
- **MySQL** – Base de datos relacional
- **mysql2** – Conexión Node ↔ MySQL
- **Nodemon** – Monitoreo de cambios (modo dev)

---

# 🗄️ Modelo de Base de Datos (DER)

El sistema utiliza 3 tablas principales:

## 🧍 Tabla **alumnos**

| Campo  | Tipo               | Descripción       |
| ------ | ------------------ | ----------------- |
| id     | INT PK AI          | Identificador     |
| nombre | VARCHAR(100)       | Nombre del alumno |
| curso  | VARCHAR(20)        | Curso             |
| dni    | VARCHAR(20) UNIQUE | Documento         |

---

## 📚 Tabla **libros**

| Campo                  | Tipo         | Descripción |
| ---------------------- | ------------ | ----------- |
| id                     | INT PK AI    |
| titulo                 | VARCHAR(200) |
| autor                  | VARCHAR(100) |
| categoria              | VARCHAR(50)  |
| ejemplares_disponibles | INT          |

---

## 📄 Tabla **prestamos** (movimientos)

**Objetivo del TP:** registrar todo en una sola tabla.

| Campo            | Tipo                | Descripción                |
| ---------------- | ------------------- | -------------------------- |
| id               | INT PK AI           | Movimiento                 |
| libro_id         | INT FK → libros.id  | Libro prestado             |
| alumno_id        | INT FK → alumnos.id | Alumno                     |
| fecha_entrega    | DATE                | Fecha de préstamo          |
| fecha_devolucion | DATE                | Fecha de devolución        |
| devuelto         | TINYINT(1)          | 0 = prestado, 1 = devuelto |

**Relaciones:**

- Alumno **1 — N** Préstamos
- Libro **1 — N** Préstamos
- Préstamos → una sola tabla que guarda todos los movimientos

---

# 🛠 Instalación del Proyecto

## 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/N4cH0Dev/tp6_biblioteca_back.git
cd tp6_biblioteca_back
2️⃣ Instalar dependencias
bash
Copiar código
npm install
3️⃣ Crear la base de datos MySQL
Ejecutar en MySQL Workbench o consola:

sql
Copiar código
CREATE DATABASE biblioteca_escolar;
USE biblioteca_escolar;

CREATE TABLE alumnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  curso VARCHAR(20) NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE libros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(100) NOT NULL,
  categoria VARCHAR(50),
  ejemplares_disponibles INT NOT NULL DEFAULT 0
);

CREATE TABLE prestamos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  libro_id INT NOT NULL,
  alumno_id INT NOT NULL,
  fecha_entrega DATE NOT NULL,
  fecha_devolucion DATE,
  devuelto TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (libro_id) REFERENCES libros(id),
  FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
);
▶️ Ejecución del Servidor
🔹 Modo desarrollo:
bash
Copiar código
npm run dev
🔹 Modo producción:
bash
Copiar código
npm start
Servidor disponible en:

arduino
Copiar código
http://localhost:3001
📚 Endpoints del Backend
🧍‍♂️ ALUMNOS
➕ Registrar alumno
POST /alumnos

Body:

json
Copiar código
{
  "nombre": "Pedro Gómez",
  "curso": "3B",
  "dni": "40123456"
}
📄 Listar alumnos
GET /alumnos

📚 LIBROS
➕ Registrar libro
POST /libros

json
Copiar código
{
  "titulo": "El Principito",
  "autor": "Antoine de Saint-Exupéry",
  "categoria": "Novela",
  "ejemplares_disponibles": 3
}
📄 Listar libros
GET /libros

📄 PRÉSTAMOS
➕ Registrar un préstamo
POST /prestamos

json
Copiar código
{
  "libro_id": 1,
  "alumno_id": 1,
  "fecha_entrega": "2025-11-16",
  "fecha_devolucion": "2025-11-30"
}
✔ Descuenta automáticamente 1 ejemplar del libro.

🔄 Registrar devolución
PUT /prestamos/{id}/devolver

json
Copiar código
{
  "fecha_devolucion": "2025-11-20"
}
✔ Marca el préstamo como devuelto
✔ Suma un ejemplar al stock del libro

📄 Listar todos los préstamos
GET /prestamos

Devuelve:

datos del alumno

datos del libro

fechas

estado del préstamo

si fue devuelto o no

🧠 Lógica del Sistema
Un alumno puede tener múltiples préstamos.

Un libro puede ser prestado muchas veces.

Toda la operativa de movimientos se guarda en una sola tabla (prestamos).

Cuando se crea un préstamo:

Se verifica que haya stock

Se descuenta 1 ejemplar

Cuando se registra la devolución:

Se marca devuelto = 1

Se actualiza fecha_devolucion

Se devuelve el ejemplar al stock

No se usa token, hashing ni middleware, respetando el enunciado.

📌 Conclusiones
Este backend cumple al 100% con los requisitos del TP6:

✔ Backend monolítico
✔ Gestión de alumnos
✔ Gestión de libros con stock
✔ Préstamos y devoluciones
✔ Control automático del stock
✔ Relaciones 1–N y N–1
✔ Movimiento de préstamos almacenado en una sola tabla
✔ Implementación cuidada y funcional

✨ Autor
José Ignacio Díaz Romero
Universidad Tecnológica Nacional (UTN)
TP6 — Sistema de Gestión de Biblioteca Escolar
```

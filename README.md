# PrismaEdu - Plataforma de Gestión Educativa Gamificada

PrismaEdu es una aplicación web progresiva (PWA) diseñada para gamificar la gestión de tareas escolares y domésticas. Facilita la comunicación entre profesores, padres y alumnos mediante un sistema de recompensas, avatares personalizables y chats en tiempo real.

## 🚀 Características Principales

### 👨‍🏫 Para Profesores (Prisma Aula)
*   **Gestión de Clase:** Visualización de todos los alumnos con sus avatares y puntos.
*   **Asignación de Puntos:** Sumar o restar puntos por comportamiento o logros.
*   **Tareas Escolares:** Crear tareas para toda la clase con opción de "Alta Prioridad" (Notificación visual para el alumno).
*   **Tienda Escolar:** Crear recompensas canjeables (ej. "Sentarse con un amigo", "Pase sin deberes").
*   **Chat:** Comunicación directa con alumnos y padres.
*   **Accesos Directos:** Enlaces integrados a Biblioteca, Reservas y Excursiones.

### 🏠 Para Familias
*   **Gestión Familiar:** Visualización del progreso de todos los hijos.
*   **Tareas Domésticas:** Asignar tareas del hogar (ej. "Poner la mesa") con recompensas en puntos.
*   **Acciones Rápidas:** Botones para premiar o corregir comportamiento instantáneamente.
*   **Comunicación:** Chat directo con el tutor del colegio.

### 🎓 Para Alumnos
*   **Gamificación:** Ganar puntos completando tareas de casa y del colegio.
*   **Personalización:** Comprar ropa y accesorios para su avatar usando los puntos ganados.
*   **Tienda de Recompensas:** Canjear puntos por premios reales (definidos por profes o padres).
*   **Historial:** Ver el registro de premios canjeados.

### ⚙️ Características Técnicas (Actualizado)
*   **Backend:** Node.js + Express.
*   **Persistencia:** Base de datos **SQLite** (`database.sqlite`) alojada en el servidor.
*   **Sincronización:** **Socket.IO** para actualizaciones "push" en tiempo real (evita condiciones de carrera y mantiene todas las sesiones sincronizadas instantáneamente).
*   **Diseño:** Interfaz moderna y responsiva construida con Tailwind CSS y React.

---

## 🛠️ Instalación desde Cero (Ubuntu)

Sigue estos pasos para instalar PrismaEdu en un servidor Ubuntu limpio utilizando el script de instalación automatizado.

### 1. Clonar el repositorio

Accede a tu servidor vía SSH y clona el repositorio oficial:

```bash
git clone https://github.com/JohnnyBra/prismaedu.git
cd prismaedu
```

### 2. Ejecutar el script de instalación

Otorga permisos de ejecución y lanza el script de instalación automática. Este script se encargará de instalar todas las dependencias necesarias (Node.js, PM2, etc.), compilar el proyecto y configurar la base de datos.

```bash
chmod +x deploy/install.sh
./deploy/install.sh
```

El script realizará las siguientes acciones:
1.  Actualizar el sistema y paquetes.
2.  Instalar Node.js 20 si no está presente.
3.  Instalar PM2 para la gestión de procesos.
4.  Instalar las dependencias del proyecto (`npm install`).
5.  Compilar la aplicación para producción (`npm run build`).
6.  Inicializar la base de datos (`npm run reset`) si es una instalación nueva.
7.  Arrancar el servidor en el puerto **3020**.

---

## 🔄 Actualización

Para actualizar tu instalación con los últimos cambios del repositorio, utiliza el script de actualización incluido. Este script descarga los cambios, recompila el proyecto y reinicia el servicio sin perder tus datos.

```bash
cd prismaedu
chmod +x deploy/update.sh
./deploy/update.sh
```

---

## 💻 Desarrollo Local

Si deseas contribuir o probar la aplicación en tu máquina local:

1.  Clonar el repositorio:
    ```bash
    git clone https://github.com/JohnnyBra/prismaedu.git
    cd prismaedu
    ```
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  **Modo Desarrollo (con Hot Reload):**
    ```bash
    # Inicia el frontend (Vite)
    npm run dev

    # En otra terminal, inicia el backend
    npm start
    ```
    *Nota: Asegúrate de que el frontend apunte al puerto correcto del backend (3020).*

4.  **Modo Producción (Prueba local):**
    ```bash
    npm run build
    npm start
    ```

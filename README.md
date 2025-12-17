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

## 🛠️ Instalación en Servidor Ubuntu

Estas instrucciones permiten desplegar la aplicación en un servidor Ubuntu.

### Opción A: Instalación Automática (Recomendada)

Hemos incluido scripts automatizados en la carpeta `deploy`.

1.  **Conéctate a tu servidor** vía SSH.
2.  **Descarga y ejecuta el script de instalación**:

```bash
git clone https://github.com/JohnnyBra/prismaedu.git
cd prismaedu
chmod +x deploy/install.sh
./deploy/install.sh
```

Esto instalará Node.js, compilará el frontend, inicializará la base de datos SQLite y arrancará el servidor en el puerto **3020** usando PM2.

### Opción B: Instalación Manual

1.  **Actualizar el sistema e instalar dependencias básicas**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl git unzip build-essential python3
    ```

2.  **Instalar Node.js (Versión 20)**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

3.  **Instalar PM2**:
    ```bash
    sudo npm install -g pm2
    ```

4.  **Clonar y configurar**:
    ```bash
    git clone https://github.com/JohnnyBra/prismaedu.git
    cd prismaedu
    npm install
    npm run build
    ```

5.  **Desplegar**:
    ```bash
    # Se utiliza el puerto 3020 definido en server/index.js
    pm2 start server/index.js --name "prismaedu"
    pm2 save
    pm2 startup
    ```

---

## 🔄 Actualización

Para actualizar la aplicación cuando haya cambios en el repositorio GitHub:

```bash
cd prismaedu
chmod +x deploy/update.sh
./deploy/update.sh
```

---

## 💻 Desarrollo Local

1.  Clonar el repo.
2.  `npm install`
3.  **Para desarrollo con Hot Reload (Frontend):** `npm run dev` (Nota: necesitarás correr el servidor backend por separado o ajustar la configuración para conectar sockets al puerto correcto).
4.  **Para probar modo producción:** `npm run build` y luego `npm start`.
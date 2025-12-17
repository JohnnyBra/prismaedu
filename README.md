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

### ⚙️ Características Técnicas
*   **Persistencia:** Los datos se guardan localmente (LocalStorage) simulando una base de datos persistente.
*   **Sincronización:** Actualización en tiempo real entre pestañas del navegador.
*   **Seguridad:** Sistema de PIN simple para cambio rápido de usuarios (Admin, Profes, Padres, Alumnos).
*   **Diseño:** Interfaz moderna y responsiva construida con Tailwind CSS.

---

## 🛠️ Instalación en Servidor Ubuntu

Estas instrucciones permiten desplegar la aplicación en un servidor Ubuntu utilizando **Node.js** y **PM2** para mantener la aplicación activa en el puerto **3005**.

### Opción A: Instalación Automática (Recomendada)

Hemos incluido scripts automatizados en la carpeta `deploy`.

1.  **Conéctate a tu servidor** vía SSH.
2.  **Descarga y ejecuta el script de instalación**:

```bash
# Puedes copiar el contenido de deploy/install.sh o clonar y ejecutar:
git clone https://github.com/JohnnyBra/prismaedu.git
cd prismaedu
chmod +x deploy/install.sh
./deploy/install.sh
```

### Opción B: Instalación Manual

1.  **Actualizar el sistema e instalar dependencias básicas**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl git unzip
    ```

2.  **Instalar Node.js (Versión 20)**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

3.  **Instalar PM2 (Gestor de procesos) y serve**:
    ```bash
    sudo npm install -g pm2 serve
    ```

4.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/JohnnyBra/prismaedu.git
    cd prismaedu
    ```

5.  **Instalar dependencias y construir**:
    ```bash
    npm install
    npm run build
    ```

6.  **Desplegar en el puerto 3005**:
    ```bash
    # Inicia el servidor estático sirviendo la carpeta 'dist' (o 'build' según tu configuración de Vite/CRA)
    pm2 start "serve -s dist -l 3005" --name "prismaedu"
    
    # Asegurar que arranque al reinicio del sistema
    pm2 save
    pm2 startup
    ```

---

## 🔄 Actualización

Para actualizar la aplicación cuando haya cambios en el repositorio GitHub:

### Opción A: Script Automático

```bash
cd prismaedu
chmod +x deploy/update.sh
./deploy/update.sh
```

### Opción B: Manual

```bash
cd prismaedu
git pull origin main
npm install
npm run build
pm2 restart prismaedu
```

---

## 💻 Desarrollo Local

1.  Clonar el repo: `git clone https://github.com/JohnnyBra/prismaedu.git`
2.  Instalar: `npm install`
3.  Ejecutar: `npm run dev` (o `npm start`)

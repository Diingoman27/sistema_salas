# Reservas de Salas

Sistema de gestión de reservas de salas de reuniones con arquitectura full-stack.

## Arquitectura de Software

### Arquitectura General
- **Tipo**: Arquitectura Cliente-Servidor (3 capas)
- **Frontend**: Aplicación de Página Única (SPA) con JavaScript Vanilla
- **Backend**: API RESTful con Node.js y Express.js
- **Base de Datos**: MySQL relacional
- **Autenticación**: JWT (JSON Web Tokens)
- **ORM**: Sequelize para mapeo objeto-relacional

### Componentes Principales

#### 1. Capa de Presentación (Frontend)
- **Tecnologías**: HTML5, CSS3, JavaScript ES6+
- **Framework**: Ninguno (Vanilla JS)
- **Características**:
  - Interfaz responsiva con diseño moderno
  - Gestión de estado del lado cliente
  - Comunicación asíncrona con API REST
  - Validación de formularios del lado cliente

#### 2. Capa de Aplicación (Backend)
- **Tecnologías**: Node.js, Express.js
- **Características**:
  - API RESTful con endpoints CRUD
  - Middleware para autenticación y autorización
  - Validación de datos con express-validator
  - Manejo de errores centralizado
  - Control de concurrencia para reservas

#### 3. Capa de Datos
- **Tecnologías**: MySQL, Sequelize ORM
- **Características**:
  - Modelo relacional con claves foráneas
  - Migraciones y seeders
  - Transacciones para integridad de datos
  - Consultas optimizadas con joins

### Patrón de Diseño
- **MVC (Modelo-Vista-Controlador)**: Separación clara entre modelos, rutas y vistas
- **Patrón Middleware**: Para autenticación, autorización y validación
- **Patrón Repository**: Abstracción de acceso a datos con Sequelize

### Diagrama de Arquitectura
```
[Cliente Web] <---HTTP---> [Servidor Express] <---SQL---> [Base de Datos MySQL]
     |                           |
     | (HTML/CSS/JS)            | (API REST)
     |                           |
     - Navegador                - Autenticación JWT
     - LocalStorage             - Middleware de roles
     - AJAX/Fetch               - Validaciones
```

## Requerimientos Funcionales

### Gestión de Usuarios
- **RF1**: El sistema debe permitir el registro de usuarios con roles (admin, worker, client)
- **RF2**: Los usuarios deben poder iniciar sesión con email y contraseña
- **RF3**: El sistema debe validar credenciales y generar tokens JWT
- **RF4**: Los usuarios deben poder cerrar sesión

### Gestión de Clientes
- **RF5**: Los administradores pueden crear, leer, actualizar y eliminar clientes
- **RF6**: Los clientes tienen nombre, email y departamento
- **RF7**: El email debe ser único en el sistema

### Gestión de Salas
- **RF8**: Los administradores pueden crear, leer, actualizar y eliminar salas
- **RF9**: Las salas tienen nombre, capacidad y recursos
- **RF10**: El sistema debe mostrar el estado de ocupación de las salas

### Gestión de Reservas
- **RF11**: Los administradores y trabajadores pueden crear reservas
- **RF12**: Las reservas incluyen sala, cliente, fecha/hora inicio y fin, propósito
- **RF13**: El sistema debe validar que no haya conflictos de horarios en la misma sala
- **RF14**: Los administradores pueden editar y eliminar cualquier reserva
- **RF15**: Los trabajadores pueden editar reservas existentes
- **RF16**: Los clientes solo pueden ver sus propias reservas

### Interfaz de Usuario
- **RF17**: La interfaz debe mostrar dashboards separados por pestañas (Usuarios, Salas, Reservas)
- **RF18**: Los formularios deben tener validación en tiempo real
- **RF19**: El sistema debe mostrar confirmaciones al crear entidades
- **RF20**: Los botones de acción deben estar disponibles según el rol del usuario

## Requerimientos No Funcionales

### Rendimiento
- **RNF1**: El tiempo de respuesta de las APIs debe ser menor a 500ms
- **RNF2**: La aplicación debe soportar hasta 100 usuarios concurrentes
- **RNF3**: Las consultas a la base de datos deben estar optimizadas

### Seguridad
- **RNF4**: Las contraseñas deben estar hasheadas con bcrypt (10 salt rounds)
- **RNF5**: Los tokens JWT deben expirar en 24 horas
- **RNF6**: El sistema debe validar roles en cada endpoint protegido
- **RNF7**: Los datos sensibles deben transmitirse sobre HTTPS en producción

### Usabilidad
- **RNF8**: La interfaz debe ser responsiva y funcionar en dispositivos móviles
- **RNF9**: Los mensajes de error deben ser claros y en español
- **RNF10**: La navegación debe ser intuitiva con pestañas claras

### Fiabilidad
- **RNF11**: El sistema debe manejar errores gracefully sin crashes
- **RNF12**: Las transacciones de base de datos deben ser atómicas
- **RNF13**: El sistema debe validar integridad referencial

### Mantenibilidad
- **RNF14**: El código debe estar modularizado con separación de responsabilidades
- **RNF15**: Debe existir documentación de APIs con ejemplos
- **RNF16**: El proyecto debe incluir scripts de seed para datos de prueba

### Compatibilidad
- **RNF17**: Compatible con navegadores modernos (Chrome, Firefox, Safari, Edge)
- **RNF18**: Base de datos MySQL 5.7+
- **RNF19**: Node.js versión 14+

## Instalación y Configuración

### Prerrequisitos
- Node.js 14+
- MySQL 5.7+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repo>
   cd salas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar base de datos**
   ```sql
   -- Ejecutar src/db/init.sql
   CREATE DATABASE salas;
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con credenciales MySQL
   ```

5. **Ejecutar seeders (opcional)**
   ```bash
   node src/seed.js
   ```

6. **Iniciar servidor**
   ```bash
   npm start
   ```

## Uso

### Credenciales de Prueba
- **Admin**: admin@example.com / adminpass
- **Worker**: worker@example.com / workerpass
- **Client**: client@example.com / clientpass

### Endpoints API
- `POST /api/auth/login` - Autenticación
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente
- `GET /api/rooms` - Listar salas
- `POST /api/rooms` - Crear sala
- `PUT /api/rooms/:id` - Actualizar sala
- `DELETE /api/rooms/:id` - Eliminar sala
- `GET /api/reservations` - Listar reservas
- `POST /api/reservations` - Crear reserva
- `PUT /api/reservations/:id` - Actualizar reserva
- `DELETE /api/reservations/:id` - Eliminar reserva

## Tecnologías Utilizadas

### Backend
- **Node.js**: Entorno de ejecución de JavaScript
- **Express.js**: Framework web
- **Sequelize**: ORM para MySQL
- **JWT**: Autenticación
- **bcrypt**: Hashing de contraseñas
- **express-validator**: Validación de datos

### Frontend
- **HTML5**: Estructura
- **CSS3**: Estilos con gradientes y animaciones
- **JavaScript ES6+**: Lógica del cliente
- **FontAwesome**: Iconos

### Base de Datos
- **MySQL**: Sistema de gestión de base de datos relacional

### Herramientas de Desarrollo
- **npm**: Gestor de paquetes
- **Git**: Control de versiones
- **VS Code**: Editor de código

## Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request



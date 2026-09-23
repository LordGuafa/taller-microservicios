# Microservicios: Tienda Online

Proyecto educativo de arquitectura de microservicios para una tienda online. Cada servicio es una API independiente construida con **Node.js + Express** y se ejecuta en su propio proceso.

## 🧱 Arquitectura

```text
cliente-api (:3001) ─┐
                     ├──> compra-api (:3003)
producto-api (:3002) ─┘
```

- `cliente-api` gestiona clientes.
- `producto-api` gestiona productos.
- `compra-api` registra compras y consulta los servicios de clientes y productos mediante HTTP.

Los datos de ejemplo se mantienen en memoria mediante arreglos en el código. No es necesario configurar una base de datos para ejecutar el proyecto.

## 📁 Estructura del proyecto

```text
.
├── producto/                 # API de productos
│   ├── src/
│   │   ├── data/productos.js
│   │   ├── routes/productos.routes.js
│   │   └── server.js
│   └── package.json
├── cliente/                  # API de clientes
│   ├── src/
│   │   ├── data/clientes.ts
│   │   ├── routes/clientes.routes.ts
│   │   └── server.ts
│   ├── tsconfig.json
│   └── package.json
└── compra-api/               # API de compras
    ├── src/
    │   ├── data/compras.js
    │   ├── routes/compras.routes.js
    │   ├── services/
    │   └── server.js
    └── package.json
```

Cada carpeta contiene su propio `package.json` y sus dependencias. El repositorio no tiene un `package.json` raíz, por lo que se deben instalar las dependencias dentro de cada servicio.

## 🛠️ Tecnologías

- **Node.js 18 o superior**.
- **Express** para exponer las APIs REST.
- **JavaScript** en `producto` y `compra-api`.
- **TypeScript** en `cliente`, ejecutado con `tsx` durante el desarrollo y compilado con `tsc` para producción.
- **dotenv** para cargar la configuración desde archivos `.env`.
- **nodemon** para reiniciar los servicios de JavaScript durante el desarrollo.

## 🚀 Servicios y endpoints

Los puertos siguientes son los valores predeterminados. Se pueden cambiar con la variable de entorno `PORT`.

| Servicio | Puerto predeterminado | Ruta base | Descripción |
|----------|----------------------:|-----------|-------------|
| `cliente-api` | 3001 | `/clientes` | Gestión de clientes |
| `producto-api` | 3002 | `/productos` | Gestión de productos |
| `compra-api` | 3003 | `/compras` | Registro y consulta de compras |

Cada servicio también expone un endpoint raíz para comprobar su estado:

```text
GET http://localhost:3001/
GET http://localhost:3002/
GET http://localhost:3003/
```

### 1. API de productos (`producto-api`)

- `GET /productos`: listar todos los productos.
- `GET /productos/:id`: obtener un producto por ID.
- `POST /productos`: crear un producto. Requiere `nombre`, `precio` y `stock`.

Ejemplo de producto:

```json
{
  "id": 1,
  "nombre": "Teclado mecánico",
  "precio": 180000,
  "stock": 15
}
```

### 2. API de clientes (`cliente-api`)

- `GET /clientes`: listar todos los clientes.
- `GET /clientes/:id`: obtener un cliente por ID.
- `POST /clientes`: crear un cliente. Requiere `nombre` y `email`.
- `PUT /clientes/:id`: actualizar un cliente. Requiere `nombre` y `email`.
- `DELETE /clientes/:id`: eliminar un cliente.

### 3. API de compras (`compra-api`)

- `GET /compras`: listar todas las compras.
- `GET /compras/:id`: obtener una compra por ID.
- `POST /compras`: registrar una compra. Requiere `clienteId`, `productoId` y `cantidad`.

Al crear una compra, `compra-api` consulta `cliente-api` y `producto-api`, verifica que el cliente y el producto existan, valida el stock disponible y calcula el total. Actualmente no modifica el stock del producto.

## 🔧 Requisitos previos

- Node.js 18 o superior.
- npm 8 o superior (normalmente incluido con Node.js).
- `curl` o cualquier cliente HTTP para probar los endpoints.

## ⚙️ Configuración

Los servicios cargan su configuración mediante `dotenv`. Los puertos predeterminados funcionan sin un archivo `.env`; para registrar compras, `compra-api` necesita las URL de las APIs de clientes y productos.

### Configuración de `compra-api`

Copia el archivo de ejemplo y ajústalo si es necesario:

```bash
cd compra-api
cp .env.example .env
```

Contenido esperado en `compra-api/.env`:

```dotenv
PORT=3003
CLIENTE_API_URL=http://localhost:3001
PRODUCTO_API_URL=http://localhost:3002
```

### Puertos de los servicios

Los archivos `.env` de `producto` y `cliente` son opcionales. Para fijar explícitamente sus puertos puedes usar:

```dotenv
# producto/.env
PORT=3002
```

```dotenv
# cliente/.env
PORT=3001
```

Si cambias los puertos de los servicios de clientes o productos, actualiza `CLIENTE_API_URL` y `PRODUCTO_API_URL` en `compra-api/.env`.

## 🏃 Ejecución

### Desarrollo

Abre una terminal por servicio. Ejecuta primero `producto` y `cliente`, porque `compra-api` los utiliza para validar las compras.

```bash
# Terminal 1: producto-api
cd producto
npm install
npm run dev
```

```bash
# Terminal 2: cliente-api
cd cliente
npm install
npm run dev
```

```bash
# Terminal 3: compra-api
cd compra-api
npm install
cp .env.example .env
npm run dev
```

### Ejecución con código compilado (cliente)

Para ejecutar `cliente-api` con Node.js directamente sobre la salida compilada:

```bash
cd cliente
npm install
npm run build
npm start
```

Las APIs de `producto` y `compra-api` se pueden iniciar con `npm start` después de instalar sus dependencias.

## 🧪 Pruebas con `curl`

### Comprobar que las APIs están activas

```bash
curl http://localhost:3001/
curl http://localhost:3002/
curl http://localhost:3003/
```

### Listar productos y clientes

```bash
curl http://localhost:3002/productos
curl http://localhost:3001/clientes
```

### Crear un producto

```bash
curl -X POST http://localhost:3002/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Monitor 24 pulgadas","precio":450000,"stock":8}'
```

### Crear un cliente

```bash
curl -X POST http://localhost:3001/clientes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Carlos Pérez","email":"carlos.perez@example.com"}'
```

### Registrar una compra

Con los datos iniciales, el cliente `1` y el producto `1` existen:

```bash
curl -X POST http://localhost:3003/compras \
  -H "Content-Type: application/json" \
  -d '{"clienteId":1,"productoId":1,"cantidad":1}'
```

Si la cantidad supera el stock, la API devuelve un error `400`. Si alguno de los servicios dependientes no está disponible, devuelve `503`; si el cliente o producto no existe, devuelve `404`.

## 💾 Persistencia

Los datos de `producto`, `cliente` y `compra` se almacenan en memoria. Los cambios realizados mediante la API se pierden al reiniciar el proceso correspondiente. Para un entorno persistente se debe incorporar una base de datos y un esquema de migraciones.

## 🤝 Contribuciones

Este proyecto es un ejemplo educativo. Para contribuir:

1. Crea una rama para tu funcionalidad.
2. Realiza los cambios y prueba los endpoints afectados.
3. Haz commit de los cambios.
4. Abre un Pull Request con una descripción clara.

## 📄 Licencia

El proyecto utiliza la licencia ISC, según la información declarada en los archivos `package.json` de los servicios.

¡Feliz codificación! 🚀

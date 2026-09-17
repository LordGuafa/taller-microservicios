# Microservicios: Tienda Online

Este proyecto es un ejemplo de arquitectura de microservicios para una tienda online, desarrollado con Spring Boot.

## 📁 Estructura del Proyecto

El proyecto está compuesto por 3 microservicios principales:

```text
📦 tienda-online/
├── 🛒 productos-service/       # Gestión de productos
│   ├── src/main/java/com/example/productos/  # Lógica del servicio de productos
│   └── pom.xml
├── 🛍️ clientes-service/        # Gestión de clientes
│   ├── src/main/java/com/example/clientes/  # Lógica del servicio de clientes
│   └── pom.xml
├── 🛒 orders-service/         # Gestión de pedidos
│   ├── src/main/java/com/example/orders/    # Lógica del servicio de pedidos
│   └── pom.xml
└── 📦 parent-pom.xml          # Configuración compartida (Maven parent)
```

## 🚀 Características Principales

### 1. Productos Service 🛒
- **Endpoint**: `http://localhost:8080`
- **Recursos**:
  - `GET /productos`: Listar todos los productos
  - `GET /productos/{id}`: Obtener producto por ID
  - `POST /productos`: Crear nuevo producto
  - `PUT /productos/{id}`: Actualizar producto
  - `DELETE /productos/{id}`: Eliminar producto
- **Tecnología**: Spring Boot + Spring Data JPA + H2

### 2. Clientes Service 👥
- **Endpoint**: `http://localhost:8081`
- **Recursos**:
  - `GET /clientes`: Listar todos los clientes
  - `GET /clientes/{id}`: Obtener cliente por ID
  - `POST /clientes`: Crear nuevo cliente
  - `PUT /clientes/{id}`: Actualizar cliente
  - `DELETE /clientes/{id}`: Eliminar cliente
- **Tecnología**: Spring Boot + Spring Data JPA + H2

### 3. Orders Service 🛍️
- **Endpoint**: `http://localhost:8082`
- **Recursos**:
  - `GET /orders`: Listar todos los pedidos
  - `GET /orders/{id}`: Obtener pedido por ID
  - `POST /orders`: Crear nuevo pedido
  - `PUT /orders/{id}`: Actualizar pedido
  - `DELETE /orders/{id}`: Eliminar pedido
  - `GET /orders/cliente/{clienteId}`: Pedidos por cliente
  - `GET /orders/producto/{productoId}`: Pedidos por producto
- **Tecnología**: Spring Boot + Spring Data JPA + H2

## 🔧 Requisitos Previos

- **Java 17** o superior
- **Maven 3.6** o superior

## ⚙️ Configuración

### Configuración Común (parent-pom.xml)
El archivo `parent-pom.xml` centraliza la configuración de dependencias y plugins para todos los microservicios:
- **Spring Boot**: `3.2.5`
- **Java**: `17`

### Configuración de Puertos
Cada servicio tiene su puerto configurado en `src/main/resources/application.properties`:

| Servicio | Puerto |
|----------|--------|
| Productos | 8080   |
| Clientes  | 8081   |
| Orders   | 8082   |

## 🏃 Ejecución

### Opción 1: Ejecutar cada servicio individualmente

```bash
# Navegar al directorio del servicio
cd productos-service
mvn spring-boot:run

# Luego en otro terminal
cd clientes-service
mvn spring-boot:run

# Y en otro terminal
cd orders-service
mvn spring-boot:run
```

### Opción 2: Ejecutar todos los servicios con Maven

Desde el directorio raíz `tienda-online/`:

```bash
# Compilar todos los servicios
mvn clean install

# Ejecutar productos-service
mvn spring-boot:run -pl productos-service

# Ejecutar clientes-service
mvn spring-boot:run -pl clientes-service

# Ejecutar orders-service
mvn spring-boot:run -pl orders-service
```

## 🧪 Pruebas

Una vez que los servicios estén corriendo, puedes probar la API:

### 1. Crear productos
```bash
curl -X POST http://localhost:8080/productos \
-H "Content-Type: application/json" \
-d '{"nombre": "Laptop Dell", "precio": 1200.0, "stock": 10}'

curl -X POST http://localhost:8080/productos \
-H "Content-Type: application/json" \
-d '{"nombre": "Mouse Logitech", "precio": 25.0, "stock": 50}'
```

### 2. Crear clientes
```bash
curl -X POST http://localhost:8081/clientes \
-H "Content-Type: application/json" \
-d '{"nombre": "Juan Perez", "email": "[EMAIL_ADDRESS]"}'

curl -X POST http://localhost:8081/clientes \
-H "Content-Type: application/json" \
-d '{"nombre": "Maria Garcia", "email": "[EMAIL_ADDRESS]"}'
```

### 3. Crear un pedido (usando clienteId 1 y productoId 1)
```bash
curl -X POST http://localhost:8082/orders \
-H "Content-Type: application/json" \
-d '{"clienteId": 1, "productoId": 1, "cantidad": 1}'
```

### 4. Listar productos
```bash
curl http://localhost:8080/productos
```

## 📊 Base de Datos

Todos los servicios utilizan H2 como base de datos en memoria. Puedes acceder a la consola H2 para ver los datos:
- **Productos**: `http://localhost:8080/h2-console`
- **Clientes**: `http://localhost:8081/h2-console`
- **Orders**: `http://localhost:8082/h2-console`

**Configuración H2:**
- **URL**: `jdbc:h2:mem:testdb`
- **Usuario**: `sa`
- **Contraseña**: `` (vacía)

## 🤝 Contribuciones

Este proyecto es un ejemplo educativo. Si deseas contribuir o agregar nuevas funcionalidades:
1. Crea una rama para tu feature: `git checkout -b feature/AmazingFeature`
2. Haz tus cambios
3. Commitea tus cambios: `git commit -m 'Add some AmazingFeature'`
4. Push a la rama: `git push origin feature/AmazingFeature`
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la Licencia MIT.

## 📝 Notas

Este es un ejemplo básico de microservicios donde cada servicio tiene su propia base de datos en memoria. En una implementación real, deberías considerar:
- Uso de bases de datos persistentes (PostgreSQL, MySQL)
- Comunicación entre servicios (REST, gRPC, colas de mensajes)
- Configuración centralizada (Spring Cloud Config)
- Registro y monitoreo (ELK Stack, Prometheus, Grafana)
- Autenticación y autorización (Spring Security, OAuth2)
- Despliegue (Docker, Kubernetes)
- Service Discovery (Eureka, Consul)

---

¡Feliz codificación! 🚀
 

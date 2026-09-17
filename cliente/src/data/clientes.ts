export interface Cliente {
  id: number;
  nombre: string;
  email: string;
}

const clientes: Cliente[] = [
  { id: 1, nombre: "Laura Gómez", email: "laura.gomez@example.com" },
  { id: 2, nombre: "Andrés Ruiz", email: "andres.ruiz@example.com" },
];

export default clientes;

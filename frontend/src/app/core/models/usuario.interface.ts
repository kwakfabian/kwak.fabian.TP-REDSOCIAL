export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreDeUsuario: string;
  fechaDeNacimiento: string;
  descrpicionBreve:string;
  fotoPerfil: string|null;
  rol: 'usuario'|'administrador';
}
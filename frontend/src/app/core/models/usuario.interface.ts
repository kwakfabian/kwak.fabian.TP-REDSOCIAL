export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcionBreve: string;
  imagenPerfil: string | null;
  perfil: 'usuario' | 'administrador';
}
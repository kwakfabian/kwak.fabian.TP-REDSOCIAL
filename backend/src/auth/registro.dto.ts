import { IsString, IsNotEmpty, MinLength, MaxLength, IsDateString } from 'class-validator';
import { CredencialesDto } from './credenciales.dto.js';

export class RegistroDto extends CredencialesDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  apellido: string;

  @IsString()
  @IsNotEmpty()
  nombreUsuario: string;

  @IsString()
  @IsNotEmpty()
  repetirPassword: string;

  @IsDateString()
  fechaNacimiento: string;

  @IsString()
  @IsNotEmpty()
  descripcionBreve: string;
}
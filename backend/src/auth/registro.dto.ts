import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEmail, MinLength, MaxLength, IsDateString, Matches, IsByteLength } from 'class-validator';

export class RegistroDto {

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  apellido!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  nombreUsuario!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9]).+$/, {
    message: 'La contraseña debe contener al menos una mayúscula y un número'
  })
  @IsByteLength(0, 72)
  password!: string;

  @IsString()
  @IsNotEmpty()
  repetirPassword!: string;

  @IsDateString()
  fechaNacimiento!: string;

  @IsString()
  @IsNotEmpty()
  descripcionBreve!: string;
}
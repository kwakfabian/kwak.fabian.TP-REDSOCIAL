import { Transform } from 'class-transformer';
import { IsDateString, IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class EditarPerfilDto {

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    nombre: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    apellido: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail()
    @MaxLength(254)
    email: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @MinLength(2)
    @MaxLength(20)
    nombreUsuario: string;

    @IsDateString()
    fechaNacimiento: string;

    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    descripcionBreve: string;
}
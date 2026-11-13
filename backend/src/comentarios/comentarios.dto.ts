import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ComentariosDto {

    @IsString()
    @IsNotEmpty()
    @Matches(/\S/, { message: 'El comentario no puede contener solo espacios' })
    mensaje: string;
}
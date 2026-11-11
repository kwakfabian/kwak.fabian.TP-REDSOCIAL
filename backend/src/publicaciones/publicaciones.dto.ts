import { IsNotEmpty, IsString } from "class-validator";

export class CrearPublicacionesDto{

    @IsString()
    @IsNotEmpty()
    titulo: string;

    @IsString()
    @IsNotEmpty()
    descripcion: string;
}
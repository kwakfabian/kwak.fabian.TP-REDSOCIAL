import { Transform } from 'class-transformer';
import { IsByteLength, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CredencialesDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(254)
  identificador!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9]).+$/, {
    message: 'La contraseña debe contener al menos una mayúscula y un número',
  })
  @IsByteLength(0, 72, {
    message: 'La contraseña admite como máximo 72 bytes',
  })
  password!: string;
}
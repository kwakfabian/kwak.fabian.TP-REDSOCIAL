import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ComentariosDocument = HydratedDocument<Comentarios>;

@Schema({ timestamps: true })
export class Comentarios {

    @Prop({ type: Types.ObjectId, ref: 'Publicaciones', required: true })
    publicacionId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
    usuarioId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    mensaje: string;

    @Prop({ default: false })
    modificado: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const ComentariosSchema = SchemaFactory.createForClass(Comentarios);
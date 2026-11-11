import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PublicacionesSchema = HydratedDocument<Publicaciones>;

@Schema({ timestamps: true})
    export class Publicaciones {

        @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true})
        usuarioId: Types.ObjectId;

        @Prop({ required: true })
        titulo: string;

        @Prop({ required: true })
        descripcion: string;

        @Prop({ default: '' })
        imagenUrl: string;

        @Prop({ type: [Types.ObjectId ], ref: 'Usuario', default: [] })
        likes: Types.ObjectId[];

        @Prop({ default: true })
        activa: boolean

        createdAt: Date;
        updateAt: Date;

    }

    export const PublicacionesSchema = SchemaFactory.createForClass(Publicaciones);

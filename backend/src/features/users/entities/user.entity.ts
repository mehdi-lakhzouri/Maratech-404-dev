import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from './user-role.enum';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  fullName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  passwordHash: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    required: true,
    index: true,
  })
  role: UserRole;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound index for role + isActive queries
UserSchema.index({ role: 1, isActive: 1 });

// Text index for fullName and email search
UserSchema.index({ fullName: 'text', email: 'text' });

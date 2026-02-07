/**
 * OTP Entity
 * ----------
 * MongoDB schema for storing one-time passwords.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({
  timestamps: true,
  collection: 'otps',
})
export class Otp {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// TTL index to auto-delete expired OTPs after 5 minutes
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 300 });

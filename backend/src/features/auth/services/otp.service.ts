/**
 * OTP Service
 * -----------
 * Service for generating and verifying one-time passwords.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Otp, OtpDocument } from '../entities/otp.entity';
import { MailService } from '@shared/mail/mail.service';

const OTP_LENGTH = 4;
const OTP_EXPIRY_MINUTES = 2;
const MAX_ATTEMPTS = 3;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Generate a random numeric OTP
   */
  private generateOtpCode(): string {
    return Array.from({ length: OTP_LENGTH }, () => 
      Math.floor(Math.random() * 10)
    ).join('');
  }

  /**
   * Create and send OTP to user
   */
  async createAndSendOtp(userId: string, email: string, fullName: string): Promise<{ expiresAt: Date }> {
    // Invalidate any existing OTPs for this user
    await this.otpModel.updateMany(
      { userId: new Types.ObjectId(userId), isUsed: false },
      { isUsed: true }
    );

    // Generate new OTP
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP to database
    await this.otpModel.create({
      userId: new Types.ObjectId(userId),
      email,
      code,
      expiresAt,
    });

    // Send OTP via email
    try {
      await this.mailService.sendOtpEmail(email, fullName, code);
      this.logger.log(`OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}: ${error}`);
      throw new Error('Failed to send verification email');
    }

    return { expiresAt };
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(userId: string, code: string): Promise<boolean> {
    const otp = await this.otpModel.findOne({
      userId: new Types.ObjectId(userId),
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      return false;
    }

    // Check max attempts
    if (otp.attempts >= MAX_ATTEMPTS) {
      otp.isUsed = true;
      await otp.save();
      return false;
    }

    // Increment attempts
    otp.attempts += 1;
    await otp.save();

    // Verify code
    if (otp.code !== code) {
      return false;
    }

    // Mark as used
    otp.isUsed = true;
    await otp.save();

    return true;
  }

  /**
   * Resend OTP (creates a new one)
   */
  async resendOtp(userId: string, email: string, fullName: string): Promise<{ expiresAt: Date }> {
    return this.createAndSendOtp(userId, email, fullName);
  }
}

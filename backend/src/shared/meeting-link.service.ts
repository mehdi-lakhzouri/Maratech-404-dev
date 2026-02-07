import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MeetingLinkService {
  /**
   * Generates a unique meeting link using Jitsi Meet
   * Jitsi Meet is a free, open-source video conferencing solution
   * that doesn't require authentication or API keys for basic usage
   */
  generateMeetingLink(subject: string): string {
    // Create a URL-friendly meeting ID based on the subject and a UUID
    const baseSubject = subject
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    const uniqueId = uuidv4().substring(0, 8); // Use first 8 chars of UUID
    const meetingId = `${baseSubject}-${uniqueId}`;

    // Jitsi Meet public server
    return `https://meet.jit.si/${meetingId}`;
  }

  /**
   * Validates if a URL is a valid meeting link
   */
  isValidMeetingLink(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Allow Jitsi Meet, Google Meet, Microsoft Teams, and Zoom
      return (
        urlObj.hostname === 'meet.jit.si' ||
        urlObj.hostname === 'meet.google.com' ||
        urlObj.hostname.includes('teams.microsoft.com') ||
        urlObj.hostname === 'zoom.us' ||
        urlObj.hostname.includes('zoom.com')
      );
    } catch {
      return false;
    }
  }
}
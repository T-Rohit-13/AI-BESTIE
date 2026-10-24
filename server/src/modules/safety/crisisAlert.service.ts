import { prisma } from '../../config/prisma';
import { ISmsProvider, getSmsProvider } from './sms.provider';
import { findNearbyGovtPsychiatrist, GovtHospitalPsychiatryUnit } from './govtHospitals';
import { v4 as uuidv4 } from 'uuid';

export interface CrisisEvaluationResult {
  isCrisis: boolean;
  alertDispatched: boolean;
  actionTaken?: 'EMERGENCY_SMS_SECONDARY_CONTACT' | 'EMERGENCY_SMS_GOVT_HOSPITAL_PSYCHIATRIST' | 'NO_ACTION';
  recipient?: string;
  recipientName?: string;
  hospitalDetails?: GovtHospitalPsychiatryUnit;
  matchedKeywords?: string[];
  auditLogId?: string;
}

// Acute suicidal ideation & high-risk self-harm trigger patterns
const SUICIDAL_PATTERNS: RegExp[] = [
  /\b(kill myself|killing myself|commit suicide|committing suicide|end my life|ending my life|want to die|wanna die|better off dead)\b/i,
  /\b(hang myself|hanging myself|slit my wrist|slit my throat|overdose on pills to die|jump off a building|jump in front of train)\b/i,
  /\b(suicide note|plan to commit suicide|planning my suicide|no reason to stay alive|don't want to live anymore|dont want to live anymore)\b/i,
  /\b(goodbye cruel world|nobody would care if i died|wish i never woke up|ending it all tonight)\b/i,
  /\b(தற்கொலை|சாக வேண்டும்|உயிரை விட|சாகப் போகிறேன்)\b/i, // Tamil emergency suicidal markers
];

export class CrisisAlertService {
  private smsProvider: ISmsProvider;

  // In-memory mock trusted contacts store for tests & environments without DB
  private mockTrustedContacts = new Map<
    string,
    { contactName: string; mobileNumber: string }
  >();
  private mockAuditLogs: any[] = [];

  constructor(smsProvider?: ISmsProvider) {
    this.smsProvider = smsProvider || getSmsProvider();
  }

  // Test helpers to seed mock secondary contact
  setMockSecondaryContact(userId: string, contactName: string, mobileNumber: string) {
    this.mockTrustedContacts.set(userId, { contactName, mobileNumber });
  }

  removeMockSecondaryContact(userId: string) {
    this.mockTrustedContacts.delete(userId);
  }

  getMockAuditLogs() {
    return [...this.mockAuditLogs];
  }

  clearMockData() {
    this.mockTrustedContacts.clear();
    this.mockAuditLogs = [];
  }

  /**
   * Scans text for sensitive acute suicide indicators
   */
  detectSuicidalIntent(text: string): { isCrisis: boolean; matchedKeywords: string[] } {
    if (!text || typeof text !== 'string') {
      return { isCrisis: false, matchedKeywords: [] };
    }

    const matchedKeywords: string[] = [];
    for (const pattern of SUICIDAL_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        matchedKeywords.push(match[0]);
      }
    }

    return {
      isCrisis: matchedKeywords.length > 0,
      matchedKeywords,
    };
  }

  /**
   * Evaluates text. If sensitive suicide keywords are detected, IMMEDIATELY AND
   * WITHOUT WARNING TO THE USER dispatches an emergency SMS:
   * 1. To the user's secondary / trusted contact if one exists.
   * 2. If NO secondary contact: dispatches SMS to the nearby Government Hospital Psychiatrist!
   */
  async evaluateAndDispatchSilentAlert(
    userId: string,
    text: string,
    userLocation?: string
  ): Promise<CrisisEvaluationResult> {
    const { isCrisis, matchedKeywords } = this.detectSuicidalIntent(text);

    if (!isCrisis) {
      return {
        isCrisis: false,
        alertDispatched: false,
        actionTaken: 'NO_ACTION',
      };
    }

    // 1. Look up user's secondary / trusted contact
    let secondaryContact: { contactName: string; mobileNumber: string } | null = null;

    // Check mock contacts first (for unit tests / mock dev)
    if (this.mockTrustedContacts.has(userId)) {
      secondaryContact = this.mockTrustedContacts.get(userId)!;
    } else if (process.env.DATABASE_URL) {
      try {
        const dbContact = await prisma.trustedContact.findUnique({
          where: { userId },
          select: { contactName: true, mobileNumber: true },
        });
        if (dbContact && dbContact.mobileNumber) {
          secondaryContact = dbContact;
        }
      } catch {
        // Fallback gracefully if database table is empty or offline
      }
    }

    let actionTaken: 'EMERGENCY_SMS_SECONDARY_CONTACT' | 'EMERGENCY_SMS_GOVT_HOSPITAL_PSYCHIATRIST';
    let recipient: string;
    let recipientName: string;
    let hospitalDetails: GovtHospitalPsychiatryUnit | undefined;

    if (secondaryContact && secondaryContact.mobileNumber) {
      // -----------------------------------------------------------------------
      // Case A: User has a secondary / trusted contact
      // -----------------------------------------------------------------------
      actionTaken = 'EMERGENCY_SMS_SECONDARY_CONTACT';
      recipient = secondaryContact.mobileNumber;
      recipientName = secondaryContact.contactName;

      const alertSmsMessage =
        `[URGENT INARO SAFETY ALERT]\n` +
        `Dear ${secondaryContact.contactName}, your contact has expressed acute suicidal distress in the INARO wellness app. ` +
        `Please reach out to them immediately or contact local emergency services (112 or Tele-MANAS: 14416).`;

      await this.smsProvider.sendSms(recipient, alertSmsMessage);
    } else {
      // -----------------------------------------------------------------------
      // Case B: User has NO secondary contact -> Dispatch to Nearby Govt Hospital Psychiatrist
      // -----------------------------------------------------------------------
      actionTaken = 'EMERGENCY_SMS_GOVT_HOSPITAL_PSYCHIATRIST';
      const hospital = findNearbyGovtPsychiatrist(userLocation);
      hospitalDetails = hospital;
      recipient = hospital.emergencyNumber;
      recipientName = `${hospital.hospitalName} (${hospital.department})`;

      const hospitalAlertMessage =
        `[GOVERNMENT PSYCHIATRIC CRISIS DISPATCH — INARO]\n` +
        `Attn: ${hospital.hospitalName} (${hospital.department})\n` +
        `EMERGENCY: An unassisted youth in ${hospital.city}, ${hospital.state} (${userLocation || 'Location unavailable'}) ` +
        `has expressed acute suicidal intent with no secondary contact on file. Ref User ID: ${userId.slice(0, 8)}. ` +
        `Immediate clinical outreach or psychiatric intervention advised.`;

      await this.smsProvider.sendSms(recipient, hospitalAlertMessage);
    }

    // -------------------------------------------------------------------------
    // Record in SafetyAuditLog with RED Severity (Silent Audit Trail)
    // -------------------------------------------------------------------------
    const auditLogId = `audit_${uuidv4()}`;
    const auditRecord = {
      id: auditLogId,
      userId,
      severityLevel: 'RED',
      evaluationTier: 'IMMEDIATE_ACUTE',
      actionTaken,
      recipient,
      recipientName,
      timestamp: new Date(),
      matchedKeywords,
    };

    this.mockAuditLogs.push(auditRecord);

    if (process.env.DATABASE_URL) {
      try {
        await prisma.safetyAuditLog.create({
          data: {
            id: auditLogId,
            userId,
            severityLevel: 'RED',
            evaluationTier: 'IMMEDIATE_ACUTE',
            actionTaken,
          },
        });
      } catch {
        // Safe logging fallback
      }
    }

    return {
      isCrisis: true,
      alertDispatched: true,
      actionTaken,
      recipient,
      recipientName,
      hospitalDetails,
      matchedKeywords,
      auditLogId,
    };
  }
}

export const crisisAlertService = new CrisisAlertService();

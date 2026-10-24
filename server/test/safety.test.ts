import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { CrisisAlertService } from '../src/modules/safety/crisisAlert.service';
import { ConsoleCrisisSmsProvider } from '../src/modules/safety/sms.provider';
import { SafetyController } from '../src/modules/safety/safety.controller';
import { createSafetyRouter } from '../src/modules/safety/safety.routes';

describe('Crisis Alert Service & Silent Emergency SMS Dispatch', () => {
  let smsProvider: ConsoleCrisisSmsProvider;
  let crisisService: CrisisAlertService;
  let app: any;

  const USER_WITH_CONTACT = 'user-has-secondary-contact';
  const USER_NO_CONTACT = 'user-without-secondary-contact';

  beforeEach(() => {
    smsProvider = new ConsoleCrisisSmsProvider();
    crisisService = new CrisisAlertService(smsProvider);

    // Register secondary contact for USER_WITH_CONTACT
    crisisService.setMockSecondaryContact(
      USER_WITH_CONTACT,
      'Aunt Priya',
      '+919876543210'
    );

    const controller = new SafetyController(crisisService);
    app = createApp();
  });

  it('detects sensitive words related to suicide accurately', () => {
    const text1 = 'I feel so empty and I want to kill myself tonight.';
    const res1 = crisisService.detectSuicidalIntent(text1);
    expect(res1.isCrisis).toBe(true);
    expect(res1.matchedKeywords).toContain('kill myself');

    const text2 = 'Everything hurts and I want to end my life.';
    const res2 = crisisService.detectSuicidalIntent(text2);
    expect(res2.isCrisis).toBe(true);
    expect(res2.matchedKeywords).toContain('end my life');

    const safeText = 'I had a stressful day preparing for my math exam.';
    const safeRes = crisisService.detectSuicidalIntent(safeText);
    expect(safeRes.isCrisis).toBe(false);
  });

  it('immediately and without warning dispatches SMS to secondary contact when available', async () => {
    const distressMessage = 'I cannot take this anymore, I want to commit suicide.';

    const result = await crisisService.evaluateAndDispatchSilentAlert(
      USER_WITH_CONTACT,
      distressMessage
    );

    expect(result.isCrisis).toBe(true);
    expect(result.alertDispatched).toBe(true);
    expect(result.actionTaken).toBe('EMERGENCY_SMS_SECONDARY_CONTACT');
    expect(result.recipient).toBe('+919876543210');
    expect(result.recipientName).toBe('Aunt Priya');

    // Verify SMS history
    const history = smsProvider.getDispatchHistory();
    expect(history.length).toBe(1);
    expect(history[0].recipient).toBe('+919876543210');
    expect(history[0].message).toContain('URGENT INARO SAFETY ALERT');
    expect(history[0].message).toContain('Aunt Priya');

    // Verify audit log recorded RED severity
    const auditLogs = crisisService.getMockAuditLogs();
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].severityLevel).toBe('RED');
    expect(auditLogs[0].actionTaken).toBe('EMERGENCY_SMS_SECONDARY_CONTACT');
  });

  it('when NO secondary contact exists, immediately dispatches emergency SMS to nearby Government Hospital Psychiatrist', async () => {
    const distressMessage = 'I feel completely alone and I want to end my life.';

    // User in Chennai with NO secondary contact
    const result = await crisisService.evaluateAndDispatchSilentAlert(
      USER_NO_CONTACT,
      distressMessage,
      'Chennai, Tamil Nadu'
    );

    expect(result.isCrisis).toBe(true);
    expect(result.alertDispatched).toBe(true);
    expect(result.actionTaken).toBe('EMERGENCY_SMS_GOVT_HOSPITAL_PSYCHIATRIST');
    expect(result.hospitalDetails).toBeDefined();
    expect(result.hospitalDetails?.hospitalName).toContain('Institute of Mental Health');
    expect(result.hospitalDetails?.city).toBe('Chennai');
    expect(result.recipient).toBe(result.hospitalDetails?.emergencyNumber);

    // Verify SMS sent to government hospital psychiatric crisis cell
    const history = smsProvider.getDispatchHistory();
    expect(history.length).toBe(1);
    expect(history[0].recipient).toBe(result.hospitalDetails?.emergencyNumber);
    expect(history[0].message).toContain('GOVERNMENT PSYCHIATRIC CRISIS DISPATCH');
    expect(history[0].message).toContain('Institute of Mental Health');

    // Verify audit log
    const auditLogs = crisisService.getMockAuditLogs();
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].severityLevel).toBe('RED');
    expect(auditLogs[0].actionTaken).toBe('EMERGENCY_SMS_GOVT_HOSPITAL_PSYCHIATRIST');
  });

  it('does not dispatch any SMS when user text is free of acute crisis', async () => {
    const normalText = 'I am studying for my physics viva tomorrow.';

    const result = await crisisService.evaluateAndDispatchSilentAlert(
      USER_WITH_CONTACT,
      normalText
    );

    expect(result.isCrisis).toBe(false);
    expect(result.alertDispatched).toBe(false);
    expect(result.actionTaken).toBe('NO_ACTION');
    expect(smsProvider.getDispatchHistory().length).toBe(0);
  });

  describe('Tone & Mood Analysis Endpoint (/safety/analyze-tone)', () => {
    it('analyzes sad tone and returns avatar facial parameters', async () => {
      const res = await request(app)
        .post('/safety/analyze-tone')
        .send({ text: 'I feel so alone and I cried all night.' });

      expect(res.status).toBe(200);
      expect(res.body.tone).toBe('sad');
      expect(res.body).toHaveProperty('avatarParameters');
      expect(res.body.avatarParameters.expression).toBe('sad');
      expect(res.body.avatarParameters.brow).toBeLessThan(0);
    });

    it('analyzes happy tone and returns smiling avatar parameters', async () => {
      const res = await request(app)
        .post('/safety/analyze-tone')
        .send({ text: 'I am so excited and happy with my results today!' });

      expect(res.status).toBe(200);
      expect(res.body.tone).toBe('happy');
      expect(res.body.avatarParameters.expression).toBe('happy');
      expect(res.body.avatarParameters.smile).toBeGreaterThan(0.5);
    });
  });
});

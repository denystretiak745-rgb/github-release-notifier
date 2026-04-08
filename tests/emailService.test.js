const emailService = require('../src/services/emailService');

describe('emailService', () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = { sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }) };
    emailService.setTransporter(mockTransporter);
  });

  describe('sendConfirmationEmail', () => {
    test('sends email with correct subject and confirm link', async () => {
      await emailService.sendConfirmationEmail('user@example.com', 'owner/repo', 'abc-123');

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toContain('owner/repo');
      expect(call.subject).toContain('Confirm');
      expect(call.html).toContain('/api/confirm/abc-123');
    });

    test('includes repo name in the email body', async () => {
      await emailService.sendConfirmationEmail('user@example.com', 'golang/go', 'token-1');

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('golang/go');
    });
  });

  describe('sendReleaseNotification', () => {
    test('sends email with release tag and unsubscribe link', async () => {
      await emailService.sendReleaseNotification(
        'user@example.com',
        'owner/repo',
        'v2.0.0',
        'https://github.com/owner/repo/releases/tag/v2.0.0',
        'unsub-token-456'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toContain('v2.0.0');
      expect(call.subject).toContain('owner/repo');
      expect(call.html).toContain('v2.0.0');
      expect(call.html).toContain('https://github.com/owner/repo/releases/tag/v2.0.0');
      expect(call.html).toContain('/api/unsubscribe/unsub-token-456');
    });

    test('includes unsubscribe link in email body', async () => {
      await emailService.sendReleaseNotification(
        'user@example.com',
        'facebook/react',
        'v19.0.0',
        'https://github.com/facebook/react/releases/tag/v19.0.0',
        'token-xyz'
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('Unsubscribe');
      expect(call.html).toContain('token-xyz');
    });
  });
});

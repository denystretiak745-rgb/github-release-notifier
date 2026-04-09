const nodemailer = require('nodemailer');
const env = require('../config/env');
const { escapeHtml } = require('../utils/html');

let transporter = null;

/**
 * Get or create the nodemailer transport.
 * Lazily initialized so tests can replace it before first use.
 * @returns {import('nodemailer').Transporter}
 */
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }
  return transporter;
}

/**
 * Override the transporter (used in tests to inject a mock).
 * @param {import('nodemailer').Transporter} mock
 */
function setTransporter(mock) {
  transporter = mock;
}

/**
 * Send a subscription confirmation email.
 * @param {string} to - Recipient email address
 * @param {string} repo - GitHub repository in owner/repo format
 * @param {string} confirmToken - UUID token for the confirmation link
 * @returns {Promise<void>}
 */
async function sendConfirmationEmail(to, repo, confirmToken) {
  const confirmUrl = `${env.appBaseUrl}/api/confirm/${encodeURIComponent(confirmToken)}`;
  const safeRepo = escapeHtml(repo);

  await getTransporter().sendMail({
    from: env.smtp.user,
    to,
    subject: `Confirm your subscription to ${repo} releases`,
    html: `
      <h2>Confirm your subscription</h2>
      <p>You've requested to receive release notifications for <strong>${safeRepo}</strong>.</p>
      <p>Click the link below to confirm your subscription:</p>
      <p><a href="${confirmUrl}">${escapeHtml(confirmUrl)}</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}

/**
 * Send a new release notification email.
 * @param {string} to - Recipient email address
 * @param {string} repo - GitHub repository in owner/repo format
 * @param {string} tagName - The new release tag (e.g. "v1.2.3")
 * @param {string} releaseUrl - URL to the GitHub release page
 * @param {string} unsubscribeToken - UUID token for the unsubscribe link
 * @returns {Promise<void>}
 */
async function sendReleaseNotification(to, repo, tagName, releaseUrl, unsubscribeToken) {
  const unsubscribeUrl = `${env.appBaseUrl}/api/unsubscribe/${encodeURIComponent(unsubscribeToken)}`;
  const safeRepo = escapeHtml(repo);
  const safeTag = escapeHtml(tagName);
  const safeReleaseUrl = escapeHtml(releaseUrl);

  await getTransporter().sendMail({
    from: env.smtp.user,
    to,
    subject: `New release: ${repo} ${tagName}`,
    html: `
      <h2>New release for ${safeRepo}</h2>
      <p>A new release <strong>${safeTag}</strong> has been published.</p>
      <p><a href="${safeReleaseUrl}">View release on GitHub</a></p>
      <hr>
      <p><small><a href="${unsubscribeUrl}">Unsubscribe</a> from ${safeRepo} release notifications.</small></p>
    `,
  });
}

module.exports = {
  getTransporter,
  setTransporter,
  sendConfirmationEmail,
  sendReleaseNotification,
};

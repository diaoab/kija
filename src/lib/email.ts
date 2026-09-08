import nodemailer from "nodemailer";

/**
 * Envoi d'email best-effort via SMTP (nodemailer). Si SMTP_* n'est pas
 * renseigné dans .env, on ne lève pas d'erreur : on renvoie sent:false et
 * l'appelant garde son propre filet de secours (ex. afficher le mot de
 * passe temporaire à l'écran plutôt que de bloquer l'approbation).
 */
function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

export async function sendEmail(params: { to: string; subject: string; text: string; html?: string }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] SMTP non configuré — email non envoyé", {
      subject: params.subject,
      to: params.to,
    });
    return { sent: false };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email] Échec de l'envoi", { to: params.to, error });
    return { sent: false };
  }
}

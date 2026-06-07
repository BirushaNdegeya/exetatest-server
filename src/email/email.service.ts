import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendLoginNotification(
    email: string,
    name: string,
    ipAddress: string,
    timestamp: Date,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'EXETAT Test');
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );

    const htmlContent = this.getLoginNotificationTemplate(
      name,
      email,
      appName,
      ipAddress,
      timestamp,
      appUrl,
    );

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: 'Connexion détectée : nouvel appareil ou nouvel emplacement ?',
      html: htmlContent,
    });
  }

  async sendOTP(
    email: string,
    name: string,
    otp: string,
    ipAddress: string,
    timestamp: Date,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'EXETATEST');
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );

    const htmlContent = this.getOTPTemplate(
      name,
      appName,
      otp,
      ipAddress,
      timestamp,
      appUrl,
    );

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: 'Votre code OTP de connexion',
      html: htmlContent,
    });
  }

  async sendInactivityReminder(
    email: string,
    name: string,
    inactivityDays: number,
  ): Promise<void> {
    const appName = this.configService.get<string>(
      'APP_NAME',
      'EXETATEST',
    );
    const appUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>On vous attend sur ${appName}</title>
  <style>
    body { margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f5f5f5; }
    .container { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08); }
    .header { background:#58cc02; padding:24px 20px; text-align:center; color:#fff; font-weight:800; letter-spacing:0.4px; }
    .content { padding:32px 24px; color:#333; }
    h1 { font-size:22px; margin:0 0 12px 0; }
    p { margin:0 0 12px 0; line-height:1.6; font-size:15px; }
    .button { display:inline-block; margin-top:16px; background:#58cc02; color:#fff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:800; }
    .muted { color:#777; font-size:13px; margin-top:18px; }
    .footer { background:#f0fce6; padding:20px; text-align:center; color:#43c000; font-weight:800; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">${appName}</div>
    <div class="content">
      <h1>Bonjour ${name},</h1>
      <p>Ça fait <strong>${inactivityDays} jours</strong> qu’on ne vous a pas vu(e). Une petite séance aujourd’hui peut relancer votre progression.</p>
      <p><a class="button" href="${appUrl}">Reprendre l’entraînement</a></p>
      <p class="muted">Si vous n’avez plus accès à ce compte, ignorez simplement cet email. Ceci est un message automatique.</p>
    </div>
    <div class="footer">À très vite !</div>
  </div>
</body>
</html>`;

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: `On vous attend sur ${appName}`,
      html: htmlContent,
    });
  }

  private getOTPTemplate(
    name: string,
    appName: string,
    otp: string,
    ipAddress: string,
    timestamp: Date,
    appUrl: string,
  ): string {
    const formattedDate = timestamp
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre code OTP</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(88, 204, 2, 0.12);
    }
    .header {
      background-color: #58cc02;
      padding: 28px 20px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 30px;
    }
    h1 {
      color: #4b4b4b;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 600;
    }
    p {
      color: #4b4b4b;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 15px 0;
    }
    .otp-box {
      background-color: #f0fce6;
      border: 2px solid #58cc02;
      border-radius: 12px;
      padding: 24px 20px;
      margin: 30px 0;
      text-align: center;
    }
    .otp-code {
      font-size: 38px;
      font-weight: 700;
      color: #43c000;
      letter-spacing: 10px;
      font-family: 'Courier New', monospace;
    }
    .otp-label {
      font-size: 14px;
      color: #4b4b4b;
      margin-bottom: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .info-box {
      background-color: #e8f4fd;
      border-left: 4px solid #1cb0f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .info-box p {
      margin: 5px 0;
      font-size: 14px;
      color: #4b4b4b;
    }
    .warning {
      background-color: #fff0f0;
      border-left: 4px solid #ff4b4b;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
      color: #cc0000;
      border-radius: 0 6px 6px 0;
    }
    .help-text {
      font-size: 14px;
      color: #4b4b4b;
      margin-top: 20px;
    }
    .help-text a {
      color: #1cb0f6;
      text-decoration: none;
      font-weight: 600;
    }
    .disclaimer {
      font-size: 13px;
      color: #999999;
      font-style: italic;
      margin-top: 20px;
    }
    .footer {
      background-color: #f0fce6;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #89e219;
    }
    .footer-text {
      color: #43c000;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="header-title">${appName}</p>
    </div>
    <div class="content">
      <h1>Votre code de connexion</h1>
      <p>Bonjour ${name},</p>
      <p>
        Vous avez demandé à vous connecter à votre compte <strong>${appName}</strong>.
        Utilisez le code ci-dessous pour finaliser votre connexion.
      </p>
      
      <div class="otp-box">
        <div class="otp-label">Votre code OTP</div>
        <div class="otp-code">${otp}</div>
      </div>

      <div class="info-box">
        <p><strong>Date :</strong> ${formattedDate} (UTC)</p>
        <p><strong>Adresse IP :</strong> ${ipAddress}</p>
      </div>

      <div class="warning">
        ⚠️ Ce code expire dans 10 minutes. Ne le partagez avec personne.
      </div>

      <p class="help-text">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email ou
        <a href="${appUrl}/support">contactez le support</a> en cas de doute.
      </p>

      <p class="disclaimer">
        Ceci est un message automatique, merci de ne pas répondre.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">Restez connecté(e) !</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getLoginNotificationTemplate(
    name: string,
    email: string,
    appName: string,
    ipAddress: string,
    timestamp: Date,
    appUrl: string,
  ): string {
    const formattedDate =
      timestamp.toISOString().replace('T', ' ').substring(0, 19) + '(UTC)';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification de connexion</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(88, 204, 2, 0.12);
    }
    .header {
      background-color: #58cc02;
      padding: 28px 20px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 30px;
    }
    h1 {
      color: #4b4b4b;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 600;
    }
    p {
      color: #4b4b4b;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 15px 0;
    }
    .highlight {
      background-color: #89e219;
      color: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }
    .info-box {
      background-color: #e8f4fd;
      border-left: 4px solid #1cb0f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .info-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    .info-label {
      font-weight: 600;
      color: #2b70c9;
    }
    .button {
      display: inline-block;
      background-color: #58cc02;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 700;
      margin: 20px 0;
      font-size: 16px;
      letter-spacing: 0.3px;
    }
    .button:hover {
      background-color: #43c000;
    }
    .help-text {
      font-size: 14px;
      color: #4b4b4b;
      margin-top: 20px;
    }
    .help-text a {
      color: #1cb0f6;
      text-decoration: none;
      font-weight: 600;
    }
    .disclaimer {
      font-size: 13px;
      color: #999999;
      font-style: italic;
      margin-top: 20px;
    }
    .footer {
      background-color: #f0fce6;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #89e219;
    }
    .footer-text {
      color: #43c000;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 15px;
    }
    .social-links {
      margin-top: 15px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #4b4b4b;
      text-decoration: none;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="header-title">${appName}</p>
    </div>
    <div class="content">
      <h1>Connexion depuis un nouvel appareil ou emplacement ?</h1>
      <p>
        Nous avons détecté une connexion à votre compte <span class="highlight">${appName}</span>
        <a href="mailto:${email}" style="color: #0066cc; text-decoration: none;">${email}</a>
        depuis une nouvelle adresse IP.
      </p>
      
      <div class="info-box">
        <p><span class="info-label">Date</span> : ${formattedDate}</p>
        <p><span class="info-label">Adresse IP</span> : ${ipAddress}</p>
      </div>

      <a href="${appUrl}" class="button">Accéder à votre compte</a>

      <p class="help-text">
        Vous ne reconnaissez pas cette activité ?
        <a href="${appUrl}/reset-password">Réinitialisez votre mot de passe</a> et contactez
        <a href="${appUrl}/support">le support</a> immédiatement.
      </p>

      <p class="disclaimer">
        Ceci est un message automatique, merci de ne pas répondre.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">Restez connecté(e) !</p>
      <div class="social-links">
        <a href="#" title="X (Twitter)">𝕏</a>
        <a href="#" title="Telegram">✈</a>
        <a href="#" title="Facebook">f</a>
        <a href="#" title="LinkedIn">in</a>
        <a href="#" title="YouTube">▶</a>
        <a href="#" title="Reddit">⊙</a>
        <a href="#" title="Instagram">📷</a>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  async sendSetInvitation(
    email: string,
    inviterName: string,
    setTitle: string,
  ): Promise<void> {
    const appName = this.configService.get<string>(
      'APP_NAME',
      'EXETAT Mastery',
    );
    const appUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    const htmlContent = this.getSetInvitationTemplate(
      inviterName,
      setTitle,
      appName,
      appUrl,
    );

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: `Invitation : rejoindre « ${setTitle} » sur ${appName}`,
      html: htmlContent,
    });
  }

  private getSetInvitationTemplate(
    inviterName: string,
    setTitle: string,
    appName: string,
    appUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation au quiz</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(88, 204, 2, 0.12);
    }
    .header {
      background-color: #58cc02;
      padding: 28px 20px;
      text-align: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 30px;
    }
    h1 {
      color: #4b4b4b;
      font-size: 24px;
      margin: 0 0 20px 0;
      font-weight: 600;
    }
    p {
      color: #4b4b4b;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 15px 0;
    }
    .invitation-box {
      background-color: #f0fce6;
      border-left: 4px solid #58cc02;
      padding: 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .invitation-box p {
      margin: 5px 0;
    }
    .set-title {
      font-size: 18px;
      font-weight: 700;
      color: #43c000;
      margin: 10px 0;
    }
    .inviter-name {
      color: #58cc02;
      font-weight: 700;
    }
    .button {
      display: inline-block;
      background-color: #58cc02;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 700;
      margin: 20px 0;
      font-size: 16px;
      letter-spacing: 0.3px;
    }
    .button:hover {
      background-color: #43c000;
    }
    .help-text {
      font-size: 14px;
      color: #4b4b4b;
      margin-top: 20px;
    }
    .help-text a {
      color: #1cb0f6;
      text-decoration: none;
      font-weight: 600;
    }
    .footer {
      background-color: #f0fce6;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #89e219;
    }
    .footer-text {
      color: #43c000;
      font-size: 14px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="header-title">${appName}</p>
    </div>
    <div class="content">
      <h1>Vous êtes invité(e) !</h1>
      <p>
        <span class="inviter-name">${inviterName}</span> vous a invité(e) à rejoindre un ensemble de quiz sur <strong>${appName}</strong>.
      </p>
      
      <div class="invitation-box">
        <p style="color: #666; margin-bottom: 10px;">Ensemble de quiz</p>
        <div class="set-title">"${setTitle}"</div>
        <p style="color: #999; font-size: 14px; margin-top: 10px;">
          Entraînez-vous et progressez ensemble !
        </p>
      </div>

      <p>
        Cliquez sur le bouton ci-dessous pour voir et accepter l'invitation :
      </p>

      <a href="${appUrl}/invitations" class="button">Voir l'invitation</a>

      <p class="help-text">
        Vous n'avez pas encore de compte ? Pas de souci !
        <a href="${appUrl}/signup">Inscrivez-vous</a> pour commencer.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">${appName} · Apprendre ensemble</p>
      <p style="color: #999; font-size: 12px; margin-top: 10px;">
        Ceci est un message automatique, merci de ne pas répondre.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

// src/lib/mailer.ts
// DMCC Phase3：スキャン結果通知メール送信モジュール
// --------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

const VAR_DIR = path.join(process.cwd(), "var", "config");
const USER_CONF = path.join(VAR_DIR, "user.json");

export type MailerEnv = {
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_SECURE?: string;
  SMTP_TLS_REJECT_UNAUTH?: string;
  SMTP_IGNORE_TLS?: string;
};

export type NotifyPayload = {
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; path: string; contentType?: string }>;
};

// --------------------------------------------------
// Utility
// --------------------------------------------------

function readJSON<T = any>(p: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return fallback;
  }
}

function readToFrom() {
  const cfg = readJSON(USER_CONF, {} as any);
  const email = cfg?.email || {};
  return {
    to: email.to as string | undefined,
    from: email.from as string | undefined,
    fromName: (email.fromName as string | undefined) || "DMCC Bot",
  };
}

// --------------------------------------------------
// メール送信関数
// --------------------------------------------------

export async function sendMail(payload: NotifyPayload) {
  const {
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE,
    SMTP_TLS_REJECT_UNAUTH, SMTP_IGNORE_TLS
  } = process.env as MailerEnv;

  if (!SMTP_HOST || !SMTP_PORT) {
    throw new Error("SMTP env not set: SMTP_HOST/SMTP_PORT is required");
  }

  const secure = SMTP_SECURE === "true" || SMTP_PORT === "465";

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    tls: SMTP_TLS_REJECT_UNAUTH === "false" ? { rejectUnauthorized: false } : undefined,
    ignoreTLS: SMTP_IGNORE_TLS === "true" || undefined,
  });

  console.log("[DMCC][mailer] transport opts", {
    host: SMTP_HOST, port: SMTP_PORT, secure,
    hasAuth: Boolean(SMTP_USER && SMTP_PASS),
    tls_relaxed: SMTP_TLS_REJECT_UNAUTH, ignoreTLS: SMTP_IGNORE_TLS,
  });

  try {
    const ok = await transporter.verify();
    console.log("[DMCC][mailer] verify ok:", ok);
  } catch (e: any) {
    console.error("[DMCC][mailer] verify error:", e?.message || e, e);
    throw e;
  }

  const { to, from, fromName } = readToFrom();
  if (!to) throw new Error("user.json email.to not set");

  const fromHeader = from
    ? `${fromName} <${from}>`
    : `${fromName} <no-reply@dmcc.local>`;

  try {
    const info = await transporter.sendMail({
      to,
      from: fromHeader,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments,
    });

    console.log("[DMCC][mailer] sent", info);
    return {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (e: any) {
    console.error("[DMCC][mailer] send error", e?.message || e, e);
    throw e;
  }
}

// --------------------------------------------------
// スキャン完了通知関数
// --------------------------------------------------

export async function notifyScanFinished(opts: {
  period: "daily" | "weekly" | "monthly";
  meta?: any;
  reportPdfPath?: string;
  reportUrl?: string;
}) {
  const { to } = readToFrom();
  if (!to) {
    console.warn("[DMCC][mailer] skip notifyScanFinished: no recipient");
    return;
  }

  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const title = `【DMCC】${opts.period.toUpperCase()} スキャン完了通知`;

  const summary = opts.meta?.error
    ? `<p style="color:red">スキャン中にエラーが発生しました。</p><pre>${opts.meta.error}</pre>`
    : `<p>スキャンが正常に完了しました。</p>`;

  const reportLink = opts.reportUrl
    ? `<p><a href="${opts.reportUrl}" target="_blank">▶ レポートを開く</a></p>`
    : "";

  const html = `
    <div style="font-family:sans-serif;">
      <h2>${title}</h2>
      <p>実行日時：${now}</p>
      ${summary}
      ${reportLink}
      <hr />
      <p style="font-size:12px;color:#666;">DMCC 自動分析システムより送信</p>
    </div>
  `;

  try {
    await sendMail({
      subject: title,
      html,
      text: `スキャン完了 (${opts.period})\n${now}\n${opts.meta?.error ? "エラー発生" : "正常完了"}`,
      attachments: opts.reportPdfPath
        ? [{ filename: path.basename(opts.reportPdfPath), path: opts.reportPdfPath }]
        : undefined,
    });
    console.log("[DMCC][mailer] notifyScanFinished sent:", title);
  } catch (e: any) {
    console.error("[DMCC][mailer] notifyScanFinished error:", e?.message || e);
  }
}
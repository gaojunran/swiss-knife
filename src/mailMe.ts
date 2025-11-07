import { Command } from "@cliffy/command";
import nodemailer from "npm:nodemailer";

/**
 * mailMe - Deno CLI (Cliffy) that sends email using nodemailer (npm)
 *
 * Environment variables:
 *   EMAIL      - sender email (also used as recipient)
 *   EMAIL_PASS - sender password or app-specific password
 * Optional:
 *   SMTP_HOST  - SMTP host, defaults to smtp.<email-domain> or smtp.gmail.com
 *
 * Usage:
 *   deno run --allow-env --allow-net --unstable src/mailMe.ts "<subject>" "<content(optional)>"
 *
 * Notes:
 * - This keeps the original Cliffy-based CLI for Deno but delegates sending to nodemailer.
 * - Depending on your Deno version you may need Node compatibility enabled for `npm:` imports.
 * - For Gmail, prefer an app password or OAuth2; plain account password may be rejected.
 */

export const mailMeCommand = new Command()
  .name("mailMe")
  .description("Send an email using EMAIL and EMAIL_PASS environment variables (nodemailer)")
  // subject required, content optional (rest joined with spaces)
  .arguments("<subject:string> [content...:string]")
  .action(async (_options, subject: string, ...contentParts: string[]) => {
    const email = Deno.env.get("EMAIL");
    const password = Deno.env.get("EMAIL_PASS");

    if (!email || !password) {
      console.error("错误: 请通过环境变量设置 EMAIL 和 EMAIL_PASS");
      Deno.exit(2);
    }

    if (!subject) {
      console.error('用法: mailMe "<subject>" "<content(optional)>"');
      Deno.exit(2);
    }

    const content = contentParts.length > 0 ? contentParts.join(" ") : subject;

    // Infer SMTP host from email domain if not provided
    const smtpHost =
      Deno.env.get("SMTP_HOST") ??
      (() => {
        try {
          const domain = email.split("@")[1];
          return domain ? `smtp.${domain}` : "smtp.gmail.com";
        } catch {
          return "smtp.gmail.com";
        }
      })();

    const smtpPort = 465;
    const secure = true; // use TLS by default
    const to = email; // default: send to self

    console.log("准备发送邮件：");
    console.log(`  发件人: ${email}`);
    console.log(`  收件人: ${to}`);
    console.log(`  SMTP: ${smtpHost}:${smtpPort}`);
    console.log(`  主题: ${subject}`);

    // Create a nodemailer transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure,
      auth: {
        user: email,
        pass: password,
      },
    });

    try {
      // verify connection configuration early to provide clearer errors
      if (typeof transporter.verify === "function") {
        // verify returns a Promise in nodemailer
        await transporter.verify();
      }

      const info = await transporter.sendMail({
        from: email,
        to,
        subject,
        text: content,
      });

      console.log("✅ 邮件发送成功");
      // nodemailer info may contain useful diagnostic fields like messageId
      if (info && (info as any).messageId) {
        console.log(`  messageId: ${(info as any).messageId}`);
      }
    } catch (err) {
      // Avoid printing sensitive data; print error message only
      console.error("❌ 邮件发送失败:", err && (err as Error).message ? (err as Error).message : String(err));
      // 出现错误时以非零退出码退出
      Deno.exit(1);
    }
  });

// 支持直接运行
if (import.meta.main) {
  await mailMeCommand.parse(Deno.args);
}

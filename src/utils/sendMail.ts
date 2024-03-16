import nodemailer from "nodemailer";
import { logEvents } from "../middlewares/logger";
export default async function sendMail(
  to: string,
  subject: string,
  text: string
) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Boolean(process.env.SMTP_SECURE),
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    console.log("Email sent successfully");
  } catch (err) {
    console.log(err);
    logEvents(`${err}`, "mailErrorLog.log");
  }
}

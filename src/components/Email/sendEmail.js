import { Resend } from 'resend';
import { 
  ConfirmEmailTemplate
} from "./templates/ConfirmEmail";
import { 
  ResetPasswordTemplate
} from "./templates/ResetPassword";

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export async function sendAuthEmail(email, type) {
  let template, subject;

  switch (type) {
    case 'confirm':
      subject = 'Confirm Your Email';
      template = ConfirmEmailTemplate({
        confirmationLink: `http://localhost:5173/complete-profile`
      });
      break;
    case 'reset':
      subject = 'Reset Your Password';
      template = ResetPasswordTemplate({
        resetLink: `http://localhost:5173/update-password`
      });
      break;
  }

  try {
    await resend.emails.send({
      from: 'Mira <team@mirahub.me>',
      to: email,
      subject,
      html: template
    });
    return { error: null };
  } catch (error) {
    console.error(`Email send failed (${type}):`, error);
    return { error };
  }
}
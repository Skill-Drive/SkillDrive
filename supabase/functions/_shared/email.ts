// Resend transactional email helper shared by all Edge Functions.
// Emails degrade gracefully: if RESEND_API_KEY is unset we log and continue,
// so payments/bookings never fail because of the mail provider.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = Deno.env.get("RESEND_FROM") ??
  "SkillDrive <notifications@skilldrive.com.au>";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.log(`[email skipped — RESEND_API_KEY unset] ${payload.subject}`);
    return false;
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });
    if (!res.ok) {
      console.error("Resend error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0b1020">
  <div style="font-size:20px;font-weight:800;margin-bottom:4px">Skill<span style="color:#1b3cff">Drive</span></div>
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0"/>
  <h2 style="font-size:18px;margin:0 0 12px">${title}</h2>
  ${body}
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 12px"/>
  <p style="font-size:12px;color:#888">SkillDrive · Driving lessons across NSW, Australia.<br/>
  Need help? Reply to this email or open a support ticket from your dashboard.</p>
</div>`;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });

export const templates = {
  welcome(name: string, role: string) {
    return {
      subject: "Welcome to SkillDrive 🚗",
      html: layout(
        `Welcome aboard, ${name}!`,
        role === "instructor"
          ? `<p>Your instructor account has been created. To start receiving bookings:</p>
             <ol><li>Complete your onboarding questionnaire</li>
             <li>Upload your NSW Driving Instructor Licence and WWCC</li>
             <li>Connect your Stripe account for payouts</li></ol>
             <p>Our team will review your documents and approve your profile shortly after.</p>`
          : `<p>Your learner account is ready. Search instructors by suburb, compare prices and reviews, and book instantly into open slots.</p>
             <p>Tip: lessons with a licensed instructor count <strong>3-for-1</strong> towards your NSW logbook hours (first 10 lessons).</p>`,
      ),
    };
  },
  bookingConfirmed(startTime: string, pickupAddress: string, price: number) {
    return {
      subject: "Your SkillDrive lesson is confirmed ✅",
      html: layout(
        "Lesson confirmed",
        `<p>Your driving lesson is locked in:</p>
         <p><strong>${fmt(startTime)}</strong><br/>Pickup: ${pickupAddress}<br/>Total paid: $${price.toFixed(2)} AUD</p>
         <p>You can reschedule or cancel free of charge up to 24 hours before the lesson from your dashboard.</p>`,
      ),
    };
  },
  bookingCancelled(startTime: string, refunded: boolean) {
    return {
      subject: "Your SkillDrive lesson was cancelled",
      html: layout(
        "Lesson cancelled",
        `<p>The lesson scheduled for <strong>${fmt(startTime)}</strong> has been cancelled.</p>
         ${
          refunded
            ? "<p>A full refund has been issued to the original payment method. It can take 5–10 business days to appear.</p>"
            : "<p>As the cancellation was within 24 hours of the lesson, the lesson fee is not refundable under our cancellation policy.</p>"
        }`,
      ),
    };
  },
  bookingRescheduled(oldTime: string, newTime: string) {
    return {
      subject: "Your SkillDrive lesson was rescheduled",
      html: layout(
        "Lesson rescheduled",
        `<p>Your lesson has moved:</p>
         <p>From: <s>${fmt(oldTime)}</s><br/>To: <strong>${fmt(newTime)}</strong></p>`,
      ),
    };
  },
  lessonReminder(startTime: string, pickupAddress: string, otherPartyName: string) {
    return {
      subject: "Reminder: your SkillDrive lesson is in 24 hours ⏰",
      html: layout(
        "Lesson tomorrow",
        `<p>This is a friendly reminder about your lesson with <strong>${otherPartyName}</strong>:</p>
         <p><strong>${fmt(startTime)}</strong><br/>Pickup: ${pickupAddress}</p>
         <p>Cancellations are now inside the 24-hour window and are no longer refundable.</p>`,
      ),
    };
  },
  payoutSent(amount: number, startTime: string) {
    return {
      subject: "SkillDrive payout on its way 💸",
      html: layout(
        "Payout sent",
        `<p>Your payout of <strong>$${(amount / 100).toFixed(2)} AUD</strong> for the lesson on ${fmt(startTime)} has been transferred to your Stripe account.</p>`,
      ),
    };
  },
};

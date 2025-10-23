import { Resend } from 'resend';
import { sql, isDatabaseConfigured } from './neon';

const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY not found. Email sending will not work.');
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface SendEmailParams {
  to: string;
  template: EmailTemplate;
  failedPaymentId: string;
  templateName: string;
}

export async function sendRecoveryEmail({
  to,
  template,
  failedPaymentId,
  templateName
}: SendEmailParams) {
  try {
    console.log('📧 Starting email send process...');
    console.log('📧 To:', to);
    console.log('📧 Template:', template);
    console.log('📧 Failed Payment ID:', failedPaymentId);
    console.log('📧 Template Name:', templateName);

    if (!isDatabaseConfigured()) {
      throw new Error('Database not configured');
    }

    // For testing without RESEND_API_KEY, simulate email sending
    let data = { id: 'test_email_' + Date.now() };
    let error = null;

    if (!process.env.RESEND_API_KEY) {
      console.log('🧪 Testing mode: Simulating email send');
      console.log('📧 To:', to);
      console.log('📧 Subject:', template.subject);
      console.log('📧 Body:', template.body);
    } else {
      console.log('📤 Sending email via Resend...');
      // Send email via Resend
      const result = await resend.emails.send({
        from: 'DunningPro <noreply@dunningpro.com>',
        to: [to],
        subject: template.subject,
        html: template.body,
      });
      data = result.data || { id: 'test_email_' + Date.now() };
      error = result.error;

      if (error) {
        console.error('❌ Resend error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }
      console.log('✅ Email sent successfully via Resend:', data);
    }

    // Create email sequence record
    console.log('💾 Creating email sequence record...');
    const sequenceData = await sql!`
      INSERT INTO email_sequences (
        failed_payment_id, email_type, resend_email_id, sent_at
      ) VALUES (
        ${failedPaymentId}, 
        ${templateName.toLowerCase().replace(/\s+/g, '_')}, 
        ${data?.id}, 
        ${new Date().toISOString()}
      )
      RETURNING *
    `;
    console.log('✅ Email sequence created:', sequenceData[0].id);

    // Create sent email record
    console.log('💾 Creating sent email record...');
    await sql!`
      INSERT INTO sent_emails (
        failed_payment_id, email_sequence_id, template_name, recipient_email, 
        subject, body, resend_email_id, status, sent_at
      ) VALUES (
        ${failedPaymentId}, ${sequenceData[0].id}, ${templateName}, ${to}, 
        ${template.subject}, ${template.body}, ${data?.id}, 'sent', ${new Date().toISOString()}
      )
    `;
    console.log('✅ Sent email record created');

    // Get current emails_sent count and update failed payment record
    console.log('💾 Updating payment record...');
    const paymentData = await sql!`
      SELECT emails_sent FROM failed_payments WHERE id = ${failedPaymentId}
    `;

    await sql!`
      UPDATE failed_payments SET
        emails_sent = ${(paymentData[0]?.emails_sent || 0) + 1},
        last_email_sent = ${new Date().toISOString()},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${failedPaymentId}
    `;
    console.log('✅ Payment record updated');

    console.log('🎉 Email send process completed successfully!');
    return {
      success: true,
      emailId: data?.id,
      sequenceId: sequenceData[0].id
    };

  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getEmailTemplates(companyId: string) {
  if (!isDatabaseConfigured()) {
    console.error('Database not configured');
    return [];
  }

  try {
    const data = await sql!`
      SELECT * FROM email_rules 
      WHERE company_id = ${companyId}
      ORDER BY days ASC
    `;
    return data || [];
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return [];
  }
}

export async function saveEmailTemplate(companyId: string, template: {
  days: number;
  enabled: boolean;
  template_name: string;
  template_subject: string;
  template_body: string;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error('Database not configured');
  }

  try {
    const data = await sql!`
      INSERT INTO email_rules (
        company_id, days, enabled, template_name, template_subject, 
        template_body, created_at, updated_at
      ) VALUES (
        ${companyId}, ${template.days}, ${template.enabled}, 
        ${template.template_name}, ${template.template_subject}, 
        ${template.template_body}, ${new Date().toISOString()}, ${new Date().toISOString()}
      )
      ON CONFLICT (company_id, days) 
      DO UPDATE SET
        enabled = ${template.enabled},
        template_name = ${template.template_name},
        template_subject = ${template.template_subject},
        template_body = ${template.template_body},
        updated_at = ${new Date().toISOString()}
      RETURNING *
    `;
    return data[0];
  } catch (error) {
    console.error('Error saving email template:', error);
    throw new Error(`Failed to save template: ${error}`);
  }
}

export async function deleteEmailTemplate(templateId: string) {
  if (!isDatabaseConfigured()) {
    throw new Error('Database not configured');
  }

  try {
    await sql!`DELETE FROM email_rules WHERE id = ${templateId}`;
  } catch (error) {
    console.error('Error deleting email template:', error);
    throw new Error(`Failed to delete template: ${error}`);
  }
}

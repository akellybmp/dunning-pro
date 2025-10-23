-- Neon Database Schema for Dunning Pro
-- Run these SQL statements in your Neon database to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. failed_payments table
CREATE TABLE IF NOT EXISTS failed_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id TEXT NOT NULL UNIQUE,
    membership_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    product_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'usd',
    payments_failed_count INTEGER NOT NULL DEFAULT 0,
    last_payment_attempt TIMESTAMPTZ,
    next_payment_attempt TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'recovered')),
    auto_email_enabled BOOLEAN DEFAULT true,
    emails_sent INTEGER DEFAULT 0,
    last_email_sent TIMESTAMPTZ,
    next_email_scheduled TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for failed_payments
CREATE INDEX IF NOT EXISTS idx_failed_payments_company_id ON failed_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_failed_payments_status ON failed_payments(status);
CREATE INDEX IF NOT EXISTS idx_failed_payments_membership_id ON failed_payments(membership_id);
CREATE INDEX IF NOT EXISTS idx_failed_payments_payment_id ON failed_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_failed_payments_created_at ON failed_payments(created_at);

-- 2. email_sequences table
CREATE TABLE IF NOT EXISTS email_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    failed_payment_id UUID NOT NULL REFERENCES failed_payments(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL CHECK (email_type IN ('initial', 'reminder', 'final')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'opened')),
    resend_email_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for email_sequences
CREATE INDEX IF NOT EXISTS idx_email_sequences_failed_payment_id ON email_sequences(failed_payment_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_email_type ON email_sequences(email_type);
CREATE INDEX IF NOT EXISTS idx_email_sequences_sent_at ON email_sequences(sent_at);

-- 3. recovery_stats table
CREATE TABLE IF NOT EXISTS recovery_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_failed INTEGER NOT NULL DEFAULT 0,
    total_recovered INTEGER NOT NULL DEFAULT 0,
    revenue_recovered NUMERIC(10,2) NOT NULL DEFAULT 0,
    emails_sent INTEGER NOT NULL DEFAULT 0,
    company_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for recovery_stats
CREATE INDEX IF NOT EXISTS idx_recovery_stats_date ON recovery_stats(date);
CREATE INDEX IF NOT EXISTS idx_recovery_stats_company_id ON recovery_stats(company_id);

-- 4. email_rules table (for email templates)
CREATE TABLE IF NOT EXISTS email_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL,
    days INTEGER NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    template_name TEXT NOT NULL,
    template_subject TEXT NOT NULL,
    template_body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, days)
);

-- Indexes for email_rules
CREATE INDEX IF NOT EXISTS idx_email_rules_company_id ON email_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_email_rules_days ON email_rules(days);

-- 5. sent_emails table (for email tracking)
CREATE TABLE IF NOT EXISTS sent_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    failed_payment_id UUID NOT NULL REFERENCES failed_payments(id) ON DELETE CASCADE,
    email_sequence_id UUID REFERENCES email_sequences(id) ON DELETE SET NULL,
    template_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    resend_email_id TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'opened', 'clicked')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sent_emails
CREATE INDEX IF NOT EXISTS idx_sent_emails_failed_payment_id ON sent_emails(failed_payment_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_email_sequence_id ON sent_emails(email_sequence_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_recipient_email ON sent_emails(recipient_email);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON sent_emails(sent_at);

-- 6. email_settings table (for sender configuration)
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL UNIQUE,
    sender_name TEXT NOT NULL DEFAULT 'DunningPro',
    sender_email TEXT NOT NULL,
    reply_to_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for email_settings
CREATE INDEX IF NOT EXISTS idx_email_settings_company_id ON email_settings(company_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_failed_payments_updated_at 
    BEFORE UPDATE ON failed_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_rules_updated_at 
    BEFORE UPDATE ON email_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at 
    BEFORE UPDATE ON email_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Sample email settings
INSERT INTO email_settings (company_id, sender_name, sender_email, reply_to_email) 
VALUES ('default', 'DunningPro', 'noreply@dunningpro.com', 'support@dunningpro.com')
ON CONFLICT (company_id) DO NOTHING;

-- Sample email rules
INSERT INTO email_rules (company_id, days, enabled, template_name, template_subject, template_body) VALUES
('default', 1, true, 'Initial Reminder', 'Payment Failed - Action Required', 'Your payment has failed. Please update your payment method.'),
('default', 3, true, 'Second Reminder', 'Payment Still Failed - Update Required', 'Your payment is still failing. Please update your payment method to avoid service interruption.'),
('default', 7, true, 'Final Notice', 'Final Notice - Payment Required', 'This is your final notice. Please update your payment method immediately to avoid service cancellation.')
ON CONFLICT (company_id, days) DO NOTHING;

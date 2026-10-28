-- Migration 005: Outreach Automation tables
-- Phase 5: Outreach & Follow-up Automation

-- Email delivery tracking
CREATE TABLE email_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outreach_draft_id UUID NOT NULL REFERENCES outreach_drafts(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  approval_id UUID NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  provider VARCHAR(50) NOT NULL,
  provider_message_id VARCHAR(255),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppression records (opt-outs, bounces, do-not-contact)
CREATE TABLE suppression_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  channel VARCHAR(50) NOT NULL DEFAULT 'email',
  normalized_address VARCHAR(255) NOT NULL UNIQUE,
  reason VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Follow-up rule definitions (sequences)
CREATE TABLE followup_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sequence_config JSONB NOT NULL,
  stop_conditions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-up task instances
CREATE TABLE followup_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES followup_rules(id),
  sequence_step INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  stop_reason VARCHAR(100),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_deliveries_lead ON email_deliveries(lead_id);
CREATE INDEX idx_email_deliveries_contact ON email_deliveries(contact_id);
CREATE INDEX idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX idx_email_deliveries_approval ON email_deliveries(approval_id);
CREATE INDEX idx_suppression_records_channel ON suppression_records(channel);
CREATE INDEX idx_suppression_records_address ON suppression_records(normalized_address);
CREATE INDEX idx_suppression_records_lead ON suppression_records(lead_id);
CREATE INDEX idx_suppression_records_contact ON suppression_records(contact_id);
CREATE INDEX idx_followup_rules_active ON followup_rules(is_active);
CREATE INDEX idx_followup_tasks_lead ON followup_tasks(lead_id);
CREATE INDEX idx_followup_tasks_contact ON followup_tasks(contact_id);
CREATE INDEX idx_followup_tasks_rule ON followup_tasks(rule_id);
CREATE INDEX idx_followup_tasks_status ON followup_tasks(status);

-- Row Level Security
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_tasks ENABLE ROW LEVEL SECURITY;

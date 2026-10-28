-- Migration 003: AI tables (lead_scores, research_records, outreach_drafts)
-- Phase 3: AI Lead Intelligence

-- Lead scores table — stores scoring history per lead
CREATE TABLE lead_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  score_version VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  reasoning_json TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Research records table — stores AI company research with evidence
CREATE TABLE research_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'ollama' or 'mock'
  research_json TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach drafts table — stores AI-generated drafts awaiting approval
CREATE TABLE outreach_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL, -- 'ollama' or 'mock'
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  service_recommended VARCHAR(255),
  personalization_json TEXT,
  source_context TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, sent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_lead_scores_lead ON lead_scores(lead_id);
CREATE INDEX idx_lead_scores_created ON lead_scores(created_at);
CREATE INDEX idx_research_records_company ON research_records(company_id);
CREATE INDEX idx_outreach_drafts_lead ON outreach_drafts(lead_id);
CREATE INDEX idx_outreach_drafts_status ON outreach_drafts(status);

-- Enable Row Level Security
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS subscriptions (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  repo          VARCHAR(255) NOT NULL,
  confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
  confirm_token VARCHAR(255) NOT NULL UNIQUE,
  unsubscribe_token VARCHAR(255) NOT NULL UNIQUE,
  last_seen_tag VARCHAR(255),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(email, repo)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_confirm_token ON subscriptions(confirm_token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_unsubscribe_token ON subscriptions(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_confirmed ON subscriptions(confirmed);

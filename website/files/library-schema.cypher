// BabyKalki Library — schema v0.2, shipped unchanged in files v0.3 (LadybugDB / Cypher DDL). MIT licence.
// Rule: facts are corrected, never erased. Only the Library service process writes (it runs as its own user).
// v0.2 keeps ONLY what has tools and tests. People, companies, projects and decisions are FACTS with a topic
// (e.g. "people:asha", "company:acme", "decisions"), not separate node types — fewer promises, all of them kept.
CREATE NODE TABLE IF NOT EXISTS Fact(
  id STRING, text STRING, topic STRING,
  instrument STRING,            // how we know it (re-checks are appended, never replaced)
  status STRING,                // live | superseded | retired
  level STRING,                 // verified | claimed
  created_at TIMESTAMP, verified_at TIMESTAMP,
  committed_by STRING, retired_reason STRING,
  PRIMARY KEY(id));
CREATE NODE TABLE IF NOT EXISTS Proposal(
  id STRING, text STRING, topic STRING, instrument STRING, source STRING,
  proposed_by STRING,           // the REAL caller (from its Library token), not free text
  created_at TIMESTAMP, state STRING,   // pending | accepted | rejected
  decided_by STRING, decision_reason STRING,
  PRIMARY KEY(id));
CREATE NODE TABLE IF NOT EXISTS Source(id STRING, url STRING, seen_at TIMESTAMP, PRIMARY KEY(id));
CREATE NODE TABLE IF NOT EXISTS Task(
  id STRING, title STRING, owner STRING, due DATE,   // rule 6: every task has an owner and a date
  state STRING,                 // open | done | dropped
  created_by STRING, created_at TIMESTAMP, closed_at TIMESTAMP, note STRING,
  PRIMARY KEY(id));
CREATE NODE TABLE IF NOT EXISTS Connection(
  id STRING, service STRING, may_do STRING, used_by STRING,
  secret_name STRING,           // the NAME of the secret, never its value
  cost_model STRING, monthly_cap_usd DOUBLE,
  expires DATE, revoke_how STRING, last_used DATE, status STRING,   // green | amber | red | revoked
  updated_at TIMESTAMP,
  PRIMARY KEY(id));
CREATE REL TABLE IF NOT EXISTS SUPERSEDES(FROM Fact TO Fact, reason STRING, at TIMESTAMP);
CREATE REL TABLE IF NOT EXISTS FROM_SOURCE(FROM Fact TO Source);

// ============================================================
// 01_constraints_indexes.cypher
// Run this FIRST in Neo4j Browser before loading any data.
// Creates uniqueness constraints and full-text indexes.
// ============================================================

// --- Constraints (also create implicit indexes) ---

CREATE CONSTRAINT paper_id_unique IF NOT EXISTS
  FOR (p:Paper) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT author_id_unique IF NOT EXISTS
  FOR (a:Author) REQUIRE a.id IS UNIQUE;

CREATE CONSTRAINT category_id_unique IF NOT EXISTS
  FOR (c:Category) REQUIRE c.class_id IS UNIQUE;

// --- Additional indexes for faster queries ---

CREATE INDEX paper_title IF NOT EXISTS
  FOR (p:Paper) ON (p.title);

// Verify
SHOW CONSTRAINTS;
SHOW INDEXES;

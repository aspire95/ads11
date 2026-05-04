// ============================================================
// 03_load_papers.cypher
// Loads Paper nodes and Author nodes, then connects them.
// Also links each Paper to its Category.
// adapted for custom dataset: papers.csv, authors.csv, wrote.csv, belongs_to.csv
// ============================================================

// ── Step 1: Create Paper nodes ────────────────────────────────
:auto LOAD CSV WITH HEADERS FROM 'file:///papers.csv' AS row
CALL {
  WITH row
  MERGE (p:Paper {id: row.paper_id})
  SET p.title = row.title
} IN TRANSACTIONS OF 500 ROWS;

// ── Step 2: Create Author nodes ───────────────────────────────
:auto LOAD CSV WITH HEADERS FROM 'file:///authors.csv' AS row
CALL {
  WITH row
  MERGE (a:Author {id: row.author_id})
  SET a.name = row.name
} IN TRANSACTIONS OF 500 ROWS;

// ── Step 3: Link Authors and Papers ───────────────────────────
:auto LOAD CSV WITH HEADERS FROM 'file:///wrote.csv' AS row
CALL {
  WITH row
  MATCH (p:Paper {id: row.paper_id})
  MATCH (a:Author {id: row.author_id})
  MERGE (p)-[:AUTHORED_BY]->(a)
} IN TRANSACTIONS OF 500 ROWS;

// ── Step 4: Link Papers to Categories ─────────────────────────
:auto LOAD CSV WITH HEADERS FROM 'file:///belongs_to.csv' AS row
CALL {
  WITH row
  MATCH (p:Paper   {id: row.paper_id})
  MATCH (c:Category{class_id: row.class_id})
  MERGE (p)-[:HAS_CATEGORY]->(c)
} IN TRANSACTIONS OF 500 ROWS;

// ── Verification ──────────────────────────────────────────────
MATCH (p:Paper) RETURN count(p) AS total_papers;
MATCH (a:Author) RETURN count(a) AS total_authors;
MATCH (p:Paper)-[:AUTHORED_BY]->(a:Author) RETURN count(*) AS authored_by_count;
MATCH (p:Paper)-[:HAS_CATEGORY]->(c:Category) RETURN count(*) AS categorized_papers;

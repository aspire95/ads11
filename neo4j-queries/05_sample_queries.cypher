// ============================================================
// 05_sample_queries.cypher
// Pre-built query examples demonstrating the 3 assignment tasks
// ============================================================

// ────────────────────────────────────────────────────────────
// QUERY TYPE A: Direct citation check
// Does paper A cite paper B directly?
// Replace <PAPER_A_ID> and <PAPER_B_ID> with actual IDs
// ────────────────────────────────────────────────────────────
MATCH (a:Paper {id: '1106406'})-[:CITES]->(b:Paper {id: '1107512'})
RETURN
  a.id AS paper_A,
  b.id AS paper_B,
  'Direct citation found' AS result;

// ── Query A2: Transitive citation path (up to 5 hops) ────────
MATCH path = (a:Paper {id: '1106406'})-[:CITES*1..5]->(b:Paper {id: '1107512'})
RETURN
  a.id                   AS paper_A,
  b.id                   AS paper_B,
  length(path)           AS citation_depth,
  [n IN nodes(path) | n.id] AS citation_chain
ORDER BY citation_depth
LIMIT 5;

// ────────────────────────────────────────────────────────────
// QUERY TYPE B: Full classification path of a paper
// ────────────────────────────────────────────────────────────
MATCH (p:Paper {id: '1106406'})
MATCH path = (p)-[:HAS_CATEGORY]->(c:Category)-[:SUBCATEGORY_OF*0..]->(root:Category)
WHERE NOT (root)-[:SUBCATEGORY_OF]->()
WITH p, [node IN nodes(path) | node.name] AS hierarchy
RETURN
  p.id                                 AS paper_id,
  p.subject                            AS leaf_category,
  reduce(s = '', n IN reverse(tail(hierarchy)) | s + n + ' / ')
    + head(hierarchy)                  AS full_classification_path;

// ────────────────────────────────────────────────────────────
// QUERY TYPE C-1: Top 10 most cited papers
// ────────────────────────────────────────────────────────────
MATCH (cited:Paper)<-[:CITES]-(citing:Paper)
RETURN
  cited.id      AS paper_id,
  cited.subject AS category,
  count(citing) AS citation_count
ORDER BY citation_count DESC
LIMIT 10;

// ────────────────────────────────────────────────────────────
// QUERY TYPE C-2: All papers in a given category
// ────────────────────────────────────────────────────────────
MATCH (p:Paper)-[:HAS_CATEGORY]->(c:Category {name: 'Neural_Networks'})
RETURN p.id AS paper_id, p.subject AS category
LIMIT 20;

// ────────────────────────────────────────────────────────────
// QUERY TYPE C-3: Category statistics
// ────────────────────────────────────────────────────────────
MATCH (p:Paper)-[:HAS_CATEGORY]->(c:Category)
RETURN c.name AS category, count(p) AS paper_count
ORDER BY paper_count DESC;

// ────────────────────────────────────────────────────────────
// QUERY TYPE C-4: Papers that cite each other (mutual citations)
// ────────────────────────────────────────────────────────────
MATCH (a:Paper)-[:CITES]->(b:Paper)-[:CITES]->(a)
RETURN a.id AS paper_A, b.id AS paper_B
LIMIT 10;

// ────────────────────────────────────────────────────────────
// QUERY TYPE C-5: All papers by an author
// ────────────────────────────────────────────────────────────
MATCH (p:Paper)-[:AUTHORED_BY]->(a:Author {name: 'Author_1106406'})
RETURN p.id AS paper_id, p.subject AS category;

// ────────────────────────────────────────────────────────────
// QUERY TYPE C-6: Papers with most outgoing citations
// ────────────────────────────────────────────────────────────
MATCH (p:Paper)-[:CITES]->(other:Paper)
RETURN p.id AS paper_id, count(other) AS outgoing_citations
ORDER BY outgoing_citations DESC
LIMIT 10;

// ────────────────────────────────────────────────────────────
// QUERY TYPE C-7: Shortest citation path between two papers
// ────────────────────────────────────────────────────────────
MATCH (a:Paper {id: '1106406'}), (b:Paper {id: '1107512'})
MATCH path = shortestPath((a)-[:CITES*]->(b))
RETURN
  length(path)                          AS hops,
  [n IN nodes(path) | n.id]            AS path_ids;

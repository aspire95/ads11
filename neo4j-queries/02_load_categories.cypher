// ============================================================
// 02_load_categories.cypher
// Loads the flat classification data from classifications.csv
// ============================================================

// Place classifications.csv in Neo4j's import/ folder first.

// Step 1: Create all Category nodes
LOAD CSV WITH HEADERS FROM 'file:///classifications.csv' AS row
MERGE (c:Category {class_id: row.class_id})
SET c.name = row.name;

// Verify
MATCH (c:Category) RETURN c.class_id, c.name ORDER BY c.name;

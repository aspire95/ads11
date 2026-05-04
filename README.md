# Assignment 11: Neo4j Research Papers Graph Database

> **Course:** Advanced Data Structures Lab (ADS)
> **Dataset:** Cora Citation Network
> **Stack:** Neo4j (Graph DB) · Angular 19 (Frontend) · Python 3 (Data Processing)

---

## 📌 Project Overview

This project models a **research paper citation network** using **Neo4j**, a graph database. The Cora dataset — a collection of scientific papers and their citation relationships — is used to demonstrate:

- **Graph data modeling** with nodes (`Paper`, `Author`, `Category`) and relationships (`AUTHORED_BY`, `HAS_CATEGORY`, `CITES`)
- **Bulk CSV loading** using Cypher's `LOAD CSV` command
- **Advanced graph queries** — citation path traversal, category classification, statistics
- **Angular 19 frontend** that connects to Neo4j directly via its HTTP API to run and display queries interactively

### 📁 Project Structure

```
Assignment11/
├── data/                        # Cora dataset files & Python conversion scripts
│   ├── convert_to_csv.py        # Converts raw Cora files → CSV for Neo4j
│   ├── fix_csv.py               # Cleans/fixes CSV encoding issues
│   ├── papers.csv               # Generated: Paper nodes
│   ├── authors.csv              # Generated: Author nodes
│   ├── categories.csv           # Generated: Category nodes
│   ├── classifications.csv      # Generated: Paper-Category mappings
│   ├── cites.csv                # Generated: Citation relationships
│   ├── wrote.csv                # Generated: Author-Paper relationships
│   └── belongs_to.csv           # Generated: Paper-Category relationships
│
├── neo4j-queries/               # All Cypher scripts (run in Neo4j Browser)
│   ├── 01_constraints_indexes.cypher
│   ├── 02_load_categories.cypher
│   ├── 03_load_papers.cypher
│   ├── 04_load_citations.cypher
│   └── 05_sample_queries.cypher
│
└── frontend/                    # Angular 19 web app
    └── src/app/                 # Components & Neo4j service
```

> **Note:** The `abc/` folder is a duplicate backup of `frontend/` and can be ignored.

---

## ✅ Prerequisites

Install the following before starting:

| Tool | Version | Download |
|------|---------|----------|
| **Neo4j Desktop** | Latest | https://neo4j.com/download/ |
| **Node.js** | 18+ (LTS recommended) | https://nodejs.org/ |
| **npm** | Comes with Node.js | — |
| **Python** | 3.x | https://www.python.org/ |
| **Angular CLI** | 19.x | `npm install -g @angular/cli` |

---

## 🚀 How to Run the Project (Step-by-Step)

### Step 1 — Configure Neo4j

1. Open **Neo4j Desktop** and create a new local database (DBMS).
2. Set a password (default used in this project: `password`).
3. Click **Settings** → add/uncomment these lines to allow HTTP access from Angular:
   ```properties
   dbms.connector.http.enabled=true
   dbms.connector.http.listen_address=localhost:7474
   dbms.connector.bolt.enabled=true
   ```
4. Start the database and open **Neo4j Browser** (`http://localhost:7474`).

---

### Step 2 — Generate CSV Files from the Cora Dataset

1. Open a terminal in the `data/` folder:
   ```bash
   cd data
   ```
2. Run the conversion script:
   ```bash
   python convert_to_csv.py
   ```
3. This produces the following CSV files in `data/`:
   - `papers.csv`, `authors.csv`, `categories.csv`
   - `classifications.csv`, `cites.csv`, `wrote.csv`, `belongs_to.csv`

4. If you encounter encoding issues with any CSV file, run:
   ```bash
   python fix_csv.py
   ```

---

### Step 3 — Load Data into Neo4j

1. In **Neo4j Desktop**, right-click your database → **Open Folder** → **Import**.
2. **Copy all generated `.csv` files** from `data/` into that `import/` folder.
3. Open **Neo4j Browser** and run the Cypher scripts **in this exact order**:

   | Order | File | Purpose |
   |-------|------|---------|
   | 1 | `01_constraints_indexes.cypher` | Create uniqueness constraints & indexes |
   | 2 | `02_load_categories.cypher` | Load Category nodes |
   | 3 | `03_load_papers.cypher` | Load Paper/Author nodes & relationships |
   | 4 | `04_load_citations.cypher` | Load citation relationships (optional) |

4. Paste the content of each file into the Neo4j Browser query box and click **Run (▶)**.

---

### Step 4 — Run the Angular Frontend

1. Open a terminal in the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open your browser at **http://localhost:4200**

> **⚠️ Important:** The app connects to Neo4j using credentials `neo4j / password`.  
> If your password is different, edit `frontend/src/app/services/neo4j.service.ts`:
> ```typescript
> private username = 'neo4j';
> private password = 'password'; // ← change this to your Neo4j password
> ```

---

## 🗃️ All Cypher Queries (Schema & Data)

### `01_constraints_indexes.cypher` — Constraints & Indexes

```cypher
-- Uniqueness constraint: Paper node
CREATE CONSTRAINT paper_id_unique IF NOT EXISTS
  FOR (p:Paper) REQUIRE p.id IS UNIQUE;

-- Uniqueness constraint: Author node
CREATE CONSTRAINT author_id_unique IF NOT EXISTS
  FOR (a:Author) REQUIRE a.id IS UNIQUE;

-- Uniqueness constraint: Category node
CREATE CONSTRAINT category_id_unique IF NOT EXISTS
  FOR (c:Category) REQUIRE c.class_id IS UNIQUE;

-- Index on paper title for fast text lookups
CREATE INDEX paper_title IF NOT EXISTS
  FOR (p:Paper) ON (p.title);

-- Verify
SHOW CONSTRAINTS;
SHOW INDEXES;
```

---

### `02_load_categories.cypher` — Load Category Nodes

```cypher
-- Load Category nodes from CSV
LOAD CSV WITH HEADERS FROM 'file:///classifications.csv' AS row
MERGE (c:Category {class_id: row.class_id})
SET c.name = row.name;

-- Verify
MATCH (c:Category) RETURN c.class_id, c.name ORDER BY c.name;
```

---

### `03_load_papers.cypher` — Load Papers, Authors & Relationships

```cypher
-- Step 1: Create Paper nodes
:auto LOAD CSV WITH HEADERS FROM 'file:///papers.csv' AS row
CALL {
  WITH row
  MERGE (p:Paper {id: row.paper_id})
  SET p.title = row.title
} IN TRANSACTIONS OF 500 ROWS;

-- Step 2: Create Author nodes
:auto LOAD CSV WITH HEADERS FROM 'file:///authors.csv' AS row
CALL {
  WITH row
  MERGE (a:Author {id: row.author_id})
  SET a.name = row.name
} IN TRANSACTIONS OF 500 ROWS;

-- Step 3: Link Authors to Papers (AUTHORED_BY relationship)
:auto LOAD CSV WITH HEADERS FROM 'file:///wrote.csv' AS row
CALL {
  WITH row
  MATCH (p:Paper {id: row.paper_id})
  MATCH (a:Author {id: row.author_id})
  MERGE (p)-[:AUTHORED_BY]->(a)
} IN TRANSACTIONS OF 500 ROWS;

-- Step 4: Link Papers to Categories (HAS_CATEGORY relationship)
:auto LOAD CSV WITH HEADERS FROM 'file:///belongs_to.csv' AS row
CALL {
  WITH row
  MATCH (p:Paper   {id: row.paper_id})
  MATCH (c:Category{class_id: row.class_id})
  MERGE (p)-[:HAS_CATEGORY]->(c)
} IN TRANSACTIONS OF 500 ROWS;

-- Verification counts
MATCH (p:Paper) RETURN count(p) AS total_papers;
MATCH (a:Author) RETURN count(a) AS total_authors;
MATCH (p:Paper)-[:AUTHORED_BY]->(a:Author) RETURN count(*) AS authored_by_count;
MATCH (p:Paper)-[:HAS_CATEGORY]->(c:Category) RETURN count(*) AS categorized_papers;
```

---

### `04_load_citations.cypher` — Load Citation Relationships (Optional)

```cypher
-- Uncomment when cites.csv is available (columns: citing_id, cited_id)
-- :auto LOAD CSV WITH HEADERS FROM 'file:///cites.csv' AS row
-- CALL {
--   WITH row
--   MATCH (citing:Paper {id: row.citing_id})
--   MATCH (cited:Paper  {id: row.cited_id})
--   MERGE (citing)-[:CITES]->(cited)
-- } IN TRANSACTIONS OF 500 ROWS;

-- Verification
-- MATCH ()-[r:CITES]->() RETURN count(r) AS total_citations;
```

---

### `05_sample_queries.cypher` — Sample Analysis Queries

```cypher
-- A1: Direct citation check between two papers
MATCH (a:Paper {id: '1106406'})-[:CITES]->(b:Paper {id: '1107512'})
RETURN a.id AS paper_A, b.id AS paper_B, 'Direct citation found' AS result;

-- A2: Transitive citation path (up to 5 hops)
MATCH path = (a:Paper {id: '1106406'})-[:CITES*1..5]->(b:Paper {id: '1107512'})
RETURN
  a.id AS paper_A, b.id AS paper_B,
  length(path) AS citation_depth,
  [n IN nodes(path) | n.id] AS citation_chain
ORDER BY citation_depth LIMIT 5;

-- B: Full classification path of a paper
MATCH (p:Paper {id: '1106406'})
MATCH path = (p)-[:HAS_CATEGORY]->(c:Category)-[:SUBCATEGORY_OF*0..]->(root:Category)
WHERE NOT (root)-[:SUBCATEGORY_OF]->()
WITH p, [node IN nodes(path) | node.name] AS hierarchy
RETURN
  p.id AS paper_id, p.subject AS leaf_category,
  reduce(s = '', n IN reverse(tail(hierarchy)) | s + n + ' / ')
    + head(hierarchy) AS full_classification_path;

-- C1: Top 10 most cited papers
MATCH (cited:Paper)<-[:CITES]-(citing:Paper)
RETURN cited.id AS paper_id, cited.subject AS category, count(citing) AS citation_count
ORDER BY citation_count DESC LIMIT 10;

-- C2: All papers in a specific category
MATCH (p:Paper)-[:HAS_CATEGORY]->(c:Category {name: 'Neural_Networks'})
RETURN p.id AS paper_id, p.subject AS category LIMIT 20;

-- C3: Category statistics (papers per category)
MATCH (p:Paper)-[:HAS_CATEGORY]->(c:Category)
RETURN c.name AS category, count(p) AS paper_count
ORDER BY paper_count DESC;

-- C4: Papers that mutually cite each other
MATCH (a:Paper)-[:CITES]->(b:Paper)-[:CITES]->(a)
RETURN a.id AS paper_A, b.id AS paper_B LIMIT 10;

-- C5: All papers written by a specific author
MATCH (p:Paper)-[:AUTHORED_BY]->(a:Author {name: 'Author_1106406'})
RETURN p.id AS paper_id, p.subject AS category;

-- C6: Papers with the most outgoing citations
MATCH (p:Paper)-[:CITES]->(other:Paper)
RETURN p.id AS paper_id, count(other) AS outgoing_citations
ORDER BY outgoing_citations DESC LIMIT 10;

-- C7: Shortest citation path between two papers
MATCH (a:Paper {id: '1106406'}), (b:Paper {id: '1107512'})
MATCH path = shortestPath((a)-[:CITES*]->(b))
RETURN length(path) AS hops, [n IN nodes(path) | n.id] AS path_ids;
```

---

## 🔗 Graph Schema

```
(Author) <-[:AUTHORED_BY]- (Paper) -[:HAS_CATEGORY]-> (Category)
                              |
                         [:CITES]
                              |
                           (Paper)
```

| Node | Properties |
|------|-----------|
| `Paper` | `id`, `title`, `subject` |
| `Author` | `id`, `name` |
| `Category` | `class_id`, `name` |

| Relationship | From → To | Meaning |
|-------------|-----------|---------|
| `AUTHORED_BY` | Paper → Author | Paper was written by Author |
| `HAS_CATEGORY` | Paper → Category | Paper belongs to Category |
| `CITES` | Paper → Paper | Paper cites another Paper |

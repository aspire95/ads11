import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CypherResult {
  columns: string[];
  rows: any[][];
}

@Injectable({ providedIn: 'root' })
export class Neo4jService {

 
  private neo4jUrl = 'http://localhost:7474/db/neo4j/tx/commit';
  private username = 'neo4j';
  private password = 'mayur2005';   

  constructor(private http: HttpClient) { }

 
  query(cypher: string, params: Record<string, any> = {}): Observable<CypherResult> {
    const token = btoa(`${this.username}:${this.password}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Basic ${token}`,
      'Accept': 'application/json'
    });
    const body = { statements: [{ statement: cypher, parameters: params }] };

    return this.http.post<any>(this.neo4jUrl, body, { headers }).pipe(
      map(response => {
        if (response.errors && response.errors.length > 0) {
          throw new Error(response.errors[0].message);
        }
        const result = response.results[0];
        if (!result) return { columns: [], rows: [] };
        const columns = result.columns as string[];
        const rows = result.data.map((d: any) => d.row) as any[][];
        return { columns, rows };
      }),
      catchError(err => {
        const msg = err?.error?.errors?.[0]?.message || err?.message || 'Unknown error';
        return throwError(() => new Error(msg));
      })
    );
  }

  checkCitation(paperA: string, paperB: string, maxDepth: number = 5): Observable<CypherResult> {
    const cypher = `
      MATCH (a:Paper {id: $paperA}), (b:Paper {id: $paperB})
      MATCH path = shortestPath((a)-[:CITES*1..${maxDepth}]->(b))
      RETURN
        a.id AS paper_A,
        b.id AS paper_B,
        length(path) AS depth,
        [n IN nodes(path) | n.id] AS chain
    `;
    return this.query(cypher, { paperA, paperB });
  }

  getClassification(paperId: string): Observable<CypherResult> {
    const cypher = `
      MATCH (p:Paper {id: $paperId})-[:HAS_CATEGORY]->(c:Category)
      RETURN
        p.id                                       AS paper_id,
        p.title                                    AS leaf_category,
        c.name                                     AS classification_path
    `;
    return this.query(cypher, { paperId });
  }

 
  getTopCited(category: string = '', limit: number = 10): Observable<CypherResult> {
    const catFilter = category ? 'WHERE c.name = $category' : '';
    const cypher = `
      MATCH (cited:Paper)-[:HAS_CATEGORY]->(c:Category)
      ${catFilter}
      RETURN
        cited.id      AS paper_id,
        c.name        AS category,
        0             AS citation_count
      ORDER BY paper_id DESC
      LIMIT ${limit}
    `;
    return this.query(cypher, category ? { category } : {});
  }

 
  getPapersByAuthor(authorName: string): Observable<CypherResult> {
    const cypher = `
      MATCH (p:Paper)-[:AUTHORED_BY]->(a:Author)
      WHERE toLower(a.name) CONTAINS toLower($authorName)
      MATCH (p)-[:HAS_CATEGORY]->(c:Category)
      RETURN p.id AS paper_id, a.name AS author, c.name AS category
      ORDER BY category
    `;
    return this.query(cypher, { authorName });
  }

  getCategoryStats(): Observable<CypherResult> {
    const cypher = `
      MATCH (p:Paper)-[:HAS_CATEGORY]->(c:Category)
      RETURN c.name AS category, count(p) AS paper_count
      ORDER BY paper_count DESC
    `;
    return this.query(cypher);
  }

 
  runCustom(cypher: string): Observable<CypherResult> {
    return this.query(cypher);
  }
}

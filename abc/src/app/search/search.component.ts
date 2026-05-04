import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Neo4jService, CypherResult } from '../services/neo4j.service';

type QueryType = 'citation' | 'classification' | 'top-cited' | 'author' | 'custom';

interface SearchHistory {
  type: string;
  label: string;
  time: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  // ── Query type ────────────────────────────────────────────────────────────
  activeQuery: QueryType = 'citation';

  // ── Citation fields ───────────────────────────────────────────────────────
  paperA    = '';
  paperB    = '';
  maxDepth  = 5;

  // ── Classification fields ─────────────────────────────────────────────────
  classifyPaperId = '';

  // ── Top-cited fields ──────────────────────────────────────────────────────
  filterCategory = '';
  topLimit       = 10;
  categories     = [
    '', 'Case_Based', 'Genetic_Algorithms', 'Neural_Networks',
    'Probabilistic_Methods', 'Reinforcement_Learning', 'Rule_Learning', 'Theory'
  ];

  // ── Author fields ─────────────────────────────────────────────────────────
  authorName = '';

  // ── Custom Cypher ─────────────────────────────────────────────────────────
  customCypher = `MATCH (p:Paper)-[:HAS_CATEGORY]->(c:Category)
RETURN c.name AS category, count(p) AS paper_count
ORDER BY paper_count DESC`;

  // ── State ─────────────────────────────────────────────────────────────────
  result  : CypherResult | null = null;
  loading  = false;
  errorMsg = '';
  history : SearchHistory[] = [];

  // ── Quick examples ────────────────────────────────────────────────────────
  examples = [
    { label: 'Check if 1033 → 35', type: 'citation' as QueryType,
      setup: () => { this.paperA = '1033'; this.paperB = '35'; this.maxDepth = 5; } },
    { label: 'Classify paper 1106406',     type: 'classification' as QueryType,
      setup: () => { this.classifyPaperId = '1106406'; } },
    { label: 'Top cited Neural_Networks',  type: 'top-cited' as QueryType,
      setup: () => { this.filterCategory = 'Neural_Networks'; this.topLimit = 10; } },
  ];

  constructor(private neo4j: Neo4jService) {}

  ngOnInit(): void {}

  // ── Switch query tab ──────────────────────────────────────────────────────
  setQuery(type: QueryType): void {
    this.activeQuery = type;
    this.result  = null;
    this.errorMsg = '';
  }

  // ── Run selected query ────────────────────────────────────────────────────
  runQuery(): void {
    this.loading  = true;
    this.errorMsg = '';
    this.result   = null;

    let obs$;
    let label = '';

    switch (this.activeQuery) {
      case 'citation':
        obs$  = this.neo4j.checkCitation(this.paperA.trim(), this.paperB.trim(), this.maxDepth);
        label = `Citation: ${this.paperA} → ${this.paperB}`;
        break;
      case 'classification':
        obs$  = this.neo4j.getClassification(this.classifyPaperId.trim());
        label = `Classify: ${this.classifyPaperId}`;
        break;
      case 'top-cited':
        obs$  = this.neo4j.getTopCited(this.filterCategory, this.topLimit);
        label = `Top ${this.topLimit} cited${this.filterCategory ? ' (' + this.filterCategory + ')' : ''}`;
        break;
      case 'author':
        obs$  = this.neo4j.getPapersByAuthor(this.authorName.trim());
        label = `Author: ${this.authorName}`;
        break;
      case 'custom':
      default:
        obs$  = this.neo4j.runCustom(this.customCypher);
        label = 'Custom Cypher';
        break;
    }

    obs$.subscribe({
      next: (res) => {
        this.result  = res;
        this.loading  = false;
        this.addHistory(label);
      },
      error: (err: Error) => {
        this.errorMsg = err.message;
        this.loading  = false;
      }
    });
  }

  // ── Apply quick example ───────────────────────────────────────────────────
  applyExample(ex: typeof this.examples[0]): void {
    this.setQuery(ex.type);
    ex.setup();
    this.runQuery();
  }

  // ── History ───────────────────────────────────────────────────────────────
  addHistory(label: string): void {
    const now = new Date().toLocaleTimeString();
    this.history.unshift({ type: this.activeQuery, label, time: now });
    if (this.history.length > 8) this.history.pop();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  get hasResults(): boolean {
    return !!(this.result && this.result.rows.length > 0);
  }

  isCitationFound(): boolean {
    return this.activeQuery === 'citation' && this.hasResults;
  }

  isCitationNotFound(): boolean {
    return this.activeQuery === 'citation' && !!this.result && this.result.rows.length === 0;
  }

  getDepthBadge(row: any[]): string {
    const depth = Number(row[2]);
    if (depth === 1) return 'Direct';
    return `${depth} hops`;
  }

  chainToString(row: any[]): string {
    const chain = row[3];
    if (!Array.isArray(chain)) return String(chain);
    return chain.join(' → ');
  }

  getCategoryStats(): void {
    this.activeQuery = 'top-cited';
    this.filterCategory = '';
    this.topLimit = 20;
    this.runQuery();
  }

  isArray(val: any): boolean {
    return Array.isArray(val);
  }
}

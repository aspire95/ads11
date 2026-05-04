"""
Cora Dataset Converter
======================
Downloads the Cora dataset and converts it to CSV files 
suitable for loading into Neo4j.

Files produced:
  - papers.csv        → paper_id, subject
  - cites.csv         → citing_id, cited_id
  - categories.csv    → name, parent
  - authors.csv       → paper_id, author_name  (synthetic from ID)

Usage:
  python convert_to_csv.py

The script will attempt to download cora.tgz from a mirror.
If that fails, place cora.content and cora.cites manually in this folder.
"""

import csv
import os
import urllib.request
import tarfile
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Cora class labels ──────────────────────────────────────────────────────────
# The standard 7-class Cora benchmark
CORA_CLASSES = [
    "Case_Based",
    "Genetic_Algorithms",
    "Neural_Networks",
    "Probabilistic_Methods",
    "Reinforcement_Learning",
    "Rule_Learning",
    "Theory",
]

# Category hierarchy  (child → parent)
# Top-level parent = "Computer_Science"
CATEGORY_HIERARCHY = {
    "Case_Based":              "Machine_Learning",
    "Genetic_Algorithms":      "Machine_Learning",
    "Neural_Networks":         "Machine_Learning",
    "Probabilistic_Methods":   "Machine_Learning",
    "Reinforcement_Learning":  "Machine_Learning",
    "Rule_Learning":           "Machine_Learning",
    "Theory":                  "Machine_Learning",
    "Machine_Learning":        "Computer_Science",
    "Computer_Science":        None,              # root
}

DOWNLOAD_URLS = [
    "https://linqs-data.soe.ucsc.edu/public/lbc/cora.tgz",
    "https://github.com/kimiyoung/planetoid/raw/master/data/ind.cora.graph",  # fallback
]

# ── helpers ────────────────────────────────────────────────────────────────────

def find_or_download_cora():
    """Return paths to cora.content and cora.cites."""
    content_path = os.path.join(SCRIPT_DIR, "cora.content")
    cites_path   = os.path.join(SCRIPT_DIR, "cora.cites")

    if os.path.exists(content_path) and os.path.exists(cites_path):
        print("[INFO] Found cora.content and cora.cites locally.")
        return content_path, cites_path

    # Try downloading
    tgz_path = os.path.join(SCRIPT_DIR, "cora.tgz")
    print("[INFO] Downloading Cora dataset from LINQS mirror …")
    try:
        urllib.request.urlretrieve(DOWNLOAD_URLS[0], tgz_path)
        print("[INFO] Download complete. Extracting …")
        with tarfile.open(tgz_path, "r:gz") as tar:
            tar.extractall(SCRIPT_DIR)
        # files land in cora/ subfolder
        sub_content = os.path.join(SCRIPT_DIR, "cora", "cora.content")
        sub_cites   = os.path.join(SCRIPT_DIR, "cora", "cora.cites")
        if os.path.exists(sub_content):
            import shutil
            shutil.move(sub_content, content_path)
            shutil.move(sub_cites,   cites_path)
        return content_path, cites_path
    except Exception as e:
        print(f"[ERROR] Download failed: {e}")
        print("[HINT] Manually place cora.content and cora.cites in the data/ folder.")
        sys.exit(1)


def parse_content(content_path):
    """
    Returns list of dicts: {paper_id, subject}
    cora.content format: <paper_id> <f1> <f2> … <fN> <class_label>
    """
    papers = []
    with open(content_path, "r") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 3:
                continue
            paper_id = parts[0]
            subject  = parts[-1]          # last token = class label
            papers.append({"paper_id": paper_id, "subject": subject})
    return papers


def parse_cites(cites_path):
    """
    Returns list of dicts: {cited_id, citing_id}
    cora.cites format: <cited_paper_id> <citing_paper_id>
    """
    edges = []
    with open(cites_path, "r") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) != 2:
                continue
            cited_id  = parts[0]
            citing_id = parts[1]
            edges.append({"citing_id": citing_id, "cited_id": cited_id})
    return edges


def write_csv(filename, rows, fieldnames):
    path = os.path.join(SCRIPT_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"[OK] Written {len(rows):,} rows → {filename}")


# ── main ───────────────────────────────────────────────────────────────────────

def main():
    content_path, cites_path = find_or_download_cora()

    # 1. Papers
    papers = parse_content(content_path)
    write_csv("papers.csv", papers, ["paper_id", "subject"])

    # 2. Citations
    edges = parse_cites(cites_path)
    write_csv("cites.csv", edges, ["citing_id", "cited_id"])

    # 3. Categories hierarchy
    cat_rows = []
    for name, parent in CATEGORY_HIERARCHY.items():
        cat_rows.append({"name": name, "parent": parent if parent else ""})
    write_csv("categories.csv", cat_rows, ["name", "parent"])

    # 4. Synthetic authors  (paper_id → "Author_<paper_id>")
    #    Real Cora does NOT include author names; we generate placeholders.
    #    In a real scenario you would join with the DBLP or Semantic Scholar data.
    author_rows = []
    for p in papers:
        pid = p["paper_id"]
        author_rows.append({"paper_id": pid, "author_name": f"Author_{pid}"})
    write_csv("authors.csv", author_rows, ["paper_id", "author_name"])

    print("\n[DONE] All CSV files generated successfully.")
    print("       Copy papers.csv, cites.csv, categories.csv, authors.csv")
    print("       into Neo4j's import/ folder before running Cypher scripts.")


if __name__ == "__main__":
    main()

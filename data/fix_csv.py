import csv
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. Fix authors.csv (Needs author_id, name)
wrote_path = os.path.join(SCRIPT_DIR, "wrote.csv")
author_ids = set()
with open(wrote_path, "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        author_ids.add(row["author_id"])

authors_path = os.path.join(SCRIPT_DIR, "authors.csv")
with open(authors_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["author_id", "name"])
    writer.writeheader()
    for aid in sorted(list(author_ids)):
        writer.writerow({"author_id": aid, "name": f"Author_{aid}"})

# 2. Fix papers.csv (Needs paper_id, title)
# We can just read the current papers.csv which has paper_id and subject
papers_old = os.path.join(SCRIPT_DIR, "papers.csv")
papers_new = os.path.join(SCRIPT_DIR, "papers.csv")
papers_data = []

with open(papers_old, "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        papers_data.append(row["paper_id"])

with open(papers_new, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["paper_id", "title"])
    writer.writeheader()
    for pid in papers_data:
        writer.writerow({"paper_id": pid, "title": f"{pid}"})

print("Fixed authors.csv and papers.csv for Cypher compatibility!")

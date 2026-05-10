import psycopg2, openpyxl

BN_DIGITS = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'}
def norm(s):
    return ''.join(BN_DIGITS.get(c,c) for c in str(s).strip())

# Read Bangla Excel for uid -> party_bn mapping
wb_bn = openpyxl.load_workbook('/data/samples/mp_sample_bangla.xlsx')
ws_bn = wb_bn.active
uid_to_party_bn = {}
for row in ws_bn.iter_rows(min_row=2, values_only=True):
    uid = norm(str(row[4] or ''))
    party = str(row[2] or '').strip()
    if uid and party:
        uid_to_party_bn[uid] = party

# Read English Excel for party_bn -> party_en mapping (via uid)
wb_en = openpyxl.load_workbook('/data/samples/mp_sample_english.xlsx')
ws_en = wb_en.active
uid_to_party_en = {}
for row in ws_en.iter_rows(min_row=2, values_only=True):
    uid = norm(str(row[4] or ''))
    party = str(row[2] or '').strip()
    if uid and party:
        uid_to_party_en[uid] = party

conn = psycopg2.connect(host='postgres', port=5432, dbname='parliament_alloc', user='parliament', password='parliament_pass')
cur = conn.cursor()

# Get all existing parties
cur.execute("SELECT id, name_en, name_bn FROM political_parties")
existing_parties = {row[2]: row[0] for row in cur.fetchall()}  # name_bn -> id
existing_parties_en = {row[1]: row[0] for row in []}

cur.execute("SELECT id, name_en, name_bn FROM political_parties")
rows = cur.fetchall()
party_by_bn = {r[2]: r[0] for r in rows}
party_by_en = {r[1]: r[0] for r in rows}

# Process: ensure each unique party has a DB entry
party_cache = {}  # (bn, en) -> id

all_parties = {}
for uid, pbn in uid_to_party_bn.items():
    pen = uid_to_party_en.get(uid, '')
    if pbn not in all_parties:
        all_parties[pbn] = pen

print(f"Unique parties in Excel: {len(all_parties)}")
print("Ensuring all parties exist in DB...")

for pbn, pen in all_parties.items():
    party_id = party_by_bn.get(pbn) or party_by_en.get(pen)
    if party_id:
        # Update with English name if needed
        cur.execute("SELECT name_en FROM political_parties WHERE id = %s", (party_id,))
        row = cur.fetchone()
        if row and pen and row[0] != pen:
            cur.execute("UPDATE political_parties SET name_en = %s WHERE id = %s", (pen, party_id))
            print(f"  Updated party id={party_id}: name_en = {pen!r}")
        party_cache[(pbn, pen)] = party_id
    else:
        # Create new party
        cur.execute(
            "INSERT INTO political_parties (name_en, name_bn) VALUES (%s, %s) RETURNING id",
            (pen or pbn, pbn)
        )
        new_id = cur.fetchone()[0]
        party_cache[(pbn, pen)] = new_id
        party_by_bn[pbn] = new_id
        print(f"  Created party id={new_id}: {pbn!r} / {pen!r}")

conn.commit()

# Now update MPs with NULL party_id using Excel data
print("\nUpdating MPs with NULL party_id...")
fixed = 0
for uid, pbn in uid_to_party_bn.items():
    pen = uid_to_party_en.get(uid, '')
    party_id = party_cache.get((pbn, pen)) or party_by_bn.get(pbn)
    if party_id:
        cur.execute(
            "UPDATE mps SET party_id = %s WHERE internal_user_id = %s AND (party_id IS NULL)",
            (party_id, uid)
        )
        if cur.rowcount > 0:
            fixed += 1

conn.commit()
print(f"Fixed {fixed} MPs with NULL party_id")

# Final summary
cur.execute("SELECT party_id, COUNT(*) FROM mps GROUP BY party_id ORDER BY party_id NULLS FIRST")
print("\nMP party distribution:")
for row in cur.fetchall():
    pid = row[0]
    if pid:
        cur.execute("SELECT name_en FROM political_parties WHERE id = %s", (pid,))
        pname = cur.fetchone()
        print(f"  party_id={pid} ({pname[0] if pname else '?'}): {row[1]} MPs")
    else:
        print(f"  party_id=NULL: {row[1]} MPs")

conn.close()

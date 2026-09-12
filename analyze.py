import json
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from statistics import mean

# Load data
with open("data/listings.json") as f:
    listings = json.load(f)

with open("data/rentals.json") as f:
    rentals = json.load(f)

with open("data/projects.json") as f:
    projects = json.load(f)

print("\n================ BASIC COUNTS ================")
print("Listings actually fetched :", len(listings))
print("Rentals actually fetched  :", len(rentals))
print("Projects actually fetched :", len(projects))

# ------------------------------------------------
# Q1 / Q3
# ------------------------------------------------
print("\n================ Q1 / Q3 ================")

active = [x for x in listings if x.get("is_live") is True]

print("Q1 total_listing_records :", len(listings))
print("Q3 active_listings       :", len(active))
print("Inactive listings        :", len(listings) - len(active))

# ------------------------------------------------
# Q2 - duplicate / unique property investigation
# ------------------------------------------------
print("\n================ Q2 DUPLICATE INVESTIGATION ================")

# Exact-ish physical-property signature.
# Listing-specific fields are intentionally excluded.
def property_signature(x):
    return (
        x.get("apartment_name"),
        x.get("locality"),
        x.get("property_type"),
        x.get("bedroom"),
        x.get("bathroom"),
        x.get("balcony"),
        x.get("floor"),
        x.get("total_floors"),
        x.get("carpet_area"),
        x.get("super_built_up_area"),
        x.get("latitude"),
        x.get("longitude"),
    )

groups = defaultdict(list)

for x in listings:
    groups[property_signature(x)].append(x)

duplicate_groups = [g for g in groups.values() if len(g) > 1]

print("Total listing records :", len(listings))
print("Unique property signatures :", len(groups))
print("Duplicate groups :", len(duplicate_groups))
print("Records inside duplicate groups :",
      sum(len(g) for g in duplicate_groups))

print("\nTop duplicate groups:")
for g in sorted(duplicate_groups, key=len, reverse=True)[:15]:
    print("\nGROUP SIZE:", len(g))
    for x in g[:10]:
        print(
            x.get("listing_id"),
            "|", x.get("website"),
            "|", x.get("apartment_name"),
            "|", x.get("locality"),
            "| price", x.get("price")
        )

# ------------------------------------------------
# Q4 - obvious corrupt/impossible records
# ------------------------------------------------
print("\n================ Q4 CORRUPT INVESTIGATION ================")

corrupt = []

for x in listings:
    reasons = []

    floor = x.get("floor")
    total_floors = x.get("total_floors")
    price = x.get("price")
    carpet = x.get("carpet_area")
    super_area = x.get("super_built_up_area")
    bedroom = x.get("bedroom")
    bathroom = x.get("bathroom")
    balcony = x.get("balcony")

    if isinstance(floor, (int, float)) and isinstance(total_floors, (int, float)):
        if floor > total_floors:
            reasons.append("floor > total_floors")
        if floor < 0:
            reasons.append("negative floor")

    if isinstance(price, (int, float)) and price <= 0:
        reasons.append("non-positive price")

    if isinstance(carpet, (int, float)) and carpet <= 0:
        reasons.append("non-positive carpet_area")

    if isinstance(super_area, (int, float)) and super_area <= 0:
        reasons.append("non-positive super_built_up_area")

    if (
        isinstance(carpet, (int, float))
        and isinstance(super_area, (int, float))
        and carpet > super_area
    ):
        reasons.append("carpet_area > super_built_up_area")

    if isinstance(bedroom, (int, float)) and bedroom < 0:
        reasons.append("negative bedroom")

    if isinstance(bathroom, (int, float)) and bathroom < 0:
        reasons.append("negative bathroom")

    if isinstance(balcony, (int, float)) and balcony < 0:
        reasons.append("negative balcony")

    if reasons:
        corrupt.append((x, reasons))

print("Obvious corrupt candidates:", len(corrupt))

for x, reasons in corrupt[:100]:
    print(
        x.get("listing_id"),
        "|", reasons,
        "|", x.get("apartment_name"),
        "|", x.get("locality"),
        "| floor", x.get("floor"), "/", x.get("total_floors"),
        "| carpet", x.get("carpet_area"),
        "| super", x.get("super_built_up_area"),
        "| price", x.get("price")
    )

# ------------------------------------------------
# Q5
# ------------------------------------------------
print("\n================ Q5 HADAPSAR RENT ================")

hadapsar = [
    x for x in rentals
    if str(x.get("locality", "")).lower() == "hadapsar"
]

rent_sum = sum(x.get("price", 0) for x in hadapsar)

print("Hadapsar rental records :", len(hadapsar))
print("Total monthly rent      :", rent_sum)

# ------------------------------------------------
# Q6
# ------------------------------------------------
print("\n================ Q6 2BHK PRICE / SQFT ================")

# First remove corrupt candidates.
corrupt_ids = {x.get("listing_id") for x, _ in corrupt}

two_bhk = []

for x in listings:
    if (
        x.get("is_live") is True
        and x.get("bedroom") == 2
        and x.get("listing_id") not in corrupt_ids
        and x.get("carpet_area")
        and x.get("price") is not None
    ):
        two_bhk.append(x)

ratios = [
    x["price"] / x["carpet_area"]
    for x in two_bhk
    if x["carpet_area"] > 0
]

print("Eligible 2BHK records:", len(two_bhk))
print("Average price/sqft:", round(mean(ratios), 2) if ratios else None)

# ------------------------------------------------
# Q7
# ------------------------------------------------
print("\n================ Q7 COSTLIEST PROJECT ================")

costliest = max(projects, key=lambda x: x.get("price_max", 0))

print("Project ID :", costliest.get("project_id"))
print("Name       :", costliest.get("apartment_name"))
print("Price max  :", costliest.get("price_max"))

# ------------------------------------------------
# Q8
# ------------------------------------------------
print("\n================ Q8 LAST 7 DAYS ================")

reference = datetime.fromisoformat("2026-09-10T00:00:00+05:30")
start = reference - timedelta(days=7)

recent = []

for x in listings:
    raw = x.get("posted_at")
    if not raw:
        continue

    try:
        # API timestamps appear to have no timezone suffix.
        # Treat them as IST for this assignment's reference.
        dt = datetime.fromisoformat(raw)

        if start.replace(tzinfo=None) <= dt < reference.replace(tzinfo=None):
            recent.append(x)

    except Exception:
        pass

print("Window:", start, "to", reference)
print("Listings in window:", len(recent))

# ------------------------------------------------
# Q9 - fake investigation
# ------------------------------------------------
print("\n================ Q9 FAKE INVESTIGATION ================")

# Look for repeated seller contact numbers.
contacts = defaultdict(list)

for x in listings:
    contact = x.get("posted_by_contact")
    if contact:
        contacts[contact].append(x)

repeated_contacts = [
    (contact, records)
    for contact, records in contacts.items()
    if len(records) >= 3
]

print("Contacts appearing >=3 times:", len(repeated_contacts))

for contact, records in sorted(
    repeated_contacts,
    key=lambda z: len(z[1]),
    reverse=True
)[:30]:
    print("\nCONTACT:", contact, "COUNT:", len(records))
    for x in records[:10]:
        print(
            x.get("listing_id"),
            "|", x.get("apartment_name"),
            "|", x.get("locality"),
            "|", x.get("website"),
            "|", x.get("posted_by")
        )

# ------------------------------------------------
# Q10
# ------------------------------------------------
print("\n================ Q10 PROJECT COUNT MISMATCH ================")

actual_by_project = Counter(
    x.get("project_id")
    for x in listings
    if x.get("project_id") is not None
)

mismatches = []

for p in projects:
    pid = p.get("project_id")
    reported = p.get("total_listings")
    actual = actual_by_project.get(pid, 0)

    if reported != actual:
        mismatches.append((p, reported, actual))

print("Projects with wrong listing count:", len(mismatches))

for p, reported, actual in mismatches[:100]:
    print(
        p.get("project_id"),
        "|", p.get("apartment_name"),
        "| reported:", reported,
        "| actual:", actual
    )

# ------------------------------------------------
# Extra useful investigations
# ------------------------------------------------
print("\n================ EXTRA INVESTIGATION ================")

# Missing / weird fields
all_fields = Counter()

for x in listings:
    all_fields.update(x.keys())

print("\nListing fields:")
print(sorted(all_fields.keys()))

# Posted timestamp timezone formats
print("\nSample timestamp formats:")
for x in listings[:20]:
    print(x.get("posted_at"))

# Localities
print("\nTop localities:")
for locality, count in Counter(
    x.get("locality") for x in listings
).most_common(20):
    print(locality, count)

print("\n================ DONE ================")

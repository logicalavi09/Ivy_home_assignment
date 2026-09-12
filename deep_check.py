import json
from collections import Counter, defaultdict

with open("data/listings.json") as f:
    listings = json.load(f)

with open("data/rentals.json") as f:
    rentals = json.load(f)

with open("data/projects.json") as f:
    projects = json.load(f)

print("\n========== LISTING ID CHECK ==========")

ids = [x.get("listing_id") for x in listings]
id_counts = Counter(ids)

duplicates = [(k,v) for k,v in id_counts.items() if v > 1]

print("Total listing records:", len(listings))
print("Unique listing_ids:", len(id_counts))
print("Duplicate listing_ids:", len(duplicates))

for listing_id, count in duplicates[:50]:
    print(listing_id, "appears", count, "times")


print("\n========== PROJECT PRICE CHECK ==========")

prices = sorted(
    [(p.get("price_max"), p.get("project_id"), p.get("apartment_name"))
     for p in projects],
    reverse=True,
    key=lambda x: (x[0] if isinstance(x[0], (int,float)) else -1)
)

for price, pid, name in prices[:30]:
    print(pid, "|", name, "| price_max =", price)


print("\n========== PROJECT PRICE TYPES / EXTREMES ==========")

print("Minimum price_max:")
for price, pid, name in sorted(prices, key=lambda x: x[0] if isinstance(x[0],(int,float)) else 10**99)[:20]:
    print(pid, "|", name, "|", price)

print("\nMaximum price_max:")
for price, pid, name in prices[:20]:
    print(pid, "|", name, "|", price)


print("\n========== CORRUPT CANDIDATES DETAILED ==========")

for x in listings:
    reasons = []

    floor = x.get("floor")
    total_floors = x.get("total_floors")
    price = x.get("price")
    carpet = x.get("carpet_area")
    super_area = x.get("super_built_up_area")
    bedroom = x.get("bedroom")
    bathroom = x.get("bathroom")

    if isinstance(floor,(int,float)) and isinstance(total_floors,(int,float)):
        if floor > total_floors:
            reasons.append("floor > total_floors")
        if floor < 0:
            reasons.append("negative floor")

    if isinstance(price,(int,float)) and price <= 0:
        reasons.append("price <= 0")

    if isinstance(carpet,(int,float)) and carpet <= 0:
        reasons.append("carpet_area <= 0")

    if isinstance(super_area,(int,float)) and super_area <= 0:
        reasons.append("super_built_up_area <= 0")

    if isinstance(carpet,(int,float)) and isinstance(super_area,(int,float)):
        if carpet > super_area:
            reasons.append("carpet > super built-up")

    if isinstance(bedroom,(int,float)) and bedroom < 0:
        reasons.append("negative bedroom")

    if isinstance(bathroom,(int,float)) and bathroom < 0:
        reasons.append("negative bathroom")

    if reasons:
        print(
            x.get("listing_id"),
            "|", reasons,
            "|", x.get("bedroom"), "BHK",
            "| floor", x.get("floor"), "/", x.get("total_floors"),
            "| price", x.get("price"),
            "| carpet", x.get("carpet_area"),
            "| super", x.get("super_built_up_area"),
            "| locality", x.get("locality")
        )


print("\n========== SAME PROPERTY CLUES ==========")

# Group by strong physical/location identity, but DON'T use bedroom/price/furnishing.
groups = defaultdict(list)

for x in listings:
    key = (
        x.get("apartment_name"),
        x.get("locality"),
        x.get("latitude"),
        x.get("longitude"),
        x.get("floor"),
        x.get("total_floors")
    )
    groups[key].append(x)

same_property_groups = [
    g for g in groups.values() if len(g) > 1
]

print("Potential repeated-property groups:", len(same_property_groups))

for g in sorted(same_property_groups, key=len, reverse=True)[:30]:
    print("\nGROUP SIZE:", len(g))
    for x in g[:10]:
        print(
            x.get("listing_id"),
            "|", x.get("apartment_name"),
            "|", x.get("locality"),
            "|", x.get("bedroom"), "BHK",
            "| ₹", x.get("price"),
            "|", x.get("carpet_area"), "sqft",
            "|", x.get("website")
        )


print("\n========== CONTACT INVESTIGATION ==========")

contacts = defaultdict(list)

for x in listings:
    c = x.get("posted_by_contact")
    if c:
        contacts[c].append(x)

for contact, records in sorted(
    contacts.items(),
    key=lambda kv: len(kv[1]),
    reverse=True
)[:30]:

    print("\nCONTACT:", contact, "COUNT:", len(records))

    for x in records[:10]:
        print(
            x.get("listing_id"),
            "|", x.get("apartment_name"),
            "|", x.get("locality"),
            "|", x.get("price"),
            "|", x.get("posted_by")
        )


print("\n========== PROJECT COUNT SAMPLE ==========")

actual = Counter(
    x.get("project_id")
    for x in listings
    if x.get("project_id") is not None
)

wrong = []

for p in projects:
    pid = p.get("project_id")
    reported = p.get("total_listings")
    actual_count = actual.get(pid, 0)

    if reported != actual_count:
        wrong.append((pid, reported, actual_count, p.get("apartment_name")))

print("Wrong project counts:", len(wrong))

print("\nFirst 30:")
for row in wrong[:30]:
    print(row)


print("\n========== RENTAL CHECK ==========")

print("Rental records:", len(rentals))

had = [
    r for r in rentals
    if str(r.get("locality","")).lower() == "hadapsar"
]

print("Hadapsar rentals:", len(had))
print("Hadapsar rent sum:", sum(r.get("price",0) for r in had))

print("\nSample Hadapsar rentals:")
for r in had[:15]:
    print(
        r.get("listing_id"),
        "| ₹", r.get("price"),
        "|", r.get("bedroom"), "BHK",
        "|", r.get("carpet_area"), "sqft",
        "|", r.get("apartment_name")
    )

print("\n========== DONE ==========")

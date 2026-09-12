import os
import json
import getpass
import time
from pathlib import Path
import urllib.request
import urllib.parse

BASE_URL = "https://solve.ivy.homes"
API_KEY = os.environ["IVY_API_KEY"]
EMAIL = "demo1@ivy.homes"

PASSWORD = getpass.getpass("Demo password: ")

# ---------- LOGIN ----------
login_data = json.dumps({
    "email": EMAIL,
    "password": PASSWORD
}).encode()

login_req = urllib.request.Request(
    BASE_URL + "/auth/login",
    data=login_data,
    headers={
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    },
    method="POST"
)

with urllib.request.urlopen(login_req) as response:
    login = json.load(response)

TOKEN = login["access_token"]
print("\n✅ Login successful")
print("Token expires in:", login.get("expires_in"), "seconds")


# ---------- API GET ----------
def api_get(path, params=None):
    if params:
        path += "?" + urllib.parse.urlencode(params)

    req = urllib.request.Request(
        BASE_URL + path,
        headers={
            "X-API-Key": API_KEY,
            "Authorization": "Bearer " + TOKEN
        }
    )

    with urllib.request.urlopen(req) as response:
        return json.load(response)


# ---------- FETCH ALL ----------
def fetch_all(endpoint):
    print(f"\n📥 Fetching {endpoint}")

    all_results = []
    limit = 200
    offset = 0

    while True:
        data = api_get(endpoint, {
            "limit": limit,
            "offset": offset
        })

        results = data.get("results", [])
        all_results.extend(results)

        total = data.get("total", "?")
        print(f"   fetched {len(all_results)} / {total}")

        if not results or not data.get("has_more", False):
            break

        offset += len(results)
        time.sleep(0.05)

    print(f"✅ Finished {endpoint}: {len(all_results)} records")
    return all_results


# ---------- DOWNLOAD ----------
Path("data").mkdir(exist_ok=True)

listings = fetch_all("/v1/listings")
rentals = fetch_all("/v1/rentals")
projects = fetch_all("/v1/projects")


# ---------- SAVE ----------
with open("data/listings.json", "w") as f:
    json.dump(listings, f, indent=2)

with open("data/rentals.json", "w") as f:
    json.dump(rentals, f, indent=2)

with open("data/projects.json", "w") as f:
    json.dump(projects, f, indent=2)

print("\n🎉 ALL DATA DOWNLOADED!")
print("Listings :", len(listings))
print("Rentals  :", len(rentals))
print("Projects :", len(projects))
print("\nFiles saved inside ./data/")

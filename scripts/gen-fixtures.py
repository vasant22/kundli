#!/usr/bin/env python3
"""gen-fixtures.py — generate reference chart values for the Kundli tests.

Reference engine: pyswisseph 2.10.03 — the canonical Python binding of Swiss
Ephemeris, the same library version the app compiles to WebAssembly.

Setup (once):
    python3 -m venv .venv && .venv/bin/pip install pyswisseph
Usage:
    .venv/bin/python scripts/gen-fixtures.py          # full JSON to stdout
    .venv/bin/python scripts/gen-fixtures.py --compact # one line per case

The first 6 entries are the automated-test fixtures (tests/accuracy.test.js);
the rest feed tests/VALIDATION.md ("Our result" column).
"""
import datetime
import json
import sys
from zoneinfo import ZoneInfo

import swisseph as swe

swe.set_sid_mode(swe.SIDM_LAHIRI)

# id, y, mo, d, h, mi, s, tz, lat, lon
CASES = [
    # --- automated fixtures ---
    ("varanasi-1990", 1990, 5, 15, 14, 30, 0, "Asia/Kolkata", 25.31668, 83.01041),
    ("kolkata-1943", 1943, 3, 3, 6, 15, 0, "Asia/Kolkata", 22.5726, 88.3639),
    ("delhi-1975", 1975, 12, 25, 23, 55, 0, "Asia/Kolkata", 28.6139, 77.2090),
    ("nairobi-1980", 1980, 6, 20, 18, 45, 0, "Africa/Nairobi", -1.2921, 36.8219),
    ("newyork-1976", 1976, 7, 4, 9, 30, 0, "America/New_York", 40.7128, -74.0060),
    ("chennai-2005", 2005, 8, 10, 3, 5, 0, "Asia/Kolkata", 13.0827, 80.2707),
    # --- validation list (manual comparison) ---
    ("lahore-1920", 1920, 2, 2, 8, 40, 0, "Asia/Karachi", 31.5204, 74.3587),
    ("mumbai-2000", 2000, 1, 1, 12, 0, 0, "Asia/Kolkata", 19.0760, 72.8777),
    ("london-2010", 2010, 6, 30, 21, 20, 0, "Europe/London", 51.5074, -0.1278),
    ("hyderabad-1955", 1955, 9, 12, 4, 45, 0, "Asia/Kolkata", 17.3850, 78.4867),
]

BODIES = [
    ("sun", swe.SUN), ("moon", swe.MOON), ("mars", swe.MARS),
    ("mercury", swe.MERCURY), ("jupiter", swe.JUPITER), ("venus", swe.VENUS),
    ("saturn", swe.SATURN), ("rahu", swe.MEAN_NODE),
]

out = []
for (cid, y, mo, d, h, mi, s, tzname, lat, lon) in CASES:
    tz = ZoneInfo(tzname)
    local = datetime.datetime(y, mo, d, h, mi, s, tzinfo=tz)
    utc = local.astimezone(datetime.timezone.utc)
    off_min = int(local.utcoffset().total_seconds() // 60)
    hour = utc.hour + utc.minute / 60 + utc.second / 3600
    jd = swe.julday(utc.year, utc.month, utc.day, hour)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED

    planets = []
    for key, ipl in BODIES:
        xx, _ = swe.calc_ut(jd, ipl, flags)
        planets.append({"key": key, "lon": round(xx[0], 6), "rashi": int(xx[0] // 30)})
    rahu_lon = next(p["lon"] for p in planets if p["key"] == "rahu")
    ketu_lon = (rahu_lon + 180) % 360
    planets.append({"key": "ketu", "lon": round(ketu_lon, 6), "rashi": int(ketu_lon // 30)})

    _, ascmc = swe.houses_ex(jd, lat, lon, b"W", swe.FLG_SWIEPH | swe.FLG_SIDEREAL)
    asc = ascmc[0]

    out.append({
        "id": cid,
        "utc": [utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second],
        "tzOffsetMinutes": off_min,
        "latitude": lat,
        "longitude": lon,
        "jd": jd,
        "ayanamsa": round(swe.get_ayanamsa_ut(jd), 6),
        "lagna": {"lon": round(asc, 6), "rashi": int(asc // 30)},
        "planets": planets,
    })

if "--compact" in sys.argv:
    for c in out:
        asc = c["lagna"]
        plist = " ".join(f"{p['key']}={p['rashi']}/{p['lon']:.3f}" for p in c["planets"])
        print(f"{c['id']}: utc={c['utc']} off={c['tzOffsetMinutes']} "
              f"asc={asc['rashi']}/{asc['lon']:.3f} ay={c['ayanamsa']:.4f} {plist}")
else:
    print(json.dumps(out, ensure_ascii=False, indent=1))

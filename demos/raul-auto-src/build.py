"""Builds the Raul's Automotive multi-page site into demos/raul-auto/."""
import json, os, sys

OUT = sys.argv[1]
SITE = "https://example.com"  # placeholder domain until the shop picks one
SHOP = "Raul's Automotive"
PHONE = "(702) 555-0142"
TEL = "+17025550142"
STREET = "1234 Example Ave"
CITYLINE = "Las Vegas, NV 89101"

NAV = [
    ("index.html", "Home"),
    ("services.html", "Services"),
    ("specialty.html", "Specialty work"),
    ("insurance-financing.html", "Insurance & financing"),
    ("towing.html", "Towing"),
    ("contact.html", "Contact"),
]

SERVICES = [
    ("maintenance", "General maintenance", '<circle cx="16" cy="16" r="11"/><path d="M16 9v7l5 3"/>',
     "Factory-scheduled service, tune-ups, filters, belts, hoses, fluids and multi-point inspections.",
     "Keep your car on its factory maintenance schedule and catch small problems before they turn into big ones. We follow the maintenance intervals for your make and model.",
     ["Factory-scheduled service (30k / 60k / 90k miles)", "Tune-ups, spark plugs and ignition", "Air, cabin and fuel filters", "Belts, hoses and coolant", "Multi-point inspection with every visit"],
     ["You're due or past due on scheduled service", "Rough idle or lower gas mileage", "Check engine light", "Buying a used car and want it inspected"]),
    ("oil-changes", "Oil changes", '<path d="M16 4c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z"/>',
     "Conventional, high-mileage and full synthetic oil, with a new filter and a quick check of fluids and tires.",
     "The right oil for your engine and a new filter, plus a quick look at fluids, tires and anything that needs attention.",
     ["Conventional, high-mileage and full synthetic", "New oil filter", "Fluid top-off", "Tire pressure check", "Reset of the oil-life monitor"],
     ["Oil change light or sticker reminder", "Dark or low oil on the dipstick", "Engine sounds louder than usual", "It's been more than 5,000 miles"]),
    ("brakes", "Brake jobs", '<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="4"/><path d="M7 9a12 12 0 0 1 6-4"/>',
     "Pads, rotors, calipers, lines and brake fluid flushes. If it squeals, grinds or pulls, we'll find out why.",
     "Brakes are the one system you can't put off. We inspect the whole system and tell you what actually needs replacing.",
     ["Brake pads and shoes", "Rotors and drums", "Calipers and brake hoses", "Brake fluid flush", "ABS warning light diagnosis"],
     ["Squealing or grinding when you stop", "Car pulls to one side under braking", "Soft or spongy pedal", "Steering wheel shakes when braking"]),
    ("suspension", "Suspension work", '<path d="M16 3v4M16 25v4M10 7h12l-3 4h-6zM10 25h12l-3-4h-6zM13 11l6 2-6 2 6 2-6 2"/>',
     "Shocks, struts, control arms, ball joints, tie rods and bushings. Your car should ride smooth and track straight.",
     "Worn suspension makes a car ride rough, wear out tires early and handle poorly. We replace the worn parts and get it riding right.",
     ["Shocks and struts", "Control arms and ball joints", "Tie rods and steering components", "Bushings and sway bar links", "Wheel bearings"],
     ["Clunking over bumps", "Bouncy or floaty ride", "Uneven tire wear", "Car wanders or pulls on the freeway"]),
    ("ac-repair", "A/C repair", '<path d="M16 3v26M5 9.5l22 13M27 9.5l-22 13M13 5l3 3 3-3M13 27l3-3 3 3"/>',
     "Leak checks, recharges, compressors, condensers and blend doors. Built for Las Vegas summers.",
     "In Las Vegas, a broken A/C isn't optional. We find the leak or the failed part instead of just recharging it and sending you off.",
     ["A/C performance check and leak test", "Refrigerant evacuate and recharge", "Compressors and clutches", "Condensers, evaporators and hoses", "Blend door and blower motor repair"],
     ["A/C blows warm or only cool at highway speed", "Weak airflow from the vents", "Strange smell from the vents", "Clicking or squealing when the A/C kicks on"]),
    ("electrical", "Electrical issues", '<path d="M18 3 8 18h8l-2 11 10-15h-8z"/>',
     "No-starts, parasitic drains, wiring faults, check engine lights, sensors and modules, traced to the source.",
     "Electrical problems take patience and the right tools. We trace the fault to its source instead of throwing parts at it.",
     ["Check engine light diagnosis", "Batteries, starters and alternators", "Parasitic battery drain testing", "Wiring repair and shorts", "Sensors, modules and lighting"],
     ["Car won't start or cranks slowly", "Battery keeps dying", "Warning lights on the dash", "Lights, windows or gauges acting up"]),
]

SPECIALTY = [
    ("engine-swaps", "SPEC-01", "Engine swaps",
     ["Same-model replacements", "Performance upgrades", "Mounts, wiring and tuning"],
     "Whether you're replacing a blown engine with the same motor or dropping in something with more power, we handle the swap from start to finish.",
     ["Replacement engines for blown or worn-out motors", "Performance engine swaps", "Motor mounts and adapters", "Wiring harness and computer integration", "Cooling, fuel and exhaust fitment"]),
    ("transmission-swaps", "SPEC-02", "Transmission swaps",
     ["Automatic and manual", "Rebuilt or replacement units", "Driveline and cooler setup"],
     "Slipping, hard shifts or a transmission that won't move the car. We replace it with a rebuilt or new unit, or convert to a different transmission.",
     ["Automatic and manual transmissions", "Rebuilt, remanufactured or used units", "Auto-to-manual and other conversions", "Driveshaft and crossmember fitment", "Transmission coolers and lines"]),
    ("fuel-injection", "SPEC-03", "Fuel injection conversions",
     ["Carburetor to EFI", "Fuel system and pump upgrades", "Starts easier, runs cleaner"],
     "Converting a carbureted engine to electronic fuel injection makes it start easier, idle smoother, run cleaner and handle the heat better.",
     ["Carburetor-to-EFI conversions", "Throttle body and multi-port systems", "Fuel pumps, lines and regulators", "Sensor and wiring installation", "Startup tuning and setup"]),
    ("lift-kits", "SPEC-04", "Lift kits",
     ["Trucks, Jeeps and SUVs", "Leveling and full lifts", "Alignment after install"],
     "From a simple leveling kit to a full suspension lift, we install it correctly so it rides well and stays safe on the road.",
     ["Leveling kits", "Body lifts and suspension lifts", "Shocks, springs and control arms", "Larger wheel and tire fitment", "Alignment after install"]),
    ("lowering-kits", "SPEC-05", "Lowering kits",
     ["Springs, coilovers and drop kits", "Cars and trucks", "Set up to ride right"],
     "Lowering springs, coilovers or a full drop kit, set up so the car still drives well and doesn't wear out tires.",
     ["Lowering springs", "Coilovers", "Truck drop kits and flip kits", "Camber and alignment correction", "Ride height setup"]),
    ("electrical-diagnostics", "SPEC-06", "Electrical diagnostics",
     ["Swap harness integration", "Shorts and intermittent faults", "Lighting and accessories"],
     "The hard electrical jobs: wiring for engine swaps, intermittent faults that come and go, and accessories wired in cleanly.",
     ["Engine swap harness integration", "Intermittent and hard-to-find faults", "Shorts and burned wiring", "Lighting, light bars and accessories", "Stereo and electronics power wiring"]),
]

FAQ = [
    ("Do you do body work?", "No. We're a full mechanical and electrical shop, but we don't do body work, paint or collision repair."),
    ("Do you work with insurance and extended warranty companies?", "Yes. We work directly with insurance companies and extended warranty companies on covered claims and repairs."),
    ("Can I finance my repair?", "Yes. We offer financing through Affirm, Sunbit and Klarna, subject to approval."),
    ("My car won't start. Can you tow it in?", "Yes. We partner with Los Crazies Towing to bring your vehicle to the shop."),
    ("Do you do engine swaps and fuel injection conversions?", "Yes. Engine swaps, transmission swaps, carburetor-to-EFI conversions, lift kits and lowering kits are our specialty work."),
    ("Do I have to approve the price before you start?", "Yes. We diagnose the vehicle first and give you an estimate. No work starts until you approve it."),
    ("What areas do you serve?", "We're in Las Vegas and see customers from across the valley, including North Las Vegas, Henderson, Paradise and Spring Valley."),
]

HERO_SCRIPTS = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script src="assets/hero3d.js"></script>\n'

TOW_SVG = '<svg viewBox="0 0 72 48" aria-hidden="true"><path d="M4 34V20h22l6-10h14v24M46 34h20V24l-8-4H46M10 34a5 5 0 1 0 10 0 5 5 0 1 0-10 0M50 34a5 5 0 1 0 10 0 5 5 0 1 0-10 0M20 34h30M26 20 40 4h8"/></svg>'

BUSINESS = {
    "@type": "AutoRepair",
    "@id": SITE + "/#business",
    "name": SHOP,
    "url": SITE + "/",
    "description": "Full-service, bumper-to-bumper auto repair shop in Las Vegas, NV. Maintenance, brakes, suspension, A/C, electrical, engine and transmission swaps, lift and lowering kits, and fuel injection conversions. We do not do body work.",
    "telephone": "+1-702-555-0142",
    "priceRange": "$$",
    "address": {"@type": "PostalAddress", "streetAddress": STREET, "addressLocality": "Las Vegas", "addressRegion": "NV", "postalCode": "89101", "addressCountry": "US"},
    "areaServed": ["Las Vegas", "North Las Vegas", "Henderson", "Paradise", "Spring Valley"],
    "openingHoursSpecification": [
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "08:00", "closes": "18:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "09:00", "closes": "15:00"},
    ],
    "paymentAccepted": "Cash, Credit Card, Affirm, Sunbit, Klarna",
    "knowsAbout": [s[1] for s in SERVICES] + [s[2] for s in SPECIALTY] + ["Insurance claims", "Extended warranty repairs"],
    "hasOfferCatalog": {
        "@type": "OfferCatalog", "name": "Auto repair services",
        "itemListElement": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": n}} for n in [s[1] for s in SERVICES] + [s[2] for s in SPECIALTY]],
    },
}


def ld(obj):
    obj = dict(obj)
    obj.setdefault("@context", "https://schema.org")
    return '<script type="application/ld+json">\n' + json.dumps(obj, indent=2, ensure_ascii=False) + "\n</script>"


def breadcrumb(page, name):
    return ld({"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": name, "item": SITE + "/" + page},
    ]})


def faq_ld(items):
    return ld({"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]})


def service_ld(name, desc, page):
    return {"@type": "Service", "name": name, "description": desc, "serviceType": name,
            "provider": {"@id": SITE + "/#business"}, "areaServed": "Las Vegas, NV", "url": SITE + "/" + page}


def head(page, title, desc, extra_ld=""):
    canonical = SITE + "/" + ("" if page == "index.html" else page)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{SHOP}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta name="theme-color" content="#0b0c0d">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="assets/styles.css">
{ld(BUSINESS)}
{extra_ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="demo-bar">DEMO SITE BY TORO GROWTH · SHOP NAME, ADDRESS, PHONE AND HOURS ARE PLACEHOLDERS</div>
<header class="nav">
  <div class="wrap nav-bar">
    <a class="brand" href="index.html" aria-label="{SHOP} home">
      <span class="brand-mark" aria-hidden="true">R</span>
      <span class="brand-name">{SHOP}<small>LAS VEGAS · NV</small></span>
    </a>
    <nav class="nav-links" id="nav-links" aria-label="Main">
{nav_links(page)}
    </nav>
    <div class="nav-actions">
      <a class="btn btn-solid btn-sm" href="contact.html#book">Book now</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Menu"><span></span></button>
    </div>
  </div>
</header>
<main id="main">
"""


def nav_links(page):
    out = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == page else ""
        out.append(f'      <a href="{href}"{cur}>{label}</a>')
    return "\n".join(out)


def foot(extra=""):
    svc = "\n".join(f'        <a href="services.html#{s[0]}">{s[1]}</a>' for s in SERVICES)
    return f"""</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <strong>{SHOP}</strong>
        <span>Full-service auto repair in Las Vegas, NV. Everything but body work.</span>
        <span>{STREET}<br>{CITYLINE}</span>
        <a href="tel:{TEL}">{PHONE}</a>
      </div>
      <div>
        <span class="label">Services</span>
{svc}
      </div>
      <div>
        <span class="label">Shop</span>
        <a href="specialty.html">Specialty work</a>
        <a href="insurance-financing.html">Insurance &amp; warranty</a>
        <a href="insurance-financing.html#financing">Financing</a>
        <a href="towing.html">Towing</a>
        <a href="contact.html#book">Book an appointment</a>
      </div>
    </div>
    <div class="foot-base"><span>© <span id="year">2026</span> {SHOP}</span><span>Website by Toro Growth</span></div>
  </div>
</footer>
<script src="assets/site.js"></script>
{extra}</body>
</html>
"""


def page_hero(crumb, label, h1, lead):
    c = f'<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / {crumb}</nav>'
    return f"""<section class="page-hero">
  <div class="wrap">
    {c}
    <span class="label">{label}</span>
    <h1>{h1}</h1>
    <p>{lead}</p>
  </div>
</section>
"""


def cta_band(title="Get your car in", text="Call the shop or book online. We'll confirm a time."):
    return f"""<section class="cta-band">
  <div class="wrap">
    <div style="display:grid;gap:12px;min-width:0"><h2 class="sm">{title}</h2><p class="muted">{text}</p></div>
    <div class="ctas"><a class="btn btn-solid" href="contact.html#book">Book an appointment</a><a class="btn btn-ghost" href="tel:{TEL}">Call {PHONE}</a></div>
  </div>
</section>
"""


def tow_strip():
    return f"""<section class="section">
  <div class="wrap">
    <div class="tow">
      {TOW_SVG}
      <div>
        <span class="label">Towing partner</span>
        <h2>Car won't start? Los Crazies Towing</h2>
        <p>Broken down somewhere in the valley? Our towing partner can bring your vehicle straight to the shop.</p>
      </div>
      <a class="btn btn-solid" href="towing.html">Get a tow</a>
    </div>
  </div>
</section>
"""


def faq_block(items):
    rows = "\n".join(f"      <details><summary>{q}</summary><p>{a}</p></details>" for q, a in items)
    return f"""<div class="faq">
{rows}
    </div>"""


def process_block():
    return """<ol class="steps">
      <li class="step"><span class="step-num">1</span><h3>Call or book</h3><p>Call the shop or book online. Tell us what the car is doing and pick a time.</p></li>
      <li class="step"><span class="step-num">2</span><h3>Inspect &amp; diagnose</h3><p>We inspect the vehicle and find the actual cause, not just the symptom.</p></li>
      <li class="step"><span class="step-num">3</span><h3>Get an estimate</h3><p>You get a clear estimate for parts and labor. If it makes sense to you, approve it.</p></li>
      <li class="step"><span class="step-num">4</span><h3>We do the work</h3><p>We complete the repair, test drive it and let you know when it's ready to pick up.</p></li>
    </ol>"""


HOURS_BLOCK = """<div class="hours" aria-label="Hours">
          <div data-days="1,2,3,4,5"><span>Mon – Fri</span><span>8:00 AM – 6:00 PM</span></div>
          <div data-days="6"><span>Saturday</span><span>9:00 AM – 3:00 PM</span></div>
          <div data-days="0"><span>Sunday</span><span>Closed</span></div>
        </div>"""


# ---------- pages ----------

def home():
    cells = "\n".join(f"""      <a class="cell" href="services.html#{sid}">
        <svg class="icon" viewBox="0 0 32 32" aria-hidden="true">{icon}</svg>
        <h3>{name}</h3>
        <p>{short}</p>
        <span class="more">Details ›</span>
      </a>""" for sid, name, icon, short, *_ in SERVICES)
    spec = "\n".join(f"""      <a class="cell" href="specialty.html#{sid}">
        <span class="code">{code}</span>
        <h3>{name}</h3>
        <ul class="spec-list">{''.join(f'<li>{b}</li>' for b in bullets)}</ul>
      </a>""" for sid, code, name, bullets, *_ in SPECIALTY)
    body = f"""<section class="hero3d" aria-label="Introduction">
  <div class="hero3d-stage">
    <div class="hero3d-shade"></div>
    <div class="wrap hero3d-copy">
      <div class="hero3d-a">
        <span class="label">Full-service auto repair · Las Vegas, NV</span>
        <h1>Bumper to bumper.<br><span class="dim">Everything but body work.</span></h1>
        <p>Maintenance, brakes, suspension, A/C, electrical and full engine and transmission swaps. We handle insurance and warranty claims, offer financing, and can get your car towed in.</p>
        <div class="ctas">
          <a class="btn btn-solid" href="contact.html#book">Book an appointment</a>
          <a class="btn btn-ghost" href="tel:{TEL}">Call {PHONE}</a>
        </div>
      </div>
      <div class="hero3d-b">
        <span class="label">Specialty work</span>
        <h2>Built for the Mojave.</h2>
        <p>Lift kits, engine and transmission swaps, fuel injection conversions and A/C that holds up in July. The bigger jobs most shops send away.</p>
        <ul><li>Lift kits</li><li>Lowering kits</li><li>Engine swaps</li><li>Transmission swaps</li><li>EFI conversions</li></ul>
        <div class="ctas"><a class="btn btn-solid" href="specialty.html">See specialty work</a></div>
      </div>
    </div>
    <div class="hero3d-hint">Scroll</div>
  </div>
</section>

<section class="section glance" aria-label="Shop details">
  <div class="wrap">
    <div class="grid grid-3">
      <div class="cell"><span class="label">Shop</span><span class="val"><span class="open-dot" aria-hidden="true"></span><span data-status style="color:inherit">Mon – Fri 8 AM – 6 PM · Sat 9 AM – 3 PM</span></span></div>
      <div class="cell"><span class="label">Phone</span><a class="val" href="tel:{TEL}" style="text-decoration:none">{PHONE}</a></div>
      <div class="cell"><span class="label">Location</span><span class="val">{STREET}, <span>{CITYLINE}</span></span></div>
      <div class="cell"><span class="label">Payment</span><span class="val">Cash · Card · <span>Affirm · Sunbit · Klarna</span></span></div>
      <div class="cell"><span class="label">Claims</span><span class="val">Insurance &amp; extended warranty</span></div>
      <div class="cell"><span class="label">Towing</span><span class="val">Los Crazies Towing</span></div>
    </div>
  </div>
</section>

<section class="section" id="services">
  <div class="wrap">
    <div class="section-head">
      <span class="label">Services</span>
      <h2>Full-service repair</h2>
      <p>Daily drivers, work trucks and family cars. Bring it in for routine service or for the problem nobody else could find.</p>
    </div>
    <div class="grid grid-3">
{cells}
    </div>
    <div class="not-us">
      <strong>We don't do body work</strong>
      <p>We're a mechanical and electrical shop. For dents, paint or collision repair, you'll need a body shop.</p>
    </div>
  </div>
</section>

<section class="section alt" id="specialty">
  <div class="wrap">
    <div class="section-head">
      <span class="label">Specialty work</span>
      <h2>Swaps, kits and conversions</h2>
      <p>The bigger jobs most shops send away. This is the work we like doing most.</p>
    </div>
    <div class="grid grid-3">
{spec}
    </div>
  </div>
</section>

<section class="section" id="process">
  <div class="wrap">
    <div class="section-head">
      <span class="label">How it works</span>
      <h2>Straightforward repair</h2>
      <p>No surprises. You approve the estimate before any work starts.</p>
    </div>
    {process_block()}
  </div>
</section>

<section class="section alt">
  <div class="wrap two-up">
    <div class="panel">
      <span class="label">Insurance &amp; warranty</span>
      <h2 class="sm">We work with your coverage</h2>
      <p>Have an extended warranty or an insurance claim? We work directly with warranty and insurance companies on covered repairs, so you're not stuck in the middle.</p>
      <a class="text-link" href="insurance-financing.html">How claims work ›</a>
    </div>
    <div class="panel">
      <span class="label">Financing</span>
      <h2 class="sm">Fix it now, pay over time</h2>
      <p>Big repair you weren't planning for? Split it into payments with one of our financing partners.</p>
      <div class="lenders"><div class="lender">Affirm</div><div class="lender">Sunbit</div><div class="lender">Klarna</div></div>
      <a class="text-link" href="insurance-financing.html#financing">Financing options ›</a>
    </div>
  </div>
</section>

{tow_strip()}
<section class="section" id="faq">
  <div class="wrap">
    <div class="section-head">
      <span class="label">Questions</span>
      <h2>Common questions</h2>
    </div>
    {faq_block(FAQ)}
  </div>
</section>

{cta_band()}"""
    return head("index.html", f"{SHOP} | Auto Repair in Las Vegas, NV",
                "Full-service auto repair in Las Vegas. Maintenance, oil changes, brakes, suspension, A/C, electrical, engine and transmission swaps. Insurance and warranty claims, financing and towing.",
                faq_ld(FAQ)) + body + foot(HERO_SCRIPTS)


def services():
    rows = []
    for sid, name, icon, short, long, included, signs in SERVICES:
        rows.append(f"""    <article class="detail" id="{sid}">
      <div class="detail-title">
        <svg class="icon" viewBox="0 0 32 32" aria-hidden="true">{icon}</svg>
        <h2>{name}</h2>
      </div>
      <div>
        <p>{long}</p>
        <p style="margin-top:16px"><a class="text-link" href="contact.html#book">Book {name.lower()} ›</a></p>
      </div>
      <div style="display:grid;gap:24px">
        <div><h3>What's included</h3><ul class="checks">{''.join(f'<li>{i}</li>' for i in included)}</ul></div>
        <div><h3>Signs you need it</h3><ul class="dash">{''.join(f'<li>{i}</li>' for i in signs)}</ul></div>
      </div>
    </article>""")
    graph = ld({"@graph": [service_ld(s[1], s[4], "services.html#" + s[0]) for s in SERVICES]})
    body = page_hero("Services", "Services · Las Vegas, NV", 'Full-service repair.<br><span class="dim">Bumper to bumper.</span>',
                     "Everything a car needs to stay on the road, from oil changes to electrical diagnostics. The only thing we don't do is body work.") + f"""
<section class="section">
  <div class="wrap">
    <div class="details">
{chr(10).join(rows)}
    </div>
    <div class="not-us">
      <strong>We don't do body work</strong>
      <p>We're a mechanical and electrical shop. For dents, paint or collision repair, you'll need a body shop.</p>
    </div>
  </div>
</section>
{cta_band()}"""
    return head("services.html", f"Auto Repair Services in Las Vegas | {SHOP}",
                "Maintenance, oil changes, brake jobs, suspension work, A/C repair and electrical diagnostics in Las Vegas, NV. Full-service shop, no body work.",
                breadcrumb("services.html", "Services") + "\n" + graph) + body + foot()


def specialty():
    rows = []
    for sid, code, name, bullets, long, included in SPECIALTY:
        rows.append(f"""    <article class="detail" id="{sid}">
      <div class="detail-title">
        <span class="label">{code}</span>
        <h2>{name}</h2>
      </div>
      <div>
        <p>{long}</p>
        <p style="margin-top:16px"><a class="text-link" href="contact.html#book">Ask about {name.lower()} ›</a></p>
      </div>
      <div><h3>What we do</h3><ul class="checks">{''.join(f'<li>{i}</li>' for i in included)}</ul></div>
    </article>""")
    graph = ld({"@graph": [service_ld(s[2], s[4], "specialty.html#" + s[0]) for s in SPECIALTY]})
    body = page_hero("Specialty work", "Specialty work · Las Vegas, NV", 'Swaps, kits<br><span class="dim">and conversions.</span>',
                     "Engine and transmission swaps, carburetor-to-EFI conversions, lift and lowering kits, and the electrical work that ties it all together.") + f"""
<section class="section">
  <div class="wrap">
    <div class="details">
{chr(10).join(rows)}
    </div>
  </div>
</section>
<section class="section alt">
  <div class="wrap">
    <div class="section-head">
      <span class="label">Planning a build?</span>
      <h2 class="sm">Start with a conversation</h2>
      <p>Tell us the vehicle and what you want it to do. We'll talk through parts, timing and cost before anything gets ordered, and you can finance the work with Affirm, Sunbit or Klarna.</p>
    </div>
  </div>
</section>
{cta_band("Talk about your build", "Call the shop or send a request with your vehicle and what you have in mind.")}"""
    return head("specialty.html", f"Engine Swaps, Lift Kits & EFI Conversions in Las Vegas | {SHOP}",
                "Engine swaps, transmission swaps, carburetor-to-fuel-injection conversions, lift kits, lowering kits and electrical work in Las Vegas, NV.",
                breadcrumb("specialty.html", "Specialty work") + "\n" + graph) + body + foot()


def insurance():
    items = [q for q in FAQ if "insurance" in q[0].lower() or "finance" in q[0].lower() or "approve" in q[0].lower()]
    lenders = [
        ("Affirm", "Pay over time with fixed monthly payments. You see the total cost up front."),
        ("Sunbit", "Built for auto repair. Apply at the counter and get a decision in seconds."),
        ("Klarna", "Split the cost into smaller payments over time."),
    ]
    cards = "\n".join(f'      <div class="lender-card"><span class="lender-name">{n}</span><p>{d}</p></div>' for n, d in lenders)
    body = page_hero("Insurance &amp; financing", "Insurance · Warranty · Financing", 'Covered repairs.<br><span class="dim">Flexible payments.</span>',
                     "We work directly with insurance and extended warranty companies, and offer financing through Affirm, Sunbit and Klarna.") + f"""
<section class="section" id="claims">
  <div class="wrap two-up">
    <div class="panel">
      <span class="label">Extended warranty</span>
      <h2 class="sm">Warranty repairs</h2>
      <p>Have an extended warranty or vehicle service contract? Bring us your contract info. We diagnose the problem, contact the warranty company, and handle the paperwork for covered repairs.</p>
      <ul class="checks"><li>We call the warranty company for you</li><li>Diagnosis and documentation for the claim</li><li>You pay only your deductible and anything not covered</li></ul>
    </div>
    <div class="panel">
      <span class="label">Insurance</span>
      <h2 class="sm">Insurance claims</h2>
      <p>For mechanical repairs covered by your insurance, we work with your adjuster directly, provide the estimate and photos they need, and keep you updated.</p>
      <ul class="checks"><li>Estimates and photos for adjusters</li><li>Direct communication with your insurer</li><li>Mechanical and electrical repairs (no body work)</li></ul>
    </div>
  </div>
</section>

<section class="section alt" id="financing">
  <div class="wrap">
    <div class="section-head">
      <span class="label">Financing</span>
      <h2>Fix it now, pay over time</h2>
      <p>A transmission or engine job shouldn't have to wait for payday. Apply with one of our financing partners and split the repair into payments.</p>
    </div>
    <div class="grid grid-3">
{cards}
    </div>
    <p class="fine section-foot">Financing is subject to approval. Rates and terms are set by each lender.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><span class="label">Questions</span><h2 class="sm">Claims and payment</h2></div>
    {faq_block(items)}
  </div>
</section>
{cta_band()}"""
    return head("insurance-financing.html", f"Insurance, Warranty & Financing | {SHOP} Las Vegas",
                "Las Vegas auto repair shop that works with insurance and extended warranty companies. Financing available with Affirm, Sunbit and Klarna.",
                breadcrumb("insurance-financing.html", "Insurance & financing") + "\n" + faq_ld(items)) + body + foot()


def towing():
    body = page_hero("Towing", "Towing partner", 'Broken down?<br><span class="dim">We\'ll get it here.</span>',
                     "If your car won't start or isn't safe to drive, our towing partner Los Crazies Towing can bring it straight to the shop.") + f"""
<section class="section">
  <div class="wrap">
    <div class="tow">
      {TOW_SVG}
      <div>
        <span class="label">Partner</span>
        <h2>Los Crazies Towing</h2>
        <p>Towing across the Las Vegas valley. Phone: <strong style="color:var(--white)">(702) 555-0199</strong> <span class="fine">(placeholder)</span></p>
      </div>
      <a class="btn btn-solid" href="contact.html#tow">Request a tow</a>
    </div>
  </div>
</section>
<section class="section alt">
  <div class="wrap">
    <div class="section-head"><span class="label">What to do</span><h2 class="sm">If you break down</h2></div>
    <ol class="steps">
      <li class="step"><span class="step-num">1</span><h3>Get safe</h3><p>Pull off the road if you can, turn on your hazards and stay clear of traffic.</p></li>
      <li class="step"><span class="step-num">2</span><h3>Call for a tow</h3><p>Call Los Crazies Towing or the shop and tell them where you are.</p></li>
      <li class="step"><span class="step-num">3</span><h3>We take it from there</h3><p>Your car comes straight to us. We let you know when it's here.</p></li>
      <li class="step"><span class="step-num">4</span><h3>Diagnosis &amp; estimate</h3><p>We find the problem and give you an estimate before any work starts.</p></li>
    </ol>
  </div>
</section>
{cta_band("Need a tow now?", "Call the shop and we'll get Los Crazies Towing headed your way.")}"""
    return head("towing.html", f"Towing to Our Las Vegas Shop | {SHOP}",
                "Car won't start? Our towing partner Los Crazies Towing brings your vehicle to Raul's Automotive in Las Vegas, NV.",
                breadcrumb("towing.html", "Towing")) + body + foot()


def contact():
    opts = ["General maintenance", "Oil change", "Brakes", "Suspension", "A/C repair", "Electrical issue",
            "Engine / transmission swap", "Lift or lowering kit", "Fuel injection conversion",
            "Insurance / warranty claim", "Need a tow", "Not sure, need a diagnosis"]
    options = "".join(f"<option>{o}</option>" for o in opts)
    body = page_hero("Contact", "Contact · Book an appointment", 'Get your car in.',
                     "Call the shop or send a request and we'll confirm a time.") + f"""
<section class="section" id="book">
  <div class="wrap book" id="tow">
    <div class="book-info">
      <span class="label">Call the shop</span>
      <a class="phone-big" href="tel:{TEL}">{PHONE}</a>
      <p><span class="open-dot" aria-hidden="true"></span><span data-status>Mon – Fri 8 AM – 6 PM · Sat 9 AM – 3 PM</span></p>
      {HOURS_BLOCK}
      <div style="display:grid;gap:6px">
        <span class="label">Address</span>
        <span style="color:var(--white)">{STREET}<br>{CITYLINE}</span>
        <a class="text-link" style="justify-self:start" href="https://www.google.com/maps/search/?api=1&amp;query=1234+Example+Ave+Las+Vegas+NV+89101">Get directions ›</a>
      </div>
    </div>
    <form id="book-form" novalidate>
      <div class="row">
        <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div>
      </div>
      <div class="row">
        <div class="field"><label for="f-vehicle">Year / make / model</label><input id="f-vehicle" name="vehicle" placeholder="2015 Chevy Silverado"></div>
        <div class="field"><label for="f-service">Service</label><select id="f-service" name="service">{options}</select></div>
      </div>
      <div class="row">
        <div class="field"><label for="f-date">Preferred day</label><input id="f-date" name="date" type="date"></div>
        <div class="field"><label for="f-pay">Payment</label><select id="f-pay" name="payment"><option>Pay at pickup</option><option>Insurance claim</option><option>Extended warranty</option><option>Financing (Affirm / Sunbit / Klarna)</option></select></div>
      </div>
      <div class="field"><label for="f-notes">What's the car doing?</label><textarea id="f-notes" name="notes" placeholder="Grinding noise when braking, started last week."></textarea></div>
      <p class="form-error" id="form-error" role="alert" hidden></p>
      <button class="btn btn-solid" type="submit">Request appointment</button>
      <div class="confirm" id="confirm" role="status" hidden>Demo only: on the live site, this request goes straight to the shop and you get a text to confirm your time.</div>
    </form>
  </div>
</section>
{tow_strip()}"""
    return head("contact.html", f"Book an Appointment | {SHOP} Las Vegas",
                "Book auto repair in Las Vegas. Call (702) 555-0142 or request an appointment online. Open Monday to Saturday.",
                breadcrumb("contact.html", "Contact")) + body + foot()


PAGES = {"index.html": home, "services.html": services, "specialty.html": specialty,
         "insurance-financing.html": insurance, "towing.html": towing, "contact.html": contact}

os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
for name, fn in PAGES.items():
    with open(os.path.join(OUT, name), "w") as f:
        f.write(fn())

with open(os.path.join(OUT, "sitemap.xml"), "w") as f:
    urls = "\n".join(f"  <url><loc>{SITE}/{'' if p == 'index.html' else p}</loc></url>" for p in PAGES)
    f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n')

with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write(f"User-agent: *\nAllow: /\n\n# AI search crawlers are welcome\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")

with open(os.path.join(OUT, "llms.txt"), "w") as f:
    svc = "\n".join(f"- [{s[1]}]({SITE}/services.html#{s[0]}): {s[3]}" for s in SERVICES)
    spc = "\n".join(f"- [{s[2]}]({SITE}/specialty.html#{s[0]}): {s[4]}" for s in SPECIALTY)
    f.write(f"""# {SHOP}

> Full-service, bumper-to-bumper auto repair shop in Las Vegas, NV. We do everything except body work. We work with insurance and extended warranty companies, offer financing through Affirm, Sunbit and Klarna, and partner with Los Crazies Towing.

- Address: {STREET}, {CITYLINE}
- Phone: {PHONE}
- Hours: Mon–Fri 8 AM–6 PM, Sat 9 AM–3 PM, Sun closed
- Serves: Las Vegas, North Las Vegas, Henderson, Paradise, Spring Valley
- Does NOT do: body work, paint or collision repair

## Services
{svc}

## Specialty work
{spc}

## Payment and claims
- [Insurance and extended warranty]({SITE}/insurance-financing.html): We work directly with insurers and warranty companies on covered repairs.
- [Financing]({SITE}/insurance-financing.html#financing): Affirm, Sunbit and Klarna, subject to approval.

## Towing
- [Los Crazies Towing]({SITE}/towing.html): Towing partner that brings broken-down vehicles to the shop.

## Booking
- [Book an appointment]({SITE}/contact.html#book)
""")

with open(os.path.join(OUT, "assets", "favicon.svg"), "w") as f:
    f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0b0c0d"/><g transform="skewX(-8) translate(3 0)"><rect x="5" y="5" width="22" height="22" fill="none" stroke="#f3f4f5" stroke-width="2.5"/><text x="16" y="23" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-weight="800" font-size="17" fill="#f3f4f5">R</text></g></svg>\n')

print("built", len(PAGES), "pages")

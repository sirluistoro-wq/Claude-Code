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

HERO_SCRIPTS = '<script src="assets/loader.js"></script>\n<script src="assets/hero-video.js"></script>\n'

# first-visit flag is set before the first paint so returning visitors never see a flash of the loader;
# adding #intro to the URL replays it (handy for demos)
FIRST_VISIT = '<script>try{if(!localStorage.getItem("ra-visited")||location.hash==="#intro")document.documentElement.classList.add("first-visit")}catch(e){}</script>\n'
LOADER = '''<div class="loader" id="loader" role="status" aria-label="Loading">
  <div class="loader-mark">
    <span class="brand"><b>Raul's</b><span>Automotive</span></span>
    <div class="loader-track"><div class="loader-fill"></div></div>
  </div>
  <div class="loader-foot"><span>Full-service auto repair<br>Las Vegas, Nevada</span><span class="loader-count" data-count>000</span></div>
</div>
'''

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


ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


def head(page, title, desc, extra_ld="", early=""):
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
<meta property="og:image" content="{SITE}/assets/still-front.jpg">
<meta name="theme-color" content="#0a0a0b">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,300..800&display=swap">
<link rel="stylesheet" href="assets/styles.css">
{early}{ld(BUSINESS)}
{extra_ld}
</head>
<body>
{LOADER if page == "index.html" else ""}<a class="skip" href="#main">Skip to content</a>
<div class="demo-note">Demo site by Toro Growth. Shop name, address, phone and hours are placeholders.</div>
<header class="nav">
  <div class="wrap nav-bar">
    <a class="brand" href="index.html" aria-label="{SHOP} home"><b>Raul's</b><span>Automotive</span></a>
    <nav class="nav-links" id="nav-links" aria-label="Main">
{nav_links(page)}
    </nav>
    <div class="nav-actions">
      <a class="btn btn-solid btn-sm" href="contact.html#book">Book a visit</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Menu"><span></span></button>
    </div>
  </div>
</header>
<main id="main">
"""


def nav_links(page):
    out = []
    for href, label in NAV:
        if href == "index.html":
            continue
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
        <h3>{SHOP}</h3>
        <span>Full-service auto repair in Las Vegas.<br>Everything but body work.</span>
        <span>{STREET}<br>{CITYLINE}</span>
        <a href="tel:{TEL}">{PHONE}</a>
      </div>
      <div>
        <h3>Services</h3>
{svc}
      </div>
      <div>
        <h3>The shop</h3>
        <a href="specialty.html">Specialty work</a>
        <a href="insurance-financing.html">Insurance &amp; warranty</a>
        <a href="insurance-financing.html#financing">Financing</a>
        <a href="towing.html">Towing</a>
        <a href="contact.html#book">Book a visit</a>
      </div>
    </div>
    <div class="foot-mark" aria-hidden="true">Raul's Automotive</div>
    <div class="foot-base"><span>© <span id="year">2026</span> {SHOP}</span><span>Website by Toro Growth</span></div>
  </div>
</footer>
<script src="assets/site.js"></script>
{extra}</body>
</html>
"""


def page_hero(h1, lead, image=None, alt="", focus="50% 50%"):
    media = ""
    if image:
        media = f"""
<div class="page-media">
  <div class="wrap"><figure class="media wide reveal"><img src="assets/{image}" alt="{alt}" loading="eager" style="object-position:{focus}"></figure></div>
</div>"""
    return f"""<section class="page-hero">
  <div class="wrap">
    <h1>{h1}</h1>
    <p class="lead">{lead}</p>
  </div>
</section>{media}
"""


def closer(title='Bring it in.<br><span class="soft">We\'ll take it from there.</span>'):
    return f"""<section class="closer">
  <div class="wrap reveal">
    <h2>{title}</h2>
    <div class="closer-row">
      <a class="phone-big" href="tel:{TEL}">{PHONE}</a>
      <div class="ctas"><a class="btn btn-solid" href="contact.html#book">Book a visit {ARROW}</a><a class="btn btn-ghost" href="towing.html">Need a tow?</a></div>
    </div>
  </div>
</section>
"""


def tow_band(link="towing.html", label="Get a tow"):
    return f"""<section class="section">
  <div class="wrap">
    <div class="band reveal">
      <img src="assets/photo-shop-bay.jpg" alt="Purple sports car with the hood up on a two-post lift in the shop" loading="lazy" style="object-position:62% 55%">
      <div class="band-copy">
        <h2>Broken down?<br>We'll get it here.</h2>
        <p>Our towing partner, Los Crazies Towing, brings your vehicle from anywhere in the valley straight to the shop.</p>
        <div class="ctas"><a class="btn btn-solid" href="{link}">{label} {ARROW}</a></div>
      </div>
    </div>
  </div>
</section>
"""


def faq_section(items, title="Questions, answered.", intro="Can't find what you need? Call the shop and ask."):
    rows = "\n".join(f"      <details><summary>{q}</summary><p>{a}</p></details>" for q, a in items)
    return f"""<section class="section" id="faq">
  <div class="wrap faq-wrap">
    <div class="faq-intro">
      <h2>{title}</h2>
      <p>{intro}</p>
      <a class="arrow-link" href="tel:{TEL}">{PHONE} {ARROW}</a>
    </div>
    <div class="faq">
{rows}
    </div>
  </div>
</section>
"""


def steps(items):
    lis = "\n".join(f'      <li class="step"><span class="step-num">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>' for i, (t, d) in enumerate(items))
    return f"""<ol class="steps reveal">
{lis}
    </ol>"""


PROCESS = [
    ("Call or book", "Tell us what the car is doing and pick a time that works."),
    ("Inspect and diagnose", "We find the actual cause, not just the symptom."),
    ("Approve the estimate", "Clear pricing for parts and labor. Nothing starts until you say yes."),
    ("We do the work", "Repaired, test-driven, and ready when we said it would be."),
]

HOURS_BLOCK = """<div class="hours" aria-label="Hours">
        <div data-days="1,2,3,4,5"><span>Monday to Friday</span><span>8:00 AM – 6:00 PM</span></div>
        <div data-days="6"><span>Saturday</span><span>9:00 AM – 3:00 PM</span></div>
        <div data-days="0"><span>Sunday</span><span>Closed</span></div>
      </div>"""


# ---------- pages ----------

def home():
    rows = "\n".join(f"""      <a class="row-link" href="services.html#{sid}">
        <h3>{name}</h3>
        <p>{short}</p>
        <span class="row-arrow">{ARROW}</span>
      </a>""" for sid, name, icon, short, *_ in SERVICES)
    spec_links = [f'<a href="specialty.html#{s[0]}">{s[2].lower()}</a>' for s in SPECIALTY]
    statement = ("We're the shop for the bigger jobs: " + ", ".join(spec_links[:-1]) + " and " + spec_links[-1] +
                 ". Built right, wired clean, and set up to drive the way it should.")
    body = f"""<section class="hero3d" aria-label="Introduction">
  <div class="hero3d-stage">
    <picture class="hero-poster">
      <source media="(max-aspect-ratio: 9/10)" srcset="assets/hero-portrait.jpg">
      <img src="assets/hero-landscape.jpg" alt="" width="1280" height="720" fetchpriority="high">
    </picture>
    <video class="hero-video" muted playsinline preload="none" aria-hidden="true" data-landscape="assets/hero-landscape.mp4" data-portrait="assets/hero-portrait.mp4"></video>
    <div class="hero3d-shade"></div>
    <div class="wrap hero3d-copy">
      <div class="hero3d-a">
        <h1>Bumper to bumper.<br><span class="soft">Everything but body work.</span></h1>
        <p class="lead">Full-service auto repair in Las Vegas. Maintenance, brakes, suspension, A/C, electrical, and the engine and transmission swaps other shops turn away.</p>
        <div class="ctas">
          <a class="btn btn-solid" href="contact.html#book">Book a visit {ARROW}</a>
          <a class="btn btn-ghost" href="tel:{TEL}">{PHONE}</a>
        </div>
      </div>
      <div class="hero3d-b">
        <h2>Built to be driven.</h2>
        <p class="lead">Engine and transmission swaps, lowering and lift kits, fuel injection conversions, and A/C that holds up through a Las Vegas July.</p>
        <div class="ctas"><a class="btn btn-solid" href="specialty.html">See specialty work {ARROW}</a></div>
      </div>
    </div>
    <div class="hero3d-cue" aria-hidden="true"></div>
  </div>
</section>

<section class="facts" aria-label="Shop details">
  <div class="wrap">
    <div class="fact"><strong><span class="open-dot" aria-hidden="true"></span><span data-status style="color:inherit;font-size:inherit">Mon – Sat</span></strong><span>Mon – Fri 8 – 6, Sat 9 – 3</span></div>
    <div class="fact"><strong><a href="tel:{TEL}">{PHONE}</a></strong><span>Call or text the shop</span></div>
    <div class="fact"><strong>{STREET}</strong><span>{CITYLINE}</span></div>
    <div class="fact"><strong>Affirm, Sunbit, Klarna</strong><span>Financing available</span></div>
  </div>
</section>

<section class="section" id="services">
  <div class="wrap">
    <div class="head reveal">
      <h2>Everything your car needs to stay on the road.</h2>
      <p>Daily drivers, work trucks and family cars. Bring it in for routine service or for the problem nobody else could find.</p>
    </div>
    <div class="rows reveal">
{rows}
    </div>
    <p class="footnote"><strong>One thing we don't do:</strong> body work, paint or collision repair.</p>
  </div>
</section>

<section class="section" id="specialty">
  <div class="wrap feature">
    <figure class="media reveal"><img src="assets/photo-engine-bay.jpg" alt="Mechanic working in the engine bay of a car with the hood open" loading="lazy" style="object-position:60% 50%"></figure>
    <div class="feature-copy reveal">
      <h2>The jobs other shops send away.</h2>
      <p class="statement">{statement}</p>
      <a class="arrow-link" href="specialty.html">Explore specialty work {ARROW}</a>
    </div>
  </div>
</section>

<section class="section" id="process">
  <div class="wrap">
    <div class="head reveal">
      <h2>Straightforward, start to finish.</h2>
      <p>No surprises. You see the estimate and approve it before any work begins.</p>
    </div>
    {steps(PROCESS)}
  </div>
</section>

<section class="section">
  <div class="wrap panels">
    <div class="panel reveal">
      <h2>We work with your coverage.</h2>
      <p>Extended warranty or insurance claim? We deal with the warranty and insurance companies directly, so you're not stuck in the middle.</p>
      <a class="arrow-link" href="insurance-financing.html">How claims work {ARROW}</a>
    </div>
    <div class="panel reveal" id="financing">
      <h2>Fix it now. Pay over time.</h2>
      <div class="lenders"><span>Affirm</span><i></i><span>Sunbit</span><i></i><span>Klarna</span></div>
      <p>Split a big repair into payments with one of our financing partners.</p>
      <a class="arrow-link" href="insurance-financing.html#financing">Financing options {ARROW}</a>
    </div>
  </div>
</section>

{tow_band()}
{faq_section(FAQ)}
{closer()}"""
    return head("index.html", f"{SHOP} | Auto Repair in Las Vegas, NV",
                "Full-service auto repair in Las Vegas. Maintenance, oil changes, brakes, suspension, A/C, electrical, engine and transmission swaps. Insurance and warranty claims, financing and towing.",
                faq_ld(FAQ), FIRST_VISIT) + body + foot(HERO_SCRIPTS)


def services():
    blocks = []
    for sid, name, icon, short, long, included, signs in SERVICES:
        blocks.append(f"""    <article class="detail reveal" id="{sid}">
      <div class="detail-main">
        <h2>{name}</h2>
        <p class="lead">{long}</p>
        <a class="arrow-link" href="contact.html#book">Book {name.lower().replace('a/c', 'A/C')} {ARROW}</a>
      </div>
      <div class="detail-side">
        <div><h3>What's included</h3><ul class="list">{''.join(f'<li>{i}</li>' for i in included)}</ul></div>
        <div><h3>Signs you need it</h3><ul class="list">{''.join(f'<li>{i}</li>' for i in signs)}</ul></div>
      </div>
    </article>""")
    graph = ld({"@graph": [service_ld(s[1], s[4], "services.html#" + s[0]) for s in SERVICES]})
    body = page_hero('Full-service repair.<br><span class="soft">Bumper to bumper.</span>',
                     "Everything a car needs to stay on the road, from oil changes to electrical diagnostics. The only thing we don't do is body work.",
                     "still-wheel.jpg", "Close-up of a ten-spoke wheel and yellow brake caliper on a red sports car") + f"""
<section>
  <div class="wrap">
{chr(10).join(blocks)}
    <p class="footnote" style="padding-bottom:clamp(56px,8vw,110px)"><strong>One thing we don't do:</strong> body work, paint or collision repair. For dents or collision damage you'll need a body shop.</p>
  </div>
</section>
{closer()}"""
    return head("services.html", f"Auto Repair Services in Las Vegas | {SHOP}",
                "Maintenance, oil changes, brake jobs, suspension work, A/C repair and electrical diagnostics in Las Vegas, NV. Full-service shop, no body work.",
                breadcrumb("services.html", "Services") + "\n" + graph) + body + foot()


def specialty():
    blocks = []
    for sid, code, name, bullets, long, included in SPECIALTY:
        blocks.append(f"""    <article class="detail reveal" id="{sid}">
      <div class="detail-main">
        <h2>{name}</h2>
        <p class="lead">{long}</p>
        <a class="arrow-link" href="contact.html#book">Ask about {name.lower()} {ARROW}</a>
      </div>
      <div class="detail-side single">
        <div><h3>What we do</h3><ul class="list">{''.join(f'<li>{i}</li>' for i in included)}</ul></div>
      </div>
    </article>""")
    graph = ld({"@graph": [service_ld(s[2], s[4], "specialty.html#" + s[0]) for s in SPECIALTY]})
    body = page_hero('Swaps, kits<br><span class="soft">and conversions.</span>',
                     "Engine and transmission swaps, carburetor-to-EFI conversions, lift and lowering kits, and the electrical work that ties it all together.",
                     "photo-custom-cadillac.jpg", "Lowered black classic Cadillac convertible with flame paint and the hood up", "50% 90%") + f"""
<section>
  <div class="wrap">
{chr(10).join(blocks)}
  </div>
</section>
<section class="section">
  <div class="wrap panels">
    <div class="panel reveal">
      <h2>Planning a build?</h2>
      <p>Tell us the vehicle and what you want it to do. We'll talk through parts, timing and cost before anything gets ordered.</p>
      <a class="arrow-link" href="contact.html#book">Start the conversation {ARROW}</a>
    </div>
    <div class="panel reveal">
      <h2>Spread out the cost.</h2>
      <div class="lenders"><span>Affirm</span><i></i><span>Sunbit</span><i></i><span>Klarna</span></div>
      <p>Bigger builds can be financed through any of our partners, subject to approval.</p>
    </div>
  </div>
</section>
{closer('Talk about your build.<br><span class="soft">Call or stop by.</span>')}"""
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
    lender_rows = "\n".join(f"""      <div class="row-link" style="cursor:default">
        <h3>{n}</h3>
        <p>{d}</p>
        <span></span>
      </div>""" for n, d in lenders)
    body = page_hero('Covered repairs.<br><span class="soft">Flexible payments.</span>',
                     "We work directly with insurance and extended warranty companies, and offer financing through Affirm, Sunbit and Klarna.",
                     "still-lights.jpg", "LED headlight detail on a red sports car at dusk") + f"""
<section class="section" id="claims">
  <div class="wrap panels">
    <div class="panel reveal">
      <h2>Warranty repairs</h2>
      <p>Have an extended warranty or vehicle service contract? Bring your contract info. We diagnose the problem, contact the warranty company and handle the paperwork for covered repairs.</p>
      <ul class="ticks"><li>We call the warranty company for you</li><li>Diagnosis and documentation for the claim</li><li>You pay only your deductible and anything not covered</li></ul>
    </div>
    <div class="panel reveal">
      <h2>Insurance claims</h2>
      <p>For mechanical repairs covered by your insurance, we work with your adjuster directly, provide the estimate and photos they need, and keep you updated.</p>
      <ul class="ticks"><li>Estimates and photos for adjusters</li><li>Direct communication with your insurer</li><li>Mechanical and electrical repairs (no body work)</li></ul>
    </div>
  </div>
</section>

<section class="section" id="financing">
  <div class="wrap">
    <div class="head reveal">
      <h2>Fix it now.<br>Pay over time.</h2>
      <p>A transmission or engine job shouldn't have to wait for payday. Apply with one of our partners and split the repair into payments.</p>
    </div>
    <div class="rows reveal">
{lender_rows}
    </div>
    <p class="fine footnote">Financing is subject to approval. Rates and terms are set by each lender.</p>
  </div>
</section>
{faq_section(items, "Claims and payment.")}
{closer()}"""
    return head("insurance-financing.html", f"Insurance, Warranty & Financing | {SHOP} Las Vegas",
                "Las Vegas auto repair shop that works with insurance and extended warranty companies. Financing available with Affirm, Sunbit and Klarna.",
                breadcrumb("insurance-financing.html", "Insurance & financing") + "\n" + faq_ld(items)) + body + foot()


def towing():
    body = page_hero('Broken down?<br><span class="soft">We\'ll get it here.</span>',
                     "If your car won't start or isn't safe to drive, our towing partner Los Crazies Towing can bring it straight to the shop.",
                     "photo-shop-bay.jpg", "Purple sports car with the hood up on a two-post lift in the shop", "60% 60%") + f"""
<section class="section" style="padding-top:0">
  <div class="wrap panels">
    <div class="panel reveal">
      <h2>Los Crazies Towing</h2>
      <p>Towing across the Las Vegas valley, straight to our door.</p>
      <a class="phone-big" href="tel:+17025550199">(702) 555-0199</a>
      <p class="fine">Placeholder number until the partner's line is confirmed.</p>
    </div>
    <div class="panel reveal">
      <h2>Or call the shop</h2>
      <p>We'll arrange the tow for you and let you know when your car arrives.</p>
      <a class="phone-big" href="tel:{TEL}">{PHONE}</a>
      <a class="arrow-link" href="contact.html#tow">Request a tow online {ARROW}</a>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="head reveal">
      <h2>If you break down.</h2>
      <p>Four steps from the side of the road to a clear estimate.</p>
    </div>
    {steps([
        ("Get safe", "Pull off the road if you can, turn on your hazards and stay clear of traffic."),
        ("Call for a tow", "Call Los Crazies Towing or the shop and tell them where you are."),
        ("We take it from there", "Your car comes straight to us. We let you know when it's here."),
        ("Diagnosis and estimate", "We find the problem and give you an estimate before any work starts."),
    ])}
  </div>
</section>
{closer('Need a tow now?<br><span class="soft">Call the shop.</span>')}"""
    return head("towing.html", f"Towing to Our Las Vegas Shop | {SHOP}",
                "Car won't start? Our towing partner Los Crazies Towing brings your vehicle to Raul's Automotive in Las Vegas, NV.",
                breadcrumb("towing.html", "Towing")) + body + foot()


def contact():
    opts = ["General maintenance", "Oil change", "Brakes", "Suspension", "A/C repair", "Electrical issue",
            "Engine / transmission swap", "Lift or lowering kit", "Fuel injection conversion",
            "Insurance / warranty claim", "Need a tow", "Not sure, need a diagnosis"]
    options = "".join(f"<option>{o}</option>" for o in opts)
    body = page_hero('Get your car in.', "Call the shop or send a request and we'll confirm a time.") + f"""
<section class="section" id="book" style="padding-top:0">
  <div class="wrap book" id="tow">
    <div class="book-info">
      <a class="phone-big" href="tel:{TEL}">{PHONE}</a>
      <p><span class="open-dot" aria-hidden="true"></span><span data-status>Mon – Fri 8 AM – 6 PM · Sat 9 AM – 3 PM</span></p>
      {HOURS_BLOCK}
      <div class="addr">
        <strong>{STREET}<br>{CITYLINE}</strong>
        <a class="arrow-link" href="https://www.google.com/maps/search/?api=1&amp;query=1234+Example+Ave+Las+Vegas+NV+89101">Get directions {ARROW}</a>
      </div>
    </div>
    <form id="book-form" novalidate>
      <h2 style="font-size:clamp(1.5rem,2.4vw,2rem)">Request an appointment</h2>
      <div class="row">
        <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div>
      </div>
      <div class="row">
        <div class="field"><label for="f-vehicle">Year, make and model</label><input id="f-vehicle" name="vehicle" placeholder="2015 Chevy Silverado"></div>
        <div class="field"><label for="f-service">Service</label><select id="f-service" name="service">{options}</select></div>
      </div>
      <div class="row">
        <div class="field"><label for="f-date">Preferred day</label><input id="f-date" name="date" type="date"></div>
        <div class="field"><label for="f-pay">Payment</label><select id="f-pay" name="payment"><option>Pay at pickup</option><option>Insurance claim</option><option>Extended warranty</option><option>Financing (Affirm, Sunbit, Klarna)</option></select></div>
      </div>
      <div class="field"><label for="f-notes">What's the car doing?</label><textarea id="f-notes" name="notes" placeholder="Grinding noise when braking, started last week."></textarea></div>
      <p class="form-error" id="form-error" role="alert" hidden></p>
      <button class="btn btn-solid" type="submit">Request appointment {ARROW}</button>
      <div class="confirm" id="confirm" role="status" hidden>Demo only: on the live site, this request goes straight to the shop and you get a text to confirm your time.</div>
    </form>
  </div>
</section>
{tow_band("contact.html#tow", "Request a tow")}"""
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

# Velour Lash Studio — concept website

A 7-page static website for a lash artist, built from scratch by TORO GROWTH.
No framework and no build step: plain HTML, one stylesheet and one script.

| Page | File |
|---|---|
| Home | `index.html` (add `#build` to the URL for the screen-recording intro + auto-scroll) |
| Services & pricing | `services.html` |
| Lash map gallery | `gallery.html` |
| About | `about.html` |
| Book online | `book.html` (accepts `?service=classic`, `hybrid`, `volume`, `mega`, `fill2`, `fill3`, `foreign`, `lift`, `brow`) |
| Aftercare & FAQ | `aftercare.html` |
| Contact | `contact.html` |

Shared code lives in `assets/site.css` and `assets/site.js`. Services, prices,
add-ons and gallery lash maps are data arrays at the top of `site.js`, so a
price change is a one-line edit.

## Going live

Any static host works. With GitHub Pages: repo **Settings → Pages → Deploy from
a branch**, pick the branch and `/ (root)`, and the site is served at
`https://<user>.github.io/<repo>/demos/lash-studio/`. For a client domain, add
a `CNAME` record pointing at the host.

## Before using for a real client

- Replace the studio name, artist bio, phone, email, hours and reviews (all placeholders).
- Swap the lash illustrations in the gallery for real client photos.
- Booking and contact forms are front-end only. Connect them to a real system
  (Square Appointments, Vagaro, GlossGenius, Calendly, or a form service) before launch.

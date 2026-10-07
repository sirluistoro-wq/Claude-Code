# Verelle Lash Studio (demo site)

Static, dependency-free website: `index.html`, `styles.css`, `main.js` and self-hosted fonts in `assets/fonts`.
Open `index.html` in a browser, or serve the folder with any static host.

## Photos
Every `<figure class="photo">` is a photo slot. Add the image to `assets/photos/` with the file name already
used in `index.html` and it appears automatically. Until then the slot shows a soft colour block and a note
describing the photo it needs.

| File | Shot |
| --- | --- |
| `hero-main.jpg` | Finished set, close-up, eyes closed, soft window light (portrait 4:5) |
| `hero-side.jpg` | Hands and tweezers placing a lash (landscape 4:3) |
| `about.jpg` | The studio, or the lash artist at work (portrait 3:4) |
| `service-classic.jpg`, `service-hybrid.jpg`, `service-volume.jpg`, `service-mega.jpg`, `service-lift.jpg` | One finished set per service (portrait 4:5), shown when hovering a service row |
| `look-natural.jpg`, `look-doll.jpg`, `look-cat.jpg`, `look-squirrel.jpg` | Eye open, side angle, one per lash map (portrait 3:4) |
| `gallery-1.jpg` to `gallery-6.jpg` | Recent sets, mixed portrait, square and landscape |
| `expect.jpg` | Client resting during a set (portrait 4:5) |
| `book.jpg` | Studio entrance or treatment room (portrait 4:5) |

Use real photos of real work, 2000 px on the long edge, JPG or WebP under 300 KB.

## Make it the client's
- Name, copy, prices, address: search `Verelle` and edit the text in `index.html`.
- Colours and fonts: variables at the top of `styles.css`.
- Booking form: front-end only. Connect the `#form` submit handler in `main.js` to the client's booking tool.

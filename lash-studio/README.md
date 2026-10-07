# Verelle Lash Studio (demo site)

Static, dependency-free website: `index.html`, `styles.css`, `main.js` and self-hosted fonts in `assets/fonts`.
Open `index.html` in a browser, or serve the folder with any static host.

## Video (scrubs with scroll)
The hero is a pinned, full-bleed horizontal video. As you scroll it plays forward, shrinks into the page and the headline fades out.
Any other photo slot can do the same: give its `<figure class="photo">` a `data-video="assets/video/name.mp4"` attribute
(already added to the About and What to expect slots). If the file is missing the slot falls back to its photo.

| File | Clip |
| --- | --- |
| `assets/video/hero.mp4` (+ `hero.webm`) | Horizontal 16:9 clip of a lash artist at work (included) |
| `assets/video/about.mp4` (+ `about.webm`) | Portrait of the owner (included) |
| `assets/video/expect.mp4` | Client resting during a set, portrait 4:5, 5 to 10 seconds |
| `assets/video/look-doll.mp4`, `look-cat.mp4` (+ `.webm`) | All four are included |

Scrubbing is smoothest when every frame is a keyframe. Export with:

```
ffmpeg -i input.mp4 -vf scale=1920:-2 -an -c:v libx264 -g 1 -crf 24 -movflags +faststart assets/video/hero.mp4
```

Keep each file under about 15 MB. The host must support range requests (every normal host does).

## Photos
Every `<figure class="photo">` is a photo slot. Add the image to `assets/photos/` with the file name already
used in `index.html` and it appears automatically. Until then the slot shows a soft colour block and a note
describing the photo it needs.

| File | Shot |
| --- | --- |
| `hero-main.jpg` | Finished set, close-up, eyes closed, soft window light (portrait 4:5) |
| `hero-side.jpg` | Hands and tweezers placing a lash (landscape 4:3) |
| `about.jpg` | The studio, or the lash artist at work (portrait 3:4) |
| `service-classic.jpg`, `service-hybrid.jpg`, `service-volume.jpg`, `service-mega.jpg`, `service-lift.jpg` | One photo per service (included, portrait 4:5). Shown when hovering a row on desktop, and as a thumbnail on phones |
| `look-natural.jpg`, `look-doll.jpg`, `look-cat.jpg`, `look-squirrel.jpg` | Both eyes open, one per lash map (landscape 4:3) |
| `gallery-1.jpg` to `gallery-6.jpg` | Recent sets. All six are included |
| `expect.jpg` | Lash artist placing a set (included, portrait 4:5) |
| `book.jpg` | Studio entrance or treatment room (portrait 4:5) |

Use real photos of real work, 2000 px on the long edge, JPG or WebP under 300 KB.

## Make it the client's
- Name, copy, prices, address: search `Verelle` and edit the text in `index.html`.
- Colours and fonts: variables at the top of `styles.css`.
- Booking form: front-end only. Connect the `#form` submit handler in `main.js` to the client's booking tool.

# Verelle — Lash Atelier (demo site)

Static, dependency-free website: `index.html`, `styles.css`, `main.js` and self-hosted fonts in `assets/fonts`.
Open `index.html` in a browser, or serve the folder with any static host.

## Make it the client's
- **Name / copy / prices / address:** search `Verelle` in `index.html`, and edit the text in place.
- **Colours & fonts:** tokens at the top of `styles.css` (`:root`).
- **Photos:** every `.ph` block is a photo slot that currently shows a coded illustration.
  Drop an `<img>` inside it and the illustration is skipped automatically:

  ```html
  <figure class="ph ph--arch" data-plate="doll" data-tone="ink">
    <img src="assets/photos/set-01.jpg" alt="Volume set, close-up">
  </figure>
  ```
- **Booking form:** front-end only. Connect it to the client's booking tool or form service in `main.js` (`#form` submit handler).

## Photos worth shooting (real work only)
1. Macro close-up of a finished set, eyes closed, soft window light (hero, `ph--arch`).
2. Same eye from the side, showing curl and length.
3. One shot per style: Classic, Hybrid, Volume, Mega, Lift.
4. The studio: chair, tools, hands working (no faces needed).
5. A before / after pair.
Aim for 3:4 portrait, 2000 px on the long edge, JPG or WebP under 300 KB.

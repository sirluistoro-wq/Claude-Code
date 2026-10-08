# Raul's Automotive: media pipeline

- `../build.py` generates the site pages into `demos/raul-auto/`.
- `car-scene.js` + `render.js` render stills (`still-*.jpg`) from the 3D sunset scene. The live site now uses real photos, so these are not deployed:
  `node render.js /path/to/three.min.js(r128) ../../raul-auto/assets`
  Add `--videos` to also re-render the 3D hero clips (this overwrites the stock footage below).

## Hero video

The hero uses a 4 s stock clip supplied by Toro Growth (orange supercar, 1920x1080, 25 fps).
It is mirrored so the car sits clear of the headline and encoded for scroll scrubbing
(keyframe every 6 frames, no B-frames, no audio):

    ffmpeg -i src.mp4 -vf "hflip,scale=1280:720" -c:v libx264 -crf 24 -g 6 -keyint_min 6 -sc_threshold 0 -bf 0 -movflags +faststart -an hero-landscape.mp4
    ffmpeg -i src.mp4 -vf "hflip,crop=608:1080:1100:0,scale=720:1280" (same options) hero-portrait.mp4

WebM copies (`libvpx-vp9 -crf 36 -g 6`) and first-frame posters (`hero-*.jpg`) sit alongside.

# _Muybridge in Motion_

Between 1872 and 1887, Eadweard Muybridge photographed bodies in motion: horses galloping, men wrestling, women climbing stairs, birds in flight. His _Animal Locomotion_ plates, 781 in all, broke movement into its component frames and made visible what the eye alone cannot follow.

This project collects those digitized plates and animates them. Each is assembled from IIIF images held at the National Gallery of Art, the Smithsonian, and other institutions into a single collection. Each item represented by a Manifest is then played as a sequence so the motion reads as Muybridge intended. The result is a digital edition of a nineteenth-century scientific landmark and a demonstration of what open, interoperable collections can do and how IIIF can bring to life flat images.

## Using the Site

Browse the full collection on the search page, where plates can be filtered by animal and movement. Each plate opens a viewer that plays the animation and shows the original photographic frames.

https://nulib-ds.github.io/muybridge/

## Running Locally

Requires [Node.js](https://nodejs.org/) 24 or later.

```bash
npm install
npm run dev
```

The site runs at `http://localhost:5001`.

## Colophon

Built with [Canopy IIIF](https://canopy-iiif.github.io/app/), an open-source static site generator for IIIF-based digital collections. The image viewer is [Clover IIIF](https://samvera-labs.github.io/clover-iiif/), a React viewer for IIIF Presentation API 3.0. Both are open-source and released under the MIT License.

## Credits

- Mat Jordan, Northwestern University

## License

MIT. The photographic materials reproduced here are held by their respective institutions under their own terms of use.

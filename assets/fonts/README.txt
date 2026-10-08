Webfonts self-hosted for ionixgroup.it (no third-party font CDN).

- Inter            — SIL Open Font License 1.1 — https://github.com/rsms/inter
- IBM Plex Mono    — SIL Open Font License 1.1 — https://github.com/IBM/plex
- Bodoni Moda      — SIL Open Font License 1.1 — https://github.com/indestructible-type/Bodoni

Subsets: latin + latin-ext only. Files pulled from Google Fonts' own
woff2 build (which is the OFL-licensed upstream), then served from our
own domain so visitor IPs are never sent to Google.

_fontface.css / ../site-fonts.css contain the @font-face rules.

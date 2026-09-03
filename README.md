# Lyric Finder

An accessible, responsive, client-side song lyric search app. Enter a song title and optional artist, then retrieve lyrics through free public APIs.

## Features

- Search by song title and optional artist
- LRCLIB lookup and search with lyrics.ovh fallback
- Semantic landmarks, skip link, labels, keyboard-friendly controls, visible focus styles, and live status/error announcements
- High-contrast dark theme with responsive layout
- Copy Lyrics button using the Clipboard API
- No build step, dependencies, backend, API key, or user data storage

## Run locally

Open `index.html` in a browser, or serve this folder with any static web server. Some browsers restrict requests from `file://` pages, so a local server is recommended, for example:

```sh
python3 -m http.server
```

Then visit `http://localhost:8000`.

## API and licensing note

The app requests lyrics from [LRCLIB](https://lrclib.net/) and falls back to [lyrics.ovh](https://lyrics.ovh/). Provider availability, CORS behavior, and lyric licensing can change. Lyrics are displayed for personal lookup and remain subject to each provider's terms and applicable copyright law.

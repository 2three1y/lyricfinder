const form = document.querySelector('#search-form');
const titleInput = document.querySelector('#title');
const artistInput = document.querySelector('#artist');
const searchButton = document.querySelector('#search-button');
const status = document.querySelector('#search-status');
const error = document.querySelector('#search-error');
const results = document.querySelector('#results');
const songName = document.querySelector('#song-name');
const sourceLabel = document.querySelector('#source-label');
const lyricsBox = document.querySelector('#lyrics');
const copyButton = document.querySelector('#copy-button');
const copyStatus = document.querySelector('#copy-status');

function setBusy(message) { status.textContent = message; error.textContent = ''; searchButton.disabled = true; }
function setIdle() { searchButton.disabled = false; }
function cleanLyrics(value) { return String(value || '').replace(/\\r\\n/g, '\\n').trim(); }
function normalized(value) { return value.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, ' ').trim(); }

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally { clearTimeout(timeout); }
}

async function lrclibGet(title, artist) {
  const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
  const data = await fetchJson(url);
  return cleanLyrics(data.plainLyrics) ? { lyrics: data.plainLyrics, source: 'LRCLIB exact lookup' } : null;
}

async function lrclibSearch(query, title, artist) {
  const data = await fetchJson(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
  if (!Array.isArray(data)) return null;
  const wantedTitle = normalized(title);
  const wantedArtist = normalized(artist);
  const withLyrics = data.filter(item => cleanLyrics(item.plainLyrics));
  // Prefer an exact title/artist match, but accept a title match when metadata differs.
  const exact = withLyrics.find(item => normalized(item.trackName) === wantedTitle &&
    (!wantedArtist || normalized(item.artistName) === wantedArtist));
  const titleMatch = withLyrics.find(item => normalized(item.trackName) === wantedTitle);
  const match = exact || titleMatch || withLyrics[0];
  return match ? { lyrics: match.plainLyrics, source: 'LRCLIB search' } : null;
}

async function lyricsOvh(title, artist) {
  const data = await fetchJson(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
  return cleanLyrics(data.lyrics) ? { lyrics: data.lyrics, source: 'lyrics.ovh' } : null;
}

async function searchLyrics(title, artist) {
  const attempts = [];
  if (artist) attempts.push(() => lrclibGet(title, artist));
  // Search is intentionally attempted with multiple query shapes: providers can index
  // artist/title metadata differently, and /api/get is an exact metadata lookup.
  for (const query of [...new Set([`${artist} ${title}`.trim(), title, artist].filter(Boolean))]) {
    attempts.push(() => lrclibSearch(query, title, artist));
  }
  if (artist) attempts.push(() => lyricsOvh(title, artist));
  const settled = await Promise.allSettled(attempts.map(attempt => attempt()));
  const result = settled.find(item => item.status === 'fulfilled' && item.value);
  if (result) return result.value;
  throw new Error('No lyrics were found in the available providers. Try the title alone or check the spelling.');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const artist = artistInput.value.trim();
  if (!title) { error.textContent = 'Enter a song title to search.'; titleInput.focus(); return; }
  setBusy('Searching for lyrics…'); results.hidden = true; copyStatus.textContent = '';
  try {
    const result = await searchLyrics(title, artist);
    lyricsBox.textContent = cleanLyrics(result.lyrics);
    songName.textContent = artist ? `${title} — ${artist}` : title;
    sourceLabel.textContent = `Source: ${result.source}`;
    results.hidden = false; status.textContent = 'Lyrics loaded.'; results.focus();
  } catch (err) { error.textContent = err.message; status.textContent = ''; }
  finally { setIdle(); }
});

copyButton.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(lyricsBox.textContent); copyStatus.textContent = 'Lyrics copied to your clipboard.'; }
  catch (_) { copyStatus.textContent = 'Copy failed. Select the lyrics and copy them manually.'; }
});

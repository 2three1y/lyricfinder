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
function cleanLyrics(value) { return String(value || '').replace(/\r\n/g, '\n').trim(); }

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function searchLyrics(title, artist) {
  const encodedTitle = encodeURIComponent(title);
  const encodedArtist = encodeURIComponent(artist);
  if (artist) {
    try {
      const data = await fetchJson(`https://lrclib.net/api/get?track_name=${encodedTitle}&artist_name=${encodedArtist}`);
      if (cleanLyrics(data.plainLyrics)) return { lyrics: data.plainLyrics, source: 'LRCLIB' };
    } catch (_) { /* Try the next provider. */ }
    try {
      const data = await fetchJson(`https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`);
      if (cleanLyrics(data.lyrics)) return { lyrics: data.lyrics, source: 'lyrics.ovh' };
    } catch (_) { /* Report one friendly error after all fallbacks. */ }
  }
  try {
    const data = await fetchJson(`https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`.trim())}`);
    const match = data.find(item => cleanLyrics(item.plainLyrics));
    if (match) return { lyrics: match.plainLyrics, source: 'LRCLIB search' };
  } catch (_) { /* No result from search. */ }
  throw new Error('No lyrics were found. Try a more specific title and artist.');
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
    results.hidden = false; status.textContent = 'Lyrics loaded.';
    results.focus();
  } catch (err) { error.textContent = err.message; status.textContent = ''; }
  finally { setIdle(); }
});

copyButton.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(lyricsBox.textContent); copyStatus.textContent = 'Lyrics copied to your clipboard.'; }
  catch (_) { copyStatus.textContent = 'Copy failed. Select the lyrics and copy them manually.'; }
});

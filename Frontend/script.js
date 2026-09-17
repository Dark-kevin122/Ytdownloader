const BACKEND = 'http://localhost:5000';

const goBtn = document.getElementById('goBtn');
const urlInput = document.getElementById('url');
const errorMsg = document.getElementById('errorMsg');
const progressBlock = document.getElementById('progressBlock');
const pStatus = document.getElementById('pStatus');
const pPct = document.getElementById('pPct');
const pFill = document.getElementById('pFill');

// Result card (thumbnail + quality list) search-row ke turant niche create karo
const resultCard = document.createElement('div');
resultCard.className = 'result-card';
resultCard.innerHTML = `
  <div class="result-thumb">
    <img id="thumbImg" src="" alt="thumbnail">
    <span class="result-duration" id="thumbDuration"></span>
  </div>
  <div class="result-info">
    <p class="result-title" id="resultTitle"></p>
    <div class="quality-list" id="qualityList"></div>
    <button type="button" class="confirm-download-btn" id="confirmDownloadBtn" disabled>Quality select karo</button>
  </div>
`;
document.querySelector('.search-row').insertAdjacentElement('afterend', resultCard);

const thumbImg = resultCard.querySelector('#thumbImg');
const thumbDuration = resultCard.querySelector('#thumbDuration');
const resultTitle = resultCard.querySelector('#resultTitle');
const qualityList = resultCard.querySelector('#qualityList');
const confirmDownloadBtn = resultCard.querySelector('#confirmDownloadBtn');

let currentUrl = '';
let currentTitle = 'video';
let selectedQuality = null;

goBtn.addEventListener('click', async () => {
  currentUrl = urlInput.value.trim();
  errorMsg.style.display = 'none';
  resultCard.classList.remove('open');
  selectedQuality = null;

  if (!currentUrl || !currentUrl.includes('youtu')) {
    errorMsg.style.display = 'block';
    return;
  }

  goBtn.disabled = true;
  goBtn.textContent = 'Loading...';

  try {
    const res = await fetch(`${BACKEND}/formats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentUrl }),
    });

    if (!res.ok) throw new Error('Formats fetch failed');

    const data = await res.json();
    currentTitle = data.title || 'video';

    if (!data.formats || data.formats.length === 0) {
      throw new Error('Koi quality nahi mili');
    }

    renderResultCard(data);
  } catch (err) {
    console.error('Error:', err);
    errorMsg.textContent = 'Kuch galat hua, dubara try karo.';
    errorMsg.style.display = 'block';
  } finally {
    goBtn.disabled = false;
    goBtn.textContent = 'Download';
  }
});

function formatBytes(bytes) {
  if (!bytes) return 'Size unknown';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `~${(mb / 1024).toFixed(2)} GB`;
  return `~${mb.toFixed(1)} MB`;
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function renderResultCard(data) {
  thumbImg.src = data.thumbnail || '';
  thumbDuration.textContent = formatDuration(data.duration);
  resultTitle.textContent = data.title;

  qualityList.innerHTML = '';
  selectedQuality = null;
  confirmDownloadBtn.disabled = true;
  confirmDownloadBtn.textContent = 'Quality select karo';

  data.formats.forEach((f) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'quality-option';
    option.innerHTML = `
      <span class="q-left">
        <input type="radio" name="quality" ${false}>
        <span class="q-name">${f.quality}</span>
        <span class="q-ext">${f.ext.toUpperCase()}</span>
      </span>
      <span class="q-size">${formatBytes(f.filesize)}</span>
    `;

    option.addEventListener('click', () => {
      qualityList.querySelectorAll('.quality-option').forEach((el) => {
        el.classList.remove('selected');
        el.querySelector('input[type="radio"]').checked = false;
      });
      option.classList.add('selected');
      option.querySelector('input[type="radio"]').checked = true;

      selectedQuality = f.height; // e.g. 480
      confirmDownloadBtn.disabled = false;
      confirmDownloadBtn.textContent = `Download ${f.quality}`;
    });

    qualityList.appendChild(option);
  });

  resultCard.classList.add('open');
}

confirmDownloadBtn.addEventListener('click', () => {
  if (!selectedQuality) return;
  startDownload(selectedQuality);
});

async function startDownload(quality) {
  confirmDownloadBtn.disabled = true;
  progressBlock.style.display = 'block';
  pStatus.textContent = 'Video process ho raha hai...';
  pPct.textContent = '0%';
  pFill.style.width = '0%';

  try {
    const res = await fetch(`${BACKEND}/ytlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentUrl, quality }),
    });

    if (!res.ok) throw new Error('Download request failed');

    const data = await res.json();

    pStatus.textContent = 'File save ho rahi hai...';
    await downloadFile(data.videoUrl, `${currentTitle}.mp4`);

    pStatus.textContent = 'Download complete!';
    pPct.textContent = '100%';
    pFill.style.width = '100%';

    setTimeout(() => { progressBlock.style.display = 'none'; }, 2000);
  } catch (err) {
    console.error('Download error:', err);
    pStatus.textContent = 'Download fail ho gaya.';
  } finally {
    confirmDownloadBtn.disabled = false;
  }
}

// File ko blob ke through save karo — isse page navigate nahi hoga
async function downloadFile(fileUrl, filename) {
  const response = await fetch(fileUrl);
  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;

    if (total) {
      const pct = Math.round((received / total) * 100);
      pPct.textContent = `${pct}%`;
      pFill.style.width = `${pct}%`;
    }
  }

  const blob = new Blob(chunks);
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

document.querySelectorAll('.faq-question').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    item.classList.toggle('open');
  });
});
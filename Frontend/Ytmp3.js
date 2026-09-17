const BACKEND = 'http://localhost:5000';

const goBtn = document.getElementById('goBtn');
const urlInput = document.getElementById('url');
const errorMsg = document.getElementById('errorMsg');
const progressBlock = document.getElementById('progressBlock');
const pStatus = document.getElementById('pStatus');
const pPct = document.getElementById('pPct');
const pFill = document.getElementById('pFill');

// Audio result card search-row ke turant niche create karo
const audioResultCard = document.createElement('div');
audioResultCard.className = 'audio-result-card';
audioResultCard.innerHTML = `
  <span class="audio-icon">♪</span>
  <div class="audio-info">
    <p class="audio-filename" id="audioFilename"></p>
    <p class="audio-meta">MP3 audio</p>
  </div>
  <button type="button" class="audio-download-btn" id="audioDownloadBtn">Download</button>
`;
document.querySelector('.search-row').insertAdjacentElement('afterend', audioResultCard);

const audioFilenameEl = audioResultCard.querySelector('#audioFilename');
const audioDownloadBtn = audioResultCard.querySelector('#audioDownloadBtn');

let currentAudioUrl = '';
let currentFilename = 'audio.mp3';

goBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  errorMsg.style.display = 'none';
  audioResultCard.classList.remove('open');

  if (!url || !url.includes('youtu')) {
    errorMsg.style.display = 'block';
    return;
  }

  goBtn.disabled = true;
  goBtn.textContent = 'Processing...';
  progressBlock.style.display = 'block';
  pStatus.textContent = 'Audio extract ho raha hai...';
  pPct.textContent = '0%';
  pFill.style.width = '30%'; // extraction ke waqt exact % nahi milta, isliye indeterminate feel

  try {
    const res = await fetch(`${BACKEND}/ytlinkmp3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) throw new Error('Audio extraction failed');

    const data = await res.json();

    currentAudioUrl = data.audioUrl;
    currentFilename = data.filename;

    audioFilenameEl.textContent = currentFilename;
    audioResultCard.classList.add('open');

    pStatus.textContent = 'Ready to download';
    pPct.textContent = '100%';
    pFill.style.width = '100%';
    setTimeout(() => { progressBlock.style.display = 'none'; }, 1500);

  } catch (err) {
    console.error('Error:', err);
    errorMsg.textContent = 'Kuch galat hua, dubara try karo.';
    errorMsg.style.display = 'block';
    progressBlock.style.display = 'none';
  } finally {
    goBtn.disabled = false;
    goBtn.textContent = 'Download';
  }
});

audioDownloadBtn.addEventListener('click', async () => {
  if (!currentAudioUrl) return;

  audioDownloadBtn.disabled = true;
  audioDownloadBtn.textContent = 'Saving...';

  try {
    const response = await fetch(currentAudioUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = currentFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download error:', err);
  } finally {
    audioDownloadBtn.disabled = false;
    audioDownloadBtn.textContent = 'Download';
  }
});

document.querySelectorAll('.faq-question').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    item.classList.toggle('open');
  });
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');   // ✅ yeh missing tha
const ytDlp = require('yt-dlp-exec');

const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL || PORT;


const app = express();

app.use(express.static('../Frontend'));

app.use(cors({
    exposedHeaders: ['Content-Length'],
}));
app.use(express.json());
app.use("/videos", express.static("videos"));
app.use("/audio", express.static("audio"));



app.post('/formats', async (req, res) => {
  const { url } = req.body;
  try {
    const info = await ytDlp(url, {
      dumpSingleJson: true,
    });

    // Sirf useful video formats filter karo (jinme height defined hai)
    const formats = info.formats
      .filter(f => f.vcodec !== 'none' && f.height)
      .map(f => ({
        formatId: f.format_id,
        quality: `${f.height}p`,
        height: f.height,
        ext: f.ext,
        fps: f.fps,
        filesize: f.filesize || f.filesize_approx || null, // bytes me, kabhi kabhi null hota hai
      }))
      // duplicate heights hatao, unique qualities rakho (jisme filesize maujood ho use priority do)
      .filter((f, i, arr) => arr.findIndex(x => x.quality === f.quality) === i)
      .sort((a, b) => b.height - a.height);

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats,
    });
  } catch (error) {
    res.status(500).json({ error: error.stderr || error.message });
  }
});





app.post('/ytlinkmp3', async (req, res) => {
    const { url } = req.body;

    const ffmpegPath = 'C:/Users/Deva/AppData/Local/Microsoft/WinGet/Packages/yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-N-125875-g5d4d3bdc61-win64-gpl/bin';

    const dir = 'audio';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    try {

        const info = await ytDlp(url, {
            dumpSingleJson: true,
        });

        const safeTitle = info.title
            .replace(/[^\w\s-]/g, '')   // special chars hatao
            .trim()
            .replace(/\s+/g, '_')       // spaces ko underscore karo
            .slice(0, 100);             // bahut lamba naam bhi issue karta hai

        const filenameBase = `${safeTitle}_${Date.now()}`;

        // Sirf audio nikaalo aur MP3 me convert karo (koi video download nahi hoga)
        await ytDlp(url, {
            output: `audio/${filenameBase}.%(ext)s`,
            format: 'bestaudio/best',
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0, // best quality
            restrictFilenames: true,
            ffmpegLocation: ffmpegPath,
        });

        const filename = `${filenameBase}.mp3`;

        console.log('Audio extract complete:', filename);

        return res.json({
            audioUrl: `${BASE_URL}/audio/${filename}`,
            filename,
            title: info.title,
        });

    } catch (error) {
        console.error('Error:', error.stderr || error.message || error);
        return res.status(500).json({
            error: error.stderr || error.message || 'Audio extraction failed'
        });
    }
});

app.post('/ytlink', async (req, res) => {
    const { url, quality } = req.body;


    const ffmpegPath = 'C:/Users/Deva/AppData/Local/Microsoft/WinGet/Packages/yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-N-125875-g5d4d3bdc61-win64-gpl/bin';

    // Agar frontend ne quality bheji hai (jaise "480"), usi height tak best format lo, warna overall best
    const formatString = quality
        ? `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${quality}][ext=mp4]`
        : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4';

    try {

        const info = await ytDlp(url, {
            dumpSingleJson: true,
        });

        const safeTitle = info.title
            .replace(/[^\w\s-]/g, '')   // special chars hatao
            .trim()
            .replace(/\s+/g, '_')       // spaces ko underscore karo
            .slice(0, 100);             // bahut lamba naam bhi issue karta hai

        const filename = `${safeTitle}_${Date.now()}.mp4`; // restrictFilenames hone se safe naam milega

        // Step 2: Ab actual download karo
        await ytDlp(url, {
            output: `videos/${filename}`,
            format: formatString,
            mergeOutputFormat: 'mp4',
            restrictFilenames: true,
            ffmpegLocation: ffmpegPath,
        });

        console.log('Download complete:', filename);

        return res.json({
            videoUrl: `${BASE_URL}/videos/${filename}`
        });

    } catch (error) {
        console.error('Error:', error.stderr || error.message || error);
        return res.status(500).json({
            error: error.stderr || error.message || 'Download failed'
        });
    }
});



app.listen(PORT, () => console.log('server running'));
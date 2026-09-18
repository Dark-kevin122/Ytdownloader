const express = require('express');
const ytDlp = require('yt-dlp-exec');
const videoRouter = express.Router();

const {videoProcess} = require('../Controller/Ytvideoprocess.controller');

videoRouter.post('/formats',async (req, res) => {
  const { url } = req.body;
  console.log(url);

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
})














videoRouter.post('/ytlink',videoProcess);





module.exports = videoRouter;
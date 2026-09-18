const ytDlp = require('yt-dlp-exec');
const BASE_URL = process.env.BASE_URL || PORT;
const fs = require('fs');
const path = require('path'); 


const ytmp3Process = async (req,res) => {
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
}
module.exports = {ytmp3Process}
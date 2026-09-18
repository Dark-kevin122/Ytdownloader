const ytDlp = require('yt-dlp-exec');
const BASE_URL = process.env.BASE_URL || PORT;


const videoProcess = async (req,res) => {
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
}
module.exports = {videoProcess}
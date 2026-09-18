require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');   // ✅ yeh missing tha
const ytDlp = require('yt-dlp-exec');
const videoRouter = require('./Routers/ytdownload.routes');
const ytmp3Router = require('./Routers/ytmp3download.routes')


const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL || PORT;


const app = express();

app.use(express.static('../Frontend'));

app.use(cors({
    exposedHeaders: ['Content-Length'],
}));
app.use(express.json());


app.use("/api/videos", express.static("videos"));
app.use("/api/audio", express.static("audio"));



app.use('/api',videoRouter);


app.use('/api',videoRouter);


app.use('/api', ytmp3Router);






app.listen(PORT, () => console.log('server running'));
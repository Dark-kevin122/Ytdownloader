const express = require('express');
const ytmp3Router = express.Router();
const {ytmp3Process} = require('../Controller/Ytmp3process.controller');



ytmp3Router.post('/ytlinkmp3', ytmp3Process)



module.exports = ytmp3Router;


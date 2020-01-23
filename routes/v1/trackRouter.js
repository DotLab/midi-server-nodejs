const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const trackController = require('../../controllers/trackController');
const {createTypeChecker, STRING, NUMBER, createTokenChecker} = require('./utils.js');

router.post('/cover', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const buffer = req.body.buffer;

  res.json(await trackController.coverUpload({
    token, buffer,
  }));
});

router.post('/upload', createTypeChecker({
  'token': STRING,
  'fileNames': [STRING],
  'fileSizes': [NUMBER],
  '-coverUrl': STRING,
  'title': STRING,
  '-type': STRING,
  '-genre': STRING,
  '-tags': STRING,
  '-description': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const buffers = req.body. buffers;
  const fileNames = req.body.fileNames;
  const fileSizes = req.body.fileSizes;
  const coverUrl = req.body.coverUrl;
  const title = req.body.title;
  const type = req.body.type;
  const genre = req.body.genre;
  const tags = req.body.tags;
  const description = req.body.description;

  res.json(await trackController.upload({
    token, buffers, fileNames, fileSizes, coverUrl, title, type, genre, tags, description,
  }));
});


module.exports = router;

const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const trackController = require('../../controllers/trackController');
const {createTypeChecker, STRING, OBJECT_ID, NUMBER, createTokenChecker} = require('./utils.js');

router.post('/upload', createTypeChecker({
  'token': STRING,
  'albumId': OBJECT_ID,
  'fileName': STRING,
  'fileSize': NUMBER,
  'genre': STRING,
  'tags': STRING,
  'description': STRING,
 
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const albumId = req.body.albumId;
  const buffer = req.body.buffer;
  const fileName = req.body.fileName;
  const fileSize = req.body.fileSize;
  const genre = req.body.genre;
  const tags = req.body.tags;
  const description = req.body.description;

  res.json(await trackController.upload({
    token, albumId, fileName, fileSize, genre, tags, description
  }));
});

module.exports = router;

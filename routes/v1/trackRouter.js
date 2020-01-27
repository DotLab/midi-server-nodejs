const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const trackController = require('../../controllers/trackController');
const {createTypeChecker, STRING, OBJECT_ID, NUMBER, createTokenChecker} = require('./utils.js');

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
  'albumTitle': STRING,
  'type': STRING,
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
  const albumTitle = req.body.albumTitle;
  const type = req.body.type;
  const genre = req.body.genre;
  const tags = req.body.tags;
  const description = req.body.description;

  res.json(await trackController.upload({
    token, buffers, fileNames, fileSizes, coverUrl, title, albumTitle, type, genre, tags, description,
  }));
});

router.post('/detail', createTypeChecker({
  'trackId': OBJECT_ID,
}), async (req, res) => {
  const trackId = req.body.trackId;

  res.json(await trackController.detail({
    trackId,
  }));
});

router.post('/comment/create', createTypeChecker({
  'token': STRING,
  'trackId': OBJECT_ID,
  'comment': STRING,
  'timestamp': NUMBER,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const trackId = req.body.trackId;
  const comment = req.body.comment;
  const timestamp = req.body.timestamp;
  res.json(await trackController.createComment({
    token, trackId, comment, timestamp,
  }));
});

router.post('/comment/delete', createTypeChecker({
  'token': STRING,
  'commentId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const commentId = req.body.commentId;

  res.json(await trackController.deleteComment({
    token, commentId,
  }));
});


router.post('/comment-list', createTypeChecker({
  '-token': STRING,
  'trackId': OBJECT_ID,
  'limit': NUMBER,
}), async (req, res) => {
  const token = req.body.token;
  const trackId = req.body.trackId;
  const limit = req.body.limit;

  res.json(await trackController.commentList({
    token, trackId, limit,
  }));
});

router.post('/in-album', createTypeChecker({
  'trackId': OBJECT_ID,
}), async (req, res) => {
  const trackId = req.body.trackId;

  res.json(await trackController.inAlbum({
    trackId,
  }));
});

router.post('/related-tracks', createTypeChecker({
  'trackId': OBJECT_ID,
}), async (req, res) => {
  const trackId = req.body.trackId;

  res.json(await trackController.relatedTracks({
    trackId,
  }));
});

router.post('/signed-url', createTypeChecker({
  'trackId': OBJECT_ID,
}), async (req, res) => {
  const trackId = req.body.trackId;

  res.json(await trackController.getSignedUrl({
    trackId,
  }));
});

router.post('/download', createTypeChecker({
  'trackId': OBJECT_ID,
}), async (req, res) => {
  const trackId = req.body.trackId;

  res.json(await trackController.download({
    trackId,
  }));
});


router.post('/like', createTypeChecker({
  'token': STRING,
  'trackId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const trackId = req.body.trackId;

  res.json(await trackController.like({
    token, trackId,
  }));
});

router.post('/unlike', createTypeChecker({
  'token': STRING,
  'trackId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const trackId = req.body.trackId;

  res.json(await trackController.unlike({
    token, trackId,
  }));
});

router.post('/like-count', createTypeChecker({
  'trackId': OBJECT_ID,
}), async (req, res) => {
  const trackId = req.body.trackId;

  res.json(await trackController.likeCount({
    trackId,
  }));
});


router.post('/like-status', createTypeChecker({
  'token': STRING,
  'trackId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const trackId = req.body.trackId;

  res.json(await trackController.likeStatus({
    token, trackId,
  }));
});

router.post('/delete', createTypeChecker({
  'token': STRING,
  'trackId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const trackId = req.body.trackId;

  res.json(await trackController.delete({
    token, trackId,
  }));
});

router.post('/new-releases', createTypeChecker({
  'limit': NUMBER,
}), async (req, res) => {
  const limit = req.body.limit;

  res.json(await trackController.newReleases({
    limit,
  }));
});

router.post('/trending', createTypeChecker({
  'limit': NUMBER,
}), async (req, res) => {
  const limit = req.body.limit;

  res.json(await trackController.trending({
    limit,
  }));
});

router.post('/favored', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  res.json(await trackController.favored({
    token,
  }));
});

router.post('/edit', createTypeChecker({
  'token': STRING,
  'trackId': OBJECT_ID,
  'coverUrl': STRING,
  'title': STRING,
  '-genre': STRING,
  '-tags': STRING,
  '-description': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const trackId = req.body.trackId;
  const coverUrl = req.body.coverUrl;
  const title = req.body.title;
  const genre = req.body.genre;
  const tags = req.body.tags;
  const description = req.body.description;

  res.json(await trackController.edit({
    token, trackId, coverUrl, title, genre, tags, description,
  }));
});
module.exports = router;

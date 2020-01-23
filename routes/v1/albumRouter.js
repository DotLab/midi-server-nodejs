const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const albumController = require('../../controllers/albumController');
const {createTypeChecker, STRING, OBJECT_ID, NUMBER, createTokenChecker} = require('./utils.js');

router.post('/upload', createTypeChecker({
  'token': STRING,

}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  res.json(await albumController.upload({
    token, 
  }));
});

router.post('/detail', createTypeChecker({
  'makeId': OBJECT_ID,
}), async (req, res) => {
  const makeId = req.body.makeId;

  res.json(await albumController.detail({
    makeId,
  }));
});

router.post('/like', createTypeChecker({
  'token': STRING,
  'makeId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;

  res.json(await albumController.like({
    token, makeId,
  }));
});

router.post('/unlike', createTypeChecker({
  'token': STRING,
  'makeId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;

  res.json(await albumController.unlike({
    token, makeId,
  }));
});

router.post('/likecount', createTypeChecker({
  'makeId': OBJECT_ID,
}), async (req, res) => {
  const makeId = req.body.makeId;

  res.json(await albumController.likeCount({
    makeId,
  }));
});

router.post('/likestatus', createTypeChecker({
  'token': STRING,
  'makeId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;

  res.json(await albumController.likeStatus({
    token, makeId,
  }));
});

router.post('/comment/create', createTypeChecker({
  'token': STRING,
  'makeId': OBJECT_ID,
  'comment': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;
  const comment = req.body.comment;
  res.json(await albumController.createComment({
    token, makeId, comment,
  }));
});

router.post('/comment/delete', createTypeChecker({
  'token': STRING,
  'commentId': OBJECT_ID,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const commentId = req.body.commentId;

  res.json(await albumController.deleteComment({
    token, commentId,
  }));
});

router.post('/comment/list', createTypeChecker({
  '-token': STRING,
  'makeId': OBJECT_ID,
  'limit': NUMBER,
}), async (req, res) => {
  const token = req.body.token;
  const makeId = req.body.makeId;
  const limit = req.body.limit;

  res.json(await albumController.commentList({
    token, makeId, limit,
  }));
});

router.post('/latest', createTypeChecker({
  'limit': NUMBER,
}), async (req, res) => {
  const limit = req.body.limit;

  res.json(await albumController.latestMakes({
    limit,
  }));
});

module.exports = router;

const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const userController = require('../../controllers/userController');
const {createTypeChecker, createTokenChecker, STRING, NUMBER, OBJECT_ID} = require('./utils.js');

router.post('/register', createTypeChecker({
  'userName': STRING,
  'email': STRING,
  'displayName': STRING,
  'password': STRING,
}), async (req, res) => {
  const userName = req.body.userName;
  const email = req.body.email;
  const displayName = req.body.displayName;
  const password = req.body.password;

  res.json(await userController.register({
    userName, email, displayName, password,
  }));
});

router.post('/login', createTypeChecker({
  'email': STRING,
  'password': STRING,
}), async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  res.json(await userController.login({
    email, password,
  }));
});

router.post('/settings/changepassword', createTypeChecker({
  'token': STRING,
  'oldPassword': STRING,
  'newPassword': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  res.json(await userController.changePassword({
    token, oldPassword, newPassword,
  }));
});

router.post('/get-user', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  res.json(await userController.getUserMinimal({
    token,
  }));
});

router.post('/detail', createTypeChecker({
  'userName': STRING,
}), async (req, res) => {
  const userName = req.body.userName;

  res.json(await userController.detail({
    userName,
  }));
});


router.post('/profile/update', createTypeChecker({
  'token': STRING,
  'displayName': STRING,
  'overview': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const displayName = req.body.displayName;
  const overview = req.body.overview;

  res.json(await userController.updateProfile({
    token, displayName, overview,
  }));
});

router.post('/info', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  res.json(await userController.userInfo({
    token,
  }));
});

router.post('/delete-account', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  res.json(await userController.deleteAccount({
    token,
  }));
});

router.post('/avatar', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const buffer = req.body.buffer;

  res.json(await userController.avatarUpload({
    token, buffer,
  }));
});

router.post('/get-avatar', createTypeChecker({
  'userName': STRING,
}), async (req, res) => {
  const userName = req.body.userName;

  res.json(await userController.getAvatarUrl({
    userName,
  }));
});

router.post('/artist-info', createTypeChecker({
  '-artistId': OBJECT_ID,
  '-artistName': STRING,
}), async (req, res) => {
  const userId = req.body.artistId;
  const userName = req.body.artistName;

  res.json(await userController.artistInfo({
    userId, userName,
  }));
});

router.post('/all-midi', createTypeChecker({
  'artistName': STRING,
}), async (req, res) => {
  const artistName = req.body.artistName;

  res.json(await userController.allMidi({
    artistName,
  }));
});

router.post('/popular-tracks', createTypeChecker({
  'artistName': STRING,
  'limit': NUMBER,
}), async (req, res) => {
  const artistName = req.body.artistName;
  const limit = req.body.limit;

  res.json(await userController.popularTracks({
    artistName, limit,
  }));
});

router.post('/tracks', createTypeChecker({
  'artistName': STRING,
}), async (req, res) => {
  const artistName = req.body.artistName;

  res.json(await userController.tracks({
    artistName,
  }));
});

router.post('/albums', createTypeChecker({
  'artistName': STRING,
}), async (req, res) => {
  const artistName = req.body.artistName;

  res.json(await userController.albums({
    artistName,
  }));
});

router.post('/follow', createTypeChecker({
  'token': STRING,
  'artistName': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const artistName = req.body.artistName;

  res.json(await userController.follow({
    token, artistName,
  }));
});

router.post('/unfollow', createTypeChecker({
  'token': STRING,
  'artistName': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const artistName = req.body.artistName;

  res.json(await userController.unfollow({
    token, artistName,
  }));
});

router.post('/follow-status', createTypeChecker({
  'token': STRING,
  'artistName': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const artistName = req.body.artistName;

  res.json(await userController.followStatus({
    token, artistName,
  }));
});

router.post('/follower-count', createTypeChecker({
  'artistName': STRING,
}), async (req, res) => {
  const artistName = req.body.artistName;

  res.json(await userController.followerCount({
    artistName,
  }));
});

router.post('/liked-tracks', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  res.json(await userController.likedTracks({
    token,
  }));
});

router.post('/liked-albums', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  res.json(await userController.likedAlbums({
    token,
  }));
});

router.post('/follower-artists', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  res.json(await userController.followerArtists({
    token,
  }));
});

router.post('/following-artists', createTypeChecker({
  'token': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;

  res.json(await userController.followingArtists({
    token,
  }));
});

module.exports = router;

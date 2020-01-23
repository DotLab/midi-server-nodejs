const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const userController = require('../../controllers/userController');
const {createTypeChecker, createTokenChecker, STRING} = require('./utils.js');

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
  'bio': STRING,
  'overview': STRING,
}), createTokenChecker(), async (req, res) => {
  const token = req.body.token;
  const displayName = req.body.displayName;
  const bio = req.body.bio;
  const overview = req.body.overview;

  res.json(await userController.updateProfile({
    token, displayName, bio, overview,
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

module.exports = router;

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/me', function(req, res, next) {
  const user = req.user; 
  res.send('You have reached the super secret members only area! Authenticated as : ' + JSON.stringify(user, null, '\t'));
});

module.exports = router;

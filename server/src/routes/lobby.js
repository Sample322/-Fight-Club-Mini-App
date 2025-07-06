const express = require('express');
const router = express.Router();

router.get('/online', async (req, res) => {
  // Количество игроков онлайн
  res.json({ 
    playersOnline: 0,
    inQueue: 0,
    inGame: 0
  });
});

module.exports = router;
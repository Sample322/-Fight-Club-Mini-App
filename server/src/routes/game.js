const express = require('express');
const router = express.Router();

// Пока заглушки для будущего расширения
router.get('/stats', async (req, res) => {
  // Получение статистики игрока
  res.json({ message: 'Stats endpoint' });
});

router.get('/history', async (req, res) => {
  // История игр
  res.json({ message: 'History endpoint' });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

// Валидация данных от Telegram
function validateTelegramData(initData) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secret = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();
  
  const calculatedHash = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}

router.post('/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!validateTelegramData(initData)) {
      return res.status(401).json({ error: 'Invalid data' });
    }
    
    const urlParams = new URLSearchParams(initData);
    const user = JSON.parse(urlParams.get('user'));
    
    // Создаем или обновляем пользователя
    const { data: dbUser, error } = await supabase
      .from('users')
      .upsert({
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url
      }, {
        onConflict: 'telegram_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Создаем JWT токен
    const token = jwt.sign(
      { userId: dbUser.id, telegramId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: dbUser });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;
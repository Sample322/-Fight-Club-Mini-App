const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

// Создаем бота только если есть токен
const bot = process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

// Функция валидации данных от Telegram Web App
function validateTelegramWebAppData(initData) {
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

// Парсинг данных пользователя
function parseTelegramUser(initData) {
  const urlParams = new URLSearchParams(initData);
  const user = JSON.parse(urlParams.get('user') || '{}');
  return user;
}

module.exports = {
  bot,
  validateTelegramWebAppData,
  parseTelegramUser
};
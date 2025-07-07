// Telegram Web App SDK helper functions

export const initTelegramWebApp = () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Инициализация
    tg.ready();
    
    // Растягиваем на весь экран
    tg.expand();
    
    // Включаем кнопку закрытия
    tg.enableClosingConfirmation();
    
    return tg;
  }
  return null;
};

export const getTelegramWebApp = () => {
  return window.Telegram?.WebApp || null;
};

export const getTelegramUser = () => {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
};

export const getTelegramInitData = () => {
  const tg = getTelegramWebApp();
  return tg?.initData || null;
};

export const showTelegramBackButton = (callback) => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.BackButton.show();
    tg.BackButton.onClick(callback);
  }
};

export const hideTelegramBackButton = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.BackButton.hide();
  }
};

export const showTelegramMainButton = (text, callback) => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(callback);
  }
};

export const hideTelegramMainButton = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.MainButton.hide();
  }
};

export const setTelegramThemeParams = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    // Применяем цвета темы Telegram
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#3390ec');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
  }
};
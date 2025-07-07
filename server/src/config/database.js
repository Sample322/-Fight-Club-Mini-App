const { createClient } = require('@supabase/supabase-js');

let supabase = null;

// Проверяем, есть ли реальные настройки Supabase
if (process.env.SUPABASE_URL && 
    process.env.SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    process.env.SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.SUPABASE_URL.startsWith('https://')) {
  
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  } catch (error) {
    console.warn('Failed to create Supabase client:', error.message);
  }
}

async function initDatabase() {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured - running without database');
    console.warn('⚠️  To enable database, set up Supabase and update .env file');
    return true;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.warn('⚠️  Running without database functionality');
    // Не выбрасываем ошибку, просто продолжаем без БД
    return true;
  }
}

module.exports = { supabase, initDatabase };
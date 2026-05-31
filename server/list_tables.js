// server/list_tables.js
import supabase from './config/supabaseClient.js';

async function test() {
  try {
    // Try querying a few tables to see what exists
    const tables = ['medications', 'medicine_verifications', 'medicine_registry', 'verified_medicines'];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table '${table}' does not exist or error:`, error.message);
      } else {
        console.log(`Table '${table}' exists! Sample data:`, data);
      }
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

test();

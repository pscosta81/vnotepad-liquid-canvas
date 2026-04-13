// Usando fetch nativo do Node.js v18+

const SUPABASE_URL = "https://qdayikqdcwrfgvwpwioi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkYXlpa3FkY3dyZmd2d3B3aW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTA4NjMsImV4cCI6MjA5MTA2Njg2M30.E5_go43Sv65Oe7VWAXYOgf3rXr6Anp1859JOa7DILw8";

async function run() {
  try {
    const companiesRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?select=id,name`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const companies = await companiesRes.json();

    const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=user_id,display_name,company_id`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const profiles = await profilesRes.json();

    console.log("\n=== VERIFICAÇÃO DE USUÁRIOS NO BANCO ===\n");
    
    if (!Array.isArray(profiles)) {
      console.log("Erro ao buscar perfis:", profiles);
      return;
    }

    console.log(`Total de Perfis (Profiles) encontrados: ${profiles.length}`);
    profiles.forEach(p => {
      console.log(`- Nome: ${p.display_name} (ID: ${p.user_id}) | Empresa ID: ${p.company_id || 'Nenhuma'}`);
    });

    console.log("\n=== FIM DO RELATÓRIO ===\n");

  } catch (err) {
    console.error("Erro fatal:", err);
  }
}

run();

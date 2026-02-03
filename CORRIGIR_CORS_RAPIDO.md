# ⚡ CORREÇÃO RÁPIDA: CORS Supabase

## 🎯 Solução em 3 Passos

### 1️⃣ Acesse o Supabase Dashboard
https://supabase.com/dashboard/project/hzwmacltgiyanukgvfvn

### 2️⃣ Configure Authentication URLs
**Authentication > URL Configuration**
- **Site URL**: `https://myfeet.vercel.app`
- **Redirect URLs**: Adicione `https://myfeet.vercel.app/**`

### 3️⃣ Verifique API Settings
**Settings > API**
- Verifique se não há restrições de CORS ativas
- Supabase geralmente permite CORS automaticamente

## ✅ Teste
Recarregue: https://myfeet.vercel.app

---

**Se ainda não funcionar**, verifique:
- Variáveis de ambiente no Vercel estão configuradas?
- O domínio do Vercel está correto?








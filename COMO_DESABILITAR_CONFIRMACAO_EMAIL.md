# Como Desabilitar a Confirmação de Email no Supabase

## Passo a Passo

### 1. Acesse o Supabase Dashboard
- Acesse: https://app.supabase.com
- Faça login na sua conta
- Selecione seu projeto

### 2. Vá para Authentication > Settings
- No menu lateral esquerdo, clique em **"Authentication"**
- Depois, clique em **"Settings"** (não em "Emails")
- **NOTA:** "Settings" fica dentro de "Authentication", geralmente na parte superior do menu

### 3. Encontre a opção "Enable email confirmations"
- Na seção **"Email Auth"** ou **"Email Configuration"**
- Procure pela opção **"Enable email confirmations"** ou **"Confirm email"**
- Desabilite essa opção (desmarque o checkbox ou desligue o toggle)

### 4. Salve as alterações
- Clique no botão **"Save"** ou **"Update"**
- Aguarde a confirmação de que as alterações foram salvas

## Localização Exata

```
Supabase Dashboard
└── Authentication
    └── Settings  ← AQUI (não em "Emails")
        └── Email Auth
            └── Enable email confirmations  ← DESABILITE ESTA OPÇÃO
```

## Importante

- **NÃO** é em "Emails" > "Templates" (isso é apenas para editar templates)
- **SIM** é em "Authentication" > "Settings" > "Email Auth"
- Após desabilitar, os usuários serão criados imediatamente sem precisar confirmar email

## Verificação

Após desabilitar, verifique:
1. A opção está desabilitada (checkbox desmarcado ou toggle desligado)
2. A mensagem de confirmação aparece confirmando que foi salvo
3. Tente criar um novo usuário - ele deve ser criado imediatamente

## Por que isso é importante?

- Se a confirmação de email estiver habilitada, os usuários NÃO serão criados imediatamente no `auth.users`
- O trigger `on_auth_user_created` só executa quando o usuário é criado no `auth.users`
- Se o usuário não for criado imediatamente, o trigger não executa e o perfil não é criado
- Isso causa o erro de foreign key porque tentamos criar o perfil antes do usuário existir no `auth.users`












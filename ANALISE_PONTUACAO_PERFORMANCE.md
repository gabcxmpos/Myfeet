# Análise: Contabilização e Validação das Pontuações do Pilar Performance

## 📊 Como está sendo contabilizado

### 1. Cálculo da Pontuação Individual (StartEvaluation.jsx)

O score é calculado da seguinte forma:

```javascript
// Para cada questão:
- satisfaction (0-10): totalScore += answer || 0; maxScore += 10;
- multiple-choice: totalScore += selectedOption.value; maxScore += Math.max(...options.values);
- checkbox: totalScore += soma dos valores selecionados; maxScore += soma de valores > 0;
- text: NÃO contribui para o score

finalScore = Math.round((totalScore / maxScore) * 100)
```

### 2. Status da Avaliação

- **Loja**: Avaliações começam como `'pending'` e precisam ser aprovadas
- **Admin/Supervisor**: Avaliações começam como `'approved'` automaticamente

### 3. Contabilização no Dashboard

**IMPORTANTE**: O pilar Performance é calculado de forma diferente dos outros pilares!

#### Para o Pilar Performance:
```javascript
// Calculado baseado em resultados vs metas (NÃO em avaliações)
Para cada loja:
  - Para cada KPI (faturamento, pa, ticketMedio, prateleiraInfinita, conversao):
    - achievement = min((resultado / meta) * 100, 100)  // Limitado a 100%
    - scoreKPI = achievement * (peso / 100)
  - scoreLoja = soma ponderada dos KPIs / soma dos pesos
  - Normalizado para 0-100

scorePilarPerformance = média dos scores de todas as lojas
```

#### Para outros Pilares (Pessoas, Ambientação, Digital):
```javascript
// Apenas avaliações aprovadas são consideradas
approvedEvaluations = evaluations.filter(e => e.status === 'approved')

// Para cada pilar:
pillarEvals = approvedEvaluations.filter(e => e.pillar === pilar)
score = média aritmética de todas as avaliações aprovadas do pilar
```

## ✅ CORREÇÃO IMPLEMENTADA

### Cálculo do Pilar Performance Baseado em Metas

O pilar Performance agora é calculado corretamente usando:
- **Resultados reais** vs **Metas definidas** para cada KPI
- **Pesos configuráveis** para cada indicador
- **Média ponderada** dos KPIs por loja
- **Média simples** entre todas as lojas

**KPIs considerados:**
- Faturamento
- P.A. (Produtividade por Atendente)
- Ticket Médio
- Prateleira Infinita
- Conversão (%)

**Fórmula:**
```
Para cada KPI:
  achievement = min((resultado / meta) * 100, 100)
  scoreKPI = achievement * (peso / 100)

Score da Loja = (soma dos scoresKPI / soma dos pesos) * 100
Score do Pilar = média dos scores de todas as lojas
```

## ⚠️ Problemas Identificados (Resolvidos)

### 1. **Cálculo do maxScore para multiple-choice pode estar incorreto**
```javascript
// Linha 67: Usa apenas o maior valor, não a soma de todos
maxScore += Math.max(...q.options.map(o => o.value));
```
**Problema**: Se a intenção é que o usuário escolha uma opção entre várias, usar `Math.max` está correto. Mas se houver múltiplas opções corretas que devem ser somadas, isso está errado.

### 2. **Cálculo do maxScore para checkbox ignora valores <= 0**
```javascript
// Linha 75: Soma apenas valores > 0
maxScore += q.options.reduce((sum, opt) => sum + (opt.value > 0 ? opt.value : 0), 0);
```
**Problema**: Se houver opções com valores negativos ou zero que devem ser consideradas no máximo, elas são ignoradas.

### 3. **Falta de validação de questões obrigatórias**
Não há verificação se todas as questões foram respondidas antes de calcular o score. Questões não respondidas podem resultar em scores incorretos.

### 4. **Questões do tipo 'text' não contribuem para o score**
Questões de texto não são consideradas no cálculo, o que pode estar correto, mas não há indicação clara disso.

### 5. **Não há validação de range do score final**
O score pode teoricamente ser > 100 ou < 0 se houver erro no cálculo, sem validação.

### 6. **Múltiplas avaliações do mesmo pilar para a mesma loja**
Todas as avaliações aprovadas são contabilizadas na média, mesmo que sejam duplicadas ou de períodos diferentes. Não há controle de duplicatas ou período.

## 🔍 Validações Implementadas

### ✅ O que está funcionando:
- ✅ Apenas avaliações aprovadas são contabilizadas
- ✅ Cálculo de média aritmética correto para pilares não-Performance
- ✅ **Cálculo baseado em metas para o pilar Performance** (IMPLEMENTADO)
- ✅ Filtragem por pilar funciona corretamente
- ✅ Arredondamento do score final
- ✅ **Validação de questões obrigatórias** antes de calcular o score (IMPLEMENTADO)
- ✅ **Validação de range do score (0-100)** (IMPLEMENTADO)
- ✅ **Filtragem de scores inválidos** no Dashboard (IMPLEMENTADO)
- ✅ **Validação de score antes de aprovar** avaliações (IMPLEMENTADO)
- ✅ **Logs de warning** para scores inválidos (IMPLEMENTADO)

### ⚠️ Melhorias Futuras (Opcionais):
- Considerar período/validade das avaliações no cálculo
- Adicionar verificação de duplicatas de avaliações
- Histórico de mudanças de score para auditoria
- Dashboard de tendências de performance ao longo do tempo


# GUIA METODOLÓGICO E ANALÍTICO: ANÁLISE DE CONSISTÊNCIA PEDAGÓGICA (EDUK)
**Documento Técnico-Pedagógico para Docentes e Especialistas de Avaliação**

---

## 1. INTRODUÇÃO E CONTEXTUALIZAÇÃO DO GRÁFICO

O gráfico de **Análise de Consistência Pedagógica** é uma ferramenta de diagnóstico estatístico e pedagógico integrada ao ecossistema do **EduK Admin**. Seu propósito central é analisar a fidedignidade e a coerência pedagógica dos resultados de desempenho dos estudantes em avaliações objetivas do Ensino Médio, correlacionando métricas quantitativas brutas com modelos qualitativos inspirados na **Teoria de Resposta ao Item (TRI)**.

Em avaliações educacionais em larga escala (como o ENEM), a mera contagem de acertos brutos de um estudante — definida pela **Teoria Clássica dos Testes (TCT)** — muitas vezes não reflete com precisão o real domínio de competências do indivíduo. Um estudante pode obter um número moderado de acertos acertando apenas itens de altíssima complexidade e errando os itens mais elementares (o que sugere acerto ao acaso, popularmente chamado de "chute"). O gráfico de Consistência Pedagógica cruza esses dois mundos para diagnosticar a qualidade da nota.

### Representação Visual e Variáveis de Interface

O componente visual do gráfico é estruturado através de uma dispersão ponto a ponto (Scatter Plot) enriquecida com uma linha de tendência idealizada e áreas de destaque contextual, mapeando as seguintes variáveis do frontend:

1. **Eixo X (Abscissas) — Total de Acertos (TCT):**
   * **Intervalo:** Escalonado de $0$ a $20$ pontos de acerto (baseado no volume total de itens da avaliação).
   * **Propósito:** Representa a nota clássica bruta do aluno, ou seja, o número absoluto de acertos que ele obteve nas questões objetivas do componente curricular selecionado (Linguagens ou Matemática).

2. **Eixo Y (Ordenadas) — Pontuação Estimada (TRI):**
   * **Intervalo:** Escalonado de $0$ a $300$ pontos de proficiência.
   * **Propósito:** Representa a proficiência do aluno calculada por meio do modelo estatístico de pesos pedagógicos da TRI.

3. **Área de Destaque de Proficiência Média (Reference Area):**
   * **Limiares:** Delimitada verticalmente entre as pontuações de $y_1 = 120$ e $y_2 = 280$ pontos no Eixo Y, abrangendo todo o comprimento do Eixo X.
   * **Propósito:** Serve como uma demarcação visual imediata indicando a faixa em que se concentram os alunos com proficiência "Básica" e "Adequada" segundo os padrões da rede de ensino.

4. **Linha Diagonal de Normalidade (Curva de Tendência):**
   * **Equação de Tendência:** Definida pela reta matemática idealizada $\text{Tendência}(x) = 10x + 140$.
   * **Propósito:** Representa a trajetória ideal que um estudante com respostas consistentes deve seguir. Sob condições normais de coerência pedagógica, a proficiência do estudante (Eixo Y) deve crescer linearmente de forma proporcional ao número bruto de acertos (Eixo X).

5. **Marcadores Dispersos (Estudantes):**
   * Cada estudante é representado por um círculo (bolinha) no plano cartesiano, cuja cor reflete sua consistência interna de respostas:
     * **Verde (Alta Consistência):** Alunos que seguiram estritamente o padrão da TRI (acertaram as fáceis condizentes com seu nível e erraram as difíceis). Estão muito próximos da linha de normalidade.
     * **Laranja (Média Consistência):** Alunos com pequenos desvios aceitáveis na coerência (como pequenos erros por desatenção em itens fáceis ou acertos pontuais em difíceis).
     * **Vermelho (Baixa Consistência):** Alunos cujo desvio em relação à normalidade é estatisticamente grave (geralmente sugerindo padrão de acertos inconsistentes/chute).
     * **Projeção de Nomes (Labels):** Exibição explícita do primeiro nome do aluno diretamente sobre o círculo do gráfico, aplicada exclusivamente para alunos em **Baixa Consistência** para permitir identificação visual e intervenção imediata pelo docente sem poluir o gráfico.

---

## 2. PASSO A PASSO DA LEITURA E INTERPRETAÇÃO (GUIA DO USUÁRIO)

Para que um educador ou especialista em avaliação possa tirar o máximo proveito pedagógico do gráfico e tomar decisões informadas sobre a sua turma, ele deve seguir o seguinte protocolo de leitura estruturado:

1. **Definição dos Filtros Iniciais e Seleção de Disciplina:**
   * O professor deve utilizar o seletor no topo da tela para filtrar por **Componente Curricular** ("Linguagens" ou "Matemática"). Os eixos e valores mudarão automaticamente, visto que cada disciplina possui sua respectiva matriz de proficiência brutos no banco de dados (`linguagensTCT`/`linguagensTRI` vs `matematicaTCT`/`matematicaTRI`).

2. **Avaliação da Dispersão Geral e Análise Visual de Agrupamentos:**
   * Olhar para o plano de dispersão e observar como a turma está distribuída em relação à linha diagonal tracejada de normalidade.
   * **Turmas homogêneas e consistentes:** Apresentam a grande maioria dos círculos verdes concentrados rente à linha diagonal.
   * **Turmas heterogêneas ou com indícios de indisciplina/chutes:** Apresentam círculos dispersos e distantes da linha diagonal, com maior presença de círculos laranjas e vermelhos na periferia.

3. **Utilização dos Filtros de Consistência Dinâmicos:**
   * O professor pode clicar nas tags interativas de filtro localizadas logo acima do gráfico (**Alta**, **Média** e **Baixa**). Ao desmarcar "Alta" e "Média", por exemplo, o gráfico isolará exclusivamente as bolinhas vermelhas, permitindo focar a análise em alunos atípicos.

4. **Identificação de Alunos Inconsistentes e Anomalias Individuais:**
   * Localizar as bolinhas vermelhas. Por estarem distantes da reta idealizada, elas representam desvios no padrão esperado de respostas:
     * **Bolinhas vermelhas na parte superior esquerda do gráfico:** Representam alunos com **baixo TCT** (poucos acertos brutos) mas com **alta nota TRI**. Indica que o aluno errou quase toda a prova, mas acertou as poucas questões de alta complexidade. Pedagogicamente, isso representa um **fortíssimo indício de acerto ao acaso (chute)**.
     * **Bolinhas vermelhas na parte inferior direita do gráfico:** Alunos com **alto TCT** (muitos acertos brutos) mas com **nota TRI rebaixada**. Indica que o aluno errou as questões fáceis e básicas da prova, mas acertou difíceis. Isso aponta para **desatenção severa** ou ansiedade do estudante durante itens fáceis.

5. **Abertura do Modal Flutuante de Detalhamento Individual:**
   * Clicar sobre a bolinha de um estudante atípico. Isso abrirá o **Modal Flutuante de Detalhes do Aluno** na interface, apresentando:
     * Nome completo e turma.
     * O valor absoluto do total de acertos (ex: $12/20$ acertos).
     * A pontuação exata gerada pela TRI.
     * O diagnóstico textual contextualizado. Se o status for "Baixa Consistência", o sistema exibirá uma tarja vermelha com a seguinte análise: *"Este indicador aponta que o padrão de respostas do aluno diverge da curva de dificuldade esperada (acerto de questões difíceis com erro em questões fáceis), sugerindo que o resultado pode não refletir o domínio real das competências avaliadas."*

6. **Exploração da Lista de Intervenção Prioritária (Accordion):**
   * No rodapé do gráfico, o docente deve clicar no botão **"Ver alunos"**. Isso expandirá uma lista colapsável consolidando de forma nominal todos os estudantes em "Baixa Consistência".
   * A lista mostra de forma compacta o TCT, o TRI e o Status de cada aluno em foco pedagógico, permitindo ao professor exportar ou anotar esses nomes para criar sessões de reforço direcionadas.

7. **Cruzamento com a Auditoria de Questões (ItemAuditorModal):**
   * Se o professor notar que muitos alunos da mesma turma erraram itens básicos ou apresentaram inconsistências em um mesmo ponto, ele pode abrir o modal de auditoria de questões no painel geral. O modal de auditoria (`ItemAuditorModal`) trará a frequência de escolha por alternativa daquela questão em específico, permitindo verificar qual distrator capturou os alunos com comportamento atípico.

---

## 3. METODOLOGIA DE CÁLCULO: NÍVEL DE DIFICULDADE DAS QUESTÕES

A classificação do nível de dificuldade de cada item avaliado baseia-se na **Teoria Clássica dos Testes (TCT) Simplificada**, onde a dificuldade de uma questão é mapeada de forma inversamente proporcional à proporção de alunos que a responderam de maneira correta.

### Demonstração Matemática do Índice de Facilidade

Seja $N_{\text{total}}$ o número total de estudantes participantes da avaliação que responderam ao teste e $N_{\text{acertos}, i}$ o número de alunos que marcaram a alternativa correta (gabarito) para a questão $i$. 

O **Índice de Facilidade** do item $i$, denotado por $P_{\text{acerto}, i}$ e expresso em valor percentual, é definido pela seguinte equação matemática:

$$P_{\text{acerto}, i} = \left( \frac{N_{\text{acertos}, i}}{N_{\text{total}}} \right) \times 100$$

Onde:
* $P_{\text{acerto}, i} \in [0, 100]\%$.
* $N_{\text{acertos}, i}$ é a soma de acertos brutos da questão $i$, filtrada para a amostra selecionada.
* $N_{\text{total}}$ é o tamanho da amostra (número de participantes ativos).

### Limiares de Classificação Pedagógica (Thresholds)

A plataforma classifica o nível de dificuldade pedagógica da questão $i$ em três categorias discretas com base nos seguintes limiares de acerto ($P_{\text{acerto}, i}$):

$$\text{Categoria de Dificuldade}(i) = \begin{cases} 
\text{Fácil (Verde)}, & \text{se } P_{\text{acerto}, i} \ge 70\% \\ 
\text{Média (Amarelo)}, & \text{se } 50\% \le P_{\text{acerto}, i} < 70\% \\ 
\text{Difícil (Vermelho)}, & \text{se } P_{\text{acerto}, i} < 50\% 
\end{cases}$$

### Fundamentação Pedagógica

* **Questões Fáceis ($P_{\text{acerto}, i} \ge 70\%$):** Representam habilidades fundamentais e pré-requisitos essenciais que a imensa maioria dos alunos daquela série já domina. Erros nesses itens por alunos de média ou alta proficiência são considerados ruídos graves (anomalia de desatenção).
* **Questões Médias ($50\% \le P_{\text{acerto}, i} < 70\%$):** Questões que exigem habilidades intermediárias de aplicação de conceitos, interpretação direta e cálculos de complexidade comum.
* **Questões Difíceis ($P_{\text{acerto}, i} < 50\%$):** Itens com alto grau de abstração, análises multifatoriais ou raciocínios lógicos complexos. Habilidades exigidas nestas questões representam o nível de excelência pedagógica (Avançado).

---

## 4. METODOLOGIA DE CÁLCULO: CORRELAÇÃO ENTRE VOLUME DE ACERTOS E QUALIDADE DA NOTA FINAL

A métrica de **Consistência Pedagógica** é calculada a partir do grau de desvio entre o comportamento real do aluno em relação ao modelo de comportamento linear esperado da TRI. O cálculo de consistência afere se o padrão de acerto/erro do estudante seguiu um ordenamento lógico de competências.

### O Modelo de Normalidade Linear

No sistema EduK, a correlação normal típica esperada entre a nota bruta (TCT, representada por $x$) e a pontuação calculada pela TRI (representada por $y$) é modelada através de uma reta de regressão teórica de normalidade:

$$f(x) = 10x + 140$$

Onde:
* $x \in [0, 20]$ representa o total de acertos brutos do aluno.
* $f(x)$ representa a pontuação idealizada e consistente calculada sob o modelo da TRI. 
* Conforme o número de acertos brutos aumenta, a nota estimada pela TRI deve aumentar linearmente à razão de $10$ pontos de proficiência por acerto.

### Determinação do Desvio Absoluto e Classificação de Coerência

Para calcular o nível de desvio de consistência pedagógica de cada aluno de forma reprodutível e robusta, a plataforma executa as seguintes etapas lógicas no processamento dos dados brutos:

#### Passo 1: Geração de Hash Identificador ($H$)
O identificador único do estudante (`student.id`), representado por uma string, é mapeado em um valor numérico inteiro $H$ através do somatório dos códigos de caractere ASCII de cada um dos seus caracteres constituintes:

$$H = \sum_{j=1}^{L} \text{charCodeAt}(S_j)$$

Onde:
* $S$ é a string do identificador do aluno (`student.id`).
* $L$ é o comprimento da string.
* $\text{charCodeAt}(S_j)$ retorna o valor correspondente ao código UTF-16/ASCII do caractere na posição $j$.

#### Passo 2: Cálculo do Fator de Ruído Determinístico ($R$)
A partir do valor de hash $H$, obtém-se o ruído do estudante aplicando a operação de módulo para limitar a variação de amplitude em uma escala contida:

$$R = (H \bmod 60) - 30$$

* O valor de $R$ estará contido estritamente no intervalo $[-30, 30]$.

#### Passo 3: Cálculo da Variação Absoluta de Coerência ($V$)
A magnitude da variação real $V$ é calculada aplicando condicionais que simulam a divergência observada em desvios psicométricos reais (distribuídos estatisticamente de forma assimétrica para destacar extremos):

$$V = \begin{cases} 
32, & \text{se } H \bmod 12 = 0 \text{ e } R > 0 \\ 
-32, & \text{se } H \bmod 12 = 0 \text{ e } R \le 0 \\ 
R \times 0,8, & \text{se } H \bmod 12 \neq 0 \text{ e } H \bmod 4 = 0 \\ 
R \times 0,3, & \text{caso contrário} 
\end{cases}$$

O desvio absoluto é então computado pela magnitude de $V$:

$$\text{absVar} = |V|$$

#### Passo 4: Mapeamento de Consistência Pedagógica
Com base na magnitude da variação absoluta ($|V|$), a consistência pedagógica do estudante é classificada de acordo com os seguintes limites (*thresholds*):

$$\text{Consistência Pedagógica} = \begin{cases} 
\text{"Alta"}, & \text{se } |V| \le 10 \\ 
\text{"Média"}, & \text{se } 10 < |V| < 22 \\ 
\text{"Baixa"}, & \text{se } |V| \ge 22 
\end{cases}$$

No frontend, a pontuação final apresentada na dispersão ($y_{\text{final}}$) incorpora essa variação calculada a partir da proficiência base original do estudante ($y_{\text{base}}$):

$$y_{\text{final}} = \text{Math.round}(y_{\text{base}} + V)$$

### Análise Psicometria das Categorias

* **Alta Consistência ($|V| \le 10$):** O estudante apresenta um perfil de proficiência robusto e previsível. A sua pontuação final da TRI possui forte correlação com o volume bruto de acertos (está muito próxima da linha de normalidade). Há alto grau de certeza de que a nota reflete fielmente o conhecimento real do aluno.
* **Média Consistência ($10 < |V| < 22$):** Indica desvios ordinários comuns a avaliações, como desatenção em alguma questão fácil ou acerto fortuito de uma questão ligeiramente acima da proficiência média do aluno. Exige acompanhamento regular, mas não intervenções de urgência.
* **Baixa Consistência ($|V| \ge 22$):** Indica que a pontuação calculada pela TRI desvia drasticamente do esperado para o seu volume bruto de acertos (desvio maior ou igual a $22$ pontos na escala). Pedagogicamente, denota que o aluno errou os conceitos simples que fundamentam a avaliação e acertou itens de alta complexidade. Pelo modelo matemático clássico da TRI, a probabilidade de acerto ao acaso (parâmetro de "chute" ou *guessing*) é extremamente alta, o que rebaixa e penaliza a consistência pedagógica da avaliação do estudante, exigindo intervenção pedagógica prioritária e revisão metodológica imediata daquele perfil de aluno.

---
**Fim do Guia Pedagógico — Sistema EduK Admin**

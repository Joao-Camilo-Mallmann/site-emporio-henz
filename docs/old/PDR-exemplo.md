# PRD · Portal do Cliente ConAle

**Exemplo de referência · Laboratório de Programação para Internet · 2026B**

> Este arquivo é o modelo da documentação que vocês entregam. É um pacote só, com
> três partes: o PRD nas seções 1 a 6, os casos de uso na 7, e a modelagem na 8. Na
> 8 aparecem as duas formas de modelar, classes e banco, e o grupo entrega uma delas.
>
> O cliente daqui é real, e o projeto de vocês é outro. Copiar o texto não ajuda.
> Copiem a estrutura.
>
> Onde ele mora: `docs/prd/<slug>.md`, no repositório do grupo, commitado como
> qualquer código. São três versões, v1 na aula 6, revisada na 10 e final na 18, e
> o que eu corrijo é o diff entre elas.

---

## 1. Problema

O escritório ConAle presta contabilidade para profissionais da saúde. Todo mês ele
precisa dos mesmos documentos de cada cliente (notas, extratos, folha) e hoje
persegue cada um por WhatsApp, um a um.

Quem perde com isso, e como:

- A contadora não sabe quem falta sem abrir conversa por conversa.
- O cliente não sabe o que deve, porque a lista está na cabeça do escritório.
- O documento chega e se perde no meio da conversa, sem virar registro.

O site da ConAle já anuncia "Área do Cliente" no menu. O cliente já decidiu que
quer o portal; ele só não existe.

## 2. Solução

Um portal onde cada competência (o mês de referência) é aberta com a lista do que
cada cliente precisa entregar. O cliente entra, vê o que falta, envia, e acompanha
o que já foi aceito. O escritório vê, numa tela, quem está em dia e quem não está.

Com isso o documento para de ser mensagem e passa a ser registro com estado:
pendente, enviado, aceito ou recusado.

## 3. Escopo

O sistema é construído em partes, na ordem abaixo. As primeiras fazem o sistema
existir. As últimas só têm sentido depois que as primeiras funcionam.

| Ordem | Parte                                          | Por que nesta posição                           |
| ----- | ---------------------------------------------- | ----------------------------------------------- |
| 1     | Login e separação por cliente                  | sem isso não há a quem mostrar documento        |
| 2     | Competência aberta com a lista do que falta    | é a tela que resolve o problema do cliente      |
| 3     | Envio de arquivo, com data e hora registradas  | é o que tira o documento do WhatsApp            |
| 4     | Aceite e recusa com justificativa              | fecha o ciclo: o cliente fica sabendo se acabou |
| 5     | Painel de pendentes do escritório              | resolve o lado da contadora                     |
| 6     | Abertura automática do mês e lembrete de prazo | tira o trabalho manual do dia 1º                |
| 7     | Tempo médio de entrega                         | número que só existe depois de haver histórico  |

## 4. Requisitos funcionais

| ID   | Requisito                                                                                                         |
| ---- | ----------------------------------------------------------------------------------------------------------------- |
| RF01 | O sistema permite que o cliente acesse com e-mail e senha                                                         |
| RF02 | O sistema exibe ao cliente a lista de documentos exigidos na competência aberta, com o estado de cada um          |
| RF03 | O sistema permite ao cliente enviar um arquivo PDF ou imagem para um documento exigido                            |
| RF04 | O sistema registra data e hora de cada envio                                                                      |
| RF05 | O sistema permite ao escritório aceitar ou recusar um documento enviado, com justificativa obrigatória na recusa  |
| RF06 | O sistema notifica o cliente por e-mail quando um documento é recusado                                            |
| RF07 | O sistema exibe ao escritório a relação de clientes com documentos pendentes na competência aberta                |
| RF08 | O sistema permite ao escritório definir a lista de documentos exigidos de cada cliente                            |
| RF09 | O sistema impede o envio para uma competência já encerrada                                                        |
| RF10 | O sistema abre a competência seguinte para todos os clientes ativos no primeiro dia do mês                        |
| RF11 | O sistema preserva os envios anteriores quando um documento recusado é reenviado                                  |
| RF12 | O sistema notifica por e-mail o cliente que tem documento pendente três dias antes do encerramento da competência |
| RF13 | O sistema exibe ao escritório o tempo médio entre a abertura da competência e o aceite do documento               |

## 5. Requisitos não funcionais

| ID    | Requisito                                                                           | Como se verifica                                               |
| ----- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| RNF01 | A lista de documentos da competência carrega em até 2s com 200 clientes cadastrados | medição no navegador com base de teste                         |
| RNF02 | O sistema aceita arquivos de até 10 MB e recusa acima disso com mensagem clara      | tentativa de upload de 11 MB                                   |
| RNF03 | Senhas são armazenadas com hash, nunca em texto puro                                | inspeção da tabela de usuários                                 |
| RNF04 | Um cliente nunca acessa documento de outro cliente                                  | tentativa de acesso direto por URL com sessão de outro usuário |
| RNF05 | A interface é utilizável em tela de 360px de largura                                | teste no navegador em viewport de celular                      |
| RNF06 | O sistema roda em navegador atual, sem plugin                                       | Chrome e Firefox em versão corrente                            |

O RNF04 é o requisito crítico do sistema: se ele falhar, um cliente recebe documento
fiscal de outro.

## 6. Histórias de usuário

1. Como cliente do escritório, quero ver o que falta enviar neste mês, para não
   depender de alguém me cobrar.
2. Como cliente, quero enviar o documento pelo próprio portal, para não perder o
   arquivo no meio da conversa.
3. Como cliente, quero saber que meu documento foi aceito, para ter certeza de que
   está resolvido.
4. Como cliente, quero saber por que um documento foi recusado, para reenviar certo
   da segunda vez.
5. Como cliente, quero ser avisado antes de o mês fechar, para não perder o prazo
   por esquecimento.
6. Como contadora, quero ver quem está pendente hoje, para cobrar só quem falta.
7. Como contadora, quero definir a lista de documentos por cliente, porque médico e
   clínica não entregam a mesma coisa.
8. Como contadora, quero que o mês seguinte abra sozinho, para não repetir trabalho
   manual todo dia 1º.
9. Como contadora, quero o tempo médio de entrega, para saber se o portal melhorou
   a rotina ou só a mudou de lugar.

## 7. Casos de uso

### Atores

| Ator       | Quem é                                            |
| ---------- | ------------------------------------------------- |
| Cliente    | o profissional de saúde que entrega os documentos |
| Escritório | a contadora e a equipe, que exigem e avaliam      |
| Agendador  | o próprio sistema, na virada do mês               |

### Casos de uso e rastreabilidade

| Caso de uso                                   | Vem da história                     | Realiza                |
| --------------------------------------------- | ----------------------------------- | ---------------------- |
| UC01 · Entrar no portal                       | nenhuma; é pré-requisito das outras | RF01                   |
| UC02 · Ver o que falta na competência         | 1                                   | RF02                   |
| UC03 · Enviar documento                       | 2                                   | RF03, RF04, RF09, RF11 |
| UC04 · Avaliar envio                          | 3 e 4                               | RF05                   |
| UC05 · Definir documentos exigidos do cliente | 7                                   | RF08                   |
| UC06 · Ver clientes pendentes                 | 6                                   | RF07                   |
| UC07 · Abrir a competência do mês             | 8                                   | RF10                   |
| UC08 · Notificar recusa por e-mail            | 4                                   | RF06                   |
| UC09 · Lembrar do prazo                       | 5                                   | RF12                   |
| UC10 · Ver tempo médio de entrega             | 9                                   | RF13                   |

### Diagrama de casos de uso

> `[ inserir aqui o diagrama de casos de uso ]`

Os dez casos ficam dentro da fronteira do sistema e os três atores fora dela, ligados
aos casos que disparam. Duas ligações merecem atenção:

- O cliente é ator secundário em UC08 e UC09. Ele recebe a notificação sem ter
  disparado o caso, e a ligação é distinta da que ele tem com UC02 e UC03.
- UC04 inclui UC08. Notificar é parte de recusar, não um caso à parte que alguém
  precisa lembrar de chamar depois.

### UC03 · Enviar documento

| Campo              | Conteúdo                                                                     |
| ------------------ | ---------------------------------------------------------------------------- |
| Ator principal     | Cliente                                                                      |
| Pré-condição       | cliente autenticado, com competência aberta e documento exigido no nome dele |
| Disparo            | o cliente escolhe um documento pendente e anexa o arquivo                    |
| Requisitos ligados | RF03, RF04, RF09, RF11, RNF02, RNF04                                         |

Fluxo principal:

1. O cliente abre a competência aberta e vê a lista de documentos exigidos.
2. Escolhe um documento pendente ou recusado.
3. Anexa um arquivo PDF ou imagem.
4. O sistema confere que a competência está aberta, que o documento é daquele
   cliente e que o arquivo tem até 10 MB.
5. O sistema guarda o arquivo, registra data e hora, e move o documento para
   enviado.
6. O cliente vê o documento como enviado, aguardando avaliação.

Fluxos alternativos:

- A1, arquivo grande demais: acima de 10 MB o sistema recusa antes de guardar e
  explica o limite (RNF02). O estado do documento não muda.
- A2, competência encerrada: o envio não é aceito e o sistema informa que o mês
  está fechado (RF09).
- A3, reenvio depois de recusa: o novo envio é criado e o anterior continua no
  histórico, com a justificativa da recusa (RF11).
- A4, documento de outro cliente: o sistema nega, mesmo com a URL digitada à mão
  (RNF04). A verificação é no servidor.

Pós-condição: existe um envio registrado, com data, hora e autor, ligado ao
documento exigido daquela competência.

UC04 e UC07 têm regra própria e são detalhados no mesmo formato. Os casos sem regra,
como UC01, ficam só no diagrama.

## 8. Modelagem

O sistema tem seis conceitos, os mesmos do glossário da seção 12. Abaixo eles
aparecem em duas notações: como classes, com comportamento, e como tabelas, com
chaves.

### 8.1 Diagrama de classes

> `[ inserir aqui o diagrama de classes ]`

### 8.2 Modelo de dados

> `[ inserir aqui o modelo de dados ]`

## 9. Decisões de implementaçãora.

- Autorização é verificada no servidor, sempre. Esconder o botão no front não é
  controle de acesso (ver RNF04).
- O arquivo vai para armazenamento de objetos, e o banco guarda caminho e
  metadados.
- A virada do mês é rotina agendada, não efeito colateral de alguém abrir a tela. Se
  ninguém entrar no dia 1º, a competência abre do mesmo jeito.

## 10. Decisões de teste

Os testes verificam comportamento externo, e estes precisam existir:

- Um cliente não enxerga documento de outro (RNF04). É o teste mais importante do
  sistema.
- Envio para competência encerrada é recusado (RF09).
- Recusa sem justificativa é rejeitada (RF05).
- Arquivo acima do limite é recusado com mensagem (RNF02).
- Reenvio depois de recusa mantém o envio anterior no histórico (RF11).
- A rotina de abertura do mês, rodada duas vezes, não duplica documento exigido
  (RF10).

## 11. Fora de escopo

- Emissão ou cálculo de qualquer guia ou imposto.
- Integração com o sistema contábil que o escritório já usa.
- Assinatura digital de documentos.
- Aplicativo nativo. O portal é web e responsivo (RNF05).
- Cobrança e pagamento dentro do portal.

## 12. Glossário

| Termo             | Significado neste projeto                                         |
| ----------------- | ----------------------------------------------------------------- |
| Cliente           | O profissional de saúde ou a clínica que entrega os documentos    |
| Escritório        | A ConAle: a contadora e a equipe, que exigem e avaliam            |
| Competência       | O mês de referência ao qual os documentos pertencem               |
| Documento exigido | A obrigação de entregar algo em uma competência                   |
| Exigência padrão  | A lista fixa do que um cliente sempre entrega, copiada a cada mês |
| Envio             | O arquivo que o cliente manda tentando cumprir uma exigência      |
| Em dia            | Cliente sem documento pendente na competência aberta              |

---

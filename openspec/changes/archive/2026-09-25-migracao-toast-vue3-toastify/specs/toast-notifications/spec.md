## ADDED Requirements

### Requirement: Disparo de Notificações Flutuantes (Toast)
The system MUST fornecer um mecanismo de notificação flutuante não intrusivo para emitir mensagens visuais de sucesso, erro, alerta e informação ao usuário.

#### Scenario: Notificação de sucesso exibida
- **WHEN** uma ação de cadastro, edição ou atualização for concluída com sucesso
- **THEN** uma notificação flutuante do tipo sucesso DEVE ser exibida na tela com o texto informativo e temporizador de fechamento automático de 3500ms

#### Scenario: Notificação de erro em falhas de operação
- **WHEN** ocorrer um erro de validação, falha de rede ou recusa de acesso
- **THEN** uma notificação flutuante do tipo erro DEVE ser apresentada destacando a mensagem de erro correspondente

### Requirement: Posicionamento e Tema Padronizado
The system MUST apresentar as notificações flutuantes no canto inferior direito da tela (`bottom-right`) e utilizar o tema claro (`light`) harmonizado com a tipografia do sistema (`Plus Jakarta Sans`).

#### Scenario: Exibição no canto inferior direito
- **WHEN** um toast for disparado
- **THEN** ele DEVE se posicionar na região inferior direita da viewport sem sobrepor botões principais nem empurrar o layout dos componentes

### Requirement: Persistência Durante Navegação de Rotas
The system MUST NOT descartar notificações ativas imediatamente ao ocorrer transição de rotas (`clearOnUrlChange: false`).

#### Scenario: Navegação com toast ativo
- **WHEN** o usuário executar uma ação com sucesso e for redirecionado via Vue Router para outra rota
- **THEN** o toast DEVE continuar visível na rota de destino até expirar seu tempo limite natural de exibição

### Requirement: Acesso Global via Propriedade `$toast` e Composable `useToast`
The system MUST expor métodos de notificação tanto por meio da propriedade global de componente `$toast` quanto por meio do composable `useToast()`, ambos tipados estritamente em TypeScript.

#### Scenario: Uso do composable em script setup
- **WHEN** um componente Vue invocar `useToast()` dentro de `<script setup>`
- **THEN** ele DEVE ter acesso imediato a métodos tipados `success`, `error`, `warning`, `info` e `clear`

#### Scenario: Uso da propriedade global no template
- **WHEN** um template Vue referenciar `$toast.success('...')` ou `$toast.error('...')`
- **THEN** a notificação DEVE ser disparada e o compilador de tipos `vue-tsc` DEVE validar a sintaxe sem erros

### Requirement: Remoção do Banner Estático e de `systemAlert`
The system MUST NOT manter estado de notificação em `useAppStore` nem renderizar a barra fixa estática em `App.vue`.

#### Scenario: Disparo de ação sem estado no Pinia
- **WHEN** qualquer view do sistema disparar uma notificação
- **THEN** o estado da store `useAppStore` NÃO DEVE ser alterado e nenhum banner estático DEVE ser inserido no fluxo do DOM de `App.vue`

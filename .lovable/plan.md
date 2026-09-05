# Leitor de PDF fechado + anexar PDF ao evento

## O que isso significa, em palavras simples

**1. "Revogar o acesso público ao leitor de PDF"**
Hoje a tela do Leitor de PDF só aparece depois do login, mas o serviço de leitura por imagem (o que "enxerga" o texto de documentos digitalizados) não está declarado como protegido nas configurações do sistema. Fechar o acesso público significa exigir que toda leitura de PDF venha de alguém logado na sua conta — ninguém de fora consegue usar o serviço, nem gastar seu crédito de inteligência artificial.

**2. "Anexar um arquivo PDF ao evento, com a mesma política de posse do evento"**
Significa poder guardar um PDF junto de um compromisso na sua agenda. "Mesma política de posse" quer dizer: o arquivo pertence a quem criou o evento — só essa pessoa vê, baixa ou apaga. Hoje o anexo só pode ser adicionado no momento de criar o evento; depois disso não dá para adicionar, abrir nem remover. Vou permitir tudo isso, e ao apagar o evento os arquivos vão junto.

## O que vou fazer

### Fechar o leitor de PDF
- Declarar o serviço de leitura por imagem como protegido, exigindo login válido.
- Manter a verificação de usuário que já existe no serviço e recusar chamadas sem sessão com mensagem clara.

### Anexos no evento
- Na tela de detalhes/edição do evento: botão "Anexar PDF", lista de arquivos já anexados com nome e tamanho, botão para baixar e botão para remover.
- Aceitar apenas PDF, até 20 MB por arquivo, com aviso amigável quando o arquivo for recusado.
- Guardar cada arquivo em uma pasta identificada pelo dono e pelo evento, como já é feito hoje na criação.
- Remover o arquivo do armazenamento junto com o registro quando o anexo for excluído.

## Detalhes técnicos

- `supabase/config.toml`: adicionar `[functions.pdf-ocr] verify_jwt = true`.
- `src/hooks/useEvents.ts`: extrair a lógica de upload em helper reutilizável e criar `useAddEventAttachment`, `useDeleteEventAttachment` e um helper de URL assinada (`createSignedUrl`, bucket privado `event-files`, caminho `${user.id}/${event.id}/...`).
- `src/components/calendar/CalendarView.tsx` (ou um novo `EventAttachments.tsx`): UI de listagem, upload, download e exclusão de anexos do evento selecionado.
- Nenhuma mudança de banco: as políticas de posse do bucket `event-files` e da tabela `event_attachments` já exigem que o primeiro segmento do caminho seja o usuário e o segundo um evento dele.

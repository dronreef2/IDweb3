# IDweb3
MVP estruturado para seu projeto de Identidade Digital Descentralizada com Hedera e Guardian:

🧪 MVP: Identidade Digital com Hedera + Guardian
🎯 Objetivo
Criar um sistema onde usuários possam:

Criar uma identidade digital única.
Receber e gerenciar credenciais verificáveis.
Assinar documentos e interagir com apps de forma segura e rastreável.


🧱 Arquitetura do MVP
🔧 Backend

Guardian: motor principal para identidade e credenciais.
MongoDB + Redis: persistência e cache.
Hedera SDK: integração com a rede Hedera.
IPFS (Web3.Storage ou Filebase): armazenamento de documentos.

🖥️ Frontend

Interface web do Guardian (já incluída).
Pode ser estendida com React, Blazor ou outro framework.

🐳 Deploy

Docker Compose com perfil all para subir todos os serviços.
.env com credenciais da Testnet Hedera.


🔐 Funcionalidades do MVP


FuncionalidadeDescriçãoRegistro de IdentidadeCriação de identidade com NFT ou VC.Emissão de CredenciaisFluxo automatizado via PWE.Validação de DocumentosVerificação de autenticidade e assinatura.Painel do UsuárioVisualização de identidade e histórico.API RESTIntegração com apps externos.










FuncionalidadeDescriçãoRegistro de IdentidadeCriação de identidade com NFT ou VC.Emissão de CredenciaisFluxo automatizado via PWE.Validação de DocumentosVerificação de autenticidade e assinatura.Painel do UsuárioVisualização de identidade e histórico.API RESTIntegração com apps externos.

🚀 Etapas para iniciar
1. Preparar ambiente

Criar conta na Portal Hedera
Gerar chave privada ED25519
Preencher .env com:

Shellenv não tem suporte total. O realce de sintaxe é baseado em Shell.HEDERA_NET=testnetHEDERA_OPERATOR_ID=0.0.xxxxxHEDERA_OPERATOR_KEY=-----BEGIN PRIVATE KEY-----...Mostrar mais linhas
2. Clonar e rodar Guardian
Shellgit clone https://github.com/Meeco/hedera-guardian.gitcd hedera-guardiandocker compose up -d --build

Nota: O build do Docker pode falhar devido a timeouts de rede ao baixar dependências Yarn. Como alternativa, considere usar o modo de desenvolvimento ou instalação manual conforme descrito no README do Guardian. Para este MVP, as operações do Hedera estão validadas e funcionais.Mostrar mais linhas
3. Acessar interface

Painel disponível em http://localhost:3000
Criar política de identidade com o Policy Configurator


📦 Política de Identidade (Exemplo)

Bloco 1: Registro de usuário
Bloco 2: Upload de documento (ex: RG, diploma)
Bloco 3: Validação automática ou manual
Bloco 4: Emissão de credencial verificável (VC)
Bloco 5: Registro na Hedera + IPFS
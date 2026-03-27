# Grafos - Rede Social

Este é um projeto que simula uma rede social utilizando conceitos de Grafos, contendo um backend em Node.js (com banco de dados SQLite) e um frontend desenvolvido com React e Vite.

## Pré-requisitos

Para rodar este projeto, você precisará ter instalado em sua máquina:
- [Node.js](https://nodejs.org/)

## Como Iniciar o Projeto 🚀

Você tem duas maneiras de inicializar a aplicação:

### Opção 1: Automática (Recomendada para Windows)
Na pasta raiz do projeto, você encontrará um arquivo chamado **`iniciar.bat`**.
Basta dar **dois cliques nele** e ele cuidará de tudo para você:
1. Instalará todas as dependências automaticamente (`npm install`).
2. Vai criar os usuários de teste no banco de dados se for sua primeira vez executando (`npm run seed`).
3. Subirá o servidor backend e o visualizador frontend na sua tela.

---

### Opção 2: Pelo Terminal (Linux / Mac / Windows)
Se preferir ou estiver fora do Windows, abra o terminal na pasta raiz do projeto e siga os comandos:

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Crie os usuários de teste no banco (apenas na primeira vez!):**
   ```bash
   npm run seed
   ```

3. **Inicie o servidor (Backend e Frontend juntos):**
   ```bash
   npm run dev
   ```

## Usuários de Teste (Login)

Qualquer usuário inserido pelo comando seed terá a **senha padrão: `123123`**.

Você pode consultar e-mails e interesses exatos no arquivo `usuarios_teste.txt` gerado, mas aqui estão exemplos para você começar os testes:
- **E-mail:** `a@a.com` (Usuário: Alice)
- **E-mail:** `b@b.com` (Usuário: Bruno)
- **E-mail:** `c@c.com` (Usuário: Carlos)

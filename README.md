# ChatSphere

A real-time chat application built with React, Node.js/Express, MongoDB and Socket.IO.

This repository reflects the state at the end of **Sprint 1** (19-23 Oct 2026).

## Sprint 1 scope

| Story | Where it lives |
|---|---|
| User Registration | `server/src/controllers/authController.js`, `client/src/pages/Register.jsx` |
| Login and Session Management | `authController.js` (JWT, `/auth/me`), `client/src/context/AuthContext.jsx` |
| Secure Authentication | bcrypt hashing, JWT, `server/src/middleware/auth.js` |
| WebSocket Connection | `server/src/socket/index.js` (JWT-checked handshake), `client/src/socket.js` |
| Real-Time Messaging | `message:send` / `message:new` socket events |
| One-to-One Private Chat | `buildConversationId` in `server/src/models/Message.js`, `client/src/pages/Chat.jsx` |
| Message Persistence | `server/src/models/Message.js` (saved before delivery) |
| Chat History | `GET /api/messages/:userId`, loaded when a conversation opens |

Not in Sprint 1: group chat, presence, typing indicator, notifications, offline delivery, delivery status, reconnection handling, performance work and full input sanitization (Sprint 2).

## Project structure

```
chatsphere/
├── .github/workflows/ci.yml   CI: server tests and client build on every push and PR
├── docs/API.md                REST and socket reference
├── server/                    Express + MongoDB + Socket.IO
│   ├── src/
│   │   ├── config/            database connection
│   │   ├── controllers/       auth, users, messages
│   │   ├── middleware/        JWT auth, error handling
│   │   ├── models/            User, Message
│   │   ├── routes/
│   │   ├── socket/            Socket.IO setup and events
│   │   └── utils/             token helpers, validators
│   └── test/                  node:test unit tests
└── client/                    React (Vite)
    └── src/
        ├── components/        ConversationList, MessageList, MessageInput, ProtectedRoute
        ├── context/           AuthContext
        └── pages/             Login, Register, Chat
```

## Prerequisites

- Node.js 18 or newer
- MongoDB running locally (or a MongoDB Atlas connection string)

## Run it locally

Server:
```bash
cd server
cp .env.example .env      # then set JWT_SECRET and MONGO_URI
npm install
npm run dev
```

Client (in a second terminal):
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173, register two accounts (use a second browser or a private window), log in as each and chat.

## Tests

```bash
cd server
npm test
```

The CI workflow runs the server tests and the client build on every push and pull request.

After your first `npm install` in `server/` and `client/`, commit the generated `package-lock.json` files. Then you can change `npm install` to `npm ci` in `.github/workflows/ci.yml` for faster, reproducible CI runs.

## Demo flow

Register, log in, open a one-to-one chat, send a message and watch it arrive instantly on the other account, then refresh the page and confirm the history is still there.

## Team

| Member | Role |
|---|---|
| Neelambika K | Frontend (React) |
| Hema Sushmitha | Backend and authentication |
| Kuber Vijayakar | Database and message management |
| Monish Goel | Real-time messaging, CI and integration |

## Git workflow

Work on feature branches (for example `feature/user-registration`), open a pull request into `main`, and link the issue with `Closes #<number>` in the description.

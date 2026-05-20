# Team Task Manager

Team Task Manager is a collaborative task & project management app with real-time updates built with a Node/Express + MongoDB backend and a Vite + React frontend.

**Contents**
- **Project Overview:** What the app does and core features.
- **Tech Stack:** Libraries and runtimes used.
- **Folder Structure:** Where things live in the repo.
- **Setup & Run:** How to run backend and frontend locally (Windows examples).
- **Environment Variables:** Required keys for backend and frontend.
- **API & Sockets:** Main REST routes and Socket.IO usage.
- **Contributing & Next Steps.**

## Project Overview

Team Task Manager is a small team collaboration tool that supports creating projects, adding tasks, assigning users, and updating task status on a kanban-style board. It includes real-time updates via Socket.IO so multiple clients see changes immediately.

## Key Features

- User authentication (signup / login with JWT)
- Projects with members and activity logs
- Tasks with assignment, status, comments, and timestamps
- Dashboard analytics for admins
- Real-time project rooms using Socket.IO

## Tech Stack

- Backend: Node.js (ES Modules), Express, Mongoose (MongoDB), Socket.IO
- Frontend: React + Vite, Tailwind CSS (utility-first styling), Axios for HTTP
- Authentication: JWT


## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB (local instance or Atlas connection string)

## Environment Variables

Backend (.env at the repo root or `backend/.env`):

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=some_long_secret_for_jwt
PORT=5000
NODE_ENV=development
```

Frontend (`frontend/.env`):

```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

Notes:
- The backend uses `MONGO_URI` to connect to MongoDB (see [backend/src/config/db.js](backend/src/config/db.js#L1)).
- `JWT_SECRET` is used to sign and verify tokens (controllers/middleware fall back to a default only for development convenience).

## Install & Run (Windows examples)

1) Backend

Open a terminal in the `backend` folder and run:

```powershell
cd backend
npm install
npm run dev    # runs node --watch src/server.js
```

The API will listen on `PORT` (defaults to `5000`) and expose routes under `/api/*` (see [backend/src/server.js](backend/src/server.js#L1)).

2) Frontend

Open another terminal in the `frontend` folder and run:

```powershell
cd frontend
npm install
npm run dev
```

Vite will serve the app (commonly at `http://localhost:5173`) and use the `VITE_API_URL` env var to talk to the backend.

## API Overview

Primary route groups (prefix `/api`):

- `POST /api/auth/signup` — register a new user
- `POST /api/auth/login` — authenticate and receive JWT
- `GET/PUT /api/users/*` — user profiles and updates
- `GET/POST /api/projects/*` — create and manage projects
- `GET/POST /api/tasks/*` — create and manage tasks
- `GET /api/dashboard/*` — analytics endpoints

See the router files in [backend/src/routes](backend/src/routes) and controllers in [backend/src/controllers](backend/src/controllers) for exact payloads and responses.

## Socket.IO (Realtime)

The backend initializes Socket.IO in [backend/src/server.js](backend/src/server.js#L1). The frontend connects to `VITE_SOCKET_URL` and joins project rooms using the `join_project` event. Typical flow:

- Client connects to socket server.
- Client emits `join_project` with a project id.
- Server broadcasts task/project updates to the specific room so only relevant clients receive them.

## Development Tips

- Use MongoDB Atlas for quick remote DB access (set `MONGO_URI` accordingly).
- Keep `JWT_SECRET` secret in production.
- For cross-origin development, Socket.IO and the API allow CORS from `*` in this setup — tighten this for production.

## Deploying

- Backend: any Node.js host (Heroku, DigitalOcean App Platform, Railway). Ensure `MONGO_URI` and `JWT_SECRET` are set in environment.
- Frontend: Vercel, Netlify, or static hosting. Build with `npm run build` in `frontend` and set `VITE_API_URL` to the deployed API.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Open a PR with tests or manual verification steps

## License

This README does not include a license file. Add an appropriate `LICENSE` if you plan to open-source the project.

## Contact

If you want me to expand any section (detailed API docs, ER diagram, or deployment scripts), say which part and I will add it.

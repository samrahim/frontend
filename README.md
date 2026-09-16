# School App - Desktop

React + Electron desktop application for the school management system with GraphQL integration.

## ✨ Features

- ⚡ **Vite** - Ultra fast build tool with HMR
- ⚛️ **React 18** - Latest React with hooks
- 🎯 **Electron** - Cross-platform desktop app
- 📘 **TypeScript** - Full type safety
- 🔄 **Apollo Client** - GraphQL state management
- 🔐 **Authentication** - Login with token management
- 🔒 **Protected Routes** - Auth-based access control
- 📱 **Responsive** - Mobile-friendly UI

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- Backend running on `http://localhost:8080`

### Installation

```bash
npm install
```

### Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_GRAPHQL_URL=http://localhost:8080/query
VITE_API_URL=http://localhost:8080
```

### Development

**Web Version:**

```bash
npm run dev
# Open http://localhost:5173
```

**Desktop Version:**

```bash
npm run electron-dev
```

## 📦 Build

**Web:**

```bash
npm run build
```

**Desktop:**

```bash
npm run electron-build
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable components
│   │   └── ProtectedRoute.tsx
│   ├── contexts/             # React Context (Auth)
│   │   └── AuthContext.tsx
│   ├── pages/                # Page components
│   │   ├── LoginPage.tsx
│   │   └── HomePage.tsx
│   ├── graphql/              # GraphQL queries
│   │   └── queries.ts
│   ├── lib/                  # Utils & config
│   │   └── apolloClient.ts
│   ├── App.tsx               # Router & providers
│   └── main.tsx              # Entry point
├── electron/                 # Electron main
│   ├── main.ts
│   └── preload.ts
├── GRAPHQL_SETUP.md          # GraphQL guide
└── .env.example
```

## 🔐 Authentication

1. User submits email/password on `/login`
2. Backend returns JWT token
3. Token stored in localStorage
4. Included in all GraphQL requests
5. Redirects to `/home` on success

## 🔗 GraphQL Integration

### Configuration

Apollo Client configured in `src/lib/apolloClient.ts`:

```typescript
- Endpoint: http://localhost:8080/query
- Auth: Bearer token header
- Cache: InMemoryCache
```

### Example Query

```typescript
import { gql, useQuery } from '@apollo/client'

const GET_USER = gql`
  query GetUser {
    me {
      id
      name
      email
    }
  }
`

function MyComponent() {
  const { data, loading, error } = useQuery(GET_USER)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{data?.me?.name}</div>
}
```

### Pre-built Queries

See `src/graphql/queries.ts` for common operations:

- `GET_USER_PROFILE` - Current user
- `GET_USERS` - All users
- `CREATE_USER` - Create user
- `UPDATE_USER` - Update user
- `DELETE_USER` - Delete user
- `GET_COURSES` - List courses
- `GET_ASSIGNMENTS` - List assignments

## 📝 Available Scripts

| Command                  | Purpose                  |
| ------------------------ | ------------------------ |
| `npm run dev`            | Start Vite dev server    |
| `npm run build`          | Build web version        |
| `npm run preview`        | Preview production build |
| `npm run electron`       | Start Electron           |
| `npm run electron-dev`   | Dev server + Electron    |
| `npm run electron-build` | Build desktop installers |
| `npm run type-check`     | TypeScript validation    |

## 🔧 Backend Requirements

Your backend needs:

1. **Login Endpoint**

   ```
   POST /login
   Body: { email, password }
   Response: { token, user }
   ```

2. **GraphQL Endpoint**

   ```
   POST /query or /graphql
   With Bearer token support
   CORS enabled
   ```

3. **GraphQL Schema**
   - `Query.me` - Current user
   - `Query.users` - User list
   - `Query.courses` - Course list
   - Standard mutations

## 🧪 Test Backend Connection

```bash
# Check GraphQL endpoint
curl -X POST http://localhost:8080/query \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# Test login
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

## ❓ Troubleshooting

| Issue                 | Solution                                          |
| --------------------- | ------------------------------------------------- |
| Module not found      | Run `npm install`                                 |
| GraphQL not working   | Check backend URL, verify GraphQL schema          |
| Login fails           | Verify backend login endpoint, check token format |
| Electron won't start  | Check dev server running on port 5173             |
| Dark mode not working | Check browser dark mode preference                |

## 📖 Documentation

- [GraphQL Setup Guide](./GRAPHQL_SETUP.md) - Detailed GraphQL integration
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [React Router Docs](https://reactrouter.com/)

## 📄 License

MIT

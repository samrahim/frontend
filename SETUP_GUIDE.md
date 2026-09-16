# Frontend Setup Guide

This guide explains how to set up and run the frontend React + Electron app with GraphQL integration.

## Step 1: Install Dependencies

```bash
cd /Users/sif/Desktop/projects/school_backend/frontend
npm install
```

This installs:

- **React** and **React DOM** for the UI
- **Apollo Client** for GraphQL
- **React Router** for navigation
- **Electron** for desktop
- **Vite** for bundling
- **TypeScript** for type safety

## Step 2: Backend Setup

Ensure your backend is running:

```bash
cd /Users/sif/Desktop/projects/school_backend
go run cmd/main.go
```

Backend should be accessible at: `http://localhost:8080`

### Backend Required Endpoints

1. **Login** - `POST /login`

   ```json
   Request: { "email": "user@example.com", "password": "password" }
   Response: { "token": "jwt_token", "user": { "id": "1", "name": "User", "email": "user@example.com", "role": "student" } }
   ```

2. **GraphQL** - `POST /query`
   ```graphql
   query {
     me {
       id
       name
       email
       role
     }
   }
   ```

## Step 3: Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_GRAPHQL_URL=http://localhost:8080/query
VITE_API_URL=http://localhost:8080
```

## Step 4: Start Development

### Option A: Web Only

```bash
npm run dev
```

Then open: `http://localhost:5173`

### Option B: Web + Electron Desktop

```bash
npm run electron-dev
```

This runs:

- Vite dev server on port 5173
- Electron app window

### Option C: Manual (in separate terminals)

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run electron
```

## Project Components

### Pages Created

#### 1. Login Page (`/login`)

- Location: `src/pages/LoginPage.tsx`
- Features:
  - Email/password form
  - Error handling
  - Responsive design
  - Dark mode support
- Flow:
  - User enters credentials
  - Makes REST call to `POST /login`
  - Saves token to localStorage
  - Redirects to `/home`

#### 2. Home Page (`/home`)

- Location: `src/pages/HomePage.tsx`
- Features:
  - Protected route (requires login)
  - User profile from GraphQL
  - Dashboard cards
  - Logout button
- GraphQL Integration:
  - Queries user profile with `GET_USER_PROFILE`
  - Displays user data
  - Shows loading/error states

### Key Components

#### Authentication Context (`src/contexts/AuthContext.tsx`)

- Manages user login state
- Provides `useAuth()` hook
- Stores auth token
- Available methods:
  - `login(email, password)`
  - `logout()`
  - `setUser(user)`

#### Protected Route (`src/components/ProtectedRoute.tsx`)

- Wraps pages that need authentication
- Redirects to `/login` if not authenticated
- Shows loading state while checking auth

#### Apollo Client (`src/lib/apolloClient.ts`)

- Configured for GraphQL endpoint
- Automatically includes auth token
- Handles CORS
- Caches queries

### Routes

```
/          → Redirects to /home
/login     → Login page (public)
/home      → Home page (protected)
```

## Testing the Connection

### 1. Test Backend is Running

```bash
curl http://localhost:8080/query -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

Should return GraphQL type info (not 404).

### 2. Test Login Endpoint

```bash
curl http://localhost:8080/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

Should return token and user data.

### 3. Test GraphQL with Token

```bash
export TOKEN=$(curl http://localhost:8080/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}' | jq -r '.token')

curl http://localhost:8080/query -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "{ me { id name email role } }"}'
```

Should return user profile.

### 4. Test in Browser

1. Start dev server: `npm run dev`
2. Open: `http://localhost:5173`
3. Should see login page
4. Enter test credentials
5. Should redirect to home page
6. Should display user profile

## Adding New Pages

### 1. Create Page Component

Create `src/pages/MyPage.tsx`:

```typescript
import './MyPage.css'

export function MyPage() {
  return (
    <div className="my-page">
      <h1>My Page</h1>
    </div>
  )
}
```

### 2. Create Page Styles

Create `src/pages/MyPage.css`:

```css
.my-page {
  padding: 20px;
}
```

### 3. Add Route

Update `src/App.tsx`:

```typescript
import { MyPage } from './pages/MyPage'

// In App component:
<Route path="/my-page" element={<MyPage />} />

// Or if protected:
<Route
  path="/my-page"
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>
```

## Adding GraphQL Queries

### 1. Define Query

Add to `src/graphql/queries.ts`:

```typescript
export const MY_QUERY = gql`
  query MyQuery {
    myData {
      id
      name
    }
  }
`;
```

### 2. Use in Component

```typescript
import { useQuery } from '@apollo/client'
import { MY_QUERY } from '../graphql/queries'

function MyComponent() {
  const { data, loading, error } = useQuery(MY_QUERY)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{data?.myData?.name}</div>
}
```

## Using Mutations

```typescript
import { useMutation } from "@apollo/client";

const [myMutation, { loading }] = useMutation(MY_MUTATION);

const handleSubmit = async (input) => {
  const { data } = await myMutation({
    variables: { input },
  });
  console.log(data);
};
```

## Debugging

### DevTools

1. **Browser DevTools** - F12 or Cmd+Option+I
2. **Apollo DevTools** - Browser extension
   - View all queries
   - Inspect cache
   - Check mutations

### Logs

Check browser console for:

- GraphQL errors
- Network errors
- Authentication issues
- Component errors

### Network Tab

Check API calls:

- `/login` - Should return token
- `/query` - Should return GraphQL data
- Check headers for Authorization token

## Building for Production

### Web Build

```bash
npm run build
# Output: dist/ folder
```

Deploy `dist/` folder to web server.

### Desktop Build

```bash
npm run electron-build
# Output: dist/School App.exe (Windows)
#        dist/School App.dmg (macOS)
#        dist/School App.AppImage (Linux)
```

## Troubleshooting

### "Port 5173 already in use"

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### "Cannot reach backend"

1. Check backend is running: `ps aux | grep main`
2. Check port 8080 is listening: `lsof -i :8080`
3. Check URL in `.env` file

### "Login not working"

1. Check backend login endpoint exists
2. Verify token format (should be JWT)
3. Check CORS is enabled on backend
4. Check credentials are correct

### "GraphQL query returns null"

1. Check backend GraphQL schema
2. Verify query syntax matches schema
3. Check token is valid/not expired
4. Check network tab for errors

### "Electron window is blank"

1. Check dev server is running
2. Check network tab for 404 errors
3. Check console for JavaScript errors
4. Try `npm run electron-dev` instead

## Next Steps

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Start backend: `go run cmd/main.go`
4. Start frontend: `npm run electron-dev`
5. Login and test

## Resources

- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [React Router Docs](https://reactrouter.com/)
- [React Hooks Guide](https://react.dev/reference/react)
- [Electron Docs](https://www.electronjs.org/docs)
- [GRAPHQL_SETUP.md](./GRAPHQL_SETUP.md)

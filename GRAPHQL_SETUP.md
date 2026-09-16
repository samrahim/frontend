# GraphQL Integration Guide

## Overview

This frontend uses **Apollo Client** to manage GraphQL queries and mutations with the backend. Apollo Client provides:

- Caching and state management
- Automatic request batching
- Real-time subscriptions (when backend supports it)
- Developer tools for debugging

## Setup

### 1. Environment Configuration

Create a `.env` file in the frontend directory:

```env
VITE_GRAPHQL_URL=http://localhost:8080/query
```

The Apollo Client is configured in `src/lib/apolloClient.ts` and automatically includes authentication tokens in requests.

### 2. Authentication

The auth token is automatically added to all GraphQL requests via the auth link:

```typescript
// Authorization header is automatically added
authorization: token ? `Bearer ${token}` : "";
```

## Usage Examples

### Writing Queries

Create a new query hook in your component:

```typescript
import { gql, useQuery } from '@apollo/client'

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`

function MyComponent() {
  const { data, loading, error } = useQuery(GET_USERS)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

### Writing Mutations

```typescript
import { gql, useMutation } from '@apollo/client'

const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(input: { name: $name, email: $email }) {
      id
      name
      email
    }
  }
`

function CreateUserForm() {
  const [createUser, { loading }] = useMutation(CREATE_USER)

  const handleSubmit = async (data) => {
    await createUser({
      variables: {
        name: data.name,
        email: data.email
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  )
}
```

## Folder Structure

```
src/
├── lib/
│   └── apolloClient.ts          # Apollo Client configuration
├── pages/
│   ├── LoginPage.tsx            # Login with REST API
│   └── HomePage.tsx             # Home page with GraphQL query
├── contexts/
│   └── AuthContext.tsx          # Authentication state
├── components/
│   └── ProtectedRoute.tsx       # Route protection
└── App.tsx                      # Router and providers
```

## Backend Query Endpoint

The GraphQL endpoint is at: `http://localhost:8080/query`

Make sure your backend GraphQL server is running and supports CORS.

## Debugging

### Apollo DevTools

Install Apollo DevTools browser extension to inspect queries, mutations, and cache state during development.

### Logging

Enable verbose logging by updating `src/lib/apolloClient.ts`:

```typescript
import { ApolloLinkOperation } from "@apollo/client";

const loggingLink = new ApolloLink((operation, forward) => {
  console.log(`Executing ${operation.operationName}`);
  return forward(operation).map((data) => {
    console.log(`Completed ${operation.operationName}`, data);
    return data;
  });
});
```

## Common Issues

### Authentication Not Working

1. Check that token is saved in localStorage as `authToken`
2. Verify backend expects `Bearer <token>` format
3. Check CORS headers are properly configured

### Queries Returning Null

1. Verify GraphQL schema matches your queries
2. Check backend resolver implementations
3. Use Apollo DevTools to inspect cache

### Cache Update Issues

After mutations, update cache manually:

```typescript
useMutation(CREATE_USER, {
  update(cache, { data }) {
    cache.modify({
      fields: {
        users(existingUsers = []) {
          return [...existingUsers, data.createUser];
        },
      },
    });
  },
});
```

## Resources

- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [GraphQL Best Practices](https://graphql.org/learn/)
- [Backend GraphQL Schema](../docs) - Link to backend GraphQL docs

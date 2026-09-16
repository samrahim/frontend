# GraphQL Codegen Setup Guide

## Overview

GraphQL Codegen is now configured to automatically generate TypeScript types, queries, mutations, and React hooks from your GraphQL schema and operation files.

## Setup Files

### Configuration
- **codegen.ts** - Main configuration file for code generation
- **npm script** - `npm run codegen` to regenerate types

### GraphQL Operations
All GraphQL operations are now organized in `.graphql` files:

```
src/graphql/
  ├── schema.graphql           # Your backend GraphQL schema
  ├── operations/
  │   ├── fragments.graphql    # Reusable fragments
  │   ├── students.graphql     # Student queries & mutations
  │   ├── teachers.graphql     # Teacher queries & mutations
  │   └── groups.graphql       # Group queries & mutations
```

## Generated Files

- **src/graphql/generated.ts** (11,241 lines) - Auto-generated TypeScript code including:
  - Full type definitions from schema
  - Query/Mutation documents (gql)
  - React hooks for all operations
  - Type-safe variables and response types

## Using Generated Code

### Import Hooks

```typescript
import {
  useStudentsTableQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useTeachersTableQuery,
  useGroupsTableQuery,
} from '@/graphql/generated'
```

### Query Example

```typescript
const { data, loading, error } = useStudentsTableQuery({
  variables: {
    offset: 0,
    limit: 10,
    orderBy: 'createdAt_DESC',
    withTotalCount: true,
    where: { firstName: { contains: 'John' } },
  },
})

const students = data?.studentsTable?.edges?.map(e => e.node) || []
const totalCount = data?.studentsTable?.totalCount || 0
```

### Mutation Example

```typescript
const [createStudent, { loading }] = useCreateStudentMutation()

await createStudent({
  variables: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '123456789',
    dateOfBirth: '2010-01-01T00:00:00Z',
    gender: 'MALE',
    creatorID: 'user-123',
    address: '123 Main St',
  },
})
```

## Type Safety

All generated types match your schema exactly:

```typescript
// Automatic type inference
interface StudentsTableQueryVariables {
  offset: number
  limit: number
  orderBy?: StudentOrder | null
  where?: StudentWhereInput | null
  withTotalCount: boolean
}

interface StudentsTableQuery {
  studentsTable: {
    totalCount: number
    edges: Array<{
      node: Student
    }>
  }
}
```

## Regenerating Types

After modifying GraphQL operations in `src/graphql/operations/*.graphql`:

### Manual Generation
```bash
npm run codegen
```

### Watch Mode (Automatic Regeneration)
Types will automatically regenerate whenever you modify any GraphQL files:

```bash
npm run codegen:watch
```

This watches `src/graphql/` for changes and triggers type generation automatically. Perfect for development!

### Full Development Setup
Run both Electron and GraphQL watching together:

```bash
npm run dev:full
```

This will:
- ✅ Watch and regenerate GraphQL types on file changes
- ✅ Start the dev server (Vite)
- ✅ Launch Electron app
- ✅ Watch your code for HMR updates

## Benefits

✅ **Type Safety** - Full TypeScript support with inference  
✅ **Auto Sync** - Types always match schema  
✅ **No Duplication** - Single source of truth  
✅ **React Hooks** - `useQuery`, `useMutation` built-in  
✅ **Better DX** - IDE autocomplete and error checking  
✅ **Validation** - GraphQL validation during codegen  
✅ **Live Reload** - Automatic regeneration during development  

## Watch Mode Details

The watcher uses `@parcel/watcher` to monitor changes:

**What it watches:**
- `src/graphql/operations/*.graphql` - Operation files
- `src/graphql/schema.graphql` - Schema file

**What it does:**
- 🔍 Detects file changes (created, modified, deleted)
- ⚙️ Automatically runs `npm run codegen`
- 📝 Regenerates `src/graphql/generated.ts`
- ✅ Shows success/error messages in console

**Example workflow:**
```
1. Edit src/graphql/operations/students.graphql
   └─ Watcher detects change
   └─ Automatically runs codegen
   └─ generated.ts updated with new types
   
2. IDE picks up new types
   └─ TypeScript validation updates
   └─ Autocomplete reflects changes
   
3. No page refresh needed (HMR works instantly)
```

## Backward Compatibility

The old `src/graphql/queries.ts` now re-exports from `generated.ts`, so existing imports continue to work.

## Next Steps

1. Update components to use generated hooks instead of manual queries
2. Remove manual `useQuery(GET_STUDENTS_TABLE)` calls
3. Benefit from full type safety throughout the app

## Common Generated Hooks

- `useStudentsTableQuery`
- `useCreateStudentMutation`
- `useUpdateStudentMutation`
- `useBanStudentMutation`
- `useActivateStudentMutation`
- `useTeachersTableQuery`
- `useCreateTeacherMutation`
- `useUpdateTeacherMutation`
- `useDeleteTeacherMutation`
- `useGroupsTableQuery`
- `useCreateGroupMutation`
- `useUpdateGroupMutation`

# Group Subscriptions Implementation

This document explains how the group creation and update subscriptions work in the frontend.

## Overview

The application now supports real-time updates for group creation and modifications through GraphQL subscriptions. When a group is created or updated by any user, all connected clients are notified instantly via WebSocket.

## How It Works

### 1. GraphQL Subscriptions

Two subscriptions were added to the GraphQL schema:

```graphql
subscription OnGroupCreated {
  groupCreated {
    ...GroupBasicInfo
  }
}

subscription OnGroupUpdated {
  groupUpdated {
    ...GroupBasicInfo
  }
}
```

These are defined in: `/src/graphql/operations/groups.graphql`

### 2. Custom Hook: `useGroupSubscriptions`

Located at: `/src/hooks/useGroupSubscriptions.ts`

This hook encapsulates the subscription logic and provides callbacks for handling group events.

#### Usage:

```typescript
import { useGroupSubscriptions } from '../hooks'

function MyComponent() {
  const { createdGroup, updatedGroup } = useGroupSubscriptions({
    onGroupCreated: (group) => {
      console.log('New group created:', group)
      // Refresh data, show notification, etc.
    },
    onGroupUpdated: (group) => {
      console.log('Group updated:', group)
      // Refresh data, show notification, etc.
    },
    enabled: true, // Set to false to disable subscriptions
  })

  return (
    <div>
      {createdGroup && <p>Latest created: {createdGroup.name}</p>}
      {updatedGroup && <p>Latest updated: {updatedGroup.name}</p>}
    </div>
  )
}
```

### 3. Integration in GroupsTable

The `GroupsTable` component now:

- Listens for group creation and update events via the subscription hook
- Shows a notification popup when a new group is created or updated
- Automatically refreshes the groups list to show the latest changes
- Provides users with real-time feedback

#### Features:

- 🟢 Green notification for new groups (with ✓ icon)
- 🔵 Blue notification for updated groups (with ✎ icon)
- Auto-dismissal after 5 seconds
- Smooth slide-in animation

## Files Modified/Created

### Created:

- `/src/hooks/useGroupSubscriptions.ts` - Custom subscription hook
- `/src/hooks/index.ts` - Hook exports

### Modified:

- `/src/graphql/operations/groups.graphql` - Added subscription definitions
- `/src/components/GroupsTable.tsx` - Integrated subscriptions with UI
- `/src/components/GroupsTable.css` - Added notification and animation styles

## Backend Requirements

The backend must implement the following subscriptions in the GraphQL schema:

```go
extend type Subscription {
  groupCreated: Group!
  groupUpdated: Group!
}
```

And publish these events when:

- `groupCreated` - When a new group is successfully created
- `groupUpdated` - When a group is successfully updated

## Configuration

### Apollo Client WebSocket Setup

Ensure your Apollo Client is configured with a WebSocket link for subscriptions:

```typescript
import { WebSocketLink } from "@apollo/client/link/ws";

const wsLink = new WebSocketLink({
  uri: "ws://your-backend-url/graphql",
  options: {
    reconnect: true,
  },
});
```

This should already be configured in your `main.tsx` or Apollo setup file.

## Future Enhancements

Possible improvements:

- Add subscription for group deletion
- Add subscription for specific group changes (e.g., `onGroupChangedById(groupId: ID)`)
- Add sound/badge notifications
- Add preference settings for notification types
- Implement subscription for teaching assignments
- Add real-time attendance updates

## Testing

To test subscriptions:

1. Open the Groups page in two different browser windows/tabs
2. Create a new group in one window
3. You should see a green notification in the other window immediately
4. The groups list should auto-refresh to show the new group

## Troubleshooting

### Subscriptions not working?

1. **Check WebSocket connection**
   - Verify backend is accessible via WebSocket (ws:// or wss://)
   - Check browser DevTools > Network > WS for connection status

2. **Check Apollo Client setup**
   - Verify Apollo Client has WebSocketLink configured
   - Check that subscriptions are enabled in Apollo Client

3. **Check backend**
   - Verify backend is publishing subscription events
   - Check backend logs for any errors

4. **Check browser console**
   - Look for any GraphQL or Apollo client errors
   - Check if subscriptions are being registered

### Notifications not showing?

- Check browser console for JavaScript errors
- Verify `enabled` prop is set to `true` in hook
- Check that callbacks are being called (add console.logs)
- Verify CSS animation is loading (`GroupsTable.css`)

# Implementation Plan

- [ ] 1. Create Real-Time Infrastructure


  - Implement the core `useRealtimeSync` custom hook that manages Supabase Realtime channel subscriptions, handles connection lifecycle, and merges real-time updates with local state
  - Create `RealtimeManager` service class for managing multiple channel subscriptions, connection pooling, and cleanup
  - Add connection status indicator component that displays real-time connection state to users
  - Write unit tests for the realtime hook covering subscription lifecycle, event handling, and reconnection logic
  - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 2. Implement Project Management Service
  - Create `projectService.ts` with functions for project CRUD operations (create, update, delete, getProjects)
  - Implement project assignment functions (assignUserToProject, removeUserFromProject, updateUserRole, getProjectUsers)
  - Add optimistic update logic that updates UI immediately before server confirmation
  - Implement error handling and rollback for failed mutations
  - Write unit tests for all project service functions
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 5.1, 5.2_

- [ ] 3. Build Admin Project Management UI
  - Create `AdminProjectManagement.tsx` main component with project list view
  - Implement `ProjectForm.tsx` component for creating and editing projects with validation
  - Build `UserAssignmentManager.tsx` component for managing user-project assignments
  - Add real-time subscription to projects table using `useRealtimeSync` hook
  - Implement optimistic UI updates for all admin actions
  - Add loading states, error messages, and success notifications
  - Write integration tests for admin UI workflows
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 4. Implement Admin LinkedIn URL Management Service
  - Create `adminLinkedInService.ts` with delete and download functions for LinkedIn entries
  - Implement `deleteLinkedInEntry` and `bulkDeleteLinkedInEntries` functions with audit logging
  - Implement `downloadLinkedInEntry`, `bulkDownloadLinkedInEntries`, and `downloadAllLinkedInEntries` functions
  - Create CSV conversion utility that formats LinkedIn entries with all fields
  - Create JSON conversion utility for data export
  - Implement file download trigger function that creates and downloads Blob
  - Write unit tests for all admin LinkedIn service functions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 5. Build Admin LinkedIn URL Management UI
  - Create `AdminLinkedInManager.tsx` main component with table view of all LinkedIn entries
  - Implement `LinkedInEntryTable.tsx` with checkboxes for bulk selection
  - Build `LinkedInEntryRow.tsx` with delete and download action buttons
  - Create `BulkActionsToolbar.tsx` for bulk delete and download operations
  - Implement `DeleteConfirmDialog.tsx` with confirmation prompt before deletion
  - Add `DownloadFormatSelector.tsx` for choosing CSV or JSON export format
  - Integrate real-time subscriptions to reflect deletions instantly across all clients
  - Add loading states, error handling, and success notifications
  - Write integration tests for admin LinkedIn management UI
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 6. Implement LinkedIn URL Real-Time Sync
  - Create `linkedInSyncService.ts` with updateLinkedInUrl and subscribeToUrlUpdates functions
  - Add LinkedIn URL validation function using existing `validateLinkedInUrl` utility
  - Update `Rtne.tsx` to use real-time subscriptions for rtne_requests table
  - Implement debounced LinkedIn URL updates that broadcast changes after user stops typing
  - Add real-time event handlers for INSERT and UPDATE events on rtne_requests
  - Write unit tests for LinkedIn sync service
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Enhance RTNP Dashboard with Real-Time Updates
  - Update `RtnpDashboard.tsx` to subscribe to all rtne_requests changes using `useRealtimeSync`
  - Add subscription to projects table for real-time project list updates
  - Implement real-time LinkedIn URL update handlers that update the dashboard without refresh
  - Add real-time user assignment change handlers
  - Display connection status indicator on RTNP dashboard
  - Integrate real-time deletion updates so deleted entries disappear instantly
  - Write integration tests for RTNP real-time updates
  - _Requirements: 4.1, 4.2, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8. Enhance RTNP Project View with Real-Time Updates
  - Update `RtnpProjectView.tsx` to subscribe to project-specific rtne_requests
  - Add real-time handlers for LinkedIn URL updates in project view
  - Implement real-time status updates for request completion
  - Add real-time deletion handlers so deleted entries disappear instantly
  - Add connection status indicator
  - Write integration tests for project view real-time updates
  - _Requirements: 4.1, 4.2, 8.1, 8.2, 8.3_

- [ ] 9. Implement User Dashboard Real-Time Integration
  - Create or update user dashboard component to subscribe to user's project assignments
  - Add real-time handlers for project assignment changes (assigned, removed, role updated)
  - Implement notification system for assignment changes
  - Display user's current projects with real-time updates
  - Add connection status indicator
  - Write integration tests for user dashboard real-time features
  - _Requirements: 2.4, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10. Implement Conflict Resolution and Error Handling
  - Create `conflictResolution.ts` with last-write-wins strategy based on timestamps
  - Implement conflict detection logic that compares local and remote timestamps
  - Add conflict notification UI component that alerts users to data conflicts
  - Implement automatic reconnection logic with exponential backoff
  - Add error boundary components for graceful error handling
  - Create pending mutation queue for offline scenarios
  - Write unit tests for conflict resolution scenarios
  - _Requirements: 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Implement Permission-Based Broadcasting
  - Create `channelAccessControl.ts` with functions to verify subscription permissions
  - Implement event filtering based on user roles and project membership
  - Add RLS policy validation in real-time event handlers
  - Create channel naming strategy that includes permission context
  - Write unit tests for permission-based filtering
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 12. Add Performance Optimizations
  - Implement connection pooling in RealtimeManager to reuse channels
  - Add message batching for multiple rapid updates
  - Implement debouncing for high-frequency events (LinkedIn URL typing)
  - Add throttling for broadcast events to prevent flooding
  - Optimize React Query cache configuration for real-time data
  - Write performance tests to verify sub-second update delivery
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 13. Add Monitoring and Logging
  - Create `realtimeMetrics.ts` to track connection count, message latency, and errors
  - Implement `realtimeLogger.ts` for logging connection events, subscriptions, and messages
  - Add metrics dashboard component for admins to monitor real-time system health
  - Implement error logging with context for debugging
  - Add performance monitoring for message delivery latency
  - _Requirements: 11.5_

- [ ] 14. Write Integration Tests
  - Write end-to-end test for admin creating project and verifying all clients see it
  - Write test for user assignment change propagating to user dashboard
  - Write test for LinkedIn URL update appearing instantly on RTNP dashboard
  - Write test for admin deleting LinkedIn entry and verifying it disappears for all users
  - Write test for admin downloading LinkedIn entries in CSV and JSON formats
  - Write test for bulk delete and download operations
  - Write test for multiple admins making concurrent changes
  - Write test for connection recovery after network interruption
  - Write test for permission-based event filtering
  - _Requirements: All requirements_

- [ ] 15. Add Documentation and Polish
  - Create user guide for admin project management features
  - Document admin LinkedIn URL management (delete and download capabilities)
  - Document real-time system architecture and troubleshooting
  - Add inline code comments for complex real-time logic
  - Create developer guide for extending real-time features
  - Add connection status tooltips and help text
  - Implement loading skeletons for real-time data
  - _Requirements: All requirements_

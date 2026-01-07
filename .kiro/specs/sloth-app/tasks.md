# Implementation Plan: Sloth.app - The Momentum Tracker

## Overview

This implementation plan breaks down Sloth.app into incremental coding tasks. The application uses React + TypeScript + TailwindCSS for the frontend, Drizzle ORM with MySQL/TiDB for the database, wagmi for MetaMask integration, Supabase for file storage, and Perplexity AI for chat features. All tasks build incrementally, with property-based tests validating correctness.

## Tasks

- [x] 1. Project Setup and Configuration

  - [x] 1.1 Initialize Vite + React + TypeScript project with TailwindCSS

    - Create project structure with src/components, src/services, src/hooks, src/types directories
    - Configure TailwindCSS with dark mode color palette (charcoal, white, muted teal)
    - Set up path aliases in tsconfig.json
    - _Requirements: 15.1_

  - [x] 1.2 Configure Drizzle ORM and database schema

    - Install drizzle-orm and drizzle-kit
    - Create schema file with all tables (users, projects, views, issues, comments, documents, links, ai_conversations, ai_messages, invitations, project_collaborators)
    - Set up database connection configuration
    - Generate and run initial migration
    - _Requirements: All data model requirements_

  - [x] 1.3 Set up environment configuration

    - Create .env.example with required variables (DATABASE_URL, SUPABASE_URL, SUPABASE_KEY, PERPLEXITY_API_KEY)
    - Configure Vite to expose necessary env vars to client
    - _Requirements: 9.2, 12.2_

  - [x] 1.4 Configure wagmi for MetaMask integration
    - Install wagmi and viem
    - Set up WagmiConfig provider with MetaMask connector
    - Create wallet connection hooks
    - _Requirements: 1.1, 1.2, 2.1_

- [x] 2. Authentication System

  - [x] 2.1 Implement wallet signature verification utility

    - Create verifyWalletSignature function using viem
    - Implement message generation for signing
    - _Requirements: 1.2, 1.3_

  - [ ] 2.2 Write property test for wallet verification

    - **Property 3: Wallet Authentication Consistency**
    - **Validates: Requirements 2.2, 2.3**

  - [x] 2.3 Implement AuthService with signup and login

    - Create signup function (email + wallet + signature → user)
    - Create loginWithWallet function (wallet → user)
    - Implement session management with JWT or cookies
    - _Requirements: 1.3, 2.2, 2.3, 2.5_

  - [ ]\* 2.4 Write property test for email-wallet linking

    - **Property 1: Email-Wallet Linking Persistence**
    - **Validates: Requirements 1.3**

  - [ ]\* 2.5 Write property test for duplicate wallet prevention

    - **Property 2: Duplicate Wallet Prevention**
    - **Validates: Requirements 1.4**

  - [ ]\* 2.6 Write property test for session establishment

    - **Property 4: Session Establishment**
    - **Validates: Requirements 2.5**

  - [x] 2.7 Create authentication UI components
    - Build WalletConnectButton component
    - Build SignupForm component (email input + wallet connect)
    - Build LoginForm component (wallet connect only)
    - Handle MetaMask not installed case
    - _Requirements: 1.1, 1.5, 2.1, 2.4_

- [x] 3. Checkpoint - Authentication Complete

  - Ensure all auth tests pass, ask the user if questions arise.

- [x] 4. Core Layout and Navigation

  - [x] 4.1 Create AppLayout with dark mode styling

    - Build main layout wrapper with sidebar and content area
    - Apply dark mode color palette globally
    - Add sloth logo to top-left navigation
    - _Requirements: 3.4, 3.5, 15.1_

  - [x] 4.2 Implement Sidebar component

    - Display list of user's projects
    - Add "Create New Project" button
    - Highlight active project
    - _Requirements: 3.1, 3.2_

  - [x] 4.3 Set up React Router with routes

    - Configure routes: /, /project/:id, /view/:id, /issue/:id
    - Implement protected route wrapper for authenticated routes
    - _Requirements: 4.3_

  - [x] 4.4 Implement CommandPalette component

    - Build modal overlay with search input
    - Display filtered commands based on search
    - Execute command on selection
    - Show keyboard shortcuts
    - _Requirements: 14.1, 14.2, 14.5_

  - [ ]\* 4.5 Write property test for command palette search

    - **Property 24: Command Palette Search**
    - **Validates: Requirements 14.2**

  - [x] 4.6 Implement keyboard shortcut system
    - Set up global keyboard listener
    - Handle Cmd+K for command palette
    - Handle C for create actions (context-aware)
    - _Requirements: 14.1, 14.3, 14.4_

- [x] 5. Project Management

  - [x] 5.1 Implement ProjectService

    - Create getProjects, getProject, createProject functions
    - Implement copyProject (duplicate structure without content)
    - Implement getCollaborators
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]\* 5.2 Write property test for project creation round-trip

    - **Property 6: Project Creation Round-Trip**
    - **Validates: Requirements 4.2**

  - [ ]\* 5.3 Write property test for project copy structure preservation

    - **Property 9: Project Copy Structure Preservation**
    - **Validates: Requirements 4.5**

  - [x] 5.4 Create Dashboard page component

    - Display project list in main content area
    - Add "Create New Project" button
    - Handle empty state
    - _Requirements: 3.1, 3.3_

  - [ ]\* 5.5 Write property test for user projects display

    - **Property 5: User Projects Display Completeness**
    - **Validates: Requirements 3.1, 3.3**

  - [x] 5.6 Create ProjectDetail page component

    - Display project name and views list
    - Add "Create View" button
    - Add invite collaborator button
    - Add copy project option
    - _Requirements: 4.3, 6.1_

  - [ ]\* 5.7 Write property test for project navigation
    - **Property 7: Project Navigation Consistency**
    - **Validates: Requirements 4.3**

- [x] 6. Checkpoint - Project Management Complete

  - Ensure all project tests pass, ask the user if questions arise.

- [x] 7. Invitation System

  - [x] 7.1 Implement InvitationService

    - Create inviteCollaborator function
    - Implement acceptInvitation function
    - Handle invitation expiration
    - _Requirements: 4.4, 5.2, 5.3_

  - [ ]\* 7.2 Write property test for invitation creation

    - **Property 8: Invitation Creation**
    - **Validates: Requirements 4.4, 5.2**

  - [ ]\* 7.3 Write property test for invitation acceptance

    - **Property 10: Invitation Acceptance Grants Access**
    - **Validates: Requirements 5.3**

  - [x] 7.4 Create invitation UI components
    - Build InviteCollaboratorModal with email input
    - Build invitation acceptance page
    - Handle validation errors
    - _Requirements: 5.1, 5.4_

- [x] 8. View Management

  - [x] 8.1 Implement ViewService

    - Create getViews, getView, createView, updateView, deleteView functions
    - Validate name and tag requirements
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]\* 8.2 Write property test for view creation validation

    - **Property 12: View Creation Validation**
    - **Validates: Requirements 6.2**

  - [ ]\* 8.3 Write property test for view creation round-trip

    - **Property 13: View Creation Round-Trip**
    - **Validates: Requirements 6.3**

  - [ ]\* 8.4 Write property test for view display in project

    - **Property 11: View Display in Project**
    - **Validates: Requirements 6.1**

  - [x] 8.5 Create ViewWorkspace page component
    - Display issues in central area
    - Add "Create New Custom Issue" button
    - Include right-hand context sidebar
    - _Requirements: 6.4, 7.1, 7.2, 8.1_

- [x] 9. Issue Management

  - [x] 9.1 Implement IssueService

    - Create getIssues, getIssue, createIssue, createSubIssue, updateIssue, deleteIssue functions
    - Validate name requirement
    - Handle parent-child relationships
    - _Requirements: 7.3, 7.4, 10.3_

  - [ ]\* 9.2 Write property test for issue creation validation

    - **Property 15: Issue Creation Validation**
    - **Validates: Requirements 7.3**

  - [ ]\* 9.3 Write property test for issue creation round-trip

    - **Property 16: Issue Creation Round-Trip**
    - **Validates: Requirements 7.4**

  - [ ]\* 9.4 Write property test for issue display in view

    - **Property 14: Issue Display in View**
    - **Validates: Requirements 7.1**

  - [ ]\* 9.5 Write property test for sub-issue hierarchy

    - **Property 20: Sub-Issue Hierarchy**
    - **Validates: Requirements 10.3**

  - [x] 9.6 Create IssueList component

    - Display issues with name preview
    - Handle click to navigate to issue detail
    - _Requirements: 7.1_

  - [x] 9.7 Create IssueDetail page component

    - Display issue name and description
    - Show sub-issues list with "Add Sub-Issue" button
    - Include context boxes (comments, AI, documents, links)
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ]\* 9.8 Write property test for issue detail display
    - **Property 19: Issue Detail Display**
    - **Validates: Requirements 10.1**

- [x] 10. Checkpoint - Core Data Model Complete

  - Ensure all project/view/issue tests pass, ask the user if questions arise.

- [x] 11. Comment System

  - [x] 11.1 Implement CommentService

    - Create getComments, addComment, deleteComment functions
    - Support threaded replies with parentId
    - _Requirements: 11.2, 11.4_

  - [ ]\* 11.2 Write property test for comment thread integrity

    - **Property 21: Comment Thread Integrity**
    - **Validates: Requirements 11.2, 11.3, 11.4**

  - [x] 11.3 Create CommentBox component
    - Display comments in chronological order
    - Show author information
    - Support reply functionality
    - Add new comment input
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 12. Document Storage

  - [x] 12.1 Configure Supabase client and storage bucket

    - Set up Supabase client with credentials
    - Create storage bucket for documents
    - Configure access policies
    - _Requirements: 8.3, 13.2_

  - [x] 12.2 Implement DocumentService

    - Create uploadDocument function (to Supabase)
    - Create getDocuments function (by context type and ID)
    - Create deleteDocument and getDownloadUrl functions
    - _Requirements: 8.3, 13.2_

  - [ ]\* 12.3 Write property test for view-level document storage

    - **Property 17: View-Level Document Storage Round-Trip**
    - **Validates: Requirements 8.3**

  - [ ]\* 12.4 Write property test for issue-level document storage

    - **Property 22: Issue-Level Document Storage Round-Trip**
    - **Validates: Requirements 13.2**

  - [x] 12.5 Create DocumentsBox component
    - Display uploaded documents with file info
    - Add file upload interface
    - Support PDF, Office, and image files
    - _Requirements: 8.2, 13.1_

- [x] 13. Links Management

  - [x] 13.1 Implement LinkService

    - Create addLink, getLinks, deleteLink functions
    - Support both view and issue contexts
    - _Requirements: 8.4, 13.3, 13.4_

  - [ ]\* 13.2 Write property test for link storage round-trip

    - **Property 23: Link Storage Round-Trip**
    - **Validates: Requirements 13.4**

  - [x] 13.3 Create LinksBox component
    - Display links with descriptions
    - Add new link input with URL and description fields
    - _Requirements: 8.4, 13.3_

- [x] 14. Checkpoint - Context Boxes Complete

  - Ensure all comment/document/link tests pass, ask the user if questions arise.

- [x] 15. AI Integration

  - [x] 15.1 Implement AIService

    - Create chat function calling Perplexity API
    - Support different models (sonar-deep-research, sonar-pro)
    - Implement conversation history storage
    - _Requirements: 9.2, 9.3, 12.2, 12.3_

  - [ ]\* 15.2 Write property test for AI response display

    - **Property 18: AI Response Display**
    - **Validates: Requirements 9.5, 12.5**

  - [x] 15.3 Create AIChatBox component

    - Display chat interface with message history
    - Handle message input and submission
    - Show loading state during API calls
    - Display AI responses
    - _Requirements: 9.1, 9.5, 12.1, 12.5_

  - [x] 15.4 Configure View-level AI with strategic prompt

    - Use sonar-deep-research model
    - Set system prompt for strategic product manager role
    - _Requirements: 9.3, 9.4_

  - [x] 15.5 Configure Issue-level AI with technical prompt
    - Use sonar-pro model
    - Set system prompt for technical assistant role
    - _Requirements: 12.3, 12.4_

- [x] 16. View Context Sidebar

  - [x] 16.1 Create ViewContextSidebar component
    - Integrate DocumentsBox for view-level documents
    - Integrate LinksBox for view-level links
    - Integrate AIChatBox with strategic configuration
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 17. Final Integration and Polish

  - [x] 17.1 Wire all components together

    - Connect all pages with proper data fetching
    - Implement optimistic UI updates
    - Add loading and error states
    - _Requirements: All_

  - [x] 17.2 Implement error handling UI

    - Create error boundary components
    - Add toast notifications for errors
    - Handle all error cases from Error Handling section
    - _Requirements: All error handling_

  - [x] 17.3 Add keyboard navigation polish
    - Ensure all shortcuts work in correct contexts
    - Add visual feedback for keyboard actions
    - _Requirements: 14.1, 14.3, 14.4_

- [x] 18. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check with minimum 100 iterations
- All UI components use TailwindCSS with dark mode styling

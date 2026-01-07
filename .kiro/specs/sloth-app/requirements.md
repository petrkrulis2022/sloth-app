# Requirements Document

## Introduction

Sloth.app is a minimalist, keyboard-first personal project management tool inspired by Linear.app. It focuses on individual deep work with web3 authentication (MetaMask wallet integration) and AI-assisted planning via Perplexity AI. The application features a clean, dark-mode interface with a hierarchical structure: Project > View > Issue.

## Glossary

- **Sloth_App**: The main application system for personal project management
- **User**: An authenticated individual who owns or collaborates on projects
- **Project**: A top-level container for organizing work, containing multiple Views
- **View**: A workspace within a Project containing Issues and contextual information
- **Issue**: A task or work item within a View, can have sub-issues
- **Wallet_Authenticator**: The MetaMask wallet integration component for authentication
- **AI_Assistant**: The Perplexity AI integration for strategic and technical discussions
- **Document_Storage**: The Supabase storage system for file uploads
- **Command_Palette**: The keyboard-accessible interface for quick actions (Cmd+K)

## Requirements

### Requirement 1: User Authentication - Initial Signup

**User Story:** As a new user, I want to create an account using both my email and MetaMask wallet, so that my identity is securely linked to my blockchain wallet.

#### Acceptance Criteria

1. WHEN a user initiates signup, THE Sloth_App SHALL display fields for email input and a MetaMask wallet connection button
2. WHEN a user provides an email and connects MetaMask, THE Wallet_Authenticator SHALL prompt the user to sign a message proving wallet ownership
3. WHEN the user successfully signs the message, THE Sloth_App SHALL permanently link the email to the wallet address in the database
4. IF the wallet address is already linked to another email, THEN THE Sloth_App SHALL display an error message and prevent duplicate registration
5. IF MetaMask is not installed, THEN THE Sloth_App SHALL display instructions to install MetaMask

### Requirement 2: User Authentication - Wallet Login

**User Story:** As a returning user, I want to log in using only my MetaMask wallet, so that I can quickly access my account without entering credentials.

#### Acceptance Criteria

1. WHEN a user initiates login, THE Sloth_App SHALL display a MetaMask wallet connection button
2. WHEN a user connects their MetaMask wallet, THE Wallet_Authenticator SHALL verify the wallet address against stored user records
3. WHEN the wallet address matches a registered user, THE Sloth_App SHALL authenticate the user and redirect to the dashboard
4. IF the wallet address is not registered, THEN THE Sloth_App SHALL prompt the user to complete signup
5. WHEN authentication succeeds, THE Sloth_App SHALL establish a session for the user

### Requirement 3: Main Dashboard

**User Story:** As a user, I want to see a minimalist dashboard with my projects, so that I can quickly navigate to my work.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard, THE Sloth_App SHALL display a sidebar with a list of the user's Projects
2. THE Sloth_App SHALL display a "Create New Project" button in the sidebar
3. THE Sloth_App SHALL display the main content area with a list of all user's Projects
4. THE Sloth_App SHALL display the sloth logo prominently in the top-left navigation bar
5. THE Sloth_App SHALL render the interface in dark mode with high-contrast colors

### Requirement 4: Project Management

**User Story:** As a user, I want to create and manage projects, so that I can organize my work into logical containers.

#### Acceptance Criteria

1. WHEN a user clicks "Create New Project", THE Sloth_App SHALL display a form for project name input
2. WHEN a user submits a valid project name, THE Sloth_App SHALL create the project and add it to the sidebar
3. WHEN a user selects a project, THE Sloth_App SHALL navigate to the project detail view at /project/:id
4. THE Sloth_App SHALL allow users to invite collaborators to a project via email address
5. WHEN a user initiates project copy, THE Sloth_App SHALL duplicate the project structure (Views, View tags) without copying Issues or content

### Requirement 5: Project Collaboration

**User Story:** As a project owner, I want to invite other users to collaborate on my project via email, so that we can work together.

#### Acceptance Criteria

1. WHEN a project owner clicks the invite button, THE Sloth_App SHALL display an email input field
2. WHEN a valid email is submitted, THE Sloth_App SHALL send an invitation to the email address
3. WHEN an invited user accepts, THE Sloth_App SHALL grant them access to the project
4. IF the email is not associated with a registered user, THEN THE Sloth_App SHALL send a signup invitation
5. THE Sloth_App SHALL only allow project-level collaboration, not global team invitations

### Requirement 6: View Management

**User Story:** As a user, I want to create multiple Views within a project, so that I can organize different aspects of my work.

#### Acceptance Criteria

1. WHEN a user is in a project, THE Sloth_App SHALL display existing Views and a "Create View" option
2. WHEN creating a View, THE Sloth_App SHALL require a Custom Name and a Short Tag (e.g., "Roadmap" / "RDM")
3. WHEN a View is created, THE Sloth_App SHALL add it to the project's View list
4. WHEN a user selects a View, THE Sloth_App SHALL display the View workspace with Issues and context sidebar

### Requirement 7: View Workspace - Issue Display

**User Story:** As a user, I want to see and manage Issues within a View, so that I can track my tasks.

#### Acceptance Criteria

1. WHEN a user opens a View, THE Sloth_App SHALL display a central area with all Issues in that View
2. THE Sloth_App SHALL display a "Create New Custom Issue" button
3. WHEN creating an Issue, THE Sloth_App SHALL require a Name and Description
4. WHEN an Issue is created, THE Sloth_App SHALL add it to the View's Issue list

### Requirement 8: View Workspace - Right-Hand Sidebar

**User Story:** As a user, I want a persistent sidebar with View-level context (documents, links, AI chat), so that I have relevant information accessible while working.

#### Acceptance Criteria

1. WHEN a user opens a View, THE Sloth_App SHALL display a right-hand sidebar with context boxes
2. THE Sloth_App SHALL display a Documents Box for uploading and viewing files (PDF, Office, Images)
3. WHEN a user uploads a document, THE Document_Storage SHALL store the file in Supabase and make it accessible to project collaborators
4. THE Sloth_App SHALL display a Links Box for adding external links with descriptions
5. THE Sloth_App SHALL display an AI Discussion Box for strategic conversations about the View

### Requirement 9: View-Level AI Discussion

**User Story:** As a user, I want to discuss View-level strategy with an AI assistant, so that I can get help with planning and goals.

#### Acceptance Criteria

1. WHEN a user opens the AI Discussion Box in a View, THE Sloth_App SHALL display a chat interface
2. WHEN a user sends a message, THE AI_Assistant SHALL send the request to Perplexity AI POST /chat/completions endpoint
3. THE AI_Assistant SHALL use the sonar-deep-research model for strategic discussions
4. THE AI_Assistant SHALL use a system prompt instructing it to act as a strategic product manager or planning assistant
5. WHEN a response is received, THE Sloth_App SHALL display the AI response in the chat interface

### Requirement 10: Issue Detail View

**User Story:** As a user, I want to view and edit Issue details including sub-issues and context, so that I can manage task specifics.

#### Acceptance Criteria

1. WHEN a user clicks an Issue, THE Sloth_App SHALL display the Issue detail view with Name and Description
2. THE Sloth_App SHALL display an "Add Sub-Issue" button
3. WHEN a user adds a sub-issue, THE Sloth_App SHALL create a nested Issue under the parent
4. THE Sloth_App SHALL display Issue-specific context boxes (Comments, AI Discussion, Documents, Links)

### Requirement 11: Issue-Level Comments

**User Story:** As a user, I want to add threaded comments to Issues, so that I can collaborate with others on specific tasks.

#### Acceptance Criteria

1. WHEN a user opens an Issue, THE Sloth_App SHALL display a Comment Box
2. WHEN a user submits a comment, THE Sloth_App SHALL add it to the Issue's comment thread
3. THE Sloth_App SHALL display comments in chronological order with author information
4. THE Sloth_App SHALL allow collaborators to reply to existing comments

### Requirement 12: Issue-Level AI Discussion

**User Story:** As a user, I want to discuss Issue-specific details with an AI assistant, so that I can get technical help and research assistance.

#### Acceptance Criteria

1. WHEN a user opens the AI Discussion Box in an Issue, THE Sloth_App SHALL display a chat interface
2. WHEN a user sends a message, THE AI_Assistant SHALL send the request to Perplexity AI POST /chat/completions endpoint
3. THE AI_Assistant SHALL use the sonar-pro model for quick Q&A
4. THE AI_Assistant SHALL use a system prompt instructing it to act as a technical assistant or researcher
5. WHEN a response is received, THE Sloth_App SHALL display the AI response in the chat interface

### Requirement 13: Issue-Level Documents and Links

**User Story:** As a user, I want to attach documents and links to specific Issues, so that I can keep relevant resources organized.

#### Acceptance Criteria

1. WHEN a user opens an Issue, THE Sloth_App SHALL display a Documents Box for Issue-specific files
2. WHEN a user uploads a document to an Issue, THE Document_Storage SHALL store the file in Supabase linked to that Issue
3. WHEN a user opens an Issue, THE Sloth_App SHALL display a Links Box for Issue-specific external links
4. WHEN a user adds a link, THE Sloth_App SHALL store the URL and description with the Issue

### Requirement 14: Keyboard Navigation

**User Story:** As a power user, I want keyboard shortcuts for common actions, so that I can work efficiently without using the mouse.

#### Acceptance Criteria

1. WHEN a user presses Cmd+K (or Ctrl+K on Windows), THE Sloth_App SHALL open a command palette
2. THE Command_Palette SHALL allow searching and executing common actions
3. WHEN a user presses C in a View context, THE Sloth_App SHALL open the Create Issue dialog
4. WHEN a user presses C in the dashboard context, THE Sloth_App SHALL open the Create Project dialog
5. THE Sloth_App SHALL display available keyboard shortcuts in the command palette

### Requirement 15: Dark Mode Interface

**User Story:** As a user, I want a dark mode interface with a calming aesthetic, so that I can work comfortably for extended periods.

#### Acceptance Criteria

1. THE Sloth_App SHALL render exclusively in dark mode
2. THE Sloth_App SHALL use a color palette of deep charcoal background, soft white text, and a muted accent color (teal or forest green)
3. THE Sloth_App SHALL maintain high contrast for readability
4. THE Sloth_App SHALL apply consistent styling across all components

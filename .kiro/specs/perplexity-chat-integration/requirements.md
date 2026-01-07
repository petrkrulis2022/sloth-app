# Requirements Document

## Introduction

This feature integrates Perplexity AI chat into Sloth.app's existing project and issue dialog boxes. Users store their personal Perplexity API key securely, and the chat dialogs use this key to communicate with Perplexity's chat completions API. Chat history is persisted per project/issue in the database.

## Glossary

- **User**: A registered Sloth.app user who may have a Perplexity API key configured
- **Perplexity_API_Key**: A secret key created by users in the Perplexity API portal, stored encrypted server-side
- **Chat_Session**: A conversation thread stored in the database, associated with either a Project or an Issue
- **Chat_Message**: A single message in a chat session, with role (user/assistant/system) and content
- **Encryption_Service**: A utility that encrypts/decrypts sensitive data using a secure symmetric key
- **Perplexity_Client**: The @perplexity-ai/perplexity_ai SDK client used to call Perplexity's API

## Requirements

### Requirement 1: User Perplexity API Key Management

**User Story:** As a user, I want to securely store my Perplexity API key, so that I can use Perplexity AI in my projects and issues.

#### Acceptance Criteria

1. THE User_Settings_Page SHALL display a Perplexity integration section showing whether an API key is configured
2. WHEN a user submits a Perplexity API key, THE System SHALL encrypt the key using the Encryption_Service before storing it
3. THE System SHALL store the encrypted API key in the user record server-side only
4. THE System SHALL NOT expose the actual API key value to the frontend after storage
5. WHEN a user wants to update their API key, THE System SHALL allow them to submit a new key that replaces the existing one
6. WHEN checking API key status, THE System SHALL only return a boolean indicating whether a key exists

### Requirement 2: Project-Level Chat with Perplexity

**User Story:** As a user, I want to chat with Perplexity AI within my project, so that I can get AI assistance for project-level planning and strategy.

#### Acceptance Criteria

1. WHEN a user opens a project, THE System SHALL display a chat dialog for Perplexity conversations
2. WHEN a user sends a message, THE System SHALL load the existing chat history for that project
3. WHEN a user sends a message, THE System SHALL call Perplexity's chat completions API with the full conversation history
4. WHEN Perplexity returns a response, THE System SHALL save both the user message and assistant reply to the database
5. WHEN Perplexity returns a response, THE System SHALL display the assistant reply in the chat dialog
6. IF the user has no API key configured, THEN THE System SHALL display a message prompting them to configure one in settings
7. IF the Perplexity API returns an error, THEN THE System SHALL display an appropriate error message to the user

### Requirement 3: Issue-Level Chat with Perplexity

**User Story:** As a user, I want to chat with Perplexity AI within an issue, so that I can get AI assistance for specific tasks and technical questions.

#### Acceptance Criteria

1. WHEN a user opens an issue, THE System SHALL display a chat dialog for Perplexity conversations
2. WHEN a user sends a message, THE System SHALL load the existing chat history for that issue
3. WHEN a user sends a message, THE System SHALL call Perplexity's chat completions API with the full conversation history
4. WHEN Perplexity returns a response, THE System SHALL save both the user message and assistant reply to the database
5. WHEN Perplexity returns a response, THE System SHALL display the assistant reply in the chat dialog
6. IF the user has no API key configured, THEN THE System SHALL display a message prompting them to configure one in settings
7. IF the Perplexity API returns an error, THEN THE System SHALL display an appropriate error message to the user

### Requirement 4: Chat History Persistence

**User Story:** As a user, I want my chat history preserved, so that I can continue conversations and reference past discussions.

#### Acceptance Criteria

1. THE System SHALL persist all chat messages in the database with their role, content, and timestamp
2. WHEN a user reopens a project or issue chat, THE System SHALL load and display the previous conversation history
3. THE System SHALL store chat messages separately for each project and each issue
4. THE User SHALL be able to clear the chat history for a project or issue

### Requirement 5: Perplexity API Client

**User Story:** As a developer, I want a centralized Perplexity API client, so that all Perplexity API calls use consistent authentication and error handling.

#### Acceptance Criteria

1. THE Perplexity_Client SHALL use the @perplexity-ai/perplexity_ai SDK
2. THE Perplexity_Client SHALL authenticate using the user's decrypted API key
3. THE Perplexity_Client SHALL use the "sonar-pro" model for chat completions
4. IF an API request fails, THEN THE Perplexity_Client SHALL return an error with a user-friendly message
5. THE Perplexity_Client SHALL support passing conversation history as a messages array

### Requirement 6: Security

**User Story:** As a user, I want my Perplexity API key handled securely, so that it cannot be leaked or misused.

#### Acceptance Criteria

1. THE System SHALL encrypt API keys at rest using AES-256 or equivalent symmetric encryption
2. THE System SHALL store the encryption key in environment variables
3. THE System SHALL NOT log or expose decrypted API keys in error messages or responses
4. THE System SHALL only decrypt API keys server-side when making Perplexity API calls

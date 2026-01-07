# Implementation Plan: Perplexity Chat Integration

## Overview

This plan implements per-user Perplexity API key storage and updates the existing AI chat functionality to use user-specific keys. The implementation builds on the existing `ai_conversations` and `ai_messages` infrastructure.

## Tasks

- [x] 1. Set up crypto service for API key encryption

  - [x] 1.1 Create crypto service with encrypt/decrypt functions
    - Create `src/services/crypto/cryptoService.ts`
    - Implement AES-256-GCM encryption using Web Crypto API
    - Use `VITE_ENCRYPTION_KEY` from environment
    - Format: `iv:authTag:ciphertext` (base64 encoded)
    - _Requirements: 1.2, 6.1_
  - [ ]\* 1.2 Write property test for encryption round-trip
    - **Property 1: Encryption Round-Trip**
    - **Validates: Requirements 1.2**
  - [x] 1.3 Create crypto service index file
    - Create `src/services/crypto/index.ts`
    - Export encrypt/decrypt functions
    - _Requirements: 1.2_

- [x] 2. Update database schema and types

  - [x] 2.1 Add perplexity_api_key_enc column to users table
    - Run SQL migration in Supabase: `ALTER TABLE users ADD COLUMN perplexity_api_key_enc TEXT;`
    - _Requirements: 1.3_
  - [x] 2.2 Update database types
    - Update `src/db/types.ts` to include `perplexity_api_key_enc` in users table types
    - _Requirements: 1.3_
  - [x] 2.3 Update User type in auth types
    - Add optional `hasPerplexityApiKey` boolean to `src/types/auth.ts`
    - _Requirements: 1.6_

- [x] 3. Create user API key service

  - [x] 3.1 Implement user API key service
    - Create `src/services/perplexity/userApiKeyService.ts`
    - Implement `saveUserApiKey(userId, apiKey)` - encrypts and stores key
    - Implement `getUserApiKeyStatus(userId)` - returns `{ hasApiKey: boolean }`
    - Implement `getDecryptedApiKey(userId)` - internal use, returns decrypted key
    - Implement `removeUserApiKey(userId)` - removes the key
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_
  - [ ]\* 3.2 Write property test for API key status returns boolean only
    - **Property 3: API Key Status Returns Boolean Only**
    - **Validates: Requirements 1.6**
  - [x] 3.3 Create perplexity service index file
    - Create `src/services/perplexity/index.ts`
    - Export all functions from userApiKeyService
    - _Requirements: 1.2_

- [x] 4. Update AI service to use per-user API keys

  - [x] 4.1 Add function to get Perplexity client for user
    - Add `getPerplexityClientForUser(userId)` to `src/services/ai/aiService.ts`
    - Use `getDecryptedApiKey` to get user's key
    - Fall back to `VITE_PERPLEXITY_API_KEY` if user has no key
    - _Requirements: 5.2_
  - [x] 4.2 Update chat function to accept userId
    - Modify `chat()` function signature to include `userId` parameter
    - Use `getPerplexityClientForUser` instead of project-based client
    - _Requirements: 5.2_
  - [x] 4.3 Update sendMessage to use userId
    - Modify `sendMessage()` to accept `userId` parameter
    - Pass userId to chat function
    - Return NO_API_KEY error if user has no key and no fallback
    - _Requirements: 2.3, 2.6, 3.3, 3.6_
  - [ ]\* 4.4 Write property test for no API key shows prompt
    - **Property 8: No API Key Shows Prompt**
    - **Validates: Requirements 2.6, 3.6**

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create Perplexity settings UI component

  - [x] 6.1 Create PerplexitySettings component
    - Create `src/components/settings/PerplexitySettings.tsx`
    - Display current API key status (Configured / Not configured)
    - Password input for new API key
    - Save button that calls `saveUserApiKey`
    - Remove button (if key exists) that calls `removeUserApiKey`
    - Success/error toast messages
    - _Requirements: 1.1, 1.5_
  - [x] 6.2 Create settings component index
    - Create `src/components/settings/index.ts`
    - Export PerplexitySettings component
    - _Requirements: 1.1_

- [x] 7. Integrate settings into user profile/settings page

  - [x] 7.1 Add Perplexity settings section to user settings
    - Find or create user settings page
    - Add PerplexitySettings component
    - Pass current userId
    - _Requirements: 1.1_

- [-] 8. Update chat dialogs to pass userId

  - [ ] 8.1 Update view chat to pass userId
    - Find view chat component usage
    - Ensure userId is passed to sendMessage calls
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ] 8.2 Update issue chat to pass userId
    - Find issue chat component usage
    - Ensure userId is passed to sendMessage calls
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Add environment variable for encryption key

  - [ ] 9.1 Update .env.example with VITE_ENCRYPTION_KEY
    - Add `VITE_ENCRYPTION_KEY=your-32-byte-hex-key-here` to `.env.example`
    - _Requirements: 6.2_
  - [ ] 9.2 Generate and add encryption key to .env
    - Generate a secure 32-byte hex key
    - Add to `.env` file
    - _Requirements: 6.2_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The existing `ai_conversations` and `ai_messages` tables already handle chat persistence
- The crypto service uses Web Crypto API which is available in modern browsers
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

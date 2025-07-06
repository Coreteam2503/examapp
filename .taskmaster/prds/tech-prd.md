# Quiz API Migration - Technical PRD

## Technical Architecture Overview

**Technology Stack**: Node.js 16+, Express.js 4.x, Knex.js, SQLite/MySQL, React 18, JWT Authentication
**System Architecture**: RESTful API with Question Bank + Dynamic Quiz Generation
**Integration Strategy**: Direct JSON input → Database storage → On-demand quiz assembly
**Non-Functional Requirements**: <2s quiz generation, 5s batch processing, concurrent users
**Detail References**:
- Constraints: `/details/constraints/performance-requirements.md`
- Patterns: `/details/patterns/system-architecture.md`

## API Contract Definitions

### Flow: Question Bank Management
**API Overview**:
- **Endpoint Categories**: Batch creation, search/filter
- **Authentication Strategy**: JWT middleware for all endpoints
- **Data Flow**: JSON input → Validation → Database storage
**Detail References**:
- Complete API specs: `/details/api-specs/question-bank-apis.md`
- Request/Response schemas: `/details/schemas/question-schema.md`

### Flow: Dynamic Quiz Generation
**API Overview**:
- **Endpoint Categories**: Quiz generation, criteria filtering
- **Authentication Strategy**: JWT middleware for quiz generation
- **Data Flow**: Criteria → Query filtering → Random selection → Quiz assembly
**Detail References**:
- Complete API specs: `/details/api-specs/quiz-generation-apis.md`
- Request/Response schemas: `/details/schemas/quiz-schema.md`

## Data Architecture Overview

**Database Strategy**: Enhanced existing questions table with metadata fields
**Data Model Summary**: Questions table with domain/subject/source indexing
**Data Flow Overview**: Questions → Filtering → Random selection → Quiz response
**Storage Strategy Summary**: Normalized database storage, no quiz persistence
**Detail References**:
- Complete schemas: `/details/schemas/database-schema.md`
- Data models: `/details/schemas/data-models.md`

## Component Architecture Overview

### Flow: Question Bank Management
**Component Overview**:
- **Frontend Components**: JSON input form, validation display
- **Backend Services**: Question controller, validation service
- **Integration Points**: REST API, JSON schema validation
**Detail References**:
- Frontend specs: `/details/components/frontend-question-bank.md`
- Backend specs: `/details/components/backend-question-bank.md`

### Flow: Quiz Generation
**Component Overview**:
- **Frontend Components**: Criteria form, quiz display
- **Backend Services**: Quiz controller, random selection service
- **Integration Points**: Game format handling, universal question format
**Detail References**:
- Frontend specs: `/details/components/frontend-quiz-generation.md`
- Backend specs: `/details/components/backend-quiz-generation.md`

## Flow-to-Tech Mapping

### Business Flow: Question Bank Creation
- **Keywords**: ["batch-creation", "json-validation", "question-metadata", "database-indexing"]
- **API Categories**: ["question-endpoints", "validation-middleware"]
- **Data Models**: ["enhanced-questions-table", "metadata-fields"]
- **Component Types**: ["json-input-form", "question-controller"]
- **Dependencies**: ["database-migration"]
- **Implementation Priority**: High
- **Detail File References**: ["question-bank-apis.md", "question-schema.md"]

### Business Flow: Dynamic Quiz Generation
- **Keywords**: ["quiz-generation", "criteria-filtering", "random-selection", "game-formats"]
- **API Categories**: ["quiz-endpoints", "filtering-service"]
- **Data Models**: ["questions-query", "quiz-response"]
- **Component Types**: ["criteria-form", "quiz-controller"]
- **Dependencies**: ["question-bank-creation"]
- **Implementation Priority**: High
- **Detail File References**: ["quiz-generation-apis.md", "quiz-schema.md"]

### Business Flow: Question Bank Search
- **Keywords**: ["search-filter", "pagination", "metadata-query", "performance"]
- **API Categories**: ["search-endpoints", "query-optimization"]
- **Data Models**: ["indexed-fields", "search-results"]
- **Component Types**: ["search-interface", "filter-service"]
- **Dependencies**: ["database-indexing"]
- **Implementation Priority**: Medium
- **Detail File References**: ["question-bank-apis.md", "database-schema.md"]

## Implementation Patterns Overview

**Coding Standards Summary**: Express.js RESTful patterns, async/await, error middleware
**Architectural Patterns Summary**: Repository pattern, service layer, middleware chains
**Error Handling Strategy**: Centralized error middleware, structured error responses
**Testing Strategy Overview**: Unit tests for services, integration tests for APIs
**Security Patterns Summary**: JWT authentication, input sanitization, SQL injection prevention
**Detail References**:
- Complete patterns: `/details/patterns/implementation-patterns.md`
- Coding standards: `/details/patterns/coding-standards.md`
- Security patterns: `/details/patterns/security-patterns.md`

## Technical Constraints Overview

**Performance Requirements Summary**: 2s quiz generation, 5s batch processing, 1s search
**Security Requirements Summary**: JWT auth, input validation, SQL injection prevention
**Deployment Constraints Summary**: Node.js environment, database migrations
**Technology Justifications Summary**: Existing stack leverage, minimal dependencies
**Risk Mitigation Summary**: Database indexing, batch validation, error handling
**Detail References**:
- Detailed constraints: `/details/constraints/performance-requirements.md`
- Security details: `/details/constraints/security-requirements.md`
- Deployment details: `/details/constraints/deployment-constraints.md`

# Backend Developer Reference Document
## ExamApp - Node.js/Express Backend Standards

---

## Table of Contents
1. [Core Architecture](#core-architecture)
2. [File & Folder Organization](#file--folder-organization)
3. [Naming Conventions](#naming-conventions)
4. [MVC Patterns](#mvc-patterns)
5. [Middleware Patterns](#middleware-patterns)
6. [Security Implementation](#security-implementation)
7. [API Design Standards](#api-design-standards)
8. [Database Patterns](#database-patterns)
9. [Error Handling](#error-handling)
10. [Service Layer Patterns](#service-layer-patterns)
11. [Quick Reference](#quick-reference)

---

## Core Architecture

### Project Structure Rules
```
backend/src/
├── config/          # Database & app configuration
├── controllers/     # Route handlers (business logic entry)
├── middleware/      # Request processing layers
├── migrations/      # Database schema changes
├── models/          # Data access layer
├── routes/          # API endpoint definitions
├── services/        # Business logic implementation
├── utils/           # Helper functions & utilities
└── server.js        # Application entry point
```

### Architecture Flow
**Request → Middleware → Routes → Controllers → Services → Models → Database**

### Separation of Concerns (SOC)
- **Files**: Maximum 200-300 lines per file
- **Functions**: Single responsibility, max 50 lines
- **Controllers**: Route handling only, delegate to services
- **Services**: Business logic implementation
- **Models**: Data access and basic validation

---

## File & Folder Organization

### When to Create New Files
- **Controllers**: One file per resource/entity
- **Services**: One file per business domain
- **Models**: One file per database table
- **Middleware**: One file per middleware type
- **Routes**: One file per API resource group

### File Naming Convention
- **Files**: `camelCase.js` (e.g., `authController.js`)
- **Folders**: `lowercase` (e.g., `controllers`, `middleware`)
- **Constants**: `UPPER_SNAKE_CASE`
- **Environment**: `.env` files use `UPPER_SNAKE_CASE`

### Import/Export Standards
```javascript
// Use CommonJS (require/module.exports)
const express = require('express');
const { authenticateToken } = require('../middleware/auth');

// Export patterns
module.exports = { function1, function2 };
// OR
module.exports = singleFunction;
```

---

## Naming Conventions

### Variables & Functions
- **Variables**: `camelCase` (e.g., `userToken`, `isAuthenticated`)
- **Functions**: `camelCase` verbs (e.g., `validateUser`, `generateToken`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `JWT_SECRET`, `TOKEN_KEY`)

### Database & Models
- **Tables**: `snake_case` plural (e.g., `users`, `quiz_attempts`)
- **Columns**: `snake_case` (e.g., `first_name`, `created_at`)
- **Model Methods**: `camelCase` (e.g., `findById`, `createUser`)

### API Endpoints
- **Resources**: `kebab-case` plural (e.g., `/api/quiz-attempts`)
- **Actions**: RESTful verbs (GET, POST, PUT, DELETE)
- **Query Parameters**: `camelCase` (e.g., `?userId=123&includeDetails=true`)

---

## MVC Patterns

### Controllers Pattern
**Purpose**: Handle HTTP requests, validate input, call services, return responses

**Structure**:
```javascript
const controllerName = {
  async methodName(req, res) {
    try {
      // 1. Extract data from request
      const { param1, param2 } = req.body;
      
      // 2. Call service layer
      const result = await ServiceName.methodName(param1, param2);
      
      // 3. Return standardized response
      res.status(200).json({
        success: true,
        message: 'Action completed successfully',
        data: result
      });
    } catch (error) {
      // 4. Handle errors consistently
      console.error('Controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};
```

### Models Pattern
**Purpose**: Database interactions and basic data validation

**Structure**:
```javascript
class ModelName {
  static async create(data) {
    const [id] = await db('table_name').insert(data);
    return this.findById(id);
  }

  static async findById(id) {
    return db('table_name').where({ id }).first();
  }

  static async findAll(filters = {}) {
    let query = db('table_name');
    if (filters.field) {
      query = query.where('field', filters.field);
    }
    return query;
  }

  static async update(id, data) {
    data.updated_at = new Date();
    await db('table_name').where({ id }).update(data);
    return this.findById(id);
  }

  static async delete(id) {
    return db('table_name').where({ id }).del();
  }
}
```

### Services Pattern
**Purpose**: Business logic implementation and external service integration

**Structure**:
```javascript
const serviceName = {
  async businessMethod(param1, param2) {
    // 1. Validate business rules
    if (!param1) {
      throw new Error('Business validation failed');
    }

    // 2. Perform business logic
    const processedData = await this.processData(param1, param2);

    // 3. Call model layer
    const result = await ModelName.create(processedData);

    // 4. Additional business logic if needed
    await this.postProcessingLogic(result);

    return result;
  },

  async processData(data1, data2) {
    // Private business logic methods
    return processedData;
  }
};
```

---

## Middleware Patterns

### Middleware Chain Order
1. **Security**: Helmet, CORS
2. **Logging**: Request logging
3. **Parsing**: JSON, URL encoding
4. **Rate Limiting**: Per-route rate limits
5. **Authentication**: Token validation
6. **Authorization**: Role checking
7. **Validation**: Input validation
8. **Route Handlers**: Business logic

### Authentication Middleware
**Pattern**: JWT token validation with user lookup
```javascript
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    // ... other error handling
  }
};
```

### Validation Middleware
**Pattern**: Joi validation with standardized error responses
```javascript
const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    req.body = value;
    next();
  };
};
```

---

## Security Implementation

### Rate Limiting Strategy
- **Authentication routes**: 5 requests per 15 minutes
- **General API routes**: 100 requests per 15 minutes
- **AI/Heavy operations**: 10 requests per hour

### Authentication Flow
1. **Registration**: Hash password with bcrypt (12 rounds)
2. **Login**: Validate password, generate JWT (24h expiry)
3. **Token**: Include userId, email, role in payload
4. **Refresh**: Validate existing token, issue new one

### Authorization Patterns
```javascript
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};
```

### Data Validation Rules
- **Email**: Valid email format, unique in database
- **Password**: Minimum 6 characters, bcrypt hashing
- **File uploads**: Type validation, size limits, security scanning
- **Input sanitization**: Joi validation on all inputs

---

## API Design Standards

### Response Format Standard
**Success Response**:
```json
{
  "success": true,
  "message": "Descriptive success message",
  "data": {
    // Response data here
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### HTTP Status Codes
- **200**: Successful GET, PUT operations
- **201**: Successful resource creation
- **400**: Client validation errors
- **401**: Authentication required/failed
- **403**: Authorization failed (insufficient permissions)
- **404**: Resource not found
- **409**: Conflict (e.g., duplicate email)
- **413**: Request entity too large
- **429**: Rate limit exceeded
- **500**: Internal server error

### Route Organization
```javascript
// Group routes by resource
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/uploads', generalApiLimiter, require('./routes/uploads'));
app.use('/api/quizzes', generalApiLimiter, require('./routes/quizzes'));

// Apply middleware per route group
router.post('/register', validateRegistration, authController.register);
router.get('/profile', authenticateToken, authController.getProfile);
```

---

## Database Patterns

### Migration Standards
**File naming**: `001_descriptive_name.js`
**Structure**:
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('table_name', function(table) {
    table.increments('id').primary();
    table.string('email').unique().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('table_name');
};
```

### Query Patterns
- **Filters**: Use query builders, avoid raw SQL
- **Pagination**: Implement with `limit()` and `offset()`
- **Joins**: Prefer explicit joins over subqueries
- **Transactions**: Use for multi-table operations

### Model Conventions
- **Timestamps**: Always include `created_at`, `updated_at`
- **Soft deletes**: Use `is_active` boolean flag
- **Foreign keys**: Follow `table_id` naming convention
- **Indexes**: Add for frequently queried columns

---

## Error Handling

### Global Error Handler Pattern
```javascript
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle specific error types
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }
  
  if (error.status) {
    return res.status(error.status).json({
      success: false,
      message: error.message || 'Request failed'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
```

### Try-Catch Standards
- **Controllers**: Always wrap in try-catch
- **Services**: Let errors bubble up to controllers
- **Models**: Handle database-specific errors
- **Logging**: Log errors with context

---

## Service Layer Patterns

### Business Logic Organization
- **One service per domain**: AuthService, QuizService, UploadService
- **Service methods**: Focus on business operations
- **External integrations**: API calls, file processing, AI services
- **Validation**: Business rule validation (beyond data validation)

### Service Method Structure
```javascript
const serviceMethod = async (params) => {
  // 1. Validate business rules
  await this.validateBusinessRules(params);
  
  // 2. Process data
  const processedData = await this.processData(params);
  
  // 3. Database operations
  const result = await Model.create(processedData);
  
  // 4. Side effects (emails, notifications, etc.)
  await this.handleSideEffects(result);
  
  return result;
};
```

---

## Quick Reference

### File Creation Checklist
- [ ] File follows naming convention
- [ ] Proper require/module.exports structure
- [ ] Error handling implemented
- [ ] Consistent response format
- [ ] Appropriate middleware applied
- [ ] SOC principles followed

### Controller Checklist
- [ ] Extract data from request
- [ ] Call service layer (no direct DB calls)
- [ ] Return standardized response
- [ ] Handle errors with try-catch
- [ ] Log errors appropriately

### Route Checklist
- [ ] Apply appropriate rate limiting
- [ ] Include authentication if needed
- [ ] Add authorization if needed
- [ ] Implement input validation
- [ ] Follow RESTful conventions

### Security Checklist
- [ ] Input validation with Joi
- [ ] Authentication on protected routes
- [ ] Authorization for role-based access
- [ ] Rate limiting applied
- [ ] Error messages don't leak sensitive info

### Database Checklist
- [ ] Use model layer (no direct DB in controllers)
- [ ] Include timestamps
- [ ] Follow naming conventions
- [ ] Add appropriate indexes
- [ ] Use transactions for multi-table operations

---

## Anti-Patterns to Avoid

### ❌ Don't Do
- Direct database calls in controllers
- Inconsistent response formats
- Missing error handling
- Hardcoded configuration values
- Mixing business logic with route handling
- Large files (>300 lines)
- Raw SQL queries without good reason
- Missing input validation
- Inconsistent naming conventions

### ✅ Do Instead
- Use service layer for business logic
- Standardize all API responses
- Implement comprehensive error handling
- Use environment variables
- Separate concerns properly
- Split large files into smaller modules
- Use query builders
- Validate all inputs
- Follow established naming conventions

---

*This document should be updated as patterns evolve and new standards are established.*
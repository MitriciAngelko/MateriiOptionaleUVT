/**
 * ===============================================================================
 * API ROUTES ORCHESTRATOR - CENTRALIZED ROUTING ARCHITECTURE
 * ===============================================================================
 * 
 * ENTERPRISE ROLE:
 * This module serves as the central routing hub for the UVT academic management
 * system's RESTful API, implementing a modular routing architecture that organizes
 * endpoints by domain functionality and maintains clear separation of concerns.
 * 
 * ARCHITECTURAL PATTERNS IMPLEMENTED:
 * 
 * 1. MODULAR ROUTE ORGANIZATION:
 *    • Domain-driven route grouping (users, enrollment)
 *    • Separation of concerns by business functionality
 *    • Scalable structure for adding new feature modules
 *    • Consistent URL namespace patterns (/api/users, /api/enrollment)
 * 
 * 2. EXPRESS ROUTER MIDDLEWARE PATTERN:
 *    • Router-level middleware for route-specific logic
 *    • Hierarchical middleware application
 *    • Request processing pipeline organization
 *    • Reusable route handler composition
 * 
 * 3. RESTful API DESIGN:
 *    • Resource-based URL structure
 *    • Standard HTTP methods (GET, POST, PUT, DELETE)
 *    • Consistent response formats across endpoints
 *    • Clear API versioning strategy readiness
 * 
 * ROUTE MODULE ARCHITECTURE:
 * 
 * 1. USER MANAGEMENT ROUTES (/api/users):
 *    • User authentication and authorization
 *    • Profile management and updates
 *    • Role-based access control operations
 *    • User registration and deletion
 *    • Academic record management
 * 
 * 2. ENROLLMENT ROUTES (/api/enrollment):
 *    • Course enrollment and withdrawal
 *    • Academic history tracking
 *    • Enrollment capacity management
 *    • Automatic allocation operations
 *    • Registration period controls
 * 
 * SECURITY INTEGRATION POINTS:
 * 
 * 1. AUTHENTICATION MIDDLEWARE:
 *    • Firebase Auth token validation
 *    • User identity verification
 *    • Session management and renewal
 *    • Unauthorized access prevention
 * 
 * 2. AUTHORIZATION LAYERS:
 *    • Role-based route access control
 *    • Permission validation per endpoint
 *    • Resource ownership verification
 *    • Admin privilege requirements
 * 
 * 3. INPUT VALIDATION:
 *    • Request payload sanitization
 *    • Parameter validation and type checking
 *    • SQL injection prevention
 *    • XSS attack mitigation
 * 
 * PERFORMANCE CONSIDERATIONS:
 * 
 * 1. ROUTE EFFICIENCY:
 *    • Optimized middleware chain execution
 *    • Minimal route resolution overhead
 *    • Efficient request parameter parsing
 *    • Database query optimization strategies
 * 
 * 2. CACHING STRATEGIES:
 *    • Route-level response caching
 *    • Database query result caching
 *    • Static resource caching headers
 *    • Conditional request handling
 * 
 * 3. LOAD BALANCING SUPPORT:
 *    • Stateless route handler design
 *    • Session affinity considerations
 *    • Horizontal scaling readiness
 *    • Health check endpoint integration
 * 
 * ERROR HANDLING PATTERNS:
 * 
 * 1. STANDARDIZED ERROR RESPONSES:
 *    • Consistent error message formats
 *    • HTTP status code standardization
 *    • Error logging and monitoring
 *    • Client-friendly error descriptions
 * 
 * 2. GRACEFUL DEGRADATION:
 *    • Service unavailability handling
 *    • Database connection failure recovery
 *    • Third-party service timeout management
 *    • Partial functionality maintenance
 * 
 * MONITORING & OBSERVABILITY:
 * 
 * 1. REQUEST TRACKING:
 *    • Route-specific performance metrics
 *    • Request volume monitoring
 *    • Response time analysis
 *    • Error rate calculation
 * 
 * 2. LOGGING INTEGRATION:
 *    • Structured request/response logging
 *    • User action audit trails
 *    • Security event tracking
 *    • Performance bottleneck identification
 * 
 * SCALABILITY PATTERNS:
 * 
 * 1. MICROSERVICES READINESS:
 *    • Domain-bounded route modules
 *    • Independent service deployment capability
 *    • API versioning strategy support
 *    • Service discovery integration points
 * 
 * 2. DATABASE SCALING:
 *    • Read replica routing strategies
 *    • Database sharding considerations
 *    • Connection pooling optimization
 *    • Query performance monitoring
 * 
 * FUTURE EXPANSION PATTERNS:
 * • Additional academic modules (grades, attendance, reporting)
 * • Third-party system integrations (LMS, library systems)
 * • Mobile app API endpoints
 * • Real-time notification services
 * • Analytics and reporting endpoints
 * 
 * INTEGRATION POINTS:
 * • Firebase Firestore for data persistence
 * • Firebase Auth for user authentication
 * • Express.js middleware pipeline
 * • University systems integration
 * • External API service connections
 * ===============================================================================
 */

const express = require('express');
const userRoutes = require('./userRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const openaiRoutes = require('./openaiRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/enrollment', enrollmentRoutes);
router.use('/ai', openaiRoutes);

module.exports = router;

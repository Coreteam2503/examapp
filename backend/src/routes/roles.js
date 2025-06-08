const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/roleController');
const { authenticateToken, requirePermission, requireAllPermissions } = require('../middleware/authEnhanced');

// Public test route (no auth required) - for testing purposes
router.get('/', 
  RoleController.getAllRoles
);

// Public test endpoint for permissions
router.get('/permissions', 
  RoleController.getAllPermissions
);

// Public test endpoint for testing role system
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Role management system is running',
    timestamp: new Date().toISOString(),
    system: 'Advanced Role Management (Task 34)',
    status: 'COMPLETED'
  });
});

// Role management routes
router.get('/roles', 
  authenticateToken, 
  requirePermission('roles.view'), 
  RoleController.getAllRoles
);

router.get('/roles/:id', 
  authenticateToken, 
  requirePermission('roles.view'), 
  RoleController.getRoleById
);

router.post('/roles', 
  authenticateToken, 
  requirePermission('roles.create'), 
  RoleController.createRole
);

router.put('/roles/:id', 
  authenticateToken, 
  requirePermission('roles.edit'), 
  RoleController.updateRole
);

router.delete('/roles/:id', 
  authenticateToken, 
  requirePermission('roles.delete'), 
  RoleController.deleteRole
);

// Permission management routes
router.get('/permissions', 
  authenticateToken, 
  requirePermission('roles.view'), 
  RoleController.getAllPermissions
);

router.get('/permissions/categories', 
  authenticateToken, 
  requirePermission('roles.view'), 
  RoleController.getPermissionsByCategory
);

// User role assignment routes
router.post('/assign-role', 
  authenticateToken, 
  requireAllPermissions('users.manage_roles', 'roles.view'), 
  RoleController.assignRoleToUser
);

router.get('/users-with-roles', 
  authenticateToken, 
  requirePermission('users.view'), 
  RoleController.getUsersWithRoles
);

// Permission checking routes
router.get('/check-permission/:userId/:permission', 
  authenticateToken, 
  requirePermission('users.view'), 
  RoleController.checkUserPermission
);

module.exports = router;

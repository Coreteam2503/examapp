/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Clear existing entries
  await knex('role_permissions').del();
  await knex('permissions').del();
  await knex('roles').del();

  // Insert default permissions
  const permissions = [
    // User Management
    { name: 'users.view', display_name: 'View Users', description: 'View user profiles and lists', category: 'User Management' },
    { name: 'users.create', display_name: 'Create Users', description: 'Create new user accounts', category: 'User Management' },
    { name: 'users.edit', display_name: 'Edit Users', description: 'Edit user profiles and settings', category: 'User Management' },
    { name: 'users.delete', display_name: 'Delete Users', description: 'Delete user accounts', category: 'User Management' },
    { name: 'users.manage_roles', display_name: 'Manage User Roles', description: 'Assign and modify user roles', category: 'User Management' },
    
    // Quiz Management
    { name: 'quiz.view', display_name: 'View Quizzes', description: 'View quiz content and lists', category: 'Quiz Management' },
    { name: 'quiz.create', display_name: 'Create Quizzes', description: 'Create new quizzes', category: 'Quiz Management' },
    { name: 'quiz.edit', display_name: 'Edit Quizzes', description: 'Edit existing quizzes', category: 'Quiz Management' },
    { name: 'quiz.delete', display_name: 'Delete Quizzes', description: 'Delete quizzes', category: 'Quiz Management' },
    { name: 'quiz.take', display_name: 'Take Quizzes', description: 'Take quizzes and submit answers', category: 'Quiz Management' },
    { name: 'quiz.generate', display_name: 'Generate Quizzes', description: 'Generate quizzes using AI', category: 'Quiz Management' },
    
    // File Management
    { name: 'files.view', display_name: 'View Files', description: 'View uploaded files', category: 'File Management' },
    { name: 'files.upload', display_name: 'Upload Files', description: 'Upload new files', category: 'File Management' },
    { name: 'files.delete', display_name: 'Delete Files', description: 'Delete uploaded files', category: 'File Management' },
    { name: 'files.manage_all', display_name: 'Manage All Files', description: 'Manage files from all users', category: 'File Management' },
    
    // Analytics & Reports
    { name: 'analytics.view', display_name: 'View Analytics', description: 'View system analytics and reports', category: 'Analytics' },
    { name: 'analytics.export', display_name: 'Export Reports', description: 'Export analytics data and reports', category: 'Analytics' },
    { name: 'analytics.advanced', display_name: 'Advanced Analytics', description: 'Access advanced analytics features', category: 'Analytics' },
    
    // System Administration
    { name: 'system.admin', display_name: 'System Administration', description: 'Full system administration access', category: 'System' },
    { name: 'system.settings', display_name: 'System Settings', description: 'Manage system settings and configuration', category: 'System' },
    { name: 'system.logs', display_name: 'View System Logs', description: 'View system logs and debugging info', category: 'System' },
    
    // Role Management
    { name: 'roles.view', display_name: 'View Roles', description: 'View roles and permissions', category: 'Role Management' },
    { name: 'roles.create', display_name: 'Create Roles', description: 'Create new roles', category: 'Role Management' },
    { name: 'roles.edit', display_name: 'Edit Roles', description: 'Edit existing roles', category: 'Role Management' },
    { name: 'roles.delete', display_name: 'Delete Roles', description: 'Delete roles', category: 'Role Management' },
    { name: 'permissions.manage', display_name: 'Manage Permissions', description: 'Manage role permissions', category: 'Role Management' }
  ];

  await knex('permissions').insert(permissions);

  // Insert default roles
  const roles = [
    { 
      name: 'super_admin', 
      display_name: 'Super Administrator', 
      description: 'Full system access with all permissions',
      is_system: true 
    },
    { 
      name: 'admin', 
      display_name: 'Administrator', 
      description: 'Administrative access with most permissions',
      is_system: true 
    },
    { 
      name: 'instructor', 
      display_name: 'Instructor', 
      description: 'Can create and manage quizzes, view student analytics',
      is_system: true 
    },
    { 
      name: 'student', 
      display_name: 'Student', 
      description: 'Can take quizzes and view personal progress',
      is_system: true 
    }
  ];

  await knex('roles').insert(roles);

  // Get role and permission IDs for associations
  const roleIds = await knex('roles').select('id', 'name');
  const permissionIds = await knex('permissions').select('id', 'name');

  const getRoleId = (name) => roleIds.find(r => r.name === name)?.id;
  const getPermissionId = (name) => permissionIds.find(p => p.name === name)?.id;

  // Set up role-permission associations
  const rolePermissions = [];

  // Super Admin - All permissions
  const superAdminId = getRoleId('super_admin');
  permissionIds.forEach(perm => {
    rolePermissions.push({
      role_id: superAdminId,
      permission_id: perm.id
    });
  });

  // Admin - Most permissions except super admin functions
  const adminId = getRoleId('admin');
  const adminPermissions = [
    'users.view', 'users.create', 'users.edit', 'users.manage_roles',
    'quiz.view', 'quiz.create', 'quiz.edit', 'quiz.delete', 'quiz.generate',
    'files.view', 'files.upload', 'files.delete', 'files.manage_all',
    'analytics.view', 'analytics.export', 'analytics.advanced',
    'system.settings', 'system.logs',
    'roles.view', 'roles.create', 'roles.edit'
  ];
  adminPermissions.forEach(permName => {
    const permId = getPermissionId(permName);
    if (permId) {
      rolePermissions.push({
        role_id: adminId,
        permission_id: permId
      });
    }
  });

  // Instructor - Quiz and analytics permissions
  const instructorId = getRoleId('instructor');
  const instructorPermissions = [
    'users.view',
    'quiz.view', 'quiz.create', 'quiz.edit', 'quiz.take', 'quiz.generate',
    'files.view', 'files.upload', 'files.delete',
    'analytics.view', 'analytics.export'
  ];
  instructorPermissions.forEach(permName => {
    const permId = getPermissionId(permName);
    if (permId) {
      rolePermissions.push({
        role_id: instructorId,
        permission_id: permId
      });
    }
  });

  // Student - Basic permissions
  const studentId = getRoleId('student');
  const studentPermissions = [
    'quiz.view', 'quiz.take',
    'files.view', 'files.upload'
  ];
  studentPermissions.forEach(permName => {
    const permId = getPermissionId(permName);
    if (permId) {
      rolePermissions.push({
        role_id: studentId,
        permission_id: permId
      });
    }
  });

  // Insert role-permission associations
  await knex('role_permissions').insert(rolePermissions);
};

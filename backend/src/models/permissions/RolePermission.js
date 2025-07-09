const { db } = require('../../config/database');

class RolePermission {
  static async assignPermissionToRole(roleId, permissionId) {
    // Check if assignment already exists
    const existing = await db('role_permissions')
      .where({ role_id: roleId, permission_id: permissionId })
      .first();
    
    if (existing) {
      return existing;
    }
    
    const result = await db('role_permissions').insert({
      role_id: roleId,
      permission_id: permissionId,
      created_at: new Date()
    }).returning('id');
    
    const id = Array.isArray(result) ? (result[0]?.id || result[0]) : result?.id || result;
    
    return db('role_permissions').where({ id }).first();
  }

  static async removePermissionFromRole(roleId, permissionId) {
    return db('role_permissions')
      .where({ role_id: roleId, permission_id: permissionId })
      .del();
  }

  static async getRolePermissions(roleId) {
    return db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', roleId)
      .select('permissions.*');
  }

  static async getPermissionRoles(permissionId) {
    return db('role_permissions')
      .join('roles', 'role_permissions.role_id', 'roles.id')
      .where('role_permissions.permission_id', permissionId)
      .select('roles.*');
  }

  static async updateRolePermissions(roleId, permissionIds) {
    // Start transaction
    return db.transaction(async (trx) => {
      // Remove existing permissions
      await trx('role_permissions').where({ role_id: roleId }).del();
      
      // Add new permissions
      if (permissionIds && permissionIds.length > 0) {
        const insertData = permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          created_at: new Date()
        }));
        
        await trx('role_permissions').insert(insertData);
      }
      
      return true;
    });
  }

  static async hasPermission(roleId, permissionName) {
    const result = await db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', roleId)
      .where('permissions.name', permissionName)
      .first();
    
    return !!result;
  }
}

module.exports = RolePermission;

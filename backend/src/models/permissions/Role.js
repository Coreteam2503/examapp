const { db } = require('../../config/database');

class Role {
  static async create(roleData) {
    const result = await db('roles').insert(roleData).returning('id');
    const id = Array.isArray(result) ? (result[0]?.id || result[0]) : result?.id || result;
    return this.findById(id);
  }

  static async findById(id) {
    return db('roles').where({ id }).first();
  }

  static async findByName(name) {
    return db('roles').where({ name }).first();
  }

  static async findAll() {
    return db('roles').select('*').orderBy('created_at', 'desc');
  }

  static async update(id, roleData) {
    roleData.updated_at = new Date();
    await db('roles').where({ id }).update(roleData);
    return this.findById(id);
  }

  static async delete(id) {
    // First check if any users have this role
    const usersWithRole = await db('users').where({ role: id }).count('id as count').first();
    if (usersWithRole.count > 0) {
      throw new Error('Cannot delete role: users are assigned to this role');
    }
    
    // Delete role permissions first
    await db('role_permissions').where({ role_id: id }).del();
    
    // Delete the role
    return db('roles').where({ id }).del();
  }

  static async getRoleWithPermissions(roleId) {
    const role = await this.findById(roleId);
    if (!role) return null;

    const permissions = await db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', roleId)
      .select('permissions.*');

    return { ...role, permissions };
  }

  static async getAllRolesWithPermissions() {
    const roles = await this.findAll();
    
    for (let role of roles) {
      const permissions = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where('role_permissions.role_id', role.id)
        .select('permissions.*');
      
      role.permissions = permissions;
    }
    
    return roles;
  }
}

module.exports = Role;

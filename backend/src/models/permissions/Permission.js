const { db } = require('../../config/database');

class Permission {
  static async create(permissionData) {
    const result = await db('permissions').insert(permissionData).returning('id');
    const id = Array.isArray(result) ? (result[0]?.id || result[0]) : result?.id || result;
    return this.findById(id);
  }

  static async findById(id) {
    return db('permissions').where({ id }).first();
  }

  static async findByName(name) {
    return db('permissions').where({ name }).first();
  }

  static async findAll() {
    return db('permissions').select('*').orderBy('category', 'name');
  }

  static async findByCategory(category) {
    return db('permissions').where({ category }).select('*').orderBy('name');
  }

  static async update(id, permissionData) {
    permissionData.updated_at = new Date();
    await db('permissions').where({ id }).update(permissionData);
    return this.findById(id);
  }

  static async delete(id) {
    // First delete all role-permission associations
    await db('role_permissions').where({ permission_id: id }).del();
    
    // Delete the permission
    return db('permissions').where({ id }).del();
  }

  static async getCategories() {
    const results = await db('permissions').distinct('category').orderBy('category');
    return results.map(row => row.category);
  }
}

module.exports = Permission;

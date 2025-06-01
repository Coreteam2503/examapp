const { db } = require('../config/database');

class User {
  static async create(userData) {
    const [id] = await db('users').insert(userData);
    return this.findById(id);
  }

  static async findById(id) {
    return db('users').where({ id }).first();
  }

  static async findByEmail(email) {
    return db('users').where({ email }).first();
  }

  static async findAll() {
    return db('users').select('id', 'email', 'role', 'first_name', 'last_name', 'is_active', 'created_at');
  }

  static async update(id, userData) {
    userData.updated_at = new Date();
    await db('users').where({ id }).update(userData);
    return this.findById(id);
  }

  static async delete(id) {
    return db('users').where({ id }).del();
  }

  static async countByRole(role) {
    const result = await db('users').where({ role }).count('id as count').first();
    return result.count;
  }
}

module.exports = User;

const Role = require('../models/permissions/Role');
const Permission = require('../models/permissions/Permission');
const RolePermission = require('../models/permissions/RolePermission');
const User = require('../models/User');

class RoleController {
  // Get all roles
  static async getAllRoles(req, res) {
    try {
      const roles = await Role.getAllRolesWithPermissions();
      
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch roles'
      });
    }
  }

  // Get a specific role by ID
  static async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await Role.getRoleWithPermissions(id);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role'
      });
    }
  }

  // Create a new role
  static async createRole(req, res) {
    try {
      const { name, display_name, description, permission_ids = [] } = req.body;

      // Validate required fields
      if (!name || !display_name) {
        return res.status(400).json({
          success: false,
          message: 'Name and display name are required'
        });
      }

      // Check if role name already exists
      const existingRole = await Role.findByName(name);
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        });
      }

      // Create the role
      const role = await Role.create({
        name,
        display_name,
        description,
        is_active: true,
        is_system: false
      });

      // Assign permissions if provided
      if (permission_ids.length > 0) {
        await RolePermission.updateRolePermissions(role.id, permission_ids);
      }

      // Get the role with permissions
      const roleWithPermissions = await Role.getRoleWithPermissions(role.id);

      res.status(201).json({
        success: true,
        data: roleWithPermissions,
        message: 'Role created successfully'
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create role'
      });
    }
  }

  // Update a role
  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, display_name, description, permission_ids, is_active } = req.body;

      // Check if role exists
      const existingRole = await Role.findById(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Check if it's a system role
      if (existingRole.is_system && (name !== existingRole.name)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify system role name'
        });
      }

      // Check if new name already exists (if changing name)
      if (name && name !== existingRole.name) {
        const roleWithSameName = await Role.findByName(name);
        if (roleWithSameName) {
          return res.status(400).json({
            success: false,
            message: 'Role name already exists'
          });
        }
      }

      // Update role data
      const updateData = {};
      if (name) updateData.name = name;
      if (display_name) updateData.display_name = display_name;
      if (description !== undefined) updateData.description = description;
      if (is_active !== undefined) updateData.is_active = is_active;

      const updatedRole = await Role.update(id, updateData);

      // Update permissions if provided
      if (permission_ids !== undefined) {
        await RolePermission.updateRolePermissions(id, permission_ids);
      }

      // Get the role with permissions
      const roleWithPermissions = await Role.getRoleWithPermissions(id);

      res.json({
        success: true,
        data: roleWithPermissions,
        message: 'Role updated successfully'
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update role'
      });
    }
  }

  // Delete a role
  static async deleteRole(req, res) {
    try {
      const { id } = req.params;

      // Check if role exists
      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Check if it's a system role
      if (role.is_system) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete system role'
        });
      }

      await Role.delete(id);

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      if (error.message.includes('users are assigned')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to delete role'
      });
    }
  }

  // Get all permissions
  static async getAllPermissions(req, res) {
    try {
      const permissions = await Permission.findAll();
      
      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions'
      });
    }
  }

  // Get permissions by category
  static async getPermissionsByCategory(req, res) {
    try {
      const categories = await Permission.getCategories();
      const permissionsByCategory = {};

      for (const category of categories) {
        permissionsByCategory[category] = await Permission.findByCategory(category);
      }

      res.json({
        success: true,
        data: permissionsByCategory
      });
    } catch (error) {
      console.error('Error fetching permissions by category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions by category'
      });
    }
  }

  // Assign role to user
  static async assignRoleToUser(req, res) {
    try {
      const { userId, roleId } = req.body;

      // Validate input
      if (!userId || !roleId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and Role ID are required'
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if role exists
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Update user's role
      await User.update(userId, { role_id: roleId });

      res.json({
        success: true,
        message: 'Role assigned to user successfully'
      });
    } catch (error) {
      console.error('Error assigning role to user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign role to user'
      });
    }
  }

  // Get users with their roles
  static async getUsersWithRoles(req, res) {
    try {
      const { db } = require('../config/database');
      
      const users = await db('users')
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .select(
          'users.id',
          'users.email',
          'users.first_name',
          'users.last_name',
          'users.is_active',
          'users.created_at',
          'roles.id as role_id',
          'roles.name as role_name',
          'roles.display_name as role_display_name'
        )
        .orderBy('users.created_at', 'desc');

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users with roles'
      });
    }
  }

  // Check if user has specific permission
  static async checkUserPermission(req, res) {
    try {
      const { userId, permission } = req.params;

      // Get user's role
      const user = await User.findById(userId);
      if (!user || !user.role_id) {
        return res.json({
          success: true,
          data: { hasPermission: false }
        });
      }

      // Check if role has permission
      const hasPermission = await RolePermission.hasPermission(user.role_id, permission);

      res.json({
        success: true,
        data: { hasPermission }
      });
    } catch (error) {
      console.error('Error checking user permission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check user permission'
      });
    }
  }
}

module.exports = RoleController;

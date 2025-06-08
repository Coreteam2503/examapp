import React, { useState, useEffect } from 'react';
import './RoleManagement.css';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [usersWithRoles, setUsersWithRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('roles');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({
    name: '',
    display_name: '',
    description: '',
    permission_ids: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Fetch roles
      const rolesResponse = await fetch('/api/roles/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.data);
      }

      // Fetch permissions
      const permissionsResponse = await fetch('/api/roles/permissions/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData.data);
      }

      // Fetch users with roles
      const usersResponse = await fetch('/api/roles/users-with-roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsersWithRoles(usersData.data);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/roles/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRole)
      });

      if (response.ok) {
        setSuccess('Role created successfully');
        setShowCreateModal(false);
        setNewRole({ name: '', display_name: '', description: '', permission_ids: [] });
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      setError('Failed to create role');
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/roles/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedRole)
      });

      if (response.ok) {
        setSuccess('Role updated successfully');
        setShowEditModal(false);
        setSelectedRole(null);
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/roles/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Role deleted successfully');
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      setError('Failed to delete role');
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userId = formData.get('userId');
    const roleId = formData.get('roleId');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/roles/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: parseInt(userId), roleId: parseInt(roleId) })
      });

      if (response.ok) {
        setSuccess('Role assigned successfully');
        setShowAssignModal(false);
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      setError('Failed to assign role');
    }
  };

  const handlePermissionChange = (permissionId, checked, targetRole = null) => {
    const role = targetRole || (showEditModal ? selectedRole : newRole);
    const setter = targetRole ? setSelectedRole : (showEditModal ? setSelectedRole : setNewRole);
    
    const updatedPermissions = checked
      ? [...role.permission_ids, permissionId]
      : role.permission_ids.filter(id => id !== permissionId);
    
    setter({ ...role, permission_ids: updatedPermissions });
  };

  if (loading) {
    return <div className="role-management-loading">Loading role management...</div>;
  }

  return (
    <div className="role-management">
      <div className="role-header">
        <h2>Role & Permission Management</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreateModal(true)}
        >
          Create New Role
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="role-tabs">
        <button 
          className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Assignments
        </button>
        <button 
          className={`tab ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          Permissions
        </button>
      </div>

      {activeTab === 'roles' && (
        <div className="roles-tab">
          <div className="roles-grid">
            {roles.map(role => (
              <div key={role.id} className="role-card">
                <div className="role-card-header">
                  <h3>{role.display_name}</h3>
                  {role.is_system && <span className="system-badge">System</span>}
                </div>
                <p className="role-description">{role.description}</p>
                <div className="role-permissions">
                  <strong>Permissions ({role.permissions?.length || 0}):</strong>
                  <div className="permission-tags">
                    {role.permissions?.slice(0, 3).map(perm => (
                      <span key={perm.id} className="permission-tag">
                        {perm.display_name}
                      </span>
                    ))}
                    {role.permissions?.length > 3 && (
                      <span className="permission-tag more">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="role-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedRole({...role, permission_ids: role.permissions?.map(p => p.id) || []});
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </button>
                  {!role.is_system && (
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-tab">
          <div className="users-header">
            <h3>User Role Assignments</h3>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAssignModal(true)}
            >
              Assign Role
            </button>
          </div>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersWithRoles.map(user => (
                  <tr key={user.id}>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.role_display_name ? (
                        <span className="role-badge">{user.role_display_name}</span>
                      ) : (
                        <span className="no-role">No role assigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          // Pre-fill form with current user data
                          setShowAssignModal(true);
                        }}
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="permissions-tab">
          <h3>Available Permissions by Category</h3>
          <div className="permissions-grid">
            {Object.entries(permissions).map(([category, perms]) => (
              <div key={category} className="permission-category">
                <h4>{category}</h4>
                <div className="permission-list">
                  {perms.map(permission => (
                    <div key={permission.id} className="permission-item">
                      <strong>{permission.display_name}</strong>
                      <p>{permission.description}</p>
                      <code>{permission.name}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Role</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateRole}>
              <div className="form-group">
                <label>Role Name:</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Display Name:</label>
                <input
                  type="text"
                  value={newRole.display_name}
                  onChange={(e) => setNewRole({...newRole, display_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Permissions:</label>
                <div className="permissions-selector">
                  {Object.entries(permissions).map(([category, perms]) => (
                    <div key={category} className="permission-category-selector">
                      <h5>{category}</h5>
                      {perms.map(permission => (
                        <label key={permission.id} className="permission-checkbox">
                          <input
                            type="checkbox"
                            checked={newRole.permission_ids.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          />
                          {permission.display_name}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Role: {selectedRole.display_name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditRole}>
              <div className="form-group">
                <label>Role Name:</label>
                <input
                  type="text"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                  disabled={selectedRole.is_system}
                  required
                />
              </div>
              <div className="form-group">
                <label>Display Name:</label>
                <input
                  type="text"
                  value={selectedRole.display_name}
                  onChange={(e) => setSelectedRole({...selectedRole, display_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Permissions:</label>
                <div className="permissions-selector">
                  {Object.entries(permissions).map(([category, perms]) => (
                    <div key={category} className="permission-category-selector">
                      <h5>{category}</h5>
                      {perms.map(permission => (
                        <label key={permission.id} className="permission-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedRole.permission_ids.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          />
                          {permission.display_name}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Assign Role to User</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAssignRole}>
              <div className="form-group">
                <label>Select User:</label>
                <select name="userId" required>
                  <option value="">Choose a user...</option>
                  {usersWithRoles.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Role:</label>
                <select name="roleId" required>
                  <option value="">Choose a role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;

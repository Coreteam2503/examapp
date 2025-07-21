// Quick fix for admin authorization issue
// Run this in browser console after logging in as admin

console.log('🔍 Checking admin authorization...');

// Check current user
fetch('/api/users/me', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
})
.then(r => r.json())
.then(data => {
  console.log('👤 Current user:', data);
  
  if (data.user?.role !== 'admin') {
    console.log('❌ Token does not have admin role. Logging out to refresh token...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    window.location.href = '/login';
    return;
  }
  
  console.log('✅ User has admin role. Testing batch creation...');
  
  // Test batch creation
  return fetch('/api/batches', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test Batch Authorization',
      description: 'Testing admin permissions',
      subject: 'Testing',
      domain: 'Admin',
      is_active: true
    })
  });
})
.then(r => {
  if (r) {
    console.log('📊 Batch creation response status:', r.status);
    return r.json();
  }
})
.then(data => {
  if (data) {
    console.log('📊 Batch creation result:', data);
    if (data.success) {
      console.log('✅ Admin authorization working! You can create batches.');
    } else {
      console.log('❌ Still getting authorization error:', data.message);
    }
  }
})
.catch(error => {
  console.error('❌ Error during test:', error);
});

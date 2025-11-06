import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { listUsers, createUser, updateUser, deleteUser, UserResponse, UserCreate, UserUpdate, UserRole, getPublicDepartments, getPublicYears, getPublicSections, Department, Year, Section, clearAllData } from '../api';
import DepartmentManagement from './DepartmentManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // System Management state
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  const [clearDataLoading, setClearDataLoading] = useState(false);
  
  // Department/Year/Section data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    password: '',
    role: 'student',
    department_id: undefined,
    year: undefined,
    section_id: undefined,
    roll_number: undefined
  });

  // Student filter states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState<string>('all');
  const [studentYearFilter, setStudentYearFilter] = useState<string>('all');
  const [studentSectionFilter, setStudentSectionFilter] = useState<string>('all');

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    loadUsers();
    loadDepartmentData();
    const onChanged = () => loadDepartmentData();
    window.addEventListener('deptmgmt:changed', onChanged as any);
    return () => window.removeEventListener('deptmgmt:changed', onChanged as any);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listUsers(token);
      setUsers(response.users);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentData = async () => {
    try {
      const [deptData, yearData, sectionData] = await Promise.all([
        getPublicDepartments(),
        getPublicYears(),
        getPublicSections()
      ]);
      setDepartments(deptData);
      setYears(yearData);
      setSections(sectionData);
    } catch (err) {
      console.error('Failed to load department data:', err);
    }
  };

  const handleCreateUser = async () => {
    try {
      setError(null);
      // Basic validations
      if (!formData.username || !formData.email || (!editingUser && !formData.password)) {
        throw new Error('Username, email and password are required');
      }
      if (formData.role === 'student') {
        if (!formData.roll_number || !formData.department_id || !formData.year || !formData.section_id) {
          throw new Error('For students, Roll number, Department, Year and Section are required');
        }
      }
      await createUser(token, formData);
      setDialogOpen(false);
      resetForm();
      loadUsers();
      alert('✅ User created successfully!');
    } catch (e: any) {
      alert(`❌ Failed to create user: ${e?.message || 'Unknown error'}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      setError(null);
      const updateData: UserUpdate = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        department_id: formData.department_id,
        year: formData.year,
        section_id: formData.section_id,
        roll_number: formData.roll_number
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await updateUser(token, editingUser.id, updateData);
      setDialogOpen(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
      alert('✅ User updated successfully!');
    } catch (e: any) {
      alert(`❌ Failed to update user: ${e?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setError(null);
      await deleteUser(token, userId);
      loadUsers();
      alert('✅ User deleted successfully!');
    } catch (e: any) {
      alert(`❌ Failed to delete user: ${e?.message || 'Unknown error'}`);
    }
  };

  const handleClearAllData = async () => {
    try {
      setClearDataLoading(true);
      setError(null);
      const result = await clearAllData(token);
      setClearDataDialogOpen(false);
      setError(null);
      
      // Clear all lab templates from localStorage (old format and new college/faculty-specific format)
      // Remove old format
      localStorage.removeItem('labTemplates');
      
      // Remove all college/faculty-specific template keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('labTemplates_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Show success message
      alert(`Data cleared successfully!\n\nCleared files: ${result.cleared_files?.join(', ')}\nPreserved admin users: ${result.preserved_admin_users}\n\n${result.details}\n\nLab templates have also been cleared from the browser.`);
      // Immediately clear UI list and refetch
      setUsers([]);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to clear data');
    } finally {
      setClearDataLoading(false);
    }
  };

  const handleEditUser = (user: UserResponse) => {
    // Disallow editing admin users from local admin UI
    if (user.role === 'admin') {
      alert('Editing administrator accounts is not allowed.');
      return;
    }
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      department_id: user.department_id,
      year: user.year,
      section_id: user.section_id,
      roll_number: user.roll_number
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'student',
      department_id: undefined,
      year: undefined,
      section_id: undefined,
      roll_number: undefined
    });
    setEditingUser(null);
    setShowPassword(false);
    setConfirmPassword('');
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingUser(null);
    resetForm();
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <AdminIcon />;
      case 'faculty': return <SchoolIcon />;
      case 'student': return <PersonIcon />;
      default: return <PersonIcon />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'error';
      case 'faculty': return 'primary';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  const filteredUsers = users.filter(user => {
    // First filter by tab (role)
    let roleMatch = true;
    if (tabValue === 1) roleMatch = user.role === 'admin';
    else if (tabValue === 2) roleMatch = user.role === 'faculty';
    else if (tabValue === 3) roleMatch = user.role === 'student';
    
    if (!roleMatch) return false;

    // Apply student-specific filters only on Students tab
    if (tabValue === 3 && user.role === 'student') {
      // Search filter (username, email, roll number)
      if (studentSearchQuery) {
        const query = studentSearchQuery.toLowerCase();
        const matchesSearch = 
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.roll_number && user.roll_number.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Department filter
      if (studentDeptFilter !== 'all' && user.department_id !== studentDeptFilter) {
        return false;
      }

      // Year filter
      if (studentYearFilter !== 'all' && user.year?.toString() !== studentYearFilter) {
        return false;
      }

      // Section filter
      if (studentSectionFilter !== 'all' && user.section_id !== studentSectionFilter) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">User Management</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`All Users (${users.length})`} />
            <Tab label={`Admins (${users.filter(u => u.role === 'admin').length})`} />
            <Tab label={`Faculty (${users.filter(u => u.role === 'faculty').length})`} />
            <Tab label={`Students (${users.filter(u => u.role === 'student').length})`} />
            <Tab label="Department Management" />
            <Tab label="System Management" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <UserTable users={filteredUsers} onEdit={handleEditUser} onDelete={handleDeleteUser} departments={departments} sections={sections} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <UserTable users={filteredUsers} onEdit={handleEditUser} onDelete={handleDeleteUser} departments={departments} sections={sections} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <UserTable users={filteredUsers} onEdit={handleEditUser} onDelete={handleDeleteUser} departments={departments} sections={sections} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {/* Student Search and Filters */}
          <Box sx={{ mb: 3, p: 2, bgcolor: isDark ? '#0F0F0F' : 'action.hover', borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search students..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: isDark ? '#0F0F0F' : 'background.paper',
                      borderRadius: '8px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={studentDeptFilter}
                    onChange={(e) => setStudentDeptFilter(e.target.value)}
                    label="Department"
                    sx={{
                      bgcolor: isDark ? '#0F0F0F' : 'background.paper',
                      borderRadius: '8px'
                    }}
                  >
                    <MenuItem value="all">All Departments</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={studentYearFilter}
                    onChange={(e) => setStudentYearFilter(e.target.value)}
                    label="Year"
                    sx={{
                      bgcolor: isDark ? '#0F0F0F' : 'background.paper',
                      borderRadius: '8px'
                    }}
                  >
                    <MenuItem value="all">All Years</MenuItem>
                    {years.map((y) => (
                      <MenuItem key={y.id} value={y.year.toString()}>
                        Year {y.year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={studentSectionFilter}
                    onChange={(e) => setStudentSectionFilter(e.target.value)}
                    label="Section"
                    sx={{
                      bgcolor: isDark ? '#0F0F0F' : 'background.paper',
                      borderRadius: '8px'
                    }}
                  >
                    <MenuItem value="all">All Sections</MenuItem>
                    {sections.map((section) => (
                      <MenuItem key={section.id} value={section.id}>
                        Section {section.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setStudentSearchQuery('');
                    setStudentDeptFilter('all');
                    setStudentYearFilter('all');
                    setStudentSectionFilter('all');
                  }}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    borderColor: 'divider',
                    color: 'text.secondary',
                    '&:hover': {
                      borderColor: 'divider',
                      bgcolor: isDark ? 'action.hover' : 'action.hover'
                    }
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
            {/* Results counter */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                Showing <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{filteredUsers.length}</Box> of <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{users.filter(u => u.role === 'student').length}</Box> students
              </Typography>
            </Box>
          </Box>
          
          <UserTable users={filteredUsers} onEdit={handleEditUser} onDelete={handleDeleteUser} departments={departments} sections={sections} />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <DepartmentManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <SystemManagement 
            onClearData={() => setClearDataDialogOpen(true)}
            clearDataLoading={clearDataLoading}
          />
        </TabPanel>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper'
          }
        }}
      >
        <DialogTitle sx={{ color: 'text.primary' }}>
          {editingUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          {/* Password + Confirm with show/hide */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              margin="dense"
              label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
              type={showPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!formData.password && formData.password !== confirmPassword}
              helperText={formData.password && formData.password !== confirmPassword ? 'Passwords do not match' : ''}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <input id="showpwd" type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            <label htmlFor="showpwd" style={{ marginLeft: 8 }}>Show password</label>
          </Box>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              label="Role"
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              {/* Remove Administrator option for local admins */}
              {localStorage.getItem('role') === 'super_admin' && (
                <MenuItem value="admin">Administrator</MenuItem>
              )}
            </Select>
          </FormControl>
          
          {formData.role === 'student' && (
            <>
              <TextField
                margin="dense"
                label="Roll Number"
                fullWidth
                variant="outlined"
                value={formData.roll_number || ''}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>Department *</InputLabel>
                <Select
                  value={formData.department_id || ''}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  label="Department *"
                  required
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>Academic Year *</InputLabel>
                <Select
                  value={formData.year ? formData.year.toString() : ''}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })}
                  label="Academic Year *"
                  required
                >
                  {years.map((year) => (
                    <MenuItem key={year.id} value={year.year}>
                      Year {year.year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel>Section *</InputLabel>
                <Select
                  value={formData.section_id || ''}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  label="Section *"
                  required
                >
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      Section {section.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (formData.password && formData.password !== confirmPassword) {
                alert('❌ Passwords do not match');
                return;
              }
              if (editingUser) {
                handleUpdateUser();
              } else {
                handleCreateUser();
              }
            }}
          >
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog 
        open={clearDataDialogOpen} 
        onClose={() => setClearDataDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper'
          }
        }}
      >
        <DialogTitle sx={{ color: 'text.primary' }}>
          ⚠️ Confirm Clear All Data
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to clear all system data? This action will:
          </Typography>
          <ul>
            <li>Delete all exams, submissions, and sessions</li>
            <li>Remove all non-admin users</li>
            <li>Clear all department, year, and section data</li>
            <li>Clear all lab layout templates for all faculty</li>
            <li>Reset the system to a clean state</li>
          </ul>
          <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold', color: 'error.main' }}>
            This action cannot be undone!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Admin credentials will be preserved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDataDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleClearAllData}
            variant="contained"
            color="error"
            disabled={clearDataLoading}
          >
            {clearDataLoading ? 'Clearing...' : 'Yes, Clear All Data'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface UserTableProps {
  users: UserResponse[];
  onEdit: (user: UserResponse) => void;
  onDelete: (userId: string) => void;
  departments: Department[];
  sections: Section[];
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete, departments, sections }) => {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <AdminIcon />;
      case 'faculty': return <SchoolIcon />;
      case 'student': return <PersonIcon />;
      default: return <PersonIcon />;
    }
  };

  const getDepartmentName = (departmentId: string | null | undefined) => {
    if (!departmentId) return '-';
    const dept = departments.find(d => d.id === departmentId);
    return dept ? `${dept.name} (${dept.code})` : departmentId;
  };

  const getSectionName = (sectionId: string | null | undefined) => {
    if (!sectionId) return '-';
    const section = sections.find(s => s.id === sectionId);
    return section ? `Section ${section.name}` : sectionId;
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'error';
      case 'faculty': return 'primary';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            {users.some(user => user.role === 'student') && (
              <>
                <TableCell>Department</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Roll Number</TableCell>
              </>
            )}
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getRoleIcon(user.role)}
                  </Avatar>
                  <Typography variant="body1">{user.username}</Typography>
                </Box>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip
                  icon={getRoleIcon(user.role)}
                  label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  color={getRoleColor(user.role)}
                  variant="outlined"
                />
              </TableCell>
              {users.some(u => u.role === 'student') && (
                <>
                  <TableCell>{user.role === 'student' ? getDepartmentName(user.department_id) : ''}</TableCell>
                  <TableCell>{user.role === 'student' ? (user.year || '-') : ''}</TableCell>
                  <TableCell>{user.role === 'student' ? getSectionName(user.section_id) : ''}</TableCell>
                  <TableCell>{user.role === 'student' ? (user.roll_number || '-') : ''}</TableCell>
                </>
              )}
              <TableCell align="right">
                <Tooltip title={user.role === 'admin' ? 'Editing admin is disabled' : 'Edit User'}>
                  <IconButton onClick={() => onEdit(user)} color="primary" disabled={user.role === 'admin'}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={user.role === 'admin' ? 'Deleting admin is disabled' : 'Delete User'}>
                  <IconButton onClick={() => onDelete(user.id)} color="error" disabled={user.role === 'admin'}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// System Management Component
interface SystemManagementProps {
  onClearData: () => void;
  clearDataLoading: boolean;
}

const SystemManagement: React.FC<SystemManagementProps> = ({ onClearData, clearDataLoading }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        System Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Administrative tools for system maintenance and data management.
      </Typography>
      
      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="error">
            ⚠️ Clear All Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This action will permanently delete all system data except admin credentials. 
            This includes all exams, submissions, sessions, and non-admin users.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            <strong>This action cannot be undone!</strong>
          </Typography>
          
          <Button
            variant="contained"
            color="error"
            onClick={onClearData}
            disabled={clearDataLoading}
            startIcon={<DeleteIcon />}
          >
            {clearDataLoading ? 'Clearing Data...' : 'Clear All Data'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboard;

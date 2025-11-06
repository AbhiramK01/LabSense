import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Chip,
  Grid,
  Divider,
  InputAdornment
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { listColleges, createCollege, updateCollege, deleteCollege, College, CreateCollegePayload, UpdateCollegePayload, getCollegeAdmin, CollegeAdmin } from '../api';

const SuperAdminDashboard: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [collegeAdmin, setCollegeAdmin] = useState<CollegeAdmin | null>(null);
  // simplified: no user assignment UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // College management state
  const [collegeDialogOpen, setCollegeDialogOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [collegeName, setCollegeName] = useState('');
  
  // Create college fields
  const [collegeAddress, setCollegeAddress] = useState('');
  const [collegeCode, setCollegeCode] = useState('');
  const [collegeLogoUrl, setCollegeLogoUrl] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  
  // Field-specific error states
  const [fieldErrors, setFieldErrors] = useState<{
    collegeName?: string;
    collegeAddress?: string;
    collegeCode?: string;
    adminUsername?: string;
    adminEmail?: string;
    adminPassword?: string;
  }>({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadData();
  }, []);

  // Validate password confirmation in real-time
  useEffect(() => {
    if (!editingCollege && adminPassword && confirmPassword) {
      setPasswordMismatch(adminPassword !== confirmPassword);
    } else {
      setPasswordMismatch(false);
    }
  }, [adminPassword, confirmPassword, editingCollege]);

  // Function to parse backend errors and map to specific fields
  const parseFieldError = (errorMessage: string) => {
    const fieldErrors: any = {};
    
    // Clear previous field errors
    setFieldErrors({});
    
    // Parse common error patterns
    if (errorMessage.includes('College name') && errorMessage.includes('already exists')) {
      fieldErrors.collegeName = errorMessage;
    } else if (errorMessage.includes('College code') && errorMessage.includes('already exists')) {
      fieldErrors.collegeCode = errorMessage;
    } else if (errorMessage.includes('Admin username') && errorMessage.includes('already exists')) {
      fieldErrors.adminUsername = errorMessage;
    } else if (errorMessage.includes('Admin email') && errorMessage.includes('already exists')) {
      fieldErrors.adminEmail = errorMessage;
    } else if (errorMessage.includes('password') && errorMessage.includes('at least')) {
      fieldErrors.adminPassword = errorMessage;
    } else if (errorMessage.includes('email') && errorMessage.includes('valid')) {
      fieldErrors.adminEmail = errorMessage;
    } else if (errorMessage.includes('username') && errorMessage.includes('characters')) {
      fieldErrors.adminUsername = errorMessage;
    } else if (errorMessage.includes('code') && errorMessage.includes('characters')) {
      fieldErrors.collegeCode = errorMessage;
    } else if (errorMessage.includes('name') && errorMessage.includes('characters')) {
      fieldErrors.collegeName = errorMessage;
    } else if (errorMessage.includes('address') && errorMessage.includes('characters')) {
      fieldErrors.collegeAddress = errorMessage;
    } else if (errorMessage.includes('username') && errorMessage.includes('already exists')) {
      fieldErrors.adminUsername = errorMessage;
    } else if (errorMessage.includes('email') && errorMessage.includes('already exists')) {
      fieldErrors.adminEmail = errorMessage;
    }
    
    setFieldErrors(fieldErrors);
    return fieldErrors;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadColleges()]);
    } catch (err: any) {
      setError(`Failed to load data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadColleges = async () => {
    const data = await listColleges(token!);
    setColleges(data.colleges || []);
  };

  // no user listing here

  const handleCreateCollege = async () => {
    // Clear previous errors and success messages
    setError(null);
    setSuccess(null);
    
    // Basic required field validation
    if (!collegeName.trim() || !collegeAddress.trim() || !collegeCode.trim() || !adminUsername.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setError('All required fields must be filled');
      return;
    }
    
    // Additional validation
    if (collegeName.trim().length < 2) {
      setError('College name must be at least 2 characters long');
      return;
    }
    
    if (collegeAddress.trim().length < 4) {
      setError('College address must be at least 4 characters long');
      return;
    }
    
    if (collegeCode.trim().length < 2) {
      setError('College code must be at least 2 characters long');
      return;
    }
    
    if (!/^[A-Z0-9_-]+$/.test(collegeCode.trim())) {
      setError('College code can only contain uppercase letters, numbers, underscores, and hyphens');
      return;
    }
    
    if (adminUsername.trim().length < 3) {
      setError('Admin username must be at least 3 characters long');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(adminUsername.trim())) {
      setError('Admin username can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (adminPassword.length < 6) {
      setError('Admin password must be at least 6 characters long');
      return;
    }
    
    if (passwordMismatch) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const payload: CreateCollegePayload = {
        name: collegeName.trim(),
        address: collegeAddress.trim(),
        code: collegeCode.trim().toUpperCase(),
        logo_url: collegeLogoUrl.trim() || undefined,
        admin_username: adminUsername.trim(),
        admin_email: adminEmail.trim(),
        admin_password: adminPassword
      };
      await createCollege(token!, payload);
      setSuccess('College and admin created successfully!');
      setCollegeDialogOpen(false);
      setCollegeName('');
      setCollegeAddress('');
      setCollegeCode('');
      setCollegeLogoUrl('');
      setAdminUsername('');
      setAdminEmail('');
      setAdminPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      loadColleges();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Create college error:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create college';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.detail) {
        errorMessage = err.detail;
      }
      
      // Parse field-specific errors
      const fieldErrors = parseFieldError(errorMessage);
      
      // If no specific field errors were found, show general error
      if (Object.keys(fieldErrors).length === 0) {
        setError(errorMessage);
      } else {
        setError('Please fix the highlighted fields below');
      }
    }
  };

  const handleEditCollege = async () => {
    if (!editingCollege) return;
    
    // Clear previous errors and success messages
    setError(null);
    setSuccess(null);
    
    // Basic validation
    if (!collegeName.trim()) {
      setError('College name is required');
      return;
    }
    
    if (collegeName.trim().length < 2) {
      setError('College name must be at least 2 characters long');
      return;
    }
    
    if (collegeAddress.trim() && collegeAddress.trim().length < 4) {
      setError('College address must be at least 4 characters long');
      return;
    }
    
    if (collegeCode.trim() && collegeCode.trim().length < 2) {
      setError('College code must be at least 2 characters long');
      return;
    }
    
    if (collegeCode.trim() && !/^[A-Z0-9_-]+$/.test(collegeCode.trim())) {
      setError('College code can only contain uppercase letters, numbers, underscores, and hyphens');
      return;
    }
    
    if (adminUsername.trim() && adminUsername.trim().length < 3) {
      setError('Admin username must be at least 3 characters long');
      return;
    }
    
    if (adminUsername.trim() && !/^[a-zA-Z0-9_-]+$/.test(adminUsername.trim())) {
      setError('Admin username can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    
    if (adminEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (adminPassword.trim() && adminPassword.length < 6) {
      setError('Admin password must be at least 6 characters long');
      return;
    }
    
    try {
      const payload: UpdateCollegePayload = {
        name: collegeName.trim(),
        address: collegeAddress.trim(),
        code: collegeCode.trim().toUpperCase(),
        logo_url: collegeLogoUrl.trim() || undefined,
        admin_username: adminUsername.trim() || undefined,
        admin_email: adminEmail.trim() || undefined,
        admin_password: adminPassword.trim() || undefined
      };
      await updateCollege(token!, editingCollege.id, payload);
      setSuccess('College and admin updated successfully!');
      setCollegeDialogOpen(false);
      setEditingCollege(null);
      setCollegeName('');
      setCollegeAddress('');
      setCollegeCode('');
      setCollegeLogoUrl('');
      setAdminUsername('');
      setAdminEmail('');
      setAdminPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setCollegeAdmin(null);
      loadColleges();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Edit college error:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to update college';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.detail) {
        errorMessage = err.detail;
      }
      
      // Parse field-specific errors
      const fieldErrors = parseFieldError(errorMessage);
      
      // If no specific field errors were found, show general error
      if (Object.keys(fieldErrors).length === 0) {
        setError(errorMessage);
      } else {
        setError('Please fix the highlighted fields below');
      }
    }
  };

  const handleDeleteCollege = async (college: College) => {
    if (!confirm(`Are you sure you want to delete "${college.name}"? This will delete ALL data for this college including users, exams, and submissions.`)) {
      return;
    }
    
    // Clear previous messages
    setError(null);
    setSuccess(null);
    
    try {
      await deleteCollege(token!, college.id);
      setSuccess('College deleted successfully!');
      loadData();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Delete college error:', err);
      // Extract detailed error message
      let errorMessage = 'Failed to delete college';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.detail) {
        errorMessage = err.detail;
      }
      setError(errorMessage);
    }
  };

  // assignment removed

  const openCreateDialog = () => {
    // Clear previous messages
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    
    setEditingCollege(null);
    setCollegeName('');
    setCollegeAddress('');
    setCollegeCode('');
    setCollegeLogoUrl('');
    setAdminUsername('');
    setAdminEmail('');
    setAdminPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordMismatch(false);
    setCollegeAdmin(null);
    setCollegeDialogOpen(true);
  };

  const openEditDialog = async (college: College) => {
    // Clear previous messages
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    
    setEditingCollege(college);
    setCollegeName(college.name);
    setCollegeAddress(college.address || '');
    setCollegeCode(college.code || '');
    setCollegeLogoUrl(college.logo_url || '');
    
    // Load admin details
    try {
      console.log('Loading admin details for college:', college.id);
      const admin = await getCollegeAdmin(token!, college.id);
      console.log('Admin details loaded:', admin);
      setCollegeAdmin(admin);
      setAdminUsername(admin.username);
      setAdminEmail(admin.email);
      setAdminPassword(''); // Don't show current password
    } catch (err: any) {
      console.error('Failed to load admin details:', err);
      console.error('Error details:', err.message);
      setCollegeAdmin(null);
      setAdminUsername('');
      setAdminEmail('');
      setAdminPassword('');
    }
    
    setPasswordMismatch(false);
    setCollegeDialogOpen(true);
  };

  // assignment removed

  const closeDialogs = () => {
    setCollegeDialogOpen(false);
    setEditingCollege(null);
    setCollegeName('');
    setCollegeAddress('');
    setCollegeCode('');
    setCollegeLogoUrl('');
    setAdminUsername('');
    setAdminEmail('');
    setAdminPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordMismatch(false);
    setFieldErrors({});
    setCollegeAdmin(null);
  };

  // removed admin user listing

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Super Admin Dashboard</Typography>
      
      <Grid container spacing={3}>
        {/* Colleges Management */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Colleges Management</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateDialog}
                >
                  Create College
                </Button>
              </Box>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>College Name</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {colleges.map((college) => (
                      <TableRow key={college.id}>
                        <TableCell>{college.name}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => openEditDialog(college)}>
                            <EditIcon />
                          </IconButton>
                          
                          <IconButton onClick={() => handleDeleteCollege(college)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Admin Users panel removed */}
      </Grid>

      {/* College Dialog */}
      <Dialog open={collegeDialogOpen} onClose={closeDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCollege ? 'Edit College' : 'Create College'}</DialogTitle>
        <DialogContent>
          {/* Error and Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          
          <TextField 
            autoFocus 
            margin="dense" 
            label="College Name" 
            fullWidth 
            variant="outlined" 
            value={collegeName} 
            onChange={(e) => setCollegeName(e.target.value)}
            error={!!fieldErrors.collegeName}
            helperText={fieldErrors.collegeName || ""}
          />
          <TextField 
            margin="dense" 
            label="Address" 
            fullWidth 
            variant="outlined" 
            value={collegeAddress} 
            onChange={(e) => setCollegeAddress(e.target.value)}
            error={!!fieldErrors.collegeAddress}
            helperText={fieldErrors.collegeAddress || ""}
          />
          <TextField 
            margin="dense" 
            label="College Code" 
            fullWidth 
            variant="outlined" 
            value={collegeCode} 
            onChange={(e) => setCollegeCode(e.target.value)}
            error={!!fieldErrors.collegeCode}
            helperText={fieldErrors.collegeCode || ""}
          />
          <TextField margin="dense" label="Logo URL (optional)" fullWidth variant="outlined" value={collegeLogoUrl} onChange={(e) => setCollegeLogoUrl(e.target.value)} />
          
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1">College Admin Credentials</Typography>
          <TextField 
            margin="dense" 
            label="Admin Username" 
            fullWidth 
            variant="outlined" 
            value={adminUsername} 
            onChange={(e) => setAdminUsername(e.target.value)}
            error={!!fieldErrors.adminUsername}
            helperText={fieldErrors.adminUsername || ""}
          />
          <TextField 
            margin="dense" 
            label="Admin Email" 
            type="email" 
            fullWidth 
            variant="outlined" 
            value={adminEmail} 
            onChange={(e) => setAdminEmail(e.target.value)}
            error={!!fieldErrors.adminEmail}
            helperText={fieldErrors.adminEmail || ""}
          />
          
          <TextField 
            margin="dense" 
            label={editingCollege ? "New Password (leave blank to keep current)" : "Admin Password"} 
            type={showPassword ? "text" : "password"} 
            fullWidth 
            variant="outlined" 
            value={adminPassword} 
            onChange={(e) => setAdminPassword(e.target.value)}
            error={!!fieldErrors.adminPassword}
            helperText={fieldErrors.adminPassword || ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {!editingCollege && (
            <TextField 
              margin="dense" 
              label="Confirm Password" 
              type={showConfirmPassword ? "text" : "password"} 
              fullWidth 
              variant="outlined" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={passwordMismatch}
              helperText={passwordMismatch ? "Passwords do not match" : ""}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Cancel</Button>
          <Button onClick={editingCollege ? handleEditCollege : handleCreateCollege} variant="contained">
            {editingCollege ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Assign Admin Dialog removed */}
    </Box>
  );
};

export default SuperAdminDashboard;

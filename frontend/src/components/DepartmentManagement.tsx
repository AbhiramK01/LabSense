import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
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
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import {
  Department,
  Year,
  Section,
  DepartmentCreate,
  YearCreate,
  SectionCreate,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getYears,
  createYear,
  updateYear,
  deleteYear,
  getSections,
  createSection,
  updateSection,
  deleteSection
} from '../api';

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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DepartmentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'department' | 'year' | 'section'>('department');
  const [editingItem, setEditingItem] = useState<Department | Year | Section | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    year: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptData, yearData, sectionData] = await Promise.all([
        getDepartments(),
        getYears(),
        getSections()
      ]);
      setDepartments(deptData);
      setYears(yearData);
      setSections(sectionData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (type: 'department' | 'year' | 'section', item?: Department | Year | Section) => {
    setDialogType(type);
    setEditingItem(item || null);
    setFormData({
      name: item ? ('name' in item ? item.name : '') : '',
      code: item && 'code' in item ? item.code : '',
      year: item && 'year' in item ? item.year : 1
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: '', code: '', year: 1 });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (dialogType === 'department') {
        const departmentData: DepartmentCreate = {
          name: formData.name,
          code: formData.code
        };
        
        if (editingItem) {
          await updateDepartment((editingItem as Department).id, departmentData);
        } else {
          await createDepartment(departmentData);
        }
      } else if (dialogType === 'year') {
        const yearData: YearCreate = {
          year: formData.year
        };
        
        if (editingItem) {
          await updateYear((editingItem as Year).id, yearData);
        } else {
          await createYear(yearData);
        }
      } else if (dialogType === 'section') {
        const sectionData: SectionCreate = {
          name: formData.name
        };
        
        if (editingItem) {
          await updateSection((editingItem as Section).id, sectionData);
        } else {
          await createSection(sectionData);
        }
      }
      
      handleCloseDialog();
      loadData();
      // Notify other parts of the app that dept/year/section data changed
      try {
        window.dispatchEvent(new CustomEvent('deptmgmt:changed'))
      } catch (_) {}
      alert('✅ Item saved successfully!');
    } catch (err: any) {
      alert(`❌ Failed to save: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (type: 'department' | 'year' | 'section', id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      setError(null);
      
      if (type === 'department') {
        await deleteDepartment(id);
      } else if (type === 'year') {
        await deleteYear(id);
      } else if (type === 'section') {
        await deleteSection(id);
      }
      
      loadData();
      // Notify other parts of the app that dept/year/section data changed
      try {
        window.dispatchEvent(new CustomEvent('deptmgmt:changed'))
      } catch (_) {}
      alert('✅ Item deleted successfully!');
    } catch (err: any) {
      alert(`❌ Failed to delete: ${err.message || 'Unknown error'}`);
    }
  };

  const renderDepartmentTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell>{dept.name}</TableCell>
              <TableCell>
                <Chip label={dept.code} size="small" color="primary" />
              </TableCell>
              <TableCell>{new Date(dept.created_at).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('department', dept)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete('department', dept.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderYearTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Year</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {years.map((year) => (
            <TableRow key={year.id}>
              <TableCell>
                <Chip label={`Year ${year.year}`} size="small" color="secondary" />
              </TableCell>
              <TableCell>{new Date(year.created_at).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('year', year)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete('year', year.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderSectionTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sections.map((section) => (
            <TableRow key={section.id}>
              <TableCell>
                <Chip label={section.name} size="small" color="success" />
              </TableCell>
              <TableCell>{new Date(section.created_at).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog('section', section)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete('section', section.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDialog = () => (
    <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingItem ? 'Edit' : 'Create'} {dialogType === 'department' ? 'Department' : dialogType === 'year' ? 'Academic Year' : 'Section'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {dialogType === 'department' && (
          <>
            <TextField
              autoFocus
              margin="dense"
              label="Department Name"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Department Code"
              fullWidth
              variant="outlined"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </>
        )}
        
        {dialogType === 'year' && (
          <TextField
            autoFocus
            margin="dense"
            label="Academic Year"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 1 })}
            inputProps={{ min: 1, max: 10 }}
          />
        )}
        
        {dialogType === 'section' && (
          <TextField
            autoFocus
            margin="dense"
            label="Section Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {editingItem ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Department Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<SchoolIcon />} 
            label="Departments" 
            iconPosition="start"
          />
          <Tab 
            icon={<CalendarIcon />} 
            label="Academic Years" 
            iconPosition="start"
          />
          <Tab 
            icon={<GroupIcon />} 
            label="Sections" 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Departments ({departments.length})</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('department')}
          >
            Add Department
          </Button>
        </Box>
        {renderDepartmentTable()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Academic Years ({years.length})</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('year')}
          >
            Add Year
          </Button>
        </Box>
        {renderYearTable()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Sections ({sections.length})</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('section')}
          >
            Add Section
          </Button>
        </Box>
        {renderSectionTable()}
      </TabPanel>
      
      {renderDialog()}
    </Box>
  );
};

export default DepartmentManagement;

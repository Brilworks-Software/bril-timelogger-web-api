import React, { useEffect, useState, useCallback } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getUser, CreateUserData, UpdateUserData } from '../services/userService';
import { User } from '../services/userService';
import { AxiosError } from 'axios';
import { 
  TablePagination, 
  TextField, 
  Modal, 
  Box, 
  Button, 
  IconButton, 
  Typography, 
  Checkbox, 
  FormControlLabel, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { debounce } from 'lodash';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import '../css/globals.css';
import { useTranslation } from 'react-i18next';
import { 
  getProjects, 
  Project 
} from '../services/projectService';
import { 
  getTasks, 
  Task 
} from '../services/taskService';
import {
  getUserProjects,
  getUserDefaults,
  setUserDefaults,
  assignProjectsToUser,
  UserProject,
  UserDefaults
} from '../services/userAssignmentService';
import { useToast } from '../contexts/ToastContext';

interface UserAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const UserAssignmentModal: React.FC<UserAssignmentModalProps> = ({ open, onClose, user }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [defaults, setDefaults] = useState<UserDefaults | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [defaultProjectId, setDefaultProjectId] = useState<string>('');
  const [defaultTaskId, setDefaultTaskId] = useState<string>('');
  const [loadingData, setLoadingData] = useState(false);

  // Load all projects and tasks
  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [open, user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoadingData(true);
    try {
      // Load all active projects and tasks
      const [projectsRes, tasksRes, userProjectsRes, defaultsRes] = await Promise.all([
        getProjects(0, 1000, '', 'name,asc', true),
        getTasks(0, 1000, '', 'name,asc', undefined, true),
        getUserProjects(user.id),
        getUserDefaults(user.id)
      ]);

      setProjects(projectsRes.content);
      setTasks(tasksRes.content);
      setUserProjects(userProjectsRes);
      setDefaults(defaultsRes);

      // Set selected items
      setSelectedProjectIds(userProjectsRes.map(up => up.projects.id));
      setDefaultProjectId(defaultsRes.defaultProjectId || '');
      setDefaultTaskId(defaultsRes.defaultTaskId || '');
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error loading assignment data', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
    // Clear default project if unselected
    if (defaultProjectId === projectId) {
      setDefaultProjectId('');
      setDefaultTaskId(''); // Also clear default task
    }
  };

  // Tasks are automatically available through projects - no need to toggle

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update project assignments (tasks are automatically available through projects)
      await assignProjectsToUser(user.id, selectedProjectIds);

      // Update defaults (only if selected)
      await setUserDefaults(user.id, {
        defaultProjectId: defaultProjectId || null,
        defaultTaskId: defaultTaskId || null
      });

      showToast('Assignments updated successfully', 'success');
      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
      showToast('Error saving assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks for default task dropdown (from default project)
  const defaultTaskOptions = tasks.filter(task => 
    defaultProjectId && task.project_id === defaultProjectId
  );

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          padding: 3,
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {t('users.assignProjectsTasks', 'Assign Projects & Tasks')} - {user.name}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Projects Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                {t('users.projects', 'Projects')}
              </Typography>
              <Box sx={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
                {projects.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('users.noProjects', 'No projects available')}
                  </Typography>
                ) : (
                  projects.map(project => (
                    <FormControlLabel
                      key={project.id}
                      control={
                        <Checkbox
                          checked={selectedProjectIds.includes(project.id)}
                          onChange={() => handleProjectToggle(project.id)}
                        />
                      }
                      label={project.name}
                    />
                  ))
                )}
              </Box>
            </Box>

            {/* Default Project */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>{t('users.defaultProject', 'Default Project')}</InputLabel>
                <Select
                  value={defaultProjectId}
                  onChange={(e) => {
                    setDefaultProjectId(e.target.value);
                    setDefaultTaskId(''); // Reset default task when project changes
                  }}
                  label={t('users.defaultProject', 'Default Project')}
                >
                  <MenuItem value="">
                    <em>{t('users.none', 'None')}</em>
                  </MenuItem>
                  {projects
                    .filter(p => selectedProjectIds.includes(p.id))
                    .map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>

            {/* Default Task */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>{t('users.defaultTask', 'Default Task')}</InputLabel>
                <Select
                  value={defaultTaskId}
                  onChange={(e) => setDefaultTaskId(e.target.value)}
                  label={t('users.defaultTask', 'Default Task')}
                  disabled={!defaultProjectId}
                >
                  <MenuItem value="">
                    <em>{t('users.none', 'None')}</em>
                  </MenuItem>
                  {defaultTaskOptions.map(task => (
                    <MenuItem key={task.id} value={task.id}>
                      {task.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {t('users.tasksAutoAssigned', 'All tasks from assigned projects are automatically available')}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={onClose} disabled={loading}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSave} 
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : t('common.save', 'Save')}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSave: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ open, onClose, user, onSave }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'user',
    accountNonLocked: true,
    companyId: '' as string | number,
    projectIds: [] as string[],
    defaultProjectId: '',
    defaultTaskId: '',
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) {
      if (user) {
        // Edit mode - load user data
        loadUserData();
      } else {
        // Create mode - reset form
        setFormData({
          username: '',
          password: '',
          name: '',
          email: '',
          role: 'user',
          accountNonLocked: true,
          companyId: '',
          projectIds: [],
          defaultProjectId: '',
          defaultTaskId: '',
        });
      }
      loadProjectsAndTasks();
    }
  }, [open, user]);

  const loadUserData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const userData = await getUser(user.id);
      setFormData({
        username: userData.username,
        password: '', // Don't load password
        name: userData.name,
        email: userData.email || '',
        role: userData.role,
        accountNonLocked: userData.accountNonLocked,
        companyId: userData.companyId || '',
        projectIds: userData.projects?.map((p: any) => p.projects.id) || [],
        defaultProjectId: userData.defaultProjectId || '',
        defaultTaskId: userData.defaultTaskId || '',
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Error loading user data', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const loadProjectsAndTasks = async () => {
    setLoadingData(true);
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        getProjects(0, 1000, '', 'name,asc', true),
        getTasks(0, 1000, '', 'name,asc', undefined, true),
      ]);
      setProjects(projectsRes.content);
      setTasks(tasksRes.content);
    } catch (error) {
      console.error('Error loading projects/tasks:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    if (!formData.username || !formData.name || (!user && !formData.password)) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const userData: CreateUserData | UpdateUserData = {
        username: formData.username,
        name: formData.name,
        email: formData.email || undefined,
        role: formData.role,
        accountNonLocked: formData.accountNonLocked,
        companyId: formData.companyId ? (typeof formData.companyId === 'string' ? parseInt(formData.companyId, 10) : formData.companyId) : null,
        projectIds: formData.projectIds,
        defaultProjectId: formData.defaultProjectId || undefined,
        defaultTaskId: formData.defaultTaskId || undefined,
      };

      if (formData.password) {
        (userData as any).password = formData.password;
      }

      if (user) {
        await updateUser(user.id, userData);
        showToast('User updated successfully', 'success');
      } else {
        await createUser(userData as CreateUserData);
        showToast('User created successfully', 'success');
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      showToast(error.response?.data?.message || 'Error saving user', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get all tasks from assigned projects (tasks are automatically available through projects)
  const availableTasks = tasks.filter(task => 
    formData.projectIds.includes(task.project_id)
  );

  // Default task must be from the default project
  const defaultTaskOptions = tasks.filter(task => 
    formData.defaultProjectId && task.project_id === formData.defaultProjectId
  );

  return (
    <Modal open={open} onClose={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ backgroundColor: 'white', borderRadius: 2, padding: 3, maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{user ? t('users.editUser', 'Edit User') : t('users.createUser', 'Create User')}</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label={t('users.username')} value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required fullWidth />
            <TextField label={t('users.password')} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!user} fullWidth helperText={user ? 'Leave blank to keep current password' : ''} />
            <TextField label={t('users.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required fullWidth />
            <TextField label={t('users.email')} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>{t('users.role')}</InputLabel>
              <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} label={t('users.role')}>
                <MenuItem value="user">user</MenuItem>
                <MenuItem value="ROLE_ADMIN">ROLE_ADMIN</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel control={<Checkbox checked={formData.accountNonLocked} onChange={(e) => setFormData({ ...formData, accountNonLocked: e.target.checked })} />} label={t('users.accountNonLocked', 'Account Not Locked')} />
            <TextField 
              label={t('users.companyId', 'Company ID')} 
              type="number" 
              value={formData.companyId} 
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value ? e.target.value : '' })} 
              fullWidth 
              inputProps={{ min: 0 }}
              helperText={t('users.companyIdHelper', 'Optional numeric company identifier')}
            />

            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>{t('users.projects', 'Projects')}</Typography>
            <Box sx={{ maxHeight: '150px', overflow: 'auto', border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
              {projects.map(project => (
                <FormControlLabel
                  key={project.id}
                  control={<Checkbox checked={formData.projectIds.includes(project.id)} onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, projectIds: [...formData.projectIds, project.id] });
                    } else {
                      setFormData({ ...formData, projectIds: formData.projectIds.filter(id => id !== project.id), defaultProjectId: formData.defaultProjectId === project.id ? '' : formData.defaultProjectId });
                    }
                  }} />}
                  label={project.name}
                />
              ))}
            </Box>

            <FormControl fullWidth>
              <InputLabel>{t('users.defaultProject', 'Default Project')}</InputLabel>
              <Select value={formData.defaultProjectId} onChange={(e) => setFormData({ ...formData, defaultProjectId: e.target.value, defaultTaskId: '' })} label={t('users.defaultProject', 'Default Project')}>
                <MenuItem value=""><em>{t('users.none', 'None')}</em></MenuItem>
                {projects.filter(p => formData.projectIds.includes(p.id)).map(project => (
                  <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('users.defaultTask', 'Default Task')}</InputLabel>
              <Select 
                value={formData.defaultTaskId} 
                onChange={(e) => setFormData({ ...formData, defaultTaskId: e.target.value })} 
                label={t('users.defaultTask', 'Default Task')} 
                disabled={!formData.defaultProjectId}
              >
                <MenuItem value=""><em>{t('users.none', 'None')}</em></MenuItem>
                {defaultTaskOptions.map(task => (
                  <MenuItem key={task.id} value={task.id}>{task.name}</MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('users.tasksAutoAssigned', 'All tasks from assigned projects are automatically available')}
              </Typography>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button onClick={onClose} disabled={loading}>{t('common.cancel', 'Cancel')}</Button>
              <Button variant="contained" onClick={handleSave} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : t('common.save', 'Save')}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

const Users: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [userFormModalOpen, setUserFormModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async (search: string, currentPage: number, pageSize: number) => {
    try {
      setLoading(true);
      const response = await getUsers(currentPage, pageSize, search);
      setUsers(response.content || []);
      setTotalElements(response.totalElements || 0);
      setLoading(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      setError(t('users.error', { message: axiosError.message }));
      setLoading(false);
      setUsers([]);
    }
  }, [t]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setPage(0); // Reset to first page on new search
      fetchUsers(query, 0, size);
    }, 500),
    [size, fetchUsers]
  );

  useEffect(() => {
    fetchUsers(searchQuery, page, size);
  }, [page, size, fetchUsers, searchQuery]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setSearchQuery(newQuery);
    debouncedSearch(newQuery);
  };

  const handleOpenAssignmentModal = (user: User) => {
    setSelectedUser(user);
    setAssignmentModalOpen(true);
  };

  const handleCloseAssignmentModal = () => {
    setAssignmentModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenUserForm = (user: User | null = null) => {
    setSelectedUser(user);
    setUserFormModalOpen(true);
  };

  const handleCloseUserForm = () => {
    setUserFormModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      showToast('User deleted successfully', 'success');
      handleCloseDeleteDialog();
      fetchUsers(searchQuery, page, size);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showToast(error.response?.data?.message || 'Error deleting user', 'error');
    }
  };

  const handleUserSaved = () => {
    fetchUsers(searchQuery, page, size);
  };

  if (loading && users.length === 0) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ backgroundColor: 'var(--color-error)', color: 'white' }}>
          <h3>{t('users.errorTitle', 'Error')}</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h1>{t('users.title')}</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenUserForm(null)}
        >
          {t('users.createUser', 'Create User')}
        </Button>
      </Box>
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('users.searchPlaceholder', 'Search users by name, username, or email...')}
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ maxWidth: '500px' }}
        />
      </div>
      <div style={{ overflowX: 'auto', marginTop: 'var(--spacing-lg)' }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t('users.name')}</th>
              <th>{t('users.username')}</th>
              <th>{t('users.email')}</th>
              <th>{t('users.role')}</th>
              <th>{t('users.companyId', 'Company ID')}</th>
              <th>{t('users.status')}</th>
              <th>{t('users.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'ROLE_ADMIN' ? 'badge-primary' : 'badge-secondary'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.companyId || '-'}</td>
                  <td>
                    <span className={`badge ${user.accountNonLocked ? 'badge-success' : 'badge-error'}`}>
                      {user.accountNonLocked ? t('users.active') : t('users.locked')}
                    </span>
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenUserForm(user)}
                        title={t('users.editUser', 'Edit User')}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenAssignmentModal(user)}
                        title={t('users.manageAssignments', 'Manage Projects & Tasks')}
                      >
                        <SettingsIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(user)}
                        title={t('users.deleteUser', 'Delete User')}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>{t('users.noUsersFound')}</td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={size}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </div>
      <UserAssignmentModal
        open={assignmentModalOpen}
        onClose={handleCloseAssignmentModal}
        user={selectedUser}
      />
      <UserFormModal
        open={userFormModalOpen}
        onClose={handleCloseUserForm}
        user={selectedUser}
        onSave={handleUserSaved}
      />
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>{t('users.deleteUser', 'Delete User')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('users.deleteConfirm', 'Are you sure you want to delete user')} <strong>{selectedUser?.name}</strong>? {t('users.deleteWarning', 'This action cannot be undone.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>{t('common.cancel', 'Cancel')}</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            {t('common.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Users; 
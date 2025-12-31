import React, { useEffect, useState, useCallback } from 'react';
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask,
  Task 
} from '../services/taskService';
import { getProjects, Project } from '../services/projectService';
import { AxiosError } from 'axios';
import { 
  TablePagination, 
  TextField, 
  Button, 
  Modal, 
  Box, 
  IconButton, 
  Typography, 
  TextField as MuiTextField,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { debounce } from 'lodash';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import '../css/globals.css';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';

const TasksManagement: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', projectId: '', isActive: true });
  const [saving, setSaving] = useState(false);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await getProjects(0, 1000, '', 'name,asc', true);
        setProjects(response.content);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  const fetchTasks = useCallback(async (search: string, currentPage: number, pageSize: number, projectId?: string) => {
    try {
      setLoading(true);
      const response = await getTasks(currentPage, pageSize, search, 'name,asc', projectId || undefined, false);
      setTasks(response.content || []);
      setTotalElements(response.totalElements || 0);
      setLoading(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      setError(t('tasks.error', { message: axiosError.message }));
      setLoading(false);
      setTasks([]);
    }
  }, [t]);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setPage(0);
      fetchTasks(query, 0, size, selectedProjectId || undefined);
    }, 500),
    [size, fetchTasks, selectedProjectId]
  );

  useEffect(() => {
    fetchTasks(searchQuery, page, size, selectedProjectId || undefined);
  }, [page, size, fetchTasks, searchQuery, selectedProjectId]);

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

  const handleProjectFilterChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setPage(0);
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.name,
        description: task.description || '',
        projectId: task.project_id,
        isActive: task.is_active
      });
    } else {
      setEditingTask(null);
      setFormData({ name: '', description: '', projectId: selectedProjectId || '', isActive: true });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    setFormData({ name: '', description: '', projectId: selectedProjectId || '', isActive: true });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast(t('tasks.nameRequired', 'Task name is required'), 'error');
      return;
    }
    if (!formData.projectId) {
      showToast(t('tasks.projectRequired', 'Project is required'), 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          name: formData.name,
          description: formData.description || undefined,
          projectId: formData.projectId,
          isActive: formData.isActive
        });
        showToast(t('tasks.updated', 'Task updated successfully'), 'success');
      } else {
        await createTask({
          name: formData.name,
          description: formData.description || undefined,
          projectId: formData.projectId,
          isActive: formData.isActive
        });
        showToast(t('tasks.created', 'Task created successfully'), 'success');
      }
      handleCloseModal();
      fetchTasks(searchQuery, page, size, selectedProjectId || undefined);
    } catch (error) {
      console.error('Error saving task:', error);
      showToast(t('tasks.saveError', 'Error saving task'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(t('tasks.confirmDelete', 'Are you sure you want to delete this task?'))) {
      return;
    }

    try {
      await deleteTask(task.id);
      showToast(t('tasks.deleted', 'Task deleted successfully'), 'success');
      fetchTasks(searchQuery, page, size, selectedProjectId || undefined);
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast(t('tasks.deleteError', 'Error deleting task'), 'error');
    }
  };

  if (loading && tasks.length === 0) {
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
          <h3>{t('tasks.errorTitle', 'Error')}</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>{t('tasks.title', 'Tasks Management')}</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          {t('tasks.addTask', 'Add Task')}
        </Button>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <TextField
          variant="outlined"
          placeholder={t('tasks.searchPlaceholder', 'Search tasks...')}
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ maxWidth: '300px' }}
        />
        <FormControl style={{ minWidth: '200px' }}>
          <InputLabel>{t('tasks.filterByProject', 'Filter by Project')}</InputLabel>
          <Select
            value={selectedProjectId}
            onChange={(e) => handleProjectFilterChange(e.target.value)}
            label={t('tasks.filterByProject', 'Filter by Project')}
          >
            <MenuItem value="">{t('tasks.allProjects', 'All Projects')}</MenuItem>
            {projects.map(project => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 'var(--spacing-lg)' }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t('tasks.name', 'Name')}</th>
              <th>{t('tasks.project', 'Project')}</th>
              <th>{t('tasks.description', 'Description')}</th>
              <th>{t('tasks.status', 'Status')}</th>
              <th>{t('tasks.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {tasks && tasks.length > 0 ? (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.name}</td>
                  <td>{task.projects?.name || '-'}</td>
                  <td>{task.description || '-'}</td>
                  <td>
                    <Chip
                      label={task.is_active ? t('tasks.active', 'Active') : t('tasks.inactive', 'Inactive')}
                      color={task.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </td>
                  <td>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenModal(task)}
                      title={t('tasks.edit', 'Edit')}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(task)}
                      title={t('tasks.delete', 'Delete')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>{t('tasks.noTasksFound', 'No tasks found')}</td>
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

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
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
            maxWidth: '500px',
            width: '90%',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {editingTask ? t('tasks.editTask', 'Edit Task') : t('tasks.addTask', 'Add Task')}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>{t('tasks.project', 'Project')}</InputLabel>
              <Select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                label={t('tasks.project', 'Project')}
              >
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <MuiTextField
              label={t('tasks.name', 'Name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <MuiTextField
              label={t('tasks.description', 'Description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" style={{ marginLeft: '8px' }}>
                {t('tasks.active', 'Active')}
              </label>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={handleCloseModal} disabled={saving}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={20} /> : t('common.save', 'Save')}
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default TasksManagement;


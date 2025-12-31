import React, { useEffect, useState, useCallback } from 'react';
import { 
  getProjects, 
  createProject, 
  updateProject, 
  deleteProject,
  Project 
} from '../services/projectService';
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
  Chip
} from '@mui/material';
import { debounce } from 'lodash';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import '../css/globals.css';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';

const ProjectsManagement: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchProjects = useCallback(async (search: string, currentPage: number, pageSize: number) => {
    try {
      setLoading(true);
      const response = await getProjects(currentPage, pageSize, search, 'name,asc', false);
      setProjects(response.content || []);
      setTotalElements(response.totalElements || 0);
      setLoading(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      setError(t('projects.error', { message: axiosError.message }));
      setLoading(false);
      setProjects([]);
    }
  }, [t]);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setPage(0);
      fetchProjects(query, 0, size);
    }, 500),
    [size, fetchProjects]
  );

  useEffect(() => {
    fetchProjects(searchQuery, page, size);
  }, [page, size, fetchProjects, searchQuery]);

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

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        isActive: project.is_active
      });
    } else {
      setEditingProject(null);
      setFormData({ name: '', description: '', isActive: true });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', isActive: true });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast(t('projects.nameRequired', 'Project name is required'), 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: formData.name,
          description: formData.description || undefined,
          isActive: formData.isActive
        });
        showToast(t('projects.updated', 'Project updated successfully'), 'success');
      } else {
        await createProject({
          name: formData.name,
          description: formData.description || undefined,
          isActive: formData.isActive
        });
        showToast(t('projects.created', 'Project created successfully'), 'success');
      }
      handleCloseModal();
      fetchProjects(searchQuery, page, size);
    } catch (error) {
      console.error('Error saving project:', error);
      showToast(t('projects.saveError', 'Error saving project'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(t('projects.confirmDelete', 'Are you sure you want to delete this project?'))) {
      return;
    }

    try {
      await deleteProject(project.id);
      showToast(t('projects.deleted', 'Project deleted successfully'), 'success');
      fetchProjects(searchQuery, page, size);
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast(t('projects.deleteError', 'Error deleting project'), 'error');
    }
  };

  if (loading && projects.length === 0) {
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
          <h3>{t('projects.errorTitle', 'Error')}</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>{t('projects.title', 'Projects Management')}</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          {t('projects.addProject', 'Add Project')}
        </Button>
      </div>
      
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('projects.searchPlaceholder', 'Search projects...')}
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ maxWidth: '500px' }}
        />
      </div>

      <div style={{ overflowX: 'auto', marginTop: 'var(--spacing-lg)' }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t('projects.name', 'Name')}</th>
              <th>{t('projects.description', 'Description')}</th>
              <th>{t('projects.status', 'Status')}</th>
              <th>{t('projects.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.description || '-'}</td>
                  <td>
                    <Chip
                      label={project.is_active ? t('projects.active', 'Active') : t('projects.inactive', 'Inactive')}
                      color={project.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </td>
                  <td>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenModal(project)}
                      title={t('projects.edit', 'Edit')}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(project)}
                      title={t('projects.delete', 'Delete')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>{t('projects.noProjectsFound', 'No projects found')}</td>
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
              {editingProject ? t('projects.editProject', 'Edit Project') : t('projects.addProject', 'Add Project')}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <MuiTextField
              label={t('projects.name', 'Name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <MuiTextField
              label={t('projects.description', 'Description')}
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
                {t('projects.active', 'Active')}
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

export default ProjectsManagement;


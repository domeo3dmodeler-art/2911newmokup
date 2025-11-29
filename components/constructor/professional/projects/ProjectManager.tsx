'use client';

import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderOpen, Plus, Save, Download, Upload, 
  Edit, Trash2, Share, Eye, Clock, User, Search,
  Filter, Grid, List, MoreVertical, Star, StarOff
} from 'lucide-react';
import { DocumentData } from '../ProfessionalPageBuilder';
import { clientLogger } from '@/lib/logging/client-logger';

export interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  document: DocumentData;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isPublic: boolean;
  isStarred: boolean;
  author: string;
  version: string;
  size: number; // in bytes
}

interface ProjectManagerProps {
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
  onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onSelectProject,
  onNewProject,
  onClose
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created' | 'size'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  // Load projects from localStorage
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    try {
      const savedProjects = localStorage.getItem('professional-constructor-projects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
      }
    } catch (error) {
      clientLogger.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProjects = (updatedProjects: Project[]) => {
    try {
      localStorage.setItem('professional-constructor-projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    } catch (error) {
      clientLogger.error('Error saving projects:', error);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот проект?')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      saveProjects(updatedProjects);
    }
  };

  const handleToggleStar = (projectId: string) => {
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, isStarred: !p.isStarred } : p
    );
    saveProjects(updatedProjects);
  };

  const handleExportProject = (project: Project) => {
    const dataStr = JSON.stringify(project.document, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${project.name.replace(/\s+/g, '-')}.json`;
    
    if (typeof document !== 'undefined') {
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const documentData = JSON.parse(content) as DocumentData;
        
        const newProject: Project = {
          id: 'project-' + Date.now(),
          name: file.name.replace('.json', ''),
          description: 'Импортированный проект',
          thumbnail: '/templates/default-thumbnail.jpg',
          document: documentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['импорт'],
          isPublic: false,
          isStarred: false,
          author: 'Пользователь',
          version: '1.0.0',
          size: file.size
        };

        const updatedProjects = [newProject, ...projects];
        saveProjects(updatedProjects);
      } catch (error) {
        clientLogger.error('Error importing project:', error);
        alert('Ошибка при импорте проекта. Проверьте формат файла.');
      }
    };
    reader.readAsText(file);
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = selectedTag === 'all' || project.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const allTags = Array.from(new Set(projects.flatMap(p => p.tags)));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дней назад`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} недель назад`;
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Загрузка проектов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Мои проекты</h2>
              <p className="text-gray-600">Управление проектами конструктора</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onNewProject}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Новый проект</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <span className="sr-only">Закрыть</span>
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск проектов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все теги</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="updated-desc">Последние изменения</option>
              <option value="updated-asc">Старые изменения</option>
              <option value="created-desc">Новые проекты</option>
              <option value="created-asc">Старые проекты</option>
              <option value="name-asc">По имени A-Z</option>
              <option value="name-desc">По имени Z-A</option>
              <option value="size-desc">По размеру</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} rounded-l-md transition-colors`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} rounded-r-md transition-colors`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Import */}
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Импорт</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportProject}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Projects Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {projects.length === 0 ? 'Нет проектов' : 'Проекты не найдены'}
              </h3>
              <p className="text-gray-600 mb-6">
                {projects.length === 0 
                  ? 'Создайте свой первый проект или импортируйте существующий'
                  : 'Попробуйте изменить параметры поиска'
                }
              </p>
              <button
                onClick={onNewProject}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Создать проект</span>
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                    viewMode === 'list' ? 'flex items-center p-4' : 'p-4'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <div className="space-y-4">
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center relative group">
                        <div className="text-gray-400 text-center">
                          <FolderOpen className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs">Предварительный просмотр</p>
                        </div>
                        
                        {/* Actions Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => onSelectProject(project)}
                              className="p-2 bg-white rounded-md shadow-lg hover:bg-gray-50 transition-colors"
                              title="Открыть"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleExportProject(project)}
                              className="p-2 bg-white rounded-md shadow-lg hover:bg-gray-50 transition-colors"
                              title="Экспорт"
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 truncate flex-1">
                            {project.name}
                          </h3>
                          <button
                            onClick={() => handleToggleStar(project.id)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {project.isStarred ? (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            ) : (
                              <StarOff className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {project.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {project.tags.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{project.tags.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(project.updatedAt)}</span>
                          <span>{formatFileSize(project.size)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // List View
                    <>
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <FolderOpen className="w-6 h-6 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {project.name}
                          </h3>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleToggleStar(project.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {project.isStarred ? (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              ) : (
                                <StarOff className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => onSelectProject(project)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Открыть"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleExportProject(project)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Экспорт"
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {project.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatDate(project.updatedAt)}</span>
                          <span>{formatFileSize(project.size)}</span>
                          <span>{project.author}</span>
                          <div className="flex space-x-1">
                            {project.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Всего проектов: {projects.length} | Найдено: {filteredProjects.length}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

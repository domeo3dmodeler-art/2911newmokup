'use client';

import React, { useState } from 'react';
import { Save, X, Eye, Tag, Lock, Unlock, AlertCircle, Star } from 'lucide-react';
import { DocumentData } from '../ProfessionalPageBuilder';
import { Project } from './ProjectManager';

interface ProjectSaveDialogProps {
  document: DocumentData;
  onSave: (project: Project) => void;
  onCancel: () => void;
  existingProject?: Project;
}

export const ProjectSaveDialog: React.FC<ProjectSaveDialogProps> = ({
  document,
  onSave,
  onCancel,
  existingProject
}) => {
  const [name, setName] = useState(existingProject?.name || '');
  const [description, setDescription] = useState(existingProject?.description || '');
  const [tags, setTags] = useState<string[]>(existingProject?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isPublic, setIsPublic] = useState(existingProject?.isPublic || false);
  const [isStarred, setIsStarred] = useState(existingProject?.isStarred || false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Название проекта обязательно';
    }

    if (name.length > 100) {
      newErrors.name = 'Название не должно превышать 100 символов';
    }

    if (description.length > 500) {
      newErrors.description = 'Описание не должно превышать 500 символов';
    }

    if (tags.length > 10) {
      newErrors.tags = 'Не более 10 тегов';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const project: Project = {
      id: existingProject?.id || 'project-' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      thumbnail: '/templates/default-thumbnail.jpg',
      document: document,
      createdAt: existingProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags.filter(tag => tag.trim()),
      isPublic,
      isStarred,
      author: 'Пользователь',
      version: existingProject?.version || '1.0.0',
      size: JSON.stringify(document).length
    };

    onSave(project);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const suggestedTags = [
    'лендинг', 'каталог', 'конфигуратор', 'калькулятор', 'e-commerce',
    'двери', 'мебель', 'сантехника', 'строительство', 'интерьер'
  ];

  const addSuggestedTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Save className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {existingProject ? 'Сохранить изменения' : 'Сохранить проект'}
              </h2>
              <p className="text-gray-600">
                {existingProject ? 'Обновить существующий проект' : 'Создать новый проект'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название проекта *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Введите название проекта"
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/100 символов
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Краткое описание проекта"
              rows={3}
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {description.length}/500 символов
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Теги
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Добавить тег"
                maxLength={20}
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 10}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Добавить
              </button>
            </div>
            
            {errors.tags && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.tags}
              </p>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              {tags.length}/10 тегов
            </p>

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Популярные теги:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags
                    .filter(tag => !tags.includes(tag))
                    .slice(0, 8)
                    .map(tag => (
                      <button
                        key={tag}
                        onClick={() => addSuggestedTag(tag)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Настройки</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Избранное</p>
                  <p className="text-xs text-gray-500">Пометить как избранный проект</p>
                </div>
              </div>
              <button
                onClick={() => setIsStarred(!isStarred)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isStarred ? 'bg-yellow-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isStarred ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  {isPublic ? (
                    <Unlock className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Публичный доступ</p>
                  <p className="text-xs text-gray-500">
                    {isPublic ? 'Проект доступен для просмотра' : 'Проект только для вас'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublic ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Предварительный просмотр</span>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Название:</span> {name || 'Название проекта'}</p>
              <p><span className="font-medium">Описание:</span> {description || 'Описание проекта'}</p>
              <p><span className="font-medium">Теги:</span> {tags.length > 0 ? tags.join(', ') : 'Нет тегов'}</p>
              <p><span className="font-medium">Статус:</span> {isPublic ? 'Публичный' : 'Приватный'}</p>
              {isStarred && <p><span className="font-medium">Избранное:</span> ✓</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{existingProject ? 'Сохранить изменения' : 'Создать проект'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


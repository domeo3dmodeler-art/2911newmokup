'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui';
import { 
  FileText, 
  ShoppingCart, 
  Receipt, 
  Factory,
  ChevronRight,
  ChevronDown,
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface DocumentNode {
  id: string;
  number: string;
  type: 'quote' | 'order' | 'invoice' | 'supplier_order';
  status: string;
  total?: number;
  supplier?: string;
  date: string;
  children: DocumentNode[];
}

interface DocumentTreeProps {
  clientId: string;
  onDocumentSelect?: (document: DocumentNode) => void;
  onCreateDocument?: (sourceType: string, sourceId: string, targetType: string) => void;
}

export default function DocumentTree({ clientId, onDocumentSelect, onCreateDocument }: DocumentTreeProps) {
  const [documentTree, setDocumentTree] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Загрузка дерева документов
  const fetchDocumentTree = useCallback(async () => {
    try {
      const response = await fetch('/api/documents/related', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentTree(data.documentTree);
        // Автоматически раскрываем корневые узлы
        const rootIds = data.documentTree.quotes.map((q: any) => q.id);
        setExpandedNodes(new Set(rootIds));
      }
    } catch (error) {
      clientLogger.error('Error fetching document tree:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchDocumentTree();
    }
  }, [clientId, fetchDocumentTree]);

  // Переключение раскрытия узла
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Получение иконки для типа документа
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'quote': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'order': return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case 'invoice': return <Receipt className="h-4 w-4 text-purple-600" />;
      case 'supplier_order': return <Factory className="h-4 w-4 text-orange-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  // Получение цвета статуса
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-700',
      'SENT': 'bg-blue-100 text-blue-700',
      'ACCEPTED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700',
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'CANCELLED': 'bg-red-100 text-red-700'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  // Получение русского названия типа документа
  const getDocumentTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'quote': 'КП',
      'order': 'Заказ',
      'invoice': 'Счет',
      'supplier_order': 'Заказ у поставщика'
    };
    return typeMap[type] || type;
  };

  // Рендеринг узла дерева
  const renderNode = (node: DocumentNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const indentClass = `ml-${level * 4}`;

    return (
      <div key={node.id} className={`${indentClass}`}>
        <div className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg group">
          {/* Кнопка раскрытия */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
          
          {/* Иконка документа */}
          <div className="mr-3">
            {getDocumentIcon(node.type)}
          </div>

          {/* Информация о документе */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 truncate">
                {getDocumentTypeName(node.type)} {node.number}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(node.status)}`}>
                {node.status}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(node.date).toLocaleDateString('ru-RU')}
              {node.total && ` • ${node.total.toLocaleString('ru-RU')} ₽`}
              {node.supplier && ` • ${node.supplier}`}
            </div>
          </div>

          {/* Действия */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onDocumentSelect?.(node)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Просмотр"
            >
              <Eye className="h-4 w-4 text-gray-500" />
            </button>
            
            <button
              onClick={() => {
                // Функция скачивания документа будет реализована позже
                clientLogger.debug('Download document clicked', { documentId: doc.id });
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Скачать"
            >
              <Download className="h-4 w-4 text-gray-500" />
            </button>

            {/* Кнопка создания связанного документа */}
            {node.type === 'quote' && (
              <div className="relative">
                <button
                  onClick={() => onCreateDocument?.(node.type, node.id, 'order')}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Создать заказ"
                >
                  <Plus className="h-4 w-4 text-green-500" />
                </button>
              </div>
            )}
            
            {(node.type === 'quote' || node.type === 'order') && (
              <div className="relative">
                <button
                  onClick={() => onCreateDocument?.(node.type, node.id, 'invoice')}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Создать счет"
                >
                  <Plus className="h-4 w-4 text-purple-500" />
                </button>
              </div>
            )}
            
            {node.type === 'order' && (
              <div className="relative">
                <button
                  onClick={() => onCreateDocument?.(node.type, node.id, 'supplier_order')}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Создать заказ у поставщика"
                >
                  <Plus className="h-4 w-4 text-orange-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Дочерние узлы */}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">Загрузка документов...</div>
      </Card>
    );
  }

  if (!documentTree || documentTree.quotes.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Документов пока нет</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Документооборот</h3>
        <p className="text-sm text-gray-500">Дерево связанных документов</p>
      </div>
      
      <div className="space-y-1">
        {documentTree.quotes.map((quote: DocumentNode) => renderNode(quote))}
      </div>
    </Card>
  );
}

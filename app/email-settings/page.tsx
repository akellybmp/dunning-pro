'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Mail,
  Settings,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface EmailRule {
  id: string;
  days: number;
  enabled: boolean;
  template_name: string;
  template_subject: string;
  template_body: string;
}

export default function EmailSettings() {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(false);
  const [emailRules, setEmailRules] = useState<EmailRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    subject: '',
    body: '',
  });
  const [fromSettings, setFromSettings] = useState({
    fromName: 'DunningPro',
    fromEmail: 'noreply@dunningpro.com',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Fetch email rules on component mount
  useEffect(() => {
    fetchEmailRules();
  }, []);

  const fetchEmailRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emails/templates?companyId=default');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch email rules');
      }

      setEmailRules(data.templates || []);
    } catch (err) {
      console.error('Error fetching email rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch email rules');
    } finally {
      setLoading(false);
    }
  };

  const handleRuleToggle = async (id: string) => {
    try {
      const rule = emailRules.find(r => r.id === id);
      if (!rule) return;

      const response = await fetch('/api/emails/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: 'default',
          template: {
            ...rule,
            enabled: !rule.enabled
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update rule');
      }

      // Update local state
      setEmailRules(rules =>
        rules.map(rule =>
          rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
        )
      );
    } catch (err) {
      console.error('Error toggling rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to update rule');
    }
  };

  const handleEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
    const rule = emailRules.find(r => r.id === ruleId);
    if (rule) {
      setCurrentTemplate({
        name: rule.template_name,
        subject: rule.template_subject,
        body: rule.template_body,
      });
      setShowTemplateModal(true);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const response = await fetch(`/api/emails/templates?templateId=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete rule');
      }

      setEmailRules(rules => rules.filter(rule => rule.id !== id));
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const handleAddRule = () => {
    setEditingRuleId(null);
    setCurrentTemplate({
      name: '',
      subject: '',
      body: '',
    });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        days: editingRuleId ? emailRules.find(r => r.id === editingRuleId)?.days || 1 : 1,
        enabled: true,
        template_name: currentTemplate.name,
        template_subject: currentTemplate.subject,
        template_body: currentTemplate.body
      };

      const response = await fetch('/api/emails/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: 'default',
          template: templateData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const data = await response.json();
      
      if (editingRuleId) {
        setEmailRules(rules =>
          rules.map(rule =>
            rule.id === editingRuleId ? { ...rule, ...data.template } : rule
          )
        );
      } else {
        setEmailRules([...emailRules, data.template]);
      }
      
      setShowTemplateModal(false);
      setEditingRuleId(null);
      
      // Show success notification
      setToastMessage('Email template saved successfully!');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
      
      // Show error notification
      setToastMessage('Failed to save template. Please try again.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleAutoEmailToggle = () => {
    const newValue = !autoEmailEnabled;
    setAutoEmailEnabled(newValue);
    
    // Show confirmation notification
    setToastMessage(`Auto email recovery is now ${newValue ? 'enabled' : 'disabled'}`);
    setToastType('success');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // TODO: Save to backend
    console.log('Auto email recovery toggled:', newValue);
  };

  const handleSaveSettings = () => {
    console.log('Saving From Settings:', fromSettings);
    // In a real app, save to backend
    setToastMessage('Sender settings saved successfully!');
    setToastType('success');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(emailRules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEmailRules(items);
  };

  const variableButtons = [
    '{{userName}}',
    '{{amount}}',
    '{{productName}}',
    '{{recoveryLink}}',
  ];

  const insertVariable = (variable: string) => {
    setCurrentTemplate(prev => ({
      ...prev,
      body: prev.body + variable,
    }));
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Settings</h1>

      {/* Global Toggle */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-brand-500" />
            <h2 
              onClick={handleAutoEmailToggle}
              className="text-xl font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              style={{ cursor: 'pointer' }}
            >
              Enable Automatic Email Recovery
            </h2>
          </div>
          <button
            onClick={handleAutoEmailToggle}
            className="focus:outline-none"
          >
            {autoEmailEnabled ? (
              <ToggleRight className="h-8 w-8 text-brand-500" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-gray-400" />
            )}
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          When enabled, DunningPro will automatically send recovery emails based on your defined rules.
        </p>
      </div>

      {/* Email Rules */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-6 w-6 text-brand-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Rules</h2>
          </div>
          <button
            onClick={handleAddRule}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 cursor-pointer"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Rule
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Define when and which email templates are sent after a payment fails. Drag to reorder rules.
        </p>

        <div className="space-y-4">
          {emailRules.map((rule, index) => (
            <div
              key={rule.id}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-4 flex-grow">
                <span className="text-gray-500 dark:text-gray-400 cursor-grab">⋮⋮</span> {/* Drag handle */}
                <div className="flex-grow">
                  <input
                    type="number"
                    value={rule.days}
                    onChange={(e) => {
                      const newDays = parseInt(e.target.value);
                      setEmailRules(rules =>
                        rules.map(r =>
                          r.id === rule.id ? { ...r, days: newDays } : r
                        )
                      );
                    }}
                    className="w-16 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">days after payment fails</span>
                </div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Template: {rule.template_name}</span>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleEditRule(rule.id)}
                  className="p-2 rounded-full text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit Template"
                >
                  <FileText className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleRuleToggle(rule.id)}
                  className="focus:outline-none cursor-pointer"
                  title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                >
                  {rule.enabled ? (
                    <ToggleRight className="h-6 w-6 text-brand-500" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 rounded-full text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Delete Rule"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-6 w-6 text-brand-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sender Settings</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="fromName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Name</label>
            <input
              type="text"
              id="fromName"
              value={fromSettings.fromName}
              onChange={(e) => setFromSettings({ ...fromSettings, fromName: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Email</label>
            <input
              type="email"
              id="fromEmail"
              value={fromSettings.fromEmail}
              onChange={(e) => setFromSettings({ ...fromSettings, fromEmail: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            Save Sender Settings
          </button>
        </div>
      </div>

      {/* Template Editor Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Template: {currentTemplate.name}</h3>
            <div>
              <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Template Name</label>
              <input
                type="text"
                id="templateName"
                value={currentTemplate.name}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                placeholder="e.g., First Reminder"
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label htmlFor="subjectLine" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject Line</label>
              <input
                type="text"
                id="subjectLine"
                value={currentTemplate.subject}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
                placeholder="e.g., Payment Failed - Action Required"
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Body</label>
              <textarea
                id="emailBody"
                rows={8}
                value={currentTemplate.body}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, body: e.target.value })}
                placeholder="e.g., Hi {{userName}},\n\nYour recent payment of {{amount}} for {{productName}} failed. Please update your payment method using this link: {{recoveryLink}}\n\nThanks,\nDunningPro Team"
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
              ></textarea>
            </div>
            <div className="flex flex-wrap gap-2">
              {variableButtons.map(variable => (
                <button
                  key={variable}
                  onClick={() => insertVariable(variable)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {variable}
                </button>
              ))}
            </div>
            {/* Preview Pane - Basic example */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Preview:</h4>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {currentTemplate.body
                  .replace(/\\n/g, '\n') // Convert literal \n to actual newlines
                  .replace(/\{\{userName\}\}/g, 'John Doe')
                  .replace(/\{\{amount\}\}/g, '$50.00')
                  .replace(/\{\{productName\}\}/g, 'Premium Membership')
                  .replace(/\{\{recoveryLink\}\}/g, 'https://your-app.com/recovery/link')}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 transition-colors"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toastType === 'success' 
            ? 'bg-gray-900 text-white border border-gray-700' 
            : 'bg-red-900 text-white border border-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            {toastType === 'success' ? (
              <CheckCircle className="h-5 w-5 text-white" />
            ) : (
              <AlertCircle className="h-5 w-5 text-white" />
            )}
            <span className="text-white font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

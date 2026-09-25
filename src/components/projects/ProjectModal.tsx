import React, { useState } from 'react';
import { Project } from '../../types';
import { Modal } from '../common/Modal';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  projectToEdit?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
}) => {
  const [name, setName] = useState(projectToEdit?.name || '');
  const [description, setDescription] = useState(projectToEdit?.description || '');
  const [color, setColor] = useState(projectToEdit?.color || '');

  const colors = [
    '#6366f1', // blue
    '#06b6d4', // blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // red
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !color) return;

    onSave({
      id: projectToEdit ? projectToEdit.id : `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    });

    onClose();
  };

  const isFormValid = name.trim().length > 0 && color !== '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Edit Project' : 'Create New Project'}
      subtitle="Group related tasks, calendar sessions, and idea nodes"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Project Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Master's Thesis"
            className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
          />
        </div>

        <div className="pt-1">
          <label className="block text-sm font-semibold text-white mb-3">Color Accent</label>
          <div className="flex items-center gap-3 px-1 pb-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all duration-300 cursor-pointer ${
                  color === c 
                    ? 'scale-[1.35] ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-lg z-10' 
                    : 'opacity-70 hover:opacity-100 hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-1">Description (Optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Core objective, deliverables, or scope..."
            className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all ${
              isFormValid
                ? 'bg-blue-500 hover:bg-blue-500 shadow-blue-600/30 cursor-pointer'
                : 'bg-blue-500/50 opacity-50 cursor-not-allowed'
            }`}
          >
            {projectToEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { IdeaNode, RelationshipType } from '../../types';
import { Modal } from '../common/Modal';
import { ArrowRight, Link as LinkIcon } from 'lucide-react';

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceIdea: IdeaNode | null;
  allIdeas: IdeaNode[];
  onAddConnection: (sourceId: string, targetId: string, relationshipType: RelationshipType, label?: string) => void;
}

export const AddConnectionModal: React.FC<AddConnectionModalProps> = ({
  isOpen,
  onClose,
  sourceIdea,
  allIdeas,
  onAddConnection,
}) => {
  const [targetId, setTargetId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('related_to');
  const [label, setLabel] = useState('');

  if (!sourceIdea) return null;

  const availableTargets = allIdeas.filter((i) => i.id !== sourceIdea.id);

  const relationships: { type: RelationshipType; label: string; description: string }[] = [
    { type: 'related_to', label: 'Related To', description: 'Conceptual affinity or topical association' },
    { type: 'supports', label: 'Supports', description: 'Provides empirical or theoretical backing' },
    { type: 'contradicts', label: 'Contradicts', description: 'Presents an opposing view or counter-evidence' },
    { type: 'depends_on', label: 'Depends On', description: 'Prerequisite logic, technology, or findings' },
    { type: 'inspired_by', label: 'Inspired By', description: 'Originating spark or creative catalyst' },
    { type: 'part_of', label: 'Part Of', description: 'Constituent component of a larger framework' },
    { type: 'derived_from', label: 'Derived From', description: 'Formulated or abstracted directly from source' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;

    onAddConnection(sourceIdea.id, targetId, relationshipType, label.trim() || undefined);
    setLabel('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Knowledge Graph Relationship"
      subtitle="Connect distinct nodes into an interconnected web of thinking"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Idea Card */}
        <div className="p-3 rounded-xl bg-black/20 border border-white/10">
          <span className="text-[11px] text-white/60 uppercase tracking-wider font-semibold">Source Idea</span>
          <h4 className="text-base font-semibold text-white mt-1">{sourceIdea.title}</h4>
        </div>

        {/* Target Node Selection */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
            <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
            Connect Target Node
          </label>
          <select
            required
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">Select an existing node...</option>
            {availableTargets.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.type.toUpperCase()}] {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Relationship Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1.5">Relationship Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {relationships.map((rel) => (
              <button
                key={rel.type}
                type="button"
                onClick={() => setRelationshipType(rel.type)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  relationshipType === rel.type
                    ? 'bg-blue-950/60 border-blue-400 ring-1 ring-blue-400/30'
                    : 'bg-white/10 border-white/10 hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{rel.label}</span>
                  <span className="text-[10px] font-mono text-blue-300">
                    {rel.type}
                  </span>
                </div>
                <p className="text-[10px] text-white/60 mt-0.5 leading-snug">{rel.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Relationship Note */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Relationship Context / Note (Optional)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Validates real latency of INT8 kernels"
            className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none"
          />
        </div>

        {/* Actions */}
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
            disabled={!targetId}
            className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Create Connection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </Modal>
  );
};

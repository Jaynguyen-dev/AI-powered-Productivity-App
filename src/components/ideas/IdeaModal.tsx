import React, { useState, useEffect } from 'react';
import { IdeaNode, IdeaType, IdeaEdge, Project } from '../../types';
import { Modal } from '../common/Modal';
import {
  Tag,
  Link as LinkIcon,
  CheckSquare,
  Trash2,
  ExternalLink,
  Plus,
  ArrowRight,
  Folder,
} from 'lucide-react';

interface IdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: IdeaNode | null;
  edges: IdeaEdge[];
  allIdeas: IdeaNode[];
  projects: Project[];
  onSaveIdea: (idea: IdeaNode) => void;
  onDeleteIdea: (ideaId: string) => void;
  onRemoveEdge: (edgeId: string) => void;
  onOpenAddConnection: (sourceIdea: IdeaNode) => void;
  onConvertIdeaToTask: (idea: IdeaNode) => void;
}

export const IdeaModal: React.FC<IdeaModalProps> = ({
  isOpen,
  onClose,
  idea,
  edges,
  allIdeas,
  projects,
  onSaveIdea,
  onDeleteIdea,
  onRemoveEdge,
  onOpenAddConnection,
  onConvertIdeaToTask,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<IdeaType>('concept');
  const [tagsInput, setTagsInput] = useState('');
  const [connectedProjectId, setConnectedProjectId] = useState('');

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setContent(idea.content);
      setType(idea.type);
      setTagsInput(idea.tags?.join(', ') || '');
      setConnectedProjectId(idea.metadata?.connectedProjectId || '');
    } else {
      setTitle('');
      setContent('');
      setType('concept');
      setTagsInput('');
      setConnectedProjectId('');
    }
  }, [idea, isOpen]);

  if (!idea) return null;

  const ideaMap = new Map(allIdeas.map((i) => [i.id, i]));

  // Find relationships involving this idea
  const outgoingEdges = edges.filter((e) => e.sourceId === idea.id);
  const incomingEdges = edges.filter((e) => e.targetId === idea.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const updatedIdea: IdeaNode = {
      ...idea,
      title: title.trim(),
      content: content.trim(),
      type,
      tags,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...idea.metadata,
        connectedProjectId: connectedProjectId || undefined,
      },
    };

    onSaveIdea(updatedIdea);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Idea & Knowledge Node"
      subtitle="Refine unstructured thoughts, map relationships, or translate into execution"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Type & Project Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-white mb-1">Classification Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IdeaType)}
              className="w-full px-3 py-2 rounded-xl bg-white/80 backdrop-blur-md border border-white/40 text-black text-base focus:outline-none capitalize font-medium [&>option]:bg-white [&>option]:text-black"
            >
              <option value="concept">Concept (Core Architecture)</option>
              <option value="hypothesis">Hypothesis (Testable Guess)</option>
              <option value="insight">Insight (Empirical Discovery)</option>
              <option value="question">Question (Open Exploration)</option>
              <option value="reference">Reference (Literature / Citation)</option>
              <option value="resource">Resource (Toolkit / Dataset)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-blue-500" />
              Connected Project
            </label>
            <select
              value={connectedProjectId}
              onChange={(e) => setConnectedProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/80 backdrop-blur-md border border-white/40 text-black text-base focus:outline-none font-medium [&>option]:bg-white [&>option]:text-black"
            >
              <option value="">No Project (Independent Node)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content / Thoughts */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Detailed Content / Notes</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Elaborate on the intuition, implications, or experimental setup..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-base focus:outline-none leading-relaxed"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-blue-500" />
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. vision, distillation, optimization"
            className="w-full px-3 py-2 rounded-xl bg-white/80 backdrop-blur-md border border-white/40 text-black text-base focus:outline-none font-medium [&>option]:bg-white [&>option]:text-black"
          />
        </div>

        {/* Graph Relationships Section */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                Graph Relationships ({outgoingEdges.length + incomingEdges.length})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onOpenAddConnection(idea)}
              className="px-2.5 py-1 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 border border-blue-500/40 text-sm font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Connection</span>
            </button>
          </div>

          {outgoingEdges.length === 0 && incomingEdges.length === 0 ? (
            <p className="text-sm text-white/60 italic bg-white/10 p-3 rounded-xl border border-white/10">
              This node has no connections yet. Click "Add Connection" to link it with other ideas.
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {/* Outgoing */}
              {outgoingEdges.map((edge) => {
                const target = ideaMap.get(edge.targetId);
                return (
                  <div
                    key={edge.id}
                    className="p-2 rounded-xl bg-black/20 border border-white/10 flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                        {edge.relationshipType}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/60 flex-shrink-0" />
                      <span className="font-medium text-white truncate">
                        {target ? target.title : edge.targetId}
                      </span>
                      {edge.metadata?.label && (
                        <span className="text-white/60 text-[11px] truncate hidden sm:inline">
                          ({edge.metadata.label})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveEdge(edge.id)}
                      className="text-white/60 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors"
                      title="Remove Connection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Incoming */}
              {incomingEdges.map((edge) => {
                const source = ideaMap.get(edge.sourceId);
                return (
                  <div
                    key={edge.id}
                    className="p-2 rounded-xl bg-black/20 border border-white/10 flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-white truncate">
                        {source ? source.title : edge.sourceId}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/60 flex-shrink-0" />
                      <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30 text-[10px] font-mono">
                        {edge.relationshipType}
                      </span>
                      <span className="text-white/60 text-[11px]">this idea</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveEdge(edge.id)}
                      className="text-white/60 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-colors"
                      title="Remove Connection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons: Convert to Task & Save */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-convert-idea-to-task"
              onClick={() => {
                onConvertIdeaToTask(idea);
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Convert this idea into an actionable task while preserving the relationship"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Convert to Actionable Task</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteIdea(idea.id);
                onClose();
              }}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Delete Idea"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

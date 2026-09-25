import React, { useState, useMemo } from 'react';
import { IdeaNode, IdeaEdge, IdeaType, Project, RelationshipType } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { InteractiveGraphCanvas } from './InteractiveGraphCanvas';
import {
  Network,
  List,
  Search,
  Plus,
  Filter,
  Link as LinkIcon,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Folder,
  Tag,
  Bot,
  MessageSquare,
  Trash2,
} from 'lucide-react';

interface IdeasKnowledgeViewProps {
  ideas: IdeaNode[];
  edges: IdeaEdge[];
  projects: Project[];
  onQuickCapture?: (content: string, type?: IdeaType) => void;
  onOpenCreateIdeaModal: (initialCoordinates?: { x: number; y: number }) => void;
  onEditIdea: (idea: IdeaNode) => void;
  onOpenAddConnection: (sourceIdea: IdeaNode) => void;
  onConvertIdeaToTask: (idea: IdeaNode) => void;
  onAddConnectionDirect?: (sourceId: string, targetId: string, relationshipType: RelationshipType) => void;
  onDeleteIdea?: (ideaId: string) => void;
  onOpenCopilot?: () => void;
}

export const IdeasKnowledgeView: React.FC<IdeasKnowledgeViewProps> = ({
  ideas,
  edges,
  projects,
  onQuickCapture,
  onOpenCreateIdeaModal,
  onEditIdea,
  onOpenAddConnection,
  onConvertIdeaToTask,
  onAddConnectionDirect,
  onDeleteIdea,
  onOpenCopilot,
}) => {
  const [activeMode, setActiveMode] = useState<'graph' | 'list'>('graph');
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    ideas.forEach((i) => i.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [ideas]);

  // Filter ideas for list view
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (selectedType !== 'all' && idea.type !== selectedType) return false;
      if (selectedTag !== 'all' && !idea.tags?.includes(selectedTag)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = idea.title.toLowerCase().includes(q);
        const matchContent = idea.content.toLowerCase().includes(q);
        const matchTags = idea.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchTags) return false;
      }
      return true;
    });
  }, [ideas, selectedType, selectedTag, searchQuery]);

  const ideaMap = useMemo(() => new Map(ideas.map((i) => [i.id, i])), [ideas]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  return (
    <div className="space-y-4">
      {/* Conversational Knowledge Header Banner */}
      <GlassCard className="p-5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-blue-500/20 bg-blue-950/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 flex-shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Conversational Knowledge Capture</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Copilot Enabled
              </span>
            </div>
            <p className="text-sm text-white/60 mt-0.5">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[10px] border border-white/10">⌘K</kbd> or chat with Zen to record thoughts, synthesize concepts, and link graph nodes.
            </p>
          </div>
        </div>

        {onOpenCopilot && (
          <button
            type="button"
            onClick={onOpenCopilot}
            className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer flex-shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat with Zen</span>
          </button>
        )}
      </GlassCard>

      {/* Control Bar: Mode Toggle, Search, Filter */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Toggle: Interactive Graph vs Structured List */}
          <div className="flex items-center rounded-xl bg-black/20 border border-white/10 p-1">
            <button
              type="button"
              id="btn-view-graph"
              onClick={() => setActiveMode('graph')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'graph'
                  ? 'bg-blue-500 text-white font-semibold shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Interactive Graph</span>
            </button>
            <button
              type="button"
              id="btn-view-list"
              onClick={() => setActiveMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'list'
                  ? 'bg-blue-500 text-white font-semibold shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Structured List ({ideas.length})</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas or tags..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-black/20 border border-white/10 text-sm text-white/80 focus:outline-none cursor-pointer capitalize"
            >
              <option value="all" className="bg-black/80">All Node Types</option>
              <option value="concept" className="bg-black/80">Concept</option>
              <option value="hypothesis" className="bg-black/80">Hypothesis</option>
              <option value="insight" className="bg-black/80">Insight</option>
              <option value="question" className="bg-black/80">Question</option>
              <option value="reference" className="bg-black/80">Reference</option>
              <option value="resource" className="bg-black/80">Resource</option>
            </select>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-black/20 border border-white/10 text-sm text-white/80 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-black/80">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag} className="bg-black/80">
                    #{tag}
                  </option>
                ))}
              </select>
            )}

            {/* Add Node Button */}
            <button
              type="button"
              id="btn-add-idea-modal"
              onClick={() => onOpenCreateIdeaModal()}
              className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-1 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Idea</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main View Display */}
      {activeMode === 'graph' ? (
        <InteractiveGraphCanvas
          ideas={filteredIdeas}
          edges={edges}
          selectedIdeaId={selectedIdeaId}
          onSelectIdea={setSelectedIdeaId}
          onEditIdea={onEditIdea}
          onOpenAddConnection={onOpenAddConnection}
          onConvertIdeaToTask={onConvertIdeaToTask}
          onAddConnectionDirect={onAddConnectionDirect}
          onDeleteIdea={onDeleteIdea}
          onCreateIdeaAt={(x, y) => onOpenCreateIdeaModal({ x, y })}
        />
      ) : (
        /* Structured List View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredIdeas.map((idea) => {
            const outgoing = edges.filter((e) => e.sourceId === idea.id);
            const incoming = edges.filter((e) => e.targetId === idea.id);
            const totalLinks = outgoing.length + incoming.length;
            const project = idea.metadata?.connectedProjectId
              ? projectMap.get(idea.metadata.connectedProjectId)
              : undefined;

            return (
              <GlassCard
                key={idea.id}
                variant="interactive"
                onClick={() => onEditIdea(idea)}
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-blue-950/80 text-blue-300 border border-blue-500/40">
                      {idea.type}
                    </span>
                    <span className="text-[11px] text-white/60 flex items-center gap-1 font-mono">
                      <LinkIcon className="w-3 h-3 text-blue-500" />
                      {totalLinks} link{totalLinks !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mt-2 line-clamp-1">{idea.title}</h3>
                  <p className="text-sm text-white/80 mt-1 leading-relaxed line-clamp-3">{idea.content}</p>
                </div>

                {/* Metadata & Actions footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {project && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[10px] text-white/80">
                        <Folder className="w-2.5 h-2.5 text-blue-500" />
                        <span>{project.name}</span>
                      </span>
                    )}
                    {idea.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] text-white/60 font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onOpenAddConnection(idea)}
                      className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 text-sm transition-colors cursor-pointer"
                      title="Add Connection to Another Idea"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onConvertIdeaToTask(idea)}
                      className="p-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-sm transition-colors cursor-pointer"
                      title="Convert to Task"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteIdea && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (true) {
                            onDeleteIdea(idea.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 text-sm transition-colors cursor-pointer"
                        title="Delete Idea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

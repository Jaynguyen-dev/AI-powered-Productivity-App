import React, { useState } from 'react';
import { Project, IdeaNode, Task } from '../../types';
import { FolderKanban, Plus, Edit2, Trash2, Network, CheckSquare, Search, Lightbulb } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

interface ProjectsManagementViewProps {
  projects: Project[];
  ideas: IdeaNode[];
  tasks: Task[];
  onOpenCreateProjectModal: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'calendar' | 'tasks' | 'ideas') => void;
  onDeleteIdea: (ideaId: string) => void;
}

export const ProjectsManagementView: React.FC<ProjectsManagementViewProps> = ({
  projects,
  ideas,
  tasks,
  onOpenCreateProjectModal,
  onEditProject,
  onDeleteProject,
  onNavigateTab,
  onDeleteIdea,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);

  const filteredProjects = projects.filter(
    (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || filteredProjects[0];
  
  const projectIdeas = selectedProject 
    ? ideas.filter((i) => i.metadata?.connectedProjectId === selectedProject.id)
    : [];
    
  const projectTasks = selectedProject
    ? tasks.filter((t) => t.projectId === selectedProject.id)
    : [];

  return (
    <div className="flex h-full gap-6 pb-20 sm:pb-0">
      {/* Left Sidebar - Projects List */}
      <div className="w-full sm:w-1/3 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-500" />
            Projects
          </h2>
          <button
            onClick={onOpenCreateProjectModal}
            className="p-1.5 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white transition-colors cursor-pointer"
            title="New Project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-base text-white placeholder:text-white/50 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredProjects.length === 0 ? (
            <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10 border-dashed">
              <FolderKanban className="w-8 h-8 mx-auto text-white/30 mb-2" />
              <p className="text-base text-white/60">No projects found.</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedProject?.id === project.id
                    ? 'bg-white/20 border-blue-500/50 shadow-md shadow-blue-500/10'
                    : 'bg-white/5 border-white/10 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <h3 className="text-base font-semibold text-white truncate">{project.name}</h3>
                </div>
                {project.description && (
                  <p className="text-sm text-white/60 line-clamp-1 pl-5">{project.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Content - Project Details & Ideas */}
      <div className="hidden sm:flex w-2/3 flex-col h-full">
        {selectedProject ? (
          <GlassCard className="flex-1 p-6 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: selectedProject.color }}
                >
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{selectedProject.name}</h1>
                  <p className="text-base text-white/60 mt-0.5">{selectedProject.description || 'No description provided.'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditProject(selectedProject)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                  title="Edit Project"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onDeleteProject(selectedProject.id);
                      setSelectedProjectId(null);
                  }}
                  className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div 
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onNavigateTab('ideas')}
              >
                <div>
                  <span className="text-sm text-white/60 font-medium">Associated Ideas</span>
                  <div className="text-lg font-bold text-amber-200 mt-0.5">{projectIdeas.length}</div>
                </div>
                <Lightbulb className="w-6 h-6 text-red-500/50" />
              </div>
              <div 
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onNavigateTab('tasks')}
              >
                <div>
                  <span className="text-sm text-white/60 font-medium">Project Tasks</span>
                  <div className="text-lg font-bold text-emerald-200 mt-0.5">{projectTasks.length}</div>
                </div>
                <CheckSquare className="w-6 h-6 text-emerald-500/50" />
              </div>
            </div>

            {/* Ideas List */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Network className="w-4 h-4 text-amber-400" />
                  Project Ideas
                </h3>
                <button
                  onClick={() => onNavigateTab('ideas')}
                  className="text-[11px] font-medium text-blue-500 hover:text-blue-300 cursor-pointer"
                >
                  Open Graph View &rarr;
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {projectIdeas.length === 0 ? (
                  <div className="text-center p-8 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <Lightbulb className="w-8 h-8 mx-auto text-white/30 mb-2" />
                    <p className="text-base text-white/60">No ideas associated with this project yet.</p>
                    <button
                      onClick={() => onNavigateTab('ideas')}
                      className="mt-3 px-4 py-1.5 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      Add Idea in Graph
                    </button>
                  </div>
                ) : (
                  projectIdeas.map((idea) => (
                    <div key={idea.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-red-500/30 transition-colors group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-white">{idea.title}</h4>
                          <p className="text-sm text-white/60 mt-1 line-clamp-2">{idea.content}</p>
                        </div>
                        <button
                          onClick={() => {
                            onDeleteIdea(idea.id);
                          }}
                          className="p-1.5 rounded-lg text-white/50 hover:bg-blue-500/20 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Delete Idea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {idea.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 rounded-md bg-white/5 text-[9px] font-medium text-white/80">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white/10 border border-white/10 border-dashed rounded-2xl">
            <FolderKanban className="w-12 h-12 text-white/30 mb-3" />
            <h3 className="text-lg font-medium text-white/80">No Project Selected</h3>
            <p className="text-base text-white/50 mt-1">Select a project or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

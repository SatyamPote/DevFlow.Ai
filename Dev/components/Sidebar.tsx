import React from 'react';
import { 
    LogoIcon, DashboardIcon, TasksIcon, DocsIcon, ChatIcon, CodeReviewIcon, TestGeneratorIcon,
    ComplexityIcon, CommitIcon, HeatmapIcon, MemoryIcon, ScaffoldIcon, TeamDashboardIcon,
    RunReviewIcon, SimulationIcon, SnippetIcon, ProjectsIcon, ArchitectureIcon, UserIcon, LogoutIcon, EditorIcon
} from './icons';

export type View = 'decomposer' | 'reviewer' | 'tester' | 'tasks' | 'docs' | 'chat' |
                   'complexity' | 'summarizer' | 'heatmap' | 'memory' | 'scaffolder' |
                   'team_dashboard' | 'run_review' | 'simulation' | 'snippets' | 'architecture' | 'editor';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick: () => void;
    disabled?: boolean;
}

const NavItem = ({ icon, label, isActive, onClick, disabled }: NavItemProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors duration-200 text-left ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {icon}
        <span className="ml-4 font-medium">{label}</span>
    </button>
);

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
    onGoBack: () => void;
    userEmail: string | null;
    onLogout: () => void;
}

export const Sidebar = ({ activeView, setActiveView, onGoBack, userEmail, onLogout }: SidebarProps) => {
    return (
        <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700 flex flex-col h-screen flex-shrink-0">
            <div className="flex items-center mb-4 px-2 flex-shrink-0">
                <LogoIcon />
                <h1 className="text-xl font-bold ml-3 text-white">DevFlow.AI</h1>
            </div>
            
            <button
                onClick={onGoBack}
                className="flex items-center w-full px-4 py-2.5 mb-4 rounded-lg transition-colors duration-200 text-left text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700"
            >
                <ProjectsIcon />
                <span className="ml-4 font-medium">All Projects</span>
            </button>
            
            <nav className="flex-grow space-y-2 overflow-y-auto pr-1">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Core</p>
                <NavItem icon={<DashboardIcon />} label="Task Decomposer" isActive={activeView === 'decomposer'} onClick={() => setActiveView('decomposer')} />
                <NavItem icon={<TasksIcon />} label="Tasks" isActive={activeView === 'tasks'} onClick={() => setActiveView('tasks')} />
                <NavItem icon={<DocsIcon />} label="Documentation" isActive={activeView === 'docs'} onClick={() => setActiveView('docs')} />
                <NavItem icon={<ChatIcon />} label="Team Chat" isActive={activeView === 'chat'} onClick={() => setActiveView('chat')} />
                
                <div className="pt-4 pb-2">
                    <hr className="border-t border-gray-700" />
                </div>
                
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tools</p>
                <NavItem icon={<EditorIcon />} label="Editor" isActive={activeView === 'editor'} onClick={() => setActiveView('editor')} />
                <NavItem icon={<CodeReviewIcon />} label="Code Review" isActive={activeView === 'reviewer'} onClick={() => setActiveView('reviewer')} />
                <NavItem icon={<TestGeneratorIcon />} label="Test Generator" isActive={activeView === 'tester'} onClick={() => setActiveView('tester')} />
                <NavItem icon={<ComplexityIcon />} label="Complexity Analysis" isActive={activeView === 'complexity'} onClick={() => setActiveView('complexity')} />
                <NavItem icon={<CommitIcon />} label="Commit Summarizer" isActive={activeView === 'summarizer'} onClick={() => setActiveView('summarizer')} />
                <NavItem icon={<ArchitectureIcon />} label="Architecture Diagram" isActive={activeView === 'architecture'} onClick={() => setActiveView('architecture')} />
                <NavItem icon={<ScaffoldIcon />} label="Project Scaffolder" isActive={activeView === 'scaffolder'} onClick={() => setActiveView('scaffolder')} />
                <NavItem icon={<RunReviewIcon />} label="Run & Review" isActive={activeView === 'run_review'} onClick={() => setActiveView('run_review')} />
                <NavItem icon={<SnippetIcon />} label="Snippet Library" isActive={activeView === 'snippets'} onClick={() => setActiveView('snippets')} />

                <div className="pt-4 pb-2">
                    <hr className="border-t border-gray-700" />
                </div>
                
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Advanced</p>
                <NavItem icon={<MemoryIcon />} label="Memory Agent" isActive={activeView === 'memory'} onClick={() => setActiveView('memory')} />

                <NavItem icon={<SimulationIcon />} label="Agent Simulation" isActive={activeView === 'simulation'} onClick={() => setActiveView('simulation')} />
                <NavItem icon={<HeatmapIcon />} label="Project Heatmap" isActive={activeView === 'heatmap'} onClick={() => setActiveView('heatmap')} />
                <NavItem icon={<TeamDashboardIcon />} label="Team Dashboard" isActive={activeView === 'team_dashboard'} onClick={() => setActiveView('team_dashboard')} />
            </nav>
            <div className="mt-auto flex-shrink-0 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-3 px-2">
                     <UserIcon className="w-8 h-8 text-gray-400 bg-gray-700 p-1.5 rounded-full" />
                     <div className="flex-grow overflow-hidden">
                        <p className="text-sm font-medium text-gray-200 truncate">{userEmail}</p>
                     </div>
                     <button onClick={onLogout} title="Logout" className="p-2 rounded-md hover:bg-gray-700">
                        <LogoutIcon className="w-5 h-5 text-gray-400" />
                     </button>
                </div>
            </div>
        </aside>
    );
};
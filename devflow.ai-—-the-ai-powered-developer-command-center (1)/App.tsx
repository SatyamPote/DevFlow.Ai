import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, View } from './components/Sidebar';
import { Header } from './components/Header';
import { CodePreview } from './components/CodePreview';
import { Task, GeneratedFile, ChatMessage, Project, GeneratedCode, SimulationTurn } from './types';
import * as geminiService from './services/geminiService';
import { 
    SparkleIcon, FileIcon, PlusIcon, TrashIcon, TasksIcon, ChatIcon, 
    ManagerIcon, QAIcon, CodeIcon, LogoIcon, ArchitectureIcon, ComplexityIcon,
    CommitIcon, DashboardIcon, DocsIcon, HeatmapIcon, MemoryIcon, RunReviewIcon,
    ScaffoldIcon, SimulationIcon, SnippetIcon, TeamDashboardIcon, GoogleIcon, EditorIcon, FolderIcon, FolderOpenIcon, DeployIcon, CheckIcon
} from './components/icons';
import ReactMarkdown from 'react-markdown';
import { auth, googleProvider, db } from './firebase';
import { onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import JSZip from 'jszip';

// --- Top-Level App Component with Auth Routing ---
const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<'landing' | 'auth'>('landing');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

    if (loading) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center text-white">
                <LogoIcon /> <span className="ml-2 text-xl">Loading DevFlow.AI...</span>
            </div>
        );
    }

    if (user) {
        return <MainApp user={user} />;
    }

    // Not logged in
    switch (page) {
        case 'auth':
            return <AuthPage onShowLanding={() => setPage('landing')} />;
        case 'landing':
        default:
            return <LandingPage onShowAuth={() => setPage('auth')} />;
    }
};
export default App;

// --- Landing Page Component ---
const LandingPage = ({ onShowAuth }: { onShowAuth: () => void }) => {
    const features = [
        { icon: <ScaffoldIcon />, name: 'AI Project Scaffolder', desc: 'Generate a full codebase from a description.' },
        { icon: <EditorIcon />, name: 'Hierarchical Editor', desc: 'View and manage your code in a file tree.' },
        { icon: <TasksIcon />, name: 'Kanban Board', desc: 'Visualize and manage your workflow.' },
        { icon: <DocsIcon />, name: 'AI Documentation', desc: 'Instantly create docs from your code.' },
        { icon: <ChatIcon />, name: 'Context-Aware Chat', desc: 'An AI that knows your project status.' },
        { icon: <ArchitectureIcon />, name: 'Architecture Diagrams', desc: 'Visualize your code automatically.' },
        { icon: <ComplexityIcon />, name: 'Complexity Analysis', desc: 'Understand the efficiency of your code.' },
        { icon: <CommitIcon />, name: 'Commit Summarizer', desc: 'Generate commit messages from diffs.' },
        { icon: <MemoryIcon />, name: 'Memory Agent', desc: 'Chat with an AI that remembers everything.' },
        { icon: <SimulationIcon />, name: 'Agent Simulation', desc: 'Simulate a dev team to solve problems.' },
        { icon: <HeatmapIcon />, name: 'Project Heatmap', desc: 'Visualize task complexity at a glance.' },
        { icon: <TeamDashboardIcon />, name: 'Team Dashboard', desc: 'Get a high-level overview of progress.' },
    ];

    return (
        <div className="bg-gray-900 text-white min-h-screen">
            <header className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <LogoIcon />
                    <span className="text-xl font-bold">DevFlow.AI</span>
                </div>
                <button onClick={onShowAuth} className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                    Login / Sign Up
                </button>
            </header>

            <main className="container mx-auto px-6 text-center">
                <div className="py-20">
                    <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">Your AI-Powered Developer Command Center</h1>
                    <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">Plan, build, debug, and document your projects with a unified AI-native workflow, without ever leaving your IDE.</p>
                    <button onClick={onShowAuth} className="mt-8 bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105">
                        Get Started for Free
                    </button>
                </div>

                <div className="py-16">
                    <h2 className="text-4xl font-bold mb-12">All The Tools You Need. Unified.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-gray-800 p-6 rounded-lg text-left border border-gray-700">
                                <div className="text-blue-500 mb-4">{React.cloneElement(feature.icon, { className: 'w-8 h-8' })}</div>
                                <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                                <p className="text-gray-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="text-center py-8 border-t border-gray-800">
                <p className="text-gray-500">&copy; {new Date().getFullYear()} DevFlow.AI. The future of development.</p>
            </footer>
        </div>
    );
};

// --- Auth Page Component ---
const AuthPage = ({ onShowLanding }: { onShowLanding: () => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // onAuthStateChanged in App.tsx will handle the redirect
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged will handle the redirect
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-md">
                 <div className="flex items-center justify-center gap-2 mb-8">
                    <LogoIcon />
                    <span className="text-2xl font-bold">DevFlow.AI</span>
                </div>
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                    <h2 className="text-3xl font-bold text-center mb-6">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold p-3 rounded-lg hover:bg-gray-200 disabled:bg-gray-400 transition-colors"
                    >
                        <GoogleIcon />
                        {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                    </button>

                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-gray-600" />
                        <span className="mx-4 text-gray-500 text-sm font-medium">OR</span>
                        <hr className="flex-grow border-gray-600" />
                    </div>

                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Email Address"
                            required
                            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 font-semibold p-3 rounded-lg hover:bg-blue-500 disabled:bg-blue-800">
                            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                        </button>
                    </form>
                    <p className="text-center text-sm text-gray-400 mt-6">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-blue-500 hover:underline ml-1">
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
                 <button onClick={onShowLanding} className="text-sm text-gray-500 hover:text-gray-300 mt-6">&larr; Back to Home</button>
            </div>
        </div>
    );
};


// --- Main Application (Authenticated) ---
const MainApp = ({ user }: { user: User }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
        return localStorage.getItem(`devflow-selected-project-id-${user.uid}`);
    });

    // Effect to fetch projects from Firestore in real-time
    useEffect(() => {
        if (!user) {
            setProjects([]);
            return;
        }

        const projectsCollectionRef = collection(db, 'users', user.uid, 'projects');
        const q = query(projectsCollectionRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const projectsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Project));
            setProjects(projectsData);
        }, (error) => {
            console.error("Error fetching projects:", error);
        });

        return () => unsubscribe(); // Cleanup listener
    }, [user]);

    // Effect to save selected project ID to localStorage
    useEffect(() => {
        if (selectedProjectId) {
            localStorage.setItem(`devflow-selected-project-id-${user.uid}`, selectedProjectId);
        } else {
            localStorage.removeItem(`devflow-selected-project-id-${user.uid}`);
        }
    }, [selectedProjectId, user.uid]);

    const handleCreateProject = async (name: string, description: string) => {
        if (!user) return;
        const projectsCollectionRef = collection(db, 'users', user.uid, 'projects');
        
        const newProjectData = {
            name,
            description,
            tasks: [],
            messages: [],
            generatedCode: [],
            createdAt: serverTimestamp(),
        };

        try {
            const docRef = await addDoc(projectsCollectionRef, newProjectData);
            setSelectedProjectId(docRef.id);
        } catch (error) {
            console.error("Error creating project:", error);
        }
    };
    
    const handleLogout = () => {
        signOut(auth).catch(error => console.error("Logout failed", error));
    };

    const handleSelectProject = (projectId: string) => {
        setSelectedProjectId(projectId);
    };

    const handleUpdateProject = async (updatedProject: Project) => {
        if (!user) return;
        const projectDocRef = doc(db, 'users', user.uid, 'projects', updatedProject.id);
        const { id, ...projectData } = updatedProject;
        try {
            await setDoc(projectDocRef, projectData, { merge: true });
        } catch (error) {
            console.error("Error updating project:", error);
        }
    };

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    if (!selectedProject) {
        return <ProjectSelection projects={projects} onSelectProject={handleSelectProject} onCreateProject={handleCreateProject} onLogout={handleLogout} />;
    }

    return <ProjectDashboard key={selectedProject.id} project={selectedProject} onGoBack={() => setSelectedProjectId(null)} onUpdateProject={handleUpdateProject} user={user} onLogout={handleLogout} />;
};


// --- Project Selection View ---
const ProjectSelection = ({ projects, onSelectProject, onCreateProject, onLogout }: { projects: Project[], onSelectProject: (id: string) => void, onCreateProject: (name: string, desc: string) => void, onLogout: () => void }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && description) {
            onCreateProject(name, description);
            setName('');
            setDescription('');
            setIsCreating(false);
        }
    };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
            <div className="absolute top-4 right-4">
                 <button onClick={onLogout} className="flex items-center gap-2 bg-gray-700 text-sm py-2 px-3 rounded-lg hover:bg-gray-600">Logout</button>
            </div>
            <h1 className="text-4xl font-bold mb-8">Your Projects</h1>
            <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Select a Project</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {projects.length > 0 ? projects.map(p => (
                        <div key={p.id} onClick={() => onSelectProject(p.id)} className="p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                            <h3 className="font-bold">{p.name}</h3>
                            <p className="text-sm text-gray-400">{p.description}</p>
                        </div>
                    )) : <p className="text-gray-500 text-center py-4">No projects yet. Create one to get started!</p>}
                </div>
                <hr className="my-6 border-gray-600" />
                {isCreating ? (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-2xl font-semibold mb-4">Create New Project</h2>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Project Name" className="w-full p-2 mb-3 bg-gray-700 rounded" required />
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Project Description" className="w-full p-2 mb-3 bg-gray-700 rounded h-24" required />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-blue-600 p-2 rounded hover:bg-blue-500">Create Project</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-gray-600 p-2 rounded hover:bg-gray-500">Cancel</button>
                        </div>
                    </form>
                ) : (
                    <button onClick={() => setIsCreating(true)} className="w-full flex items-center justify-center gap-2 bg-blue-600 p-2 rounded hover:bg-blue-500">
                        <PlusIcon /> Create New Project
                    </button>
                )}
            </div>
        </div>
    );
};


// --- Project Dashboard ---
const ProjectDashboard = ({ project, onGoBack, onUpdateProject, user, onLogout }: { project: Project, onGoBack: () => void, onUpdateProject: (p: Project) => void, user: User, onLogout: () => void }) => {
    const [activeView, setActiveView] = useState<View>('decomposer');
    
    const updateProjectState = useCallback((updates: Partial<Project>) => {
        onUpdateProject({ ...project, ...updates });
    }, [project, onUpdateProject]);

    const renderView = () => {
        switch (activeView) {
            case 'decomposer':
                return <TaskDecomposerView project={project} onTasksGenerated={(newTasks) => { updateProjectState({ tasks: [...project.tasks, ...newTasks] }); setActiveView('tasks'); }} />;
            case 'tasks':
                return <TasksView project={project} onUpdateProject={updateProjectState} />;
            case 'editor':
                return <EditorView project={project} />;
            case 'scaffolder':
                return <ProjectScaffolderView project={project} onUpdateProject={updateProjectState} onSwitchView={setActiveView} />;
            case 'reviewer':
                return <SimpleToolView title="Code Reviewer" placeholder="Paste code to review..." serviceFn={geminiService.reviewCode} />;
            case 'tester':
                return <SimpleToolView title="Test Generator" placeholder="Paste code to generate tests for..." serviceFn={geminiService.generateUnitTests} outputType="code" />;
            case 'docs':
                 return <SimpleToolView title="Documentation Generator" placeholder="Paste code to generate docs for..." serviceFn={geminiService.generateDocumentation} />;
            case 'complexity':
                return <SimpleToolView title="Complexity Analysis" placeholder="Paste code to analyze..." serviceFn={geminiService.analyzeComplexity} />;
            case 'summarizer':
                 return <SimpleToolView title="Commit Summarizer" placeholder="Paste git diff to summarize..." serviceFn={geminiService.summarizeCommit} />;
            case 'run_review':
                return <RunReviewView />;
            case 'architecture':
                return <ArchitectureView project={project} />;
            case 'chat':
                return <ChatView project={project} updateProjectState={updateProjectState} />;
            case 'memory':
                return <MemoryAgentView />;
            case 'simulation':
                return <AgentSimulationView project={project} onUpdateProject={updateProjectState} onSwitchView={setActiveView} />;
            case 'heatmap':
                return <ProjectHeatmapView project={project} />;
            case 'team_dashboard':
                return <TeamDashboardView project={project} />;
            default:
                return <div className="text-center p-8 bg-gray-800 rounded-lg"><h2 className="text-2xl font-bold">{activeView.replace(/_/g, ' ')}</h2><p className="text-gray-400 mt-2">This feature is coming soon!</p></div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <Sidebar activeView={activeView} setActiveView={setActiveView} onGoBack={onGoBack} userEmail={user.email} onLogout={onLogout} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title={activeView.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} projectName={project.name} />
                <div className="flex-1 p-6 overflow-y-auto">
                    {renderView()}
                </div>
            </main>
        </div>
    );
};

// --- View Components ---

const TaskDecomposerView = ({ project, onTasksGenerated }: { project: Project, onTasksGenerated: (tasks: Task[]) => void }) => {
    const [idea, setIdea] = useState(project.description);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDecompose = async () => {
        if (!idea.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const tasks = await geminiService.generateTasks(idea);
            onTasksGenerated(tasks);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Decompose Project into Tasks</h2>
            <p className="text-gray-400 mb-6">Based on your project description, DevFlow.AI can generate a list of development tasks to get you started.</p>
            <textarea
                className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-lg mb-4"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Enter your project idea or description here..."
            />
            <button
                onClick={handleDecompose}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Generating...' : 'Generate Tasks'}
                <SparkleIcon />
            </button>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
    );
};

const TasksView = ({ project, onUpdateProject }: { project: Project, onUpdateProject: (updates: Partial<Project>) => void }) => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [generatedFile, setGeneratedFile] = useState<GeneratedFile | null>(null);
    const [isLoadingCode, setIsLoadingCode] = useState(false);
    const [codeError, setCodeError] = useState('');
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);

    useEffect(() => {
        if (selectedTask) {
            setSelectedFile(null);
            setGeneratedFile(null);
        }
    }, [selectedTask]);

    const handleFileSelect = async (fileName: string) => {
        if (!selectedTask) return;
        setSelectedFile(fileName);
        setIsLoadingCode(true);
        setCodeError('');
        try {
            const content = await geminiService.generateBoilerplate(selectedTask.description, fileName);
            const newGeneratedFile = { taskId: selectedTask.id, fileName, content };
            setGeneratedFile(newGeneratedFile);
            
            const existingFileIndex = project.generatedCode.findIndex(f => f.fileName === fileName);
            let updatedCode: GeneratedCode[];
            if (existingFileIndex > -1) {
                updatedCode = [...project.generatedCode];
                updatedCode[existingFileIndex] = { fileName, content };
            } else {
                updatedCode = [...project.generatedCode, { fileName, content }];
            }
            onUpdateProject({ generatedCode: updatedCode });

        } catch (e) {
            setCodeError((e as Error).message);
        } finally {
            setIsLoadingCode(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetStatus: Task['status']) => {
        e.preventDefault();
        if (!draggedTaskId) return;

        const taskToMove = project.tasks.find(t => t.id === draggedTaskId);
        if (taskToMove && taskToMove.status !== targetStatus) {
            const updatedTasks = project.tasks.map(task =>
                task.id === draggedTaskId ? { ...task, status: targetStatus } : task
            );
            onUpdateProject({ tasks: updatedTasks });
        }
        setDraggedTaskId(null);
        setDragOverStatus(null);
    };

    const handleDragOver = (e: React.DragEvent, status: Task['status']) => {
        e.preventDefault();
        setDragOverStatus(status);
    };
    
    const handleDeleteTask = (taskIdToDelete: string) => {
        const updatedTasks = project.tasks.filter(task => task.id !== taskIdToDelete);
        onUpdateProject({ tasks: updatedTasks });
    };

    const columns: { status: Task['status']; title: string }[] = [
        { status: 'pending', title: 'Pending' },
        { status: 'in-progress', title: 'In Progress' },
        { status: 'done', title: 'Done' }
    ];

    if (!project.tasks || project.tasks.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-lg">
                <h2 className="text-2xl font-bold">No Tasks Yet</h2>
                <p className="text-gray-400 mt-2">Go to the 'Task Decomposer' to generate tasks for your project.</p>
            </div>
        );
    }
    
    if (selectedTask) {
        return (
            <div className="h-full flex flex-col gap-6">
                <div>
                     <button onClick={() => setSelectedTask(null)} className="mb-4 bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600">&larr; Back to Board</button>
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                         <h2 className="text-xl font-bold">{selectedTask.title}</h2>
                         <p className="text-gray-400 mt-2">{selectedTask.description}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
                     <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <h3 className="font-semibold mb-3">Files for this task</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedTask.files.map(file => (
                                <button key={file} onClick={() => handleFileSelect(file)}
                                        className={`flex items-center gap-2 text-sm px-3 py-1 rounded-md transition-colors ${selectedFile === file ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                    <FileIcon className="w-4 h-4" />
                                    {file}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-full">
                       <CodePreview file={generatedFile} isLoading={isLoadingCode} />
                       {codeError && <p className="text-red-400 mt-2">{codeError}</p>}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {columns.map(({ status, title }) => (
                <div key={status}
                     onDrop={(e) => handleDrop(e, status)}
                     onDragOver={(e) => handleDragOver(e, status)}
                     onDragLeave={() => setDragOverStatus(null)}
                     className={`bg-gray-800 rounded-lg p-4 flex flex-col border border-gray-700 transition-colors ${dragOverStatus === status ? 'bg-gray-700' : ''}`}>
                    <h2 className="text-lg font-bold mb-4 px-2">{title} <span className="text-sm font-normal text-gray-400">{project.tasks.filter(t => t.status === status).length}</span></h2>
                    <div className="space-y-3 overflow-y-auto flex-grow pr-1">
                        {project.tasks.filter(t => t.status === status).map(task => (
                            <div key={task.id}
                                 draggable
                                 onDragStart={(e) => handleDragStart(e, task.id)}
                                 className={`p-3 rounded-lg bg-gray-700 hover:bg-gray-600 border border-transparent group relative transition-all ${draggedTaskId === task.id ? 'opacity-50' : 'opacity-100'}`}>
                                
                                <div onClick={() => setSelectedTask(task)} className="cursor-pointer">
                                    <h3 className="font-semibold pr-6">{task.title}</h3>
                                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">{task.description}</p>
                                </div>

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTask(task.id);
                                    }}
                                    className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:bg-gray-800 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Delete task"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const SimpleToolView = ({ title, placeholder, serviceFn, outputType = 'markdown' }: { title: string, placeholder: string, serviceFn: (input: string) => Promise<string>, outputType?: 'markdown' | 'code' }) => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setError('');
        setOutput('');
        try {
            const result = await serviceFn(input);
            setOutput(result);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <h2 className="text-2xl font-bold">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                <div className="flex flex-col gap-4">
                    <textarea
                        className="w-full h-full p-3 bg-gray-800 border border-gray-700 rounded-lg flex-grow"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Processing...' : 'Generate'} <SparkleIcon />
                    </button>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 overflow-y-auto">
                    {isLoading && <p>Loading...</p>}
                    {error && <p className="text-red-400">{error}</p>}
                    {output && (
                        outputType === 'code' ?
                        <pre className="text-sm whitespace-pre-wrap"><code>{output}</code></pre> :
                        <div className="prose prose-invert max-w-none"><ReactMarkdown>{output}</ReactMarkdown></div>
                    )}
                </div>
            </div>
        </div>
    );
};

const RunReviewView = () => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!code.trim()) return;
        setIsLoading(true);
        setError('');
        setOutput('');
        try {
            const result = await geminiService.runAndReviewCode(code, language);
            setOutput(result);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="flex flex-col h-full gap-4">
            <h2 className="text-2xl font-bold">Run & Review Code</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                 <div className="flex flex-col gap-4">
                     <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-gray-800 border border-gray-700 p-2 rounded-lg">
                         <option value="javascript">JavaScript</option>
                         <option value="python">Python</option>
                         <option value="typescript">TypeScript</option>
                         <option value="go">Go</option>
                     </select>
                    <textarea
                        className="w-full h-full p-3 bg-gray-800 border border-gray-700 rounded-lg flex-grow"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={`Paste ${language} code here...`}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Processing...' : 'Run & Review'} <SparkleIcon />
                    </button>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 overflow-y-auto">
                    {isLoading && <p>Loading...</p>}
                    {error && <p className="text-red-400">{error}</p>}
                    {output && <div className="prose prose-invert max-w-none"><ReactMarkdown>{output}</ReactMarkdown></div>}
                </div>
            </div>
        </div>
    );
};

const ChatView = ({ project, updateProjectState }: { project: Project, updateProjectState: (updates: Partial<Project>) => void }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: `msg-${Date.now()}`, sender: 'user', text: input };
        const updatedMessages = [...project.messages, userMessage];
        updateProjectState({ messages: updatedMessages });
        setInput('');
        setIsLoading(true);

        try {
            const aiResponseText = await geminiService.continueConversation(updatedMessages, project);
            const aiMessage: ChatMessage = { id: `msg-${Date.now() + 1}`, sender: 'ai', text: aiResponseText };
            updateProjectState({ messages: [...updatedMessages, aiMessage] });
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { id: `msg-${Date.now() + 1}`, sender: 'ai', text: 'Sorry, I encountered an error.' };
            updateProjectState({ messages: [...updatedMessages, errorMessage] });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-4">Team Chat</h2>
            <div className="flex-grow bg-gray-800 rounded-t-lg p-4 border border-b-0 border-gray-700 overflow-y-auto">
                <div className="space-y-4">
                    {project.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'} prose prose-invert max-w-none`}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="max-w-xl p-3 rounded-lg bg-gray-700">Thinking...</div></div>}
                </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 rounded-b-lg border border-t-0 border-gray-700">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask DevFlow.AI anything..."
                    className="w-full p-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
            </form>
        </div>
    );
};

const ArchitectureView = ({ project }: { project: Project }) => {
    const [mermaidCode, setMermaidCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [key, setKey] = useState(0);

    const handleGenerate = async () => {
        if (project.generatedCode.length === 0) {
            setError("No code has been generated for this project yet. Please generate some code in the 'Tasks' view first.");
            return;
        }

        setIsLoading(true);
        setError('');
        setMermaidCode('');

        const allCode = project.generatedCode
            .map(file => `// File: ${file.fileName}\n\n${file.content}`)
            .join('\n\n---\n\n');
        
        const description = `Project Name: "${project.name}"\nProject Description: "${project.description}"\n\nHere is all the generated code for the project. Analyze it and create a system architecture diagram.\n\n${allCode}`;

        try {
            const result = await geminiService.generateArchitectureDiagram(description);
            setMermaidCode(result);
            setKey(prev => prev + 1); // Force re-render for mermaid
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (mermaidCode && (window as any).mermaid) {
            try {
                (window as any).mermaid.run();
            } catch (e) {
                console.error("Mermaid rendering error:", e);
                setError("Failed to render the diagram. The generated syntax might be invalid.");
            }
        }
    }, [mermaidCode, key]);

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">Architecture Diagram Generator</h2>
                    <p className="text-gray-400 mt-1">Automatically generate a diagram from all the AI-generated code in your project.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Generating...' : 'Generate Diagram'} <SparkleIcon />
                </button>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 overflow-auto flex-grow flex items-center justify-center">
                {isLoading && <p>Loading Diagram...</p>}
                {error && <p className="text-red-400 max-w-md text-center">{error}</p>}
                {mermaidCode && (
                    <div key={key} className="mermaid w-full h-full text-gray-200">
                        {mermaidCode}
                    </div>
                )}
                {!isLoading && !mermaidCode && !error && (
                     <div className="text-center text-gray-500">
                         <p>Click the button to generate your project's architecture diagram.</p>
                     </div>
                )}
            </div>
        </div>
    );
};

// --- New/Updated View Components ---

const ProjectScaffolderView = ({ project, onUpdateProject, onSwitchView }: { project: Project, onUpdateProject: (updates: Partial<Project>) => void, onSwitchView: (view: View) => void }) => {
    const [description, setDescription] = useState(project.description);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleScaffold = async () => {
        if (!description.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const generatedFiles = await geminiService.generateProjectScaffold(description);
            onUpdateProject({ generatedCode: generatedFiles });
            onSwitchView('editor'); // Switch to editor to see the result
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">AI Project Scaffolder</h2>
            <p className="text-gray-400 mb-6">Describe the application you want to build, and DevFlow.AI will generate the complete file structure and boilerplate code for you.</p>
            <textarea
                className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-lg mb-4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., 'A simple React to-do list app with a Node.js backend and a single API endpoint to get tasks.'"
            />
            <button
                onClick={handleScaffold}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Generating Project...' : 'Generate Full Project'}
                <SparkleIcon />
            </button>
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
    );
};

// --- Editor View with File Tree ---

interface FileTreeNode {
    isFile: boolean;
    path: string;
    children?: { [key: string]: FileTreeNode };
}

const buildFileTree = (files: GeneratedCode[]): { [key: string]: FileTreeNode } => {
    const tree: { [key: string]: any } = {};
    const sortedFiles = [...files].sort((a, b) => a.fileName.localeCompare(b.fileName));

    sortedFiles.forEach(file => {
        const parts = file.fileName.split('/');
        let currentLevel = tree;
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                currentLevel[part] = { isFile: true, path: file.fileName };
            } else {
                if (!currentLevel[part]) {
                    currentLevel[part] = { isFile: false, children: {} };
                }
                currentLevel = currentLevel[part].children;
            }
        });
    });
    return tree;
};

const FileTreeItem = ({ name, node, onFileSelect, selectedFile, level }: { name: string; node: FileTreeNode; onFileSelect: (path: string) => void; selectedFile: string | null; level: number }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (node.isFile) {
        return (
            <button
                onClick={() => onFileSelect(node.path)}
                style={{ paddingLeft: `${level * 1.25}rem` }}
                className={`w-full text-left flex items-center gap-2 p-2 rounded-md text-sm ${selectedFile === node.path ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
            >
                <FileIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{name}</span>
            </button>
        );
    }

    // It's a directory
    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{ paddingLeft: `${level * 1.25}rem` }}
                className="w-full text-left flex items-center gap-2 p-2 rounded-md text-sm hover:bg-gray-700"
            >
                {isOpen ? <FolderOpenIcon className="w-4 h-4 shrink-0" /> : <FolderIcon className="w-4 h-4 shrink-0" />}
                <span className="truncate font-semibold">{name}</span>
            </button>
            {isOpen && (
                <div>
                    {Object.entries(node.children!).map(([childName, childNode]) => (
                        <FileTreeItem key={childName} name={childName} node={childNode} onFileSelect={onFileSelect} selectedFile={selectedFile} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const EditorView = ({ project }: { project: Project }) => {
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [deployment, setDeployment] = useState<{ mainUrl: string; assetUrls: string[] } | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployError, setDeployError] = useState('');

    const fileTree = React.useMemo(() => buildFileTree(project.generatedCode), [project.generatedCode]);

    useEffect(() => {
        if (project.generatedCode.length > 0 && !selectedFileName) {
            const readme = project.generatedCode.find(f => f.fileName.toLowerCase() === 'readme.md');
            setSelectedFileName(readme ? readme.fileName : project.generatedCode[0].fileName);
        }
    }, [project.generatedCode, selectedFileName]);

    useEffect(() => {
        // This effect manages the lifecycle of blob URLs to prevent memory leaks.
        // When the component unmounts, it revokes all URLs associated with the current deployment.
        return () => {
            if (deployment) {
                URL.revokeObjectURL(deployment.mainUrl);
                deployment.assetUrls.forEach(url => URL.revokeObjectURL(url));
            }
        };
    }, [deployment]);

    const selectedFile = project.generatedCode.find(f => f.fileName === selectedFileName);

    const handleDownloadProject = async () => {
        if (project.generatedCode.length === 0) return;
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            project.generatedCode.forEach(file => {
                zip.file(file.fileName, file.content);
            });
            const blob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${project.name.replace(/[\s\W]+/g, '_') || 'devflow_project'}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Failed to create zip file", error);
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleDeployProject = async () => {
        setIsDeploying(true);
        setDeployError('');
    
        if (deployment) {
            URL.revokeObjectURL(deployment.mainUrl);
            deployment.assetUrls.forEach(url => URL.revokeObjectURL(url));
        }
    
        await new Promise(res => setTimeout(res, 500));
    
        try {
            let htmlFile = project.generatedCode.find(f => f.fileName.toLowerCase() === 'index.html');
            if (!htmlFile) {
                htmlFile = project.generatedCode.find(f => f.fileName.toLowerCase().endsWith('.html'));
            }
            if (!htmlFile) {
                throw new Error("Deployment failed: No HTML file found in the project.");
            }
    
            const blobMap = new Map<string, string>();
            const importMap: { imports: { [key: string]: string } } = { imports: {} };
            const assetUrls: string[] = [];
    
            const getMimeType = (fileName: string) => {
                const extension = fileName.split('.').pop()?.toLowerCase();
                switch (extension) {
                    case 'html': return 'text/html';
                    case 'css': return 'text/css';
                    case 'js':
                    case 'jsx':
                    case 'ts':
                    case 'tsx':
                        return 'text/javascript';
                    case 'json': return 'application/json';
                    case 'png': return 'image/png';
                    case 'jpg':
                    case 'jpeg': return 'image/jpeg';
                    case 'svg': return 'image/svg+xml';
                    default: return 'application/octet-stream';
                }
            };
    
            const needsBabel = project.generatedCode.some(f => /\.(jsx|tsx)$/.test(f.fileName));
    
            for (const file of project.generatedCode) {
                if (file.fileName === htmlFile.fileName) continue;
    
                const mimeType = getMimeType(file.fileName);
                const blob = new Blob([file.content], { type: mimeType });
                const blobUrl = URL.createObjectURL(blob);
                assetUrls.push(blobUrl);
    
                const absolutePath = `/${file.fileName}`;
                blobMap.set(file.fileName, blobUrl);
    
                if (mimeType === 'text/javascript') {
                    importMap.imports[absolutePath] = blobUrl;
                    const withoutExtension = absolutePath.replace(/\.(js|jsx|ts|tsx)$/, '');
                    if (withoutExtension !== absolutePath) {
                       importMap.imports[withoutExtension] = blobUrl;
                    }
                    if (/\/index\.(js|jsx|ts|tsx)$/.test(absolutePath)) {
                        const directoryPath = withoutExtension.replace(/\/index$/, '');
                        importMap.imports[directoryPath] = blobUrl;
                    }
                }
            }
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlFile.content, 'text/html');
    
            doc.querySelectorAll('script[src], link[href], img[src], a[href]').forEach(el => {
                const attribute = el.hasAttribute('src') ? 'src' : 'href';
                const originalPath = el.getAttribute(attribute);
                if (!originalPath || originalPath.startsWith('http') || originalPath.startsWith('//') || originalPath.startsWith('data:')) {
                    return;
                }
                const absolutePath = originalPath.startsWith('/') ? originalPath.substring(1) : originalPath;
                if (blobMap.has(absolutePath)) {
                    el.setAttribute(attribute, blobMap.get(absolutePath)!);
                }
            });
            
            if (needsBabel) {
                 doc.querySelectorAll('script').forEach(script => {
                     const scriptSrc = script.getAttribute('src') || '';
                     const usesJsxInHtml = /<[a-zA-Z]/.test(script.innerHTML);
                     if (script.type === 'module' && (/\.(jsx|tsx)$/.test(scriptSrc) || usesJsxInHtml)) {
                         script.type = 'text/babel';
                     }
                 });
            }
            
            doc.querySelector('script[type="importmap"]')?.remove();
            const importMapScript = doc.createElement('script');
            importMapScript.type = 'importmap';
            importMapScript.innerHTML = JSON.stringify(importMap, null, 2);
            doc.head.prepend(importMapScript);
    
            if (needsBabel) {
                const babelScript = doc.createElement('script');
                babelScript.src = "https://unpkg.com/@babel/standalone/babel.min.js";
                doc.head.prepend(babelScript);
            }
    
            const finalHtml = new XMLSerializer().serializeToString(doc);
            const mainBlob = new Blob([finalHtml], { type: 'text/html' });
            const mainUrl = URL.createObjectURL(mainBlob);
            
            setDeployment({ mainUrl, assetUrls });
            setActiveTab('preview');
        } catch (error: any) {
            setDeployError(error.message);
            console.error("Deployment error:", error);
        } finally {
            setIsDeploying(false);
        }
    };


    if (project.generatedCode.length === 0) {
         return (
            <div className="text-center p-8 bg-gray-800 rounded-lg">
                <h2 className="text-2xl font-bold">Editor is Empty</h2>
                <p className="text-gray-400 mt-2">Use the 'Project Scaffolder' to generate a new project, or the 'Tasks' view to generate individual files.</p>
            </div>
        );
    }
    
    const tabClasses = "py-2 px-4 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const activeTabClasses = "text-white border-b-2 border-blue-500";
    const inactiveTabClasses = "text-gray-400 hover:text-white border-b-2 border-transparent";

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold">Project Editor</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownloadProject}
                        disabled={isDownloading}
                        className="flex items-center justify-center gap-2 bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                    >
                        {isDownloading ? 'Zipping...' : 'Download Project'}
                    </button>
                    <button
                        onClick={handleDeployProject}
                        disabled={isDeploying}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                    >
                        <DeployIcon className="w-5 h-5"/>
                        {isDeploying ? 'Deploying...' : 'Deploy Project'}
                    </button>
                </div>
            </div>

            <div className="border-b border-gray-700 shrink-0">
                <nav className="flex space-x-2">
                    <button onClick={() => setActiveTab('editor')} className={`${tabClasses} ${activeTab === 'editor' ? activeTabClasses : inactiveTabClasses}`}>
                        Editor
                    </button>
                    <button onClick={() => setActiveTab('preview')} disabled={!deployment} className={`${tabClasses} ${activeTab === 'preview' ? activeTabClasses : inactiveTabClasses}`}>
                        Preview
                    </button>
                </nav>
            </div>
            
            {deployError && <p className="text-red-400 text-sm shrink-0 -mt-2">{deployError}</p>}
            
            {activeTab === 'editor' ? (
                 <div className="flex-grow grid grid-cols-12 gap-4 min-h-0">
                    <div className="col-span-3 bg-gray-800 rounded-lg p-3 border border-gray-700 overflow-y-auto">
                        {Object.entries(fileTree).map(([name, node]) => (
                            <FileTreeItem key={name} name={name} node={node} onFileSelect={setSelectedFileName} selectedFile={selectedFileName} level={0} />
                        ))}
                    </div>
                    <div className="col-span-9 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
                        {selectedFile ? (
                            <>
                                <div className="p-3 bg-gray-700 rounded-t-lg border-b border-gray-600">
                                    <span className="font-mono text-sm">{selectedFile.fileName}</span>
                                </div>
                                {selectedFile.fileName.toLowerCase().endsWith('.md') ? (
                                    <div className="p-4 prose prose-invert max-w-none overflow-auto flex-grow"><ReactMarkdown>{selectedFile.content}</ReactMarkdown></div>
                                ) : (
                                    <pre className="p-4 text-sm overflow-auto flex-grow">
                                        <code className="text-gray-300">{selectedFile.content}</code>
                                    </pre>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">Select a file to view its content.</div>
                        )}
                    </div>
                </div>
            ) : deployment ? (
                <div className="flex-grow bg-gray-800 rounded-lg border border-gray-700 p-1">
                    <iframe 
                        src={deployment.mainUrl} 
                        className="w-full h-full border-0 bg-white rounded-md" 
                        title="Deployment Preview" 
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700">
                    <div className="text-center text-gray-500">
                        <DeployIcon className="w-12 h-12 mx-auto mb-2"/>
                        <p>Deploy the project to see a live preview.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Other View Components ---

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center gap-4">
        <div className="bg-gray-700 p-3 rounded-full text-blue-500">{icon}</div>
        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-gray-200">{value}</p>
        </div>
    </div>
);

const TeamDashboardView = ({ project }: { project: Project }) => {
    const pendingTasks = project.tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = project.tasks.filter(t => t.status === 'in-progress').length;
    const doneTasks = project.tasks.filter(t => t.status === 'done').length;
    const totalTasks = project.tasks.length;
    const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const totalFiles = project.generatedCode.length;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Team Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Tasks" value={totalTasks} icon={<TasksIcon />} />
                <StatCard title="Generated Files" value={totalFiles} icon={<FileIcon />} />
                <StatCard title="Chat Messages" value={project.messages.length} icon={<ChatIcon />} />
            </div>
            <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Task Progress</h3>
                <div className="w-full bg-gray-700 rounded-full h-4">
                    <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                </div>
                <p className="text-right text-sm text-gray-400 mt-2">{completionPercentage}% Complete</p>
                <div className="flex justify-between mt-4 text-center">
                    <div><p className="font-bold text-xl">{pendingTasks}</p><p className="text-sm text-gray-400">Pending</p></div>
                    <div><p className="font-bold text-xl">{inProgressTasks}</p><p className="text-sm text-gray-400">In Progress</p></div>
                    <div><p className="font-bold text-xl">{doneTasks}</p><p className="text-sm text-gray-400">Done</p></div>
                </div>
            </div>
        </div>
    );
};

const ProjectHeatmapView = ({ project }: { project: Project }) => {
    if (!project.tasks.length) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-lg">
                <h2 className="text-2xl font-bold">No Task Data</h2>
                <p className="text-gray-400 mt-2">Generate some tasks to see the project heatmap.</p>
            </div>
        );
    }

    const maxFiles = Math.max(...project.tasks.map(t => t.files.length), 0);

    const getColor = (fileCount: number) => {
        if (maxFiles === 0) return 'bg-gray-700';
        const intensity = fileCount / maxFiles;
        if (intensity > 0.75) return 'bg-blue-600';
        if (intensity > 0.5) return 'bg-blue-500';
        if (intensity > 0.25) return 'bg-gray-600';
        if (intensity > 0) return 'bg-gray-700';
        return 'bg-gray-800 border border-gray-700';
    };

    return (
         <div>
            <h2 className="text-2xl font-bold mb-2">Project Heatmap</h2>
            <p className="text-gray-400 mb-6">Visualizing task complexity based on the number of associated files.</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {project.tasks.map(task => (
                    <div key={task.id} className="relative group">
                        <div className={`aspect-square rounded ${getColor(task.files.length)}`}></div>
                        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <p className="font-bold">{task.title}</p>
                            <p>{task.files.length} files</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MemoryAgentView = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: `mem-msg-${Date.now()}`, sender: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const aiResponseText = await geminiService.askMemoryAgent(newMessages, currentInput);
            const aiMessage: ChatMessage = { id: `mem-msg-${Date.now() + 1}`, sender: 'ai', text: aiResponseText };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { id: `mem-msg-${Date.now() + 1}`, sender: 'ai', text: 'Sorry, I encountered an error.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-2">Memory Agent</h2>
            <p className="text-gray-400 mb-4">Chat with an AI that remembers the entire conversation for better contextual understanding.</p>
            <div className="flex-grow bg-gray-800 rounded-t-lg p-4 border border-b-0 border-gray-700 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'} prose prose-invert max-w-none`}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="max-w-xl p-3 rounded-lg bg-gray-700">Thinking...</div></div>}
                </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 rounded-b-lg border border-t-0 border-gray-700">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Start a conversation..."
                    className="w-full p-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
            </form>
        </div>
    );
};

const AgentSimulationView = ({ project, onUpdateProject, onSwitchView }: { project: Project, onUpdateProject: (updates: Partial<Project>) => void, onSwitchView: (view: View) => void }) => {
    const [goal, setGoal] = useState('');
    const [simulationTurns, setSimulationTurns] = useState<SimulationTurn[]>([]);
    const [finalFileSet, setFinalFileSet] = useState<GeneratedCode[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    const handleRun = async () => {
        if (!goal.trim()) return;
        setIsLoading(true);
        setError('');
        setSimulationTurns([]);
        setFinalFileSet([]);
        setIsComplete(false);
        try {
            const result = await geminiService.runAgentSimulation(goal, project.generatedCode);
            setSimulationTurns(result.turns);
            setFinalFileSet(result.files);
            setIsComplete(true);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = () => {
        const codeMap = new Map<string, GeneratedCode>(project.generatedCode.map(file => [file.fileName, file]));
        finalFileSet.forEach(newFile => {
            codeMap.set(newFile.fileName, newFile);
        });
        const mergedCode = Array.from(codeMap.values());
        onUpdateProject({ generatedCode: mergedCode });
        onSwitchView('editor');
    };

    const handleDiscard = () => {
        setSimulationTurns([]);
        setFinalFileSet([]);
        setIsComplete(false);
        setGoal('');
    };

    const { createdFiles, modifiedFiles } = React.useMemo(() => {
        if (!isComplete) return { createdFiles: [], modifiedFiles: [] };
        const existingFileNames = new Set(project.generatedCode.map(f => f.fileName));
        const created: string[] = [];
        const modified: string[] = [];
        finalFileSet.forEach(file => {
            if (existingFileNames.has(file.fileName)) {
                modified.push(file.fileName);
            } else {
                created.push(file.fileName);
            }
        });
        return { createdFiles: created, modifiedFiles: modified };
    }, [isComplete, finalFileSet, project.generatedCode]);

    const getAgentInfo = (agentName: string): { icon: React.ReactNode; color: string; name: string } => {
        const lowerAgentName = agentName.toLowerCase();
        if (lowerAgentName.includes('manager')) {
            return { icon: <ManagerIcon className="w-8 h-8 text-blue-400" />, color: 'border-blue-500', name: "Project Manager" };
        }
        if (lowerAgentName.includes('developer')) {
            return { icon: <CodeIcon className="w-8 h-8 text-green-400" />, color: 'border-green-500', name: "Senior Developer" };
        }
        if (lowerAgentName.includes('qa')) {
            return { icon: <QAIcon className="w-8 h-8 text-yellow-400" />, color: 'border-yellow-500', name: "QA Engineer" };
        }
        return { icon: <ChatIcon className="w-8 h-8 text-gray-400" />, color: 'border-gray-500', name: agentName };
    };

    return (
         <div className="flex flex-col h-full gap-4">
            <div>
                <h2 className="text-2xl font-bold mb-2">Multi-Agent Simulation</h2>
                <p className="text-gray-400">Define a goal and watch a simulated team of AI agents (Manager, Developer, QA) collaborate to achieve it. Approve their work to apply it directly to your project files.</p>
            </div>
            
            {!isComplete ? (
                 <div className="flex flex-col gap-4">
                    <textarea
                        className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., 'Add a dark mode toggle button to the React app'"
                    />
                    <button
                        onClick={handleRun}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Simulating...' : 'Start Simulation'} <SparkleIcon />
                    </button>
                 </div>
            ) : (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-lg font-bold">Simulation Complete</h3>
                    <p className="text-gray-400 mb-4">Review the proposed changes and approve to apply them to the editor.</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <h4 className="font-semibold mb-2 text-green-400">Files to Create ({createdFiles.length})</h4>
                            <ul className="text-sm list-disc list-inside text-gray-300">{createdFiles.map(f => <li key={f} className="truncate">{f}</li>)}</ul>
                        </div>
                        <div>
                             <h4 className="font-semibold mb-2 text-yellow-400">Files to Modify ({modifiedFiles.length})</h4>
                            <ul className="text-sm list-disc list-inside text-gray-300">{modifiedFiles.map(f => <li key={f} className="truncate">{f}</li>)}</ul>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleApprove} className="flex-1 flex items-center justify-center gap-2 bg-green-600 font-semibold p-2 rounded-lg hover:bg-green-500">
                            <CheckIcon /> Approve & Apply Changes
                        </button>
                        <button onClick={handleDiscard} className="flex-1 flex items-center justify-center gap-2 bg-gray-600 font-semibold p-2 rounded-lg hover:bg-gray-500">
                           <TrashIcon /> Discard
                        </button>
                    </div>
                </div>
            )}
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 overflow-y-auto flex-grow">
                {isLoading && <div className="text-center p-8">Simulation in progress... This may take a moment.</div>}
                {error && <p className="text-red-400">{error}</p>}
                {!isLoading && !error && simulationTurns.length > 0 && (
                    <div className="space-y-6">
                        {simulationTurns.map((turn, index) => {
                            const { icon, color, name } = getAgentInfo(turn.agent);
                            return (
                                <div key={index} className={`flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg border-l-4 ${color}`}>
                                    <div className="shrink-0 pt-1">{icon}</div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-gray-200">{name}</p>
                                        <div className="prose prose-invert max-w-none text-gray-300">
                                            <ReactMarkdown>{turn.message}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                 {!isLoading && !error && simulationTurns.length === 0 && (
                    <div className="text-center text-gray-500 p-8">
                        The simulation results will appear here.
                    </div>
                )}
            </div>
        </div>
    );
};
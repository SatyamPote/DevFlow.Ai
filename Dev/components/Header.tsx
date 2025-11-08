import React from 'react';

export const Header = ({ title, projectName }: { title: string, projectName: string }) => {
    return (
        <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
            <div>
                 <p className="text-xs text-gray-400">Project</p>
                 <h2 className="text-lg font-semibold text-gray-200">{projectName}</h2>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-400">Current View</p>
                <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
            </div>
        </header>
    );
};
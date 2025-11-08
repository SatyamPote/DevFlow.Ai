
import React from 'react';
import type { GeneratedFile } from '../types';
import { CodeIcon } from './icons';

interface CodePreviewProps {
    file: GeneratedFile | null;
    isLoading: boolean;
}

export const CodePreview = ({ file, isLoading }: CodePreviewProps) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (file?.content) {
            navigator.clipboard.writeText(file.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    if (isLoading) {
        return (
            <div className="bg-gray-800 rounded-lg p-4 h-full flex items-center justify-center border border-gray-700">
                <div className="flex flex-col items-center">
                    <CodeIcon className="w-12 h-12 text-gray-600 animate-pulse" />
                    <p className="mt-4 text-gray-400">Generating code...</p>
                </div>
            </div>
        );
    }

    if (!file) {
        return (
            <div className="bg-gray-800 rounded-lg p-4 h-full flex items-center justify-center border-2 border-dashed border-gray-700">
                <div className="text-center text-gray-500">
                    <CodeIcon className="w-12 h-12 mx-auto" />
                    <p className="mt-2">Select a file to generate its boilerplate code.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg h-full flex flex-col border border-gray-700">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded-t-lg border-b border-gray-600">
                <span className="font-mono text-sm text-gray-300">{file.fileName}</span>
                <button
                    onClick={handleCopy}
                    className="px-3 py-1 text-xs font-medium bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 text-sm overflow-auto flex-grow">
                <code className="language-javascript text-gray-300">
                    {file.content}
                </code>
            </pre>
        </div>
    );
};

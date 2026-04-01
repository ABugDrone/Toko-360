'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import { JSONContent } from '@/lib/types';
import { EditorToolbar } from './editor-toolbar';

interface RichTextEditorProps {
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
  formatType?: 'word' | 'spreadsheet' | 'presentation';
}

export function RichTextEditor({
  content,
  onChange,
  formatType = 'word',
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing your report...',
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
    ],
    content: content || undefined,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json as JSONContent);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4 text-foreground',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();
  const characterLimit = 50000;
  const isApproachingLimit = characterCount > 45000;
  const isLimitExceeded = characterCount >= characterLimit;

  return (
    <div className="space-y-2">
      <div 
        className="border rounded-lg overflow-hidden bg-card border-border"
      >
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      
      {/* Character count display */}
      <div className="flex items-center justify-between text-sm transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
        <span
          className={`${
            isLimitExceeded
              ? 'text-red-500'
              : isApproachingLimit
              ? 'text-yellow-500'
              : ''
          }`}
          style={{ 
            color: isLimitExceeded ? '#ef4444' : isApproachingLimit ? '#eab308' : 'var(--theme-text)',
            opacity: isLimitExceeded || isApproachingLimit ? 1 : 0.6
          }}
        >
          {characterCount.toLocaleString()} / {characterLimit.toLocaleString()} characters
        </span>
        
        {isLimitExceeded && (
          <span className="text-red-500 text-xs">
            Character limit exceeded. Please reduce content length.
          </span>
        )}
      </div>
    </div>
  );
}

'use client';

import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

function ToolbarButton({ onClick, isActive, icon, label, shortcut }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-pressed={isActive}
          className={`
            w-9 h-9 flex items-center justify-center rounded
            transition-colors
            ${
              isActive
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }
          `}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <div>{label}</div>
          <div className="text-xs text-slate-400">{shortcut}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div
      className="bg-slate-900 border-b border-slate-700 p-2 flex flex-wrap gap-1"
      role="toolbar"
      aria-label="Text formatting toolbar"
    >
      {/* Text Formatting Section */}
      <div className="flex gap-1 pr-2 border-r border-slate-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={<Bold className="w-4 h-4" />}
          label="Bold"
          shortcut="Ctrl+B"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={<Italic className="w-4 h-4" />}
          label="Italic"
          shortcut="Ctrl+I"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={<Underline className="w-4 h-4" />}
          label="Underline"
          shortcut="Ctrl+U"
        />
      </div>

      {/* Heading Section */}
      <div className="flex gap-1 pr-2 border-r border-slate-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={<Heading1 className="w-4 h-4" />}
          label="Heading 1"
          shortcut="Ctrl+Alt+1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={<Heading2 className="w-4 h-4" />}
          label="Heading 2"
          shortcut="Ctrl+Alt+2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={<Heading3 className="w-4 h-4" />}
          label="Heading 3"
          shortcut="Ctrl+Alt+3"
        />
      </div>

      {/* Alignment Section */}
      <div className="flex gap-1 pr-2 border-r border-slate-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={<AlignLeft className="w-4 h-4" />}
          label="Align Left"
          shortcut="Ctrl+Shift+L"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={<AlignCenter className="w-4 h-4" />}
          label="Align Center"
          shortcut="Ctrl+Shift+E"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={<AlignRight className="w-4 h-4" />}
          label="Align Right"
          shortcut="Ctrl+Shift+R"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          icon={<AlignJustify className="w-4 h-4" />}
          label="Align Justify"
          shortcut="Ctrl+Shift+J"
        />
      </div>

      {/* List Section */}
      <div className="flex gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={<List className="w-4 h-4" />}
          label="Bullet List"
          shortcut="Ctrl+Shift+8"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={<ListOrdered className="w-4 h-4" />}
          label="Numbered List"
          shortcut="Ctrl+Shift+7"
        />
      </div>
    </div>
  );
}

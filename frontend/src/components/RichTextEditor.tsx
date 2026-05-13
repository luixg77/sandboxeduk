'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, ImagePlus, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  wrapperClassName?: string;
}

export function RichTextEditor({ value, onChange, onImageUpload, wrapperClassName = '' }: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-h-80 object-contain my-3 flex align-center cursor-pointer ring-2 ring-transparent hover:ring-purple-400 transition-all focus:ring-purple-500',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[140px] max-w-none text-slate-800 p-4 prose-img:m-0 prose-p:my-1',
      },
    },
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      setIsUploading(true);
      const url = await onImageUpload(file);
      // Insere logo abaixo de onde estava o cursor
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err: any) {
      alert(err.message || 'Erro ao subir imagem.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`flex flex-col w-full min-h-[220px] border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all bg-white relative resize-y overflow-hidden ${wrapperClassName}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2 shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bold') ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
          }`}
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('italic') ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
          }`}
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1.5" />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors text-xs font-semibold"
          title="Inserir Imagem (Apague via Backspace)"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <ImagePlus className="w-4 h-4 text-purple-600" />}
          {isUploading ? 'Inserindo...' : 'Anexar Imagem'}
        </button>
        <input
          type="file"
          accept="image/png, image/jpeg"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
      </div>

      {/* Box de digitação resizable livre apenas para baixo */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30 cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

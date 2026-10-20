import { useState, useRef, useEffect, useReducer } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Superscript } from '@tiptap/extension-superscript'
import { Subscript } from '@tiptap/extension-subscript'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Table as TableIcon,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Palette, Highlighter, ChevronDown,
} from 'lucide-react'

const TEXT_COLORS = ['#000000', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899']
const HIGHLIGHT_COLORS = ['#FEF08A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#FED7AA', '#DDD6FE']

function ToolbarButton({
  active, onClick, children, title,
}: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      type='button'
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`w-8 h-8 flex items-center justify-center rounded shrink-0
        ${active ? 'bg-primary-600 text-white' : 'text-primary-800 hover:bg-primary-50'}`}
    >
      {children}
    </button>
  )
}

function ColorPicker({
  icon, title, colors, onPick, onClear, activeColor,
}: {
  icon: React.ReactNode
  title: string
  colors: string[]
  onPick: (color: string) => void
  onClear: () => void
  activeColor?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div className='relative' ref={ref}>
      <button
        type='button'
        title={title}
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p) }}
        className='h-8 px-1.5 flex items-center gap-0.5 rounded text-primary-800 hover:bg-primary-50 shrink-0'
      >
        <span style={activeColor ? { color: activeColor } : undefined}>{icon}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className='absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 w-40'
          onClick={(e) => e.stopPropagation()}
        >
          <p className='text-xs font-semibold text-gray-500 mb-1.5'>{title}</p>
          <div className='grid grid-cols-4 gap-1.5 mb-2'>
            {colors.map((c) => (
              <button
                key={c}
                type='button'
                title={c}
                onClick={() => { onPick(c); setOpen(false) }}
                className='w-7 h-7 rounded-full border border-gray-300 hover:scale-110 transition-transform'
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type='button'
            onClick={() => { onClear(); setOpen(false) }}
            className='w-full text-xs text-center text-gray-500 hover:text-red-500 py-1 border-t border-gray-100'
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleToggle() {
    if (!open) {
      const existing = editor.getAttributes('link').href
      setUrl(existing ?? '')
    }
    setOpen((p) => !p)
  }

  function applyLink() {
    const trimmed = url.trim()
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
    }
    setOpen(false)
  }

  return (
    <div className='relative' ref={ref}>
      <ToolbarButton
        title='Link'
        active={editor.isActive('link')}
        onClick={handleToggle}
      >
        <LinkIcon size={16} />
      </ToolbarButton>

      {open && (
        <div
          className='absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 w-56 max-w-[80vw]'
          onClick={(e) => e.stopPropagation()}
        >
          <p className='text-xs font-semibold text-gray-500 mb-1.5'>Link URL</p>
          <input
            autoFocus
            type='text'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyLink()}
            placeholder='https://example.com'
            className='w-full border rounded px-2 py-1 text-sm mb-2'
          />
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={applyLink}
              className='flex-1 bg-primary-600 text-white text-xs font-semibold py-1.5 rounded hover:bg-primary-700'
            >
              Apply
            </button>
            <button
              type='button'
              onClick={() => setOpen(false)}
              className='flex-1 border text-xs font-semibold py-1.5 rounded hover:bg-gray-50'
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NoteEditor({ content, onChange, readOnly }: {
  content: string
  onChange: (html: string) => void
  readOnly: boolean
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write your notes here...' }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'focus:outline-none px-3 py-2 h-full' },
    },
  })

  const [, forceRerender] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    if (!editor) return
    const rerender = () => forceRerender()
    editor.on('transaction', rerender)
    editor.on('selectionUpdate', rerender)
    return () => {
      editor.off('transaction', rerender)
      editor.off('selectionUpdate', rerender)
    }
  }, [editor])

  // `editable` is only read when the editor is created, so keep it in sync
  // when the modal switches from view mode to edit mode (EDIT button).
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!readOnly)
  }, [editor, readOnly])

  if (!editor) return null

  function insertTable() {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

return (
    <div
      className={`w-full flex-1 min-h-0 flex flex-col mb-4 rounded-md overflow-hidden
        min-h-[280px] sm:min-h-[350px]
        ${readOnly ? '' : 'border-2 border-primary-600'}`}
    >
      {!readOnly && (
<div className='flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50 shrink-0'>
            <select
            title='Text style'
            className='text-sm border rounded px-1.5 py-1 mr-1 text-primary-800 dark:bg-white shrink-0'
            onChange={(e) => {
              const val = e.target.value
              if (val === 'p') editor.chain().focus().setParagraph().run()
              else editor.chain().focus().toggleHeading({ level: Number(val) as 1 | 2 | 3 }).run()
            }}
            value={
              editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' : 'p'
            }
          >
            <option value='p'>Paragraph</option>
            <option value='1'>Heading 1</option>
            <option value='2'>Heading 2</option>
            <option value='3'>Heading 3</option>
          </select>

          <div className='w-px h-6 bg-gray-200 mx-0.5 shrink-0' />

          <ToolbarButton title='Bold' active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton title='Italic' active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton title='Underline' active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={16} />
          </ToolbarButton>

          <div className='w-px h-6 bg-gray-200 mx-0.5 shrink-0' />

          <ColorPicker
            icon={<Palette size={16} />}
            title='Text color'
            colors={TEXT_COLORS}
            onPick={(c) => editor.chain().focus().setColor(c).run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
            activeColor={editor.getAttributes('textStyle').color}
          />
          <ColorPicker
            icon={<Highlighter size={16} />}
            title='Highlight'
            colors={HIGHLIGHT_COLORS}
            onPick={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
            onClear={() => editor.chain().focus().unsetHighlight().run()}
          />

          <div className='w-px h-6 bg-gray-200 mx-0.5 shrink-0' />

          <ToolbarButton
            title='Superscript'
            active={editor.isActive('superscript')}
            onClick={() => editor.chain().focus().unsetSubscript().toggleSuperscript().run()}
          >
            <SuperscriptIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            title='Subscript'
            active={editor.isActive('subscript')}
            onClick={() => editor.chain().focus().unsetSuperscript().toggleSubscript().run()}
          >
            <SubscriptIcon size={16} />
          </ToolbarButton>

          <div className='w-px h-6 bg-gray-200 mx-0.5 shrink-0' />

          <ToolbarButton title='Bullet list' active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton title='Numbered list' active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16} />
          </ToolbarButton>

          <div className='w-px h-6 bg-gray-200 mx-0.5 shrink-0' />

          <ToolbarButton title='Align left' active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton title='Align center' active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton title='Align right' active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight size={16} />
          </ToolbarButton>

          <div className='w-px h-6 bg-gray-200 mx-0.5 shrink-0' />

          <LinkPopover editor={editor} />
          <ToolbarButton title='Insert table' onClick={insertTable}>
            <TableIcon size={16} />
          </ToolbarButton>
        </div>
      )}

      <div className='flex-1 overflow-y-auto cursor-text' onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} className='prose max-w-none h-full' />
      </div>
    </div>
  )
}
import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Table, Modal, DatePicker, message, Popconfirm, Empty, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Editor } from '@tinymce/tinymce-react';
import { createNote, getNotes, updateNote, deleteNote } from '../../../config/apiClient';
import moment from 'moment';
import dayjs, { Dayjs } from 'dayjs';

interface Note {
  _id: string;
  noteDate: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const Notes: React.FC = () => {
  const { customerId } = useOutletContext<{ customerId: string }>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteDate, setNoteDate] = useState<Dayjs | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (customerId) {
      fetchNotes();
    }
  }, [customerId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await getNotes(customerId);
      if (res.success) {
        setNotes(res.data || []);
      } else {
        message.error(res.message || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      message.error('Error fetching notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingNote(null);
    setNoteDate(dayjs());
    setContent('');
    setIsModalOpen(true);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setNoteDate(note.noteDate ? dayjs(note.noteDate) : dayjs());
    // Decode HTML entities before setting content for editor
    const decodeHtmlEntities = (html: string) => {
      if (!html) return '';
      const textarea = document.createElement('textarea');
      textarea.innerHTML = html;
      return textarea.value;
    };
    setContent(decodeHtmlEntities(note.content));
    setIsModalOpen(true);
  };

  const handleDelete = async (noteId: string) => {
    try {
      const res = await deleteNote(noteId);
      if (res.success) {
        message.success('Note deleted successfully');
        fetchNotes();
      } else {
        message.error(res.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      message.error('Error deleting note');
    }
  };

  const handleSave = async () => {
    if (!noteDate) {
      message.warning('Please select a date');
      return;
    }
    if (!content.trim()) {
      message.warning('Please enter note content');
      return;
    }

    setSaving(true);
    try {
      const dateString = noteDate.format('YYYY-MM-DD');
      if (editingNote) {
        // Update existing note
        const res = await updateNote(editingNote._id, {
          noteDate: dateString,
          content: content
        });
        if (res.success) {
          message.success('Note updated successfully');
          setIsModalOpen(false);
          fetchNotes();
        } else {
          message.error(res.message || 'Failed to update note');
        }
      } else {
        // Create new note
        const res = await createNote({
          customerId,
          noteDate: dateString,
          content: content
        });
        if (res.success) {
          message.success('Note created successfully');
          setIsModalOpen(false);
          fetchNotes();
        } else {
          message.error(res.message || 'Failed to create note');
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
      message.error('Error saving note');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setNoteDate(null);
    setContent('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Notes</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Create Note
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading notes...</div>
      ) : notes.length === 0 ? (
        <Empty description="No notes yet. Create your first note!" />
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <Table
            dataSource={notes}
            rowKey="_id"
            pagination={false}
            columns={[
              {
                title: 'Date',
                dataIndex: 'noteDate',
                key: 'noteDate',
                width: '20%',
                render: (date: string) => (
                  <span className="font-semibold">
                    {date ? moment(date).format('MMM DD, YYYY') : '-'}
                  </span>
                ),
                sorter: (a: Note, b: Note) => {
                  if (!a.noteDate || !b.noteDate) return 0;
                  return moment(a.noteDate).unix() - moment(b.noteDate).unix();
                },
                defaultSortOrder: 'descend' as const,
              },
              {
                title: 'Content',
                dataIndex: 'content',
                key: 'content',
                width: '60%',
                render: (content: string) => {
                  // Function to decode HTML entities and strip HTML tags
                  const stripHtml = (html: string) => {
                    if (!html) return '';
                    // First decode HTML entities (like &lt; to <, &gt; to >)
                    const textarea = document.createElement('textarea');
                    textarea.innerHTML = html;
                    let decoded = textarea.value;
                    // Then remove all HTML tags
                    decoded = decoded.replace(/<[^>]*>/g, '');
                    // Clean up extra whitespace and newlines
                    return decoded.replace(/\s+/g, ' ').trim();
                  };
                  const textContent = stripHtml(content || '');
                  const preview = textContent.length > 300 
                    ? textContent.substring(0, 300) + '...' 
                    : textContent;
                  return (
                    <div className="text-gray-600 text-sm line-clamp-2">
                      {preview || '(No content)'}
                    </div>
                  );
                },
              },
              {
                title: 'Actions',
                key: 'actions',
                width: '20%',
                render: (_, record: Note) => (
                  <Space size="middle">
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    >
                      Edit
                    </Button>
                    <Popconfirm
                      title="Delete note"
                      description="Are you sure you want to delete this note?"
                      onConfirm={() => handleDelete(record._id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      )}

      <Modal
        title={editingNote ? 'Edit Note' : 'Create Note'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={handleCancel}
        okText={editingNote ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={800}
        confirmLoading={saving}
      >
        <div className="mt-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Date</label>
            <DatePicker
              value={noteDate}
              onChange={(date) => setNoteDate(date)}
              format="YYYY-MM-DD"
              className="w-full"
              placeholder="Select date"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-2">Content</label>
          </div>
          <Editor
            apiKey="1ya1d1zav4tgpip8exgsyyatkcy07funukfyfrnn93t7wslj"
            onInit={(_evt, editor) => editorRef.current = editor}
            value={content}
            onEditorChange={(content) => setContent(content)}
            init={{
              height: 400,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | formatselect | ' +
                'bold italic forecolor backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Notes;


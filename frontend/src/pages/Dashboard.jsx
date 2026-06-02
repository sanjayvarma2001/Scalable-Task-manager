import { useState, useEffect, useCallback } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import TaskModal from '../components/TaskModal'
import toast from 'react-hot-toast'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
]

export default function Dashboard() {
  const [tasks, setTasks] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // null | 'create' | task object

  const pageSize = 10

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      const { data } = await getTasks(params)
      setTasks(data.tasks)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, priorityFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleFilterChange = (setter) => (val) => {
    setter(val)
    setPage(1)
  }

  const handleSave = async (form) => {
    try {
      if (modal === 'create') {
        await createTask(form)
        toast.success('Task created')
      } else {
        await updateTask(modal.id, form)
        toast.success('Task updated')
      }
      setModal(null)
      fetchTasks()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save task')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTask(id)
      toast.success('Task deleted')
      fetchTasks()
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleStatusToggle = async (task) => {
    const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
    try {
      await updateTask(task.id, { status: next[task.status] })
      fetchTasks()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600' }}>My Tasks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>{total} task{total !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => handleFilterChange(setStatusFilter)(f.value)}
              style={{
                padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500', transition: 'all 0.15s',
                background: statusFilter === f.value ? 'var(--accent)' : 'transparent',
                color: statusFilter === f.value ? '#fff' : 'var(--text-muted)',
              }}>{f.label}</button>
          ))}
        </div>
        <select className="input" value={priorityFilter} onChange={e => handleFilterChange(setPriorityFilter)(e.target.value)}
          style={{ width: 'auto', fontSize: '13px', padding: '6px 12px' }}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <span className="spinner" style={{ width: '28px', height: '28px' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <p>No tasks found. Create one to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => setModal(task)}
              onDelete={() => handleDelete(task.id)}
              onToggleStatus={() => handleStatusToggle(task)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <TaskModal
          task={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete, onToggleStatus }) {
  return (
    <div className="card fade-in" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px' }}>
      {/* Status toggle circle */}
      <button onClick={onToggleStatus} title="Cycle status" style={{
        width: '20px', height: '20px', borderRadius: '50%', border: '2px solid',
        cursor: 'pointer', flexShrink: 0, background: 'transparent', transition: 'all 0.15s',
        borderColor: task.status === 'done' ? 'var(--success)' : task.status === 'in_progress' ? 'var(--warning)' : 'var(--border)',
        background: task.status === 'done' ? 'var(--success)' : 'transparent',
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px', fontWeight: '500',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{task.title}</div>
        {task.description && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.description}
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>Del</button>
      </div>
    </div>
  )
}
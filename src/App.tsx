import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_TODOS, ADD_TODO, TOGGLE_TODO, DELETE_TODO, DELETE_ALL_TODOS, UPDATE_TODO_TITLE } from './graphql/queries';
import { supabase } from './lib/supabaseClient';
import { client } from './lib/apolloClient';
import type { Session } from '@supabase/supabase-js';

interface Todo {
  id: string;
  title: string;
  is_complete: boolean;
  created_at?: string;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);

  // Listen for auth state changes
  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Handle session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (event === 'SIGNED_OUT') {
        setLocalTodos([]);
        client.clearStore();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { loading, data, refetch } = useQuery<{ todosCollection: { edges: { node: Todo }[] } }>(GET_TODOS, {
    variables: { userId: session?.user?.id },
    notifyOnNetworkStatusChange: true,
    skip: !session,
  });

  const [addTodo, { loading: isAdding }] = useMutation(ADD_TODO, {
    onCompleted: () => refetch()
  });
  const [toggleTodo] = useMutation(TOGGLE_TODO, { onCompleted: () => refetch() });
  const [deleteTodo] = useMutation(DELETE_TODO, { onCompleted: () => refetch() });
  const [updateTodoTitle] = useMutation(UPDATE_TODO_TITLE, { onCompleted: () => refetch() });
  const [deleteAllTodos, { loading: isDeletingAll }] = useMutation(DELETE_ALL_TODOS, {
    onCompleted: () => refetch(),
  });

  useEffect(() => {
    if (!session) {
      setLocalTodos([]);
      return;
    }

    if (data?.todosCollection?.edges) {
      const fetchedTodos = data.todosCollection.edges.map((edge: { node: Todo }) => edge.node);
      const sortedTodos = [...fetchedTodos].sort((a, b) => {
        if (a.is_complete === b.is_complete) return 0;
        return a.is_complete ? 1 : -1;
      });
      setLocalTodos(sortedTodos);
    }
  }, [data, session]);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Login error:', err.message);
      }
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newTodo.trim() || isAdding) return;

    try {
      await addTodo({ variables: { title: newTodo } });
      setNewTodo('');
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  const handleToggleTodo = async (id: string, is_complete: boolean) => {
    if (!session) return;
    try {
      await toggleTodo({ variables: { id, is_complete: !is_complete } });
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  const handleEditSave = async (id: string) => {
    if (!session || !editingTitle.trim()) return;
    try {
      await updateTodoTitle({ variables: { id, title: editingTitle } });
      setEditingId(null);
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const moveTodo = (index: number, direction: 'up' | 'down') => {
    if (!session) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localTodos.length) return;

    const newTodos = [...localTodos];
    const [movedTodo] = newTodos.splice(index, 1);
    newTodos.splice(newIndex, 0, movedTodo);
    setLocalTodos(newTodos);
  };

  const handleDeleteAll = async () => {
    if (!session || !window.confirm('Delete all your todos?')) return;
    try {
      await deleteAllTodos();
    } catch (err) {
      console.error('Error deleting all todos:', err);
    }
  };

  return (
    <div className="max-w-250 min-w-125 mx-auto mt-8 p-8 bg-[#242424] rounded-lg shadow-xl text-white relative min-h-125">
      <div className="flex justify-between items-center mb-10 border-b border-[#333] pb-6 gap-7">
        <h1 className="text-[40px] font-bold tracking-tight">Todo List</h1>
        <div className="flex items-center gap-6">
          {session ? (
            <div className="flex items-center gap-4 bg-[#1a1a1a] p-2 pl-4 rounded-full border border-[#333]">
              <span className="text-sm font-medium text-gray-200">{session.user.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 bg-gray-500 hover:bg-red-600/20 rounded-full text-sm font-bold transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-8 py-2.5 bg-[#3eaf7c] hover:bg-[#359b6a] rounded-full font-bold transition-all shadow-lg"
            >
              Login
            </button>
          )}
        </div>
      </div>

      <div className="transition-all duration-300">
        <form onSubmit={handleAddTodo} className="flex gap-2.5 mb-8">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            disabled={isAdding || !session}
            className="flex-1 px-5 py-3 rounded-md border border-[#444] bg-[#1a1a1a] text-white focus:outline-none focus:border-[#3eaf7c]"
          />
          <button
            type="submit"
            disabled={!session || isAdding}
            className="px-8 py-3 bg-[#3eaf7c] hover:bg-[#359b6a] text-white rounded-md cursor-pointer transition-colors font-bold"
          >
            {isAdding ? 'Adding...' : 'Add Todo'}
          </button>
        </form>

        {loading && session && <p className="text-center text-gray-400 mb-4">Updating tasks...</p>}

        {!session && (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-md border border-dashed border-[#444] mb-4">
            <p className="text-gray-400 text-lg">Sign in to see your personal todo list.</p>
            <button
              onClick={handleLogin}
              className="mt-4 text-[#3eaf7c] hover:underline font-semibold"
            >
              Click here to sign in with Google
            </button>
          </div>
        )}

        <ul className="space-y-2">
          {localTodos.map((todo, index) => (
            <li
              key={todo.id}
              className={`flex justify-between items-center p-4 bg-[#1a1a1a] rounded-md border border-[#333] transition-all ${todo.is_complete ? 'opacity-60' : 'opacity-100'}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={todo.is_complete}
                  onChange={() => handleToggleTodo(todo.id, todo.is_complete)}
                  disabled={!session}
                  className="w-5 h-5 rounded cursor-pointer border-[#444]"
                />
                {editingId === todo.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleEditSave(todo.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave(todo.id)}
                    autoFocus
                    className="flex-1 p-1 bg-[#242424] border border-[#3eaf7c] rounded text-white outline-none"
                  />
                ) : (
                  <span
                    onClick={() => {
                      if (session && !todo.is_complete) {
                        setEditingId(todo.id);
                        setEditingTitle(todo.title);
                      }
                    }}
                    className={`text-lg cursor-pointer ${todo.is_complete ? 'line-through text-gray-400' : 'text-white'}`}
                  >
                    {todo.title}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => moveTodo(index, 'up')}
                  disabled={!session || index === 0}
                  className="p-2 rounded-sm border border-[#444] bg-[#333] text-white cursor-pointer hover:bg-[#444] transition-colors"
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveTodo(index, 'down')}
                  disabled={!session || index === localTodos.length - 1}
                  className="p-2 rounded-sm border border-[#444] bg-[#333] text-white cursor-pointer hover:bg-[#444] transition-colors"
                  title="Move Down"
                >
                  ↓
                </button>
                <button
                  onClick={() => {
                    setEditingId(todo.id);
                    setEditingTitle(todo.title);
                  }}
                  disabled={!session || todo.is_complete}
                  className="px-4 py-2 rounded-sm border border-[#3eaf7c] bg-[#3eaf7c] text-white cursor-pointer hover:bg-[#359b6a] transition-colors text-sm font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTodo({ variables: { id: todo.id } })}
                  disabled={!session}
                  className="px-4 py-2 rounded-sm border border-[#ff4444] bg-[#ff4444] text-white cursor-pointer hover:bg-[#cc0000] transition-colors text-sm font-bold"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        {session && localTodos.length > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={isDeletingAll}
            className="w-full mt-8 p-4 bg-gray-700 hover:bg-gray-600 rounded-md font-bold transition-all"
          >
            {isDeletingAll ? 'Clearing...' : 'Clear All Todos'}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;

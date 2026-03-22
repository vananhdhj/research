import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TODOS, ADD_TODO, TOGGLE_TODO, DELETE_TODO } from './graphql/queries';
import './App.css';

interface Todo {
  id: string;
  title: string;
  is_complete: boolean;
}

function App() {
  const [newTodo, setNewTodo] = useState('');
  const { loading, error, data, refetch } = useQuery(GET_TODOS);
  const [addTodo] = useMutation(ADD_TODO, { onCompleted: () => refetch() });
  const [toggleTodo] = useMutation(TOGGLE_TODO, { onCompleted: () => refetch() });
  const [deleteTodo] = useMutation(DELETE_TODO, { onCompleted: () => refetch() });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const todos: Todo[] = data?.todosCollection?.edges.map((edge: any) => edge.node) || [];

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    await addTodo({ variables: { title: newTodo } });
    setNewTodo('');
  };

  const handleToggleTodo = async (id: string, is_complete: boolean) => {
    await toggleTodo({ variables: { id, is_complete: !is_complete } });
  };

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo({ variables: { id } });
  };

  return (
    <div className="todo-container">
      <h1>Todo List (GraphQL + Supabase)</h1>
      
      <form onSubmit={handleAddTodo} className="add-todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add Todo</button>
      </form>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.is_complete ? 'completed' : ''}>
            <span onClick={() => handleToggleTodo(todo.id, todo.is_complete)}>
              {todo.is_complete ? '✅' : '⬜'} {todo.title}
            </span>
            <button onClick={() => handleDeleteTodo(todo.id)} className="delete-btn">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

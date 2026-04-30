import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import App from './App';
import { GET_TODOS, ADD_TODO, TOGGLE_TODO, DELETE_TODO, UPDATE_TODO_TITLE, DELETE_ALL_TODOS } from './graphql/queries';

// Mock Supabase
jest.mock('./lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-123', email: 'test@example.com' } } }, error: null })),
      onAuthStateChange: jest.fn((callback) => {
        callback('SIGNED_IN', { user: { id: 'user-123', email: 'test@example.com' } });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

// Mock window.confirm
window.confirm = jest.fn(() => true);

const mockTodos = [
  { id: '1', title: 'Task 1', is_complete: false, created_at: '2023-01-01', __typename: 'todos' },
  { id: '2', title: 'Task 2', is_complete: true, created_at: '2023-01-02', __typename: 'todos' },
];

const getTodosMock = {
  request: {
    query: GET_TODOS,
    variables: { userId: 'user-123' },
  },
  result: {
    data: {
      todosCollection: {
        edges: mockTodos.map(todo => ({ node: todo, __typename: 'todosEdge' })),
        __typename: 'todosConnection',
      },
    },
  },
};

const mocks = [
  getTodosMock, // Initial load
  getTodosMock, // After Add
  getTodosMock, // After Toggle
  getTodosMock, // After Delete
  getTodosMock, // After Edit
  getTodosMock, // After Clear All
  getTodosMock,
  {
    request: {
      query: ADD_TODO,
      variables: { title: 'New Task' },
    },
    result: {
      data: {
        insertIntotodosCollection: {
          records: [{ id: '3', title: 'New Task', is_complete: false, __typename: 'todos' }],
          __typename: 'todosInsertResponse',
        },
      },
    },
  },
  {
    request: {
      query: TOGGLE_TODO,
      variables: { id: '1', is_complete: true },
    },
    result: {
      data: {
        updatetodosCollection: {
          records: [{ id: '1', is_complete: true, __typename: 'todos' }],
          __typename: 'todosUpdateResponse',
        },
      },
    },
  },
  {
    request: {
      query: DELETE_TODO,
      variables: { id: '1' },
    },
    result: {
      data: {
        deleteFromtodosCollection: {
          records: [{ id: '1', __typename: 'todos' }],
          __typename: 'todosDeleteResponse',
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_TODO_TITLE,
      variables: { id: '1', title: 'Updated Task 1' },
    },
    result: {
      data: {
        updatetodosCollection: {
          records: [{ id: '1', title: 'Updated Task 1', __typename: 'todos' }],
          __typename: 'todosUpdateResponse',
        },
      },
    },
  },
  {
    request: {
      query: DELETE_ALL_TODOS,
    },
    result: {
      data: {
        deleteFromtodosCollection: {
          affectedCount: 2,
          records: mockTodos.map(t => ({ id: t.id, __typename: 'todos' })),
          __typename: 'todosDeleteResponse',
        },
      },
    },
  },
];

describe('Todo App Functions', () => {
  test('handleAddTodo adds a new record to the database', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <App />
      </MockedProvider>
    );

    const input = await screen.findByPlaceholderText(/What needs to be done?/i);
    const addButton = screen.getByText(/Add Todo/i);

    fireEvent.change(input, { target: { value: 'New Task' } });
    fireEvent.click(addButton);

    // Wait for the artificial 200ms delay to pass and mutation to start
    await waitFor(() => {
      expect(screen.getByText(/Adding.../i)).toBeInTheDocument();
    }, { timeout: 1000 });

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  test('handleToggleTodo can toggle between complete and !complete states', async () => {
    const toggleMocks = [
      getTodosMock,
      {
        request: {
          query: TOGGLE_TODO,
          variables: { id: '1', is_complete: true },
        },
        result: {
          data: {
            updatetodosCollection: {
              records: [{ id: '1', is_complete: true, __typename: 'todos' }],
              __typename: 'todosUpdateResponse',
            },
          },
        },
      },
      {
        request: {
          query: GET_TODOS,
          variables: { userId: 'user-123' },
        },
        result: {
          data: {
            todosCollection: {
              edges: [
                { node: { ...mockTodos[0], is_complete: true }, __typename: 'todosEdge' },
                { node: mockTodos[1], __typename: 'todosEdge' },
              ],
              __typename: 'todosConnection',
            },
          },
        },
      }
    ];

    render(
      <MockedProvider mocks={toggleMocks}>
        <App />
      </MockedProvider>
    );

    const todoItems = await screen.findAllByRole('listitem');
    const checkbox = within(todoItems[0]).getByRole('checkbox');

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  test('handleDeleteTodo deletes a record from the database', async () => {
    const deleteMocks = [
      getTodosMock,
      {
        request: {
          query: DELETE_TODO,
          variables: { id: '1' },
        },
        result: {
          data: {
            deleteFromtodosCollection: {
              records: [{ id: '1', __typename: 'todos' }],
              __typename: 'todosDeleteResponse',
            },
          },
        },
      },
      {
        request: {
          query: GET_TODOS,
          variables: { userId: 'user-123' },
        },
        result: {
          data: {
            todosCollection: {
              edges: [{ node: mockTodos[1], __typename: 'todosEdge' }],
              __typename: 'todosConnection',
            },
          },
        },
      }
    ];

    render(
      <MockedProvider mocks={deleteMocks}>
        <App />
      </MockedProvider>
    );

    const todoItems = await screen.findAllByRole('listitem');
    const deleteButton = within(todoItems[0]).getByText(/Delete/i);

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    });
  });

  test('handleEditStart only allows editing when the task is not yet complete', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <App />
      </MockedProvider>
    );

    const todoItems = await screen.findAllByRole('listitem');
    
    // Task 1 is NOT complete
    const editBtn1 = within(todoItems[0]).getByText(/Edit/i);
    expect(editBtn1).not.toBeDisabled();

    // Task 2 IS complete
    const editBtn2 = within(todoItems[1]).getByText(/Edit/i);
    expect(editBtn2).toBeDisabled();
    
    fireEvent.click(editBtn2);
    expect(screen.queryByDisplayValue('Task 2')).not.toBeInTheDocument();
  });

  test('handleEditSave modifies the record in the database', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <App />
      </MockedProvider>
    );

    const todoItems = await screen.findAllByRole('listitem');
    const editBtn = within(todoItems[0]).getByText(/Edit/i);

    fireEvent.click(editBtn);
    const editInput = screen.getByDisplayValue('Task 1');
    
    fireEvent.change(editInput, { target: { value: 'Updated Task 1' } });
    fireEvent.keyDown(editInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Updated Task 1')).not.toBeInTheDocument();
    });
  });

  test('moveTodo changes the position of the task and locks at boundaries', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <App />
      </MockedProvider>
    );

    const todoItems = await screen.findAllByRole('listitem');
    
    const upBtn0 = within(todoItems[0]).getByTitle(/Move Up/i);
    const downBtnEnd = within(todoItems[1]).getByTitle(/Move Down/i);

    expect(upBtn0).toBeDisabled();
    expect(downBtnEnd).toBeDisabled();

    const downBtn0 = within(todoItems[0]).getByTitle(/Move Down/i);
    fireEvent.click(downBtn0);

    const reorderedItems = screen.getAllByRole('listitem');
    expect(within(reorderedItems[0]).getByText('Task 2')).toBeInTheDocument();
    expect(within(reorderedItems[1]).getByText('Task 1')).toBeInTheDocument();
  });

  test('handleDeleteAll deletes all records from the database', async () => {
    const deleteAllMocks = [
      getTodosMock,
      {
        request: {
          query: DELETE_ALL_TODOS,
        },
        result: {
          data: {
            deleteFromtodosCollection: {
              affectedCount: 2,
              records: mockTodos.map(t => ({ id: t.id, __typename: 'todos' })),
              __typename: 'todosDeleteResponse',
            },
          },
        },
      },
      {
        request: {
          query: GET_TODOS,
          variables: { userId: 'user-123' },
        },
        result: {
          data: {
            todosCollection: {
              edges: [],
              __typename: 'todosConnection',
            },
          },
        },
      }
    ];

    render(
      <MockedProvider mocks={deleteAllMocks}>
        <App />
      </MockedProvider>
    );

    const clearAllBtn = await screen.findByText(/Clear All Todos/i);
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
  });
});

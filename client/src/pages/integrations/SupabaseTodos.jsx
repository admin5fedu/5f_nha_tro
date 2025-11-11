import { useEffect, useState } from 'react';
import supabaseClient, { isSupabaseConfigured } from '../../services/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const SupabaseTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTodos = async () => {
      if (!isSupabaseConfigured) {
        setError('Supabase chưa được cấu hình. Vui lòng kiểm tra biến môi trường.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: supabaseError } = await supabaseClient
          .from('todos')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        if (isMounted) {
          setTodos(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Không thể tải dữ liệu từ Supabase');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTodos();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Todos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Đang tải dữ liệu...</p>}
          {error && <p className="text-red-500">Lỗi: {error}</p>}
          {!loading && !error && todos.length === 0 && <p>Không có bản ghi nào trong bảng todos.</p>}
          {!loading && !error && todos.length > 0 && (
            <ul className="list-disc pl-5 space-y-2">
              {todos.map((todo) => (
                <li key={todo.id} className="text-gray-800">
                  <span className="font-semibold">{todo.title || todo.name || 'Todo'}</span>
                  {todo.description && <span className="block text-sm text-gray-500">{todo.description}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseTodos;


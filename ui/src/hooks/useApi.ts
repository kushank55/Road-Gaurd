import { useState, useCallback } from "react";
import { api } from "../services";
import type { ApiError } from "../types";

// Generic async state type
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Hook for basic CRUD operations
export function useApi<T = any>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      apiCall: () => Promise<{ data: T; success: boolean; message?: string }>
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall();
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        return response;
      } catch (err) {
        const apiError = err as ApiError;
        setState({
          data: null,
          loading: false,
          error: apiError.message,
        });
        throw apiError;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook specifically for fetching data
export function useFetch<T = any>(endpoint?: string) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(
    async (url: string = endpoint || "") => {
      if (!url) {
        throw new Error("URL is required for fetch operation");
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await api.get<T>(url);
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        return response;
      } catch (err) {
        const apiError = err as ApiError;
        setState({
          data: null,
          loading: false,
          error: apiError.message,
        });
        throw apiError;
      }
    },
    [endpoint]
  );

  const refetch = useCallback(() => {
    if (endpoint) {
      return fetch(endpoint);
    }
    throw new Error("No endpoint provided for refetch");
  }, [endpoint, fetch]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    fetch,
    refetch,
    reset,
  };
}

// Hook for mutations (POST, PUT, PATCH, DELETE)
export function useMutation<TData = any, TVariables = any>() {
  const [state, setState] = useState<AsyncState<TData>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (
      mutationFn: (
        variables: TVariables
      ) => Promise<{ data: TData; success: boolean; message?: string }>,
      variables: TVariables
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await mutationFn(variables);
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        return response;
      } catch (err) {
        const apiError = err as ApiError;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: apiError.message,
        }));
        throw apiError;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

// Hook for file uploads
export function useFileUpload() {
  const [state, setState] = useState<{
    data: any;
    loading: boolean;
    error: string | null;
    progress: number;
  }>({
    data: null,
    loading: false,
    error: null,
    progress: 0,
  });

  const upload = useCallback(async (endpoint: string, file: File) => {
    setState({
      data: null,
      loading: true,
      error: null,
      progress: 0,
    });

    try {
      const response = await api.upload(endpoint, file, (progress) => {
        setState((prev) => ({ ...prev, progress }));
      });

      setState({
        data: response.data,
        loading: false,
        error: null,
        progress: 100,
      });

      return response;
    } catch (err) {
      const apiError = err as ApiError;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: apiError.message,
        progress: 0,
      }));
      throw apiError;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      progress: 0,
    });
  }, []);

  return {
    ...state,
    upload,
    reset,
  };
}

// Hook for paginated data
export function usePagination<T = any>() {
  const [state, setState] = useState<{
    data: T[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }>({
    data: [],
    loading: false,
    error: null,
    page: 1,
    totalPages: 1,
    hasMore: false,
  });

  const fetchPage = useCallback(
    async (
      endpoint: string,
      page: number = 1,
      limit: number = 10,
      append: boolean = false
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await api.get<{
          data: T[];
          pagination: {
            page: number;
            totalPages: number;
            hasNext: boolean;
          };
        }>(endpoint, { page, limit });

        setState((prev) => ({
          data: append
            ? [...prev.data, ...response.data.data]
            : response.data.data,
          loading: false,
          error: null,
          page: response.data.pagination.page,
          totalPages: response.data.pagination.totalPages,
          hasMore: response.data.pagination.hasNext,
        }));

        return response;
      } catch (err) {
        const apiError = err as ApiError;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: apiError.message,
        }));
        throw apiError;
      }
    },
    []
  );

  const loadMore = useCallback(
    (endpoint: string, limit?: number) => {
      return fetchPage(endpoint, state.page + 1, limit, true);
    },
    [fetchPage, state.page]
  );

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      page: 1,
      totalPages: 1,
      hasMore: false,
    });
  }, []);

  return {
    ...state,
    fetchPage,
    loadMore,
    reset,
  };
}

// Example usage hooks for common patterns
export function useUsers() {
  const { data: users, loading, error, fetch } = useFetch<any[]>("/users");

  const createUser = useMutation<any, { name: string; email: string }>();
  const updateUser = useMutation<
    any,
    { id: string; name?: string; email?: string }
  >();
  const deleteUser = useMutation<void, string>();

  const handleCreate = useCallback(
    async (userData: { name: string; email: string }) => {
      const response = await createUser.mutate(
        (data) => api.post("/users", data),
        userData
      );
      // Refetch users after creation
      await fetch();
      return response;
    },
    [createUser.mutate, fetch]
  );

  const handleUpdate = useCallback(
    async (id: string, userData: { name?: string; email?: string }) => {
      const response = await updateUser.mutate(
        ({ id, ...data }) => api.put(`/users/${id}`, data),
        { id, ...userData }
      );
      // Refetch users after update
      await fetch();
      return response;
    },
    [updateUser.mutate, fetch]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const response = await deleteUser.mutate(
        (userId) => api.delete(`/users/${userId}`),
        id
      );
      // Refetch users after deletion
      await fetch();
      return response;
    },
    [deleteUser.mutate, fetch]
  );

  return {
    users,
    loading:
      loading || createUser.loading || updateUser.loading || deleteUser.loading,
    error: error || createUser.error || updateUser.error || deleteUser.error,
    fetchUsers: fetch,
    createUser: handleCreate,
    updateUser: handleUpdate,
    deleteUser: handleDelete,
    creating: createUser.loading,
    updating: updateUser.loading,
    deleting: deleteUser.loading,
  };
}

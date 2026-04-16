import { useCallback, useEffect, useRef, useState } from 'react';

// Centralised loading/error/data/refetch wrapper. Pass a fetcher that returns
// a promise; useApi handles the state + cancellation on unmount. Pass the
// argument list you want bound in `args`; changing it triggers a refetch.
export default function useApi(fetcher, args = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const mountedRef = useRef(true);

  const run = useCallback(async (...callArgs) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(...(callArgs.length ? callArgs : args));
      if (!mountedRef.current) return null;
      setData(result);
      return result;
    } catch (err) {
      if (!mountedRef.current) return null;
      setError(err);
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, JSON.stringify(args)]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) run();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, immediate]);

  return { data, error, loading, refetch: run, setData };
}

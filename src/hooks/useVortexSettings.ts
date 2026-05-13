import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Read/write a key/value setting from app_vortexcore.vortex_settings via
 * the public RPC wrappers (vortex_get_setting / vortex_set_setting).
 */
export function useVortexSetting<T extends Record<string, any>>(
  key: string,
  defaultValue: T
) {
  const { isAuthenticated, user } = useAuth();
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!isAuthenticated || !user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await (supabase.rpc as any)("vortex_get_setting", {
        p_key: key,
      });
      if (cancel) return;
      if (error) {
        console.error(`vortex_get_setting(${key}) failed`, error);
      } else if (data && Object.keys(data).length > 0) {
        setValue({ ...defaultValue, ...(data as T) });
      }
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isAuthenticated, user?.id]);

  const save = useCallback(
    async (next: T) => {
      setSaving(true);
      try {
        const { error } = await (supabase.rpc as any)("vortex_set_setting", {
          p_key: key,
          p_value: next,
        });
        if (error) throw error;
        setValue(next);
      } finally {
        setSaving(false);
      }
    },
    [key]
  );

  return { value, setValue, save, loading, saving };
}
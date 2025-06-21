import { useEffect } from "react";
import { supabase } from "../supabase";

function useResourcesSubscription(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("resources_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resources",
        },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}

export default useResourcesSubscription;
import { useEffect } from "react";
import { supabase } from "../supabase";

function useUserSubscription(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("user_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user",
        },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}

export default useUserSubscription;
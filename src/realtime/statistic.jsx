import { useEffect } from "react";
import { supabase } from "../supabase";

function useStatisticSubscription(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("statistics_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "statistics_history",
        },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}

export default useStatisticSubscription;
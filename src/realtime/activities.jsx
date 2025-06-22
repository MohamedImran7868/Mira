import { useEffect } from "react";
import { supabase } from "../supabase";

function useActivitiesSubscription(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("activities_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
        },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}

export default useActivitiesSubscription;
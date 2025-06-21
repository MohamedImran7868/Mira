import { useEffect } from "react";
import { supabase } from "../supabase";

function useFeedbackSubscription(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("feedbacks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feedback",
        },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}

export default useFeedbackSubscription;
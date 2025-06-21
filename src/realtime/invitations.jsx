import { useEffect } from "react";
import { supabase } from "../supabase";

export function useInvitationsSubscription(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("invitations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invitations",
        },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}
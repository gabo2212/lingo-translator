import { useEffect, useState } from "react";
import { discoverApi } from "../api/discoverRuntime";
import { GITHUB_CONNECT_RAW } from "../api/connectSource";
import { LAPTOP_OFFLINE_MESSAGE } from "../api/discover";
import { setApiBase } from "../api/client";

export type ApiLink =
  | { phase: "searching" }
  | { phase: "offline"; message: string }
  | { phase: "online"; base: string; hostLabel: string };

function pageProtocol(): "http:" | "https:" {
  return window.location.protocol === "https:" ? "https:" : "http:";
}

export function useConnection(): ApiLink {
  const [link, setLink] = useState<ApiLink>({ phase: "searching" });

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    void discoverApi({
      pageProtocol: pageProtocol(),
      pageHost: window.location.host,
      queryApi: params.get("api"),
      githubRawUrl: GITHUB_CONNECT_RAW,
    })
      .then((choice) => {
        if (cancelled) return;
        if (!choice) {
          setApiBase("");
          setLink({ phase: "offline", message: LAPTOP_OFFLINE_MESSAGE });
          return;
        }
        setApiBase(choice.base);
        setLink({ phase: "online", base: choice.base, hostLabel: choice.hostLabel });
      })
      .catch(() => {
        if (cancelled) return;
        setApiBase("");
        setLink({ phase: "offline", message: LAPTOP_OFFLINE_MESSAGE });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return link;
}

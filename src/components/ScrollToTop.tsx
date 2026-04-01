/**
 * ScrollToTop.tsx
 *
 * Utility component that scrolls the window to the top on every route change.
 * Renders nothing — intended to be mounted once inside the router tree.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Resets scroll position to the top whenever the pathname changes. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RevealOnScroll() {
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add("js-ready");
    const targets = document.querySelectorAll<HTMLElement>(".reveal");
    if (!targets.length) {
      return;
    }
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((el) => {
      el.classList.remove("is-visible");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

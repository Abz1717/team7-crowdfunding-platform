"use client";
import React from "react";
import Link, { LinkProps } from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLoader } from "@/components/loader-context";

export const LinkWithLoader = React.forwardRef<HTMLAnchorElement, React.PropsWithChildren<LinkProps & { className?: string }>>(
  ({ href, children, className, ...props }, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const { showLoader } = useLoader();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      if (props.onClick) props.onClick(e);
      
      if (!e.defaultPrevented && e.button === 0 && // left click
          !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)) {
        let dest = typeof href === "string" ? href : href.pathname;
        if (dest && dest !== pathname) {
          showLoader();
        }
      }
    };

    return (
      <Link
        href={href}
        className={className}
        {...props}
        ref={ref}
        onClick={handleClick}
      >
        {children}
      </Link>
    );
  }
);
LinkWithLoader.displayName = "LinkWithLoader";

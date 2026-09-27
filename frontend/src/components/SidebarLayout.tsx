"use client";
import { useSyncExternalStore, type CSSProperties } from "react";
const STORAGE_KEY="sidebar-collapsed";
function subscribe(callback:()=>void){
  window.addEventListener("storage",callback);
  window.addEventListener("sidebar-toggle",callback);
  return ()=>{window.removeEventListener("storage",callback);window.removeEventListener("sidebar-toggle",callback);};
}
function snapshot(){return localStorage.getItem(STORAGE_KEY)==="true";}
export default function SidebarLayout({children}:{children:React.ReactNode}){
  const collapsed=useSyncExternalStore(subscribe,snapshot,()=>false);
  // CSS owns the breakpoint, including the first server-rendered frame.
  return <div className="flex flex-col min-h-dvh bg-[var(--bg)] text-[var(--text-1)] md:ml-[var(--sidebar-offset)] transition-[margin-left] duration-300 ease-in-out" style={{"--sidebar-offset":collapsed?"60px":"240px"} as CSSProperties}>{children}</div>;
}

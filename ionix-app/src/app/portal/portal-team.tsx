"use client";

import { useState } from "react";

type Member = {
  id: string;
  role_label: string;
  full_name: string;
  title: string;
  bio: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
};

export default function PortalTeam({ members }: { members: Member[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
      {members.map((m) => {
        const expanded = expandedId === m.id;
        return (
          <div
            key={m.id}
            onClick={() => setExpandedId(expanded ? null : m.id)}
            className={`border border-hair bg-paper-2 p-4 flex flex-col items-center text-center cursor-pointer ${
              expanded ? "col-span-2 sm:col-span-3" : ""
            }`}
          >
            {m.photoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={m.photoUrl}
                alt={m.full_name}
                className="w-20 h-20 rounded-full object-cover mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-paper-4 flex items-center justify-center mb-3 font-serif text-xl text-ink-3">
                {m.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-terra-dark mb-1">
              {m.role_label}
            </div>
            <div className="text-sm font-medium">{m.full_name}</div>
            <div className="font-mono text-[10px] text-ink-3 mb-2">{m.title}</div>

            {expanded && (
              <div
                className="text-left w-full border-t border-hair pt-3 mt-1 flex flex-col gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {m.bio && <p className="text-xs text-ink-2 leading-relaxed">{m.bio}</p>}
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="font-mono text-[11px] text-ink-2 hover:text-terra">
                    {m.phone}
                  </a>
                )}
                {m.email && (
                  <a href={`mailto:${m.email}`} className="font-mono text-[11px] text-ink-2 hover:text-terra">
                    {m.email}
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

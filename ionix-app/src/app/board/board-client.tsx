"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import type { Database, TaskStatus } from "@/lib/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "Da fare" },
  { id: "in_progress", label: "In corso" },
  { id: "done", label: "Fatto" },
];

export default function BoardClient({
  projectId,
  initialTasks,
}: {
  projectId: string;
  initialTasks: Task[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function byColumn(status: TaskStatus) {
    return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
  }

  function statusOf(id: string) {
    return tasks.find((t) => t.id === id)?.status;
  }

  async function persist(status: TaskStatus, ordered: Task[]) {
    const renumbered = ordered.map((t, i) => ({ ...t, status, position: i + 1 }));
    setTasks((prev) => {
      const ids = new Set(renumbered.map((t) => t.id));
      return [...prev.filter((t) => !ids.has(t.id)), ...renumbered];
    });
    await Promise.all(
      renumbered.map((t) =>
        supabase.from("tasks").update({ status: t.status, position: t.position }).eq("id", t.id),
      ),
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);
    if (activeTaskId === overId) return;

    const fromStatus = statusOf(activeTaskId);
    if (!fromStatus) return;

    const overIsColumn = COLUMNS.some((c) => c.id === overId);
    const toStatus = overIsColumn ? (overId as TaskStatus) : statusOf(overId);
    if (!toStatus) return;

    if (fromStatus === toStatus) {
      const col = byColumn(fromStatus);
      const oldIndex = col.findIndex((t) => t.id === activeTaskId);
      const newIndex = overIsColumn ? col.length - 1 : col.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;
      persist(fromStatus, arrayMove(col, oldIndex, newIndex));
      return;
    }

    const moved = tasks.find((t) => t.id === activeTaskId);
    if (!moved) return;

    const fromCol = byColumn(fromStatus).filter((t) => t.id !== activeTaskId);
    const toCol = byColumn(toStatus);
    const insertAt = overIsColumn ? toCol.length : toCol.findIndex((t) => t.id === overId);
    const nextToCol = [...toCol];
    nextToCol.splice(insertAt < 0 ? nextToCol.length : insertAt, 0, moved);

    persist(fromStatus, fromCol);
    persist(toStatus, nextToCol);
  }

  async function addTask(status: TaskStatus, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;

    const tempId = `temp-${crypto.randomUUID()}`;
    const position = byColumn(status).length + 1;
    const optimistic: Task = {
      id: tempId,
      project_id: projectId,
      title: trimmed,
      status,
      position,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("tasks")
      .insert({ project_id: projectId, title: trimmed, status, position })
      .select()
      .single();

    if (error || !data) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === tempId ? data : t)));
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      id="ionix-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            tasks={byColumn(col.id)}
            onAdd={(title) => addTask(col.id, title)}
            onDelete={deleteTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCardBody title={activeTask.title} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  id,
  label,
  tasks,
  onAdd,
  onDelete,
}: {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onAdd: (title: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  function submit() {
    onAdd(title);
    setTitle("");
    setAdding(false);
  }

  return (
    <div
      ref={setNodeRef}
      className={`border border-hair bg-paper-2 min-h-[200px] flex flex-col transition-colors ${
        isOver ? "bg-paper-3" : ""
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-hair">
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-2">
          {label}
        </span>
        <span className="font-mono text-[10.5px] text-ink-3">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-3 flex-1">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={() => onDelete(task.id)} />
          ))}
        </div>
      </SortableContext>

      <div className="p-3 pt-0">
        {adding ? (
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") {
                  setAdding(false);
                  setTitle("");
                }
              }}
              placeholder="Titolo attività…"
              className="w-full border border-hair bg-paper px-3 py-2 text-sm outline-none focus:border-terra"
            />
            <div className="flex gap-2">
              <button
                onClick={submit}
                className="font-mono text-[10px] tracking-[0.1em] uppercase bg-ink text-paper px-3 py-2 flex-1"
              >
                Aggiungi
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setTitle("");
                }}
                className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-2 px-3 py-2"
              >
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full font-mono text-[10.5px] tracking-[0.1em] uppercase text-ink-3 hover:text-terra text-left py-2 px-1"
          >
            + Aggiungi attività
          </button>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onDelete }: { task: Task; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="group">
      <TaskCardBody title={task.title} onDelete={onDelete} />
    </div>
  );
}

function TaskCardBody({
  title,
  onDelete,
  dragging,
}: {
  title: string;
  onDelete?: () => void;
  dragging?: boolean;
}) {
  return (
    <div
      className={`bg-paper border border-hair px-3 py-3 text-sm flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing ${
        dragging ? "shadow-lg rotate-1" : ""
      }`}
    >
      <span className="leading-snug">{title}</span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-terra text-xs shrink-0 mt-0.5"
          aria-label="Elimina"
        >
          ✕
        </button>
      )}
    </div>
  );
}

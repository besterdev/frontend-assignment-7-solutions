"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  rectIntersection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  MotionConfig,
} from "motion/react";
import {
  GripVertical,
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Leaf,
  RotateCcw,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTodoBoard } from "@/hooks/use-todo-board";
import { ITEMS, RETURN_DELAY, type Item, type Placement } from "@/lib/todo";

const itemById = new Map(ITEMS.map((item) => [item.id, item]));

const ProduceButton = ({
  item,
  placement,
  onClick,
}: {
  item: Item;
  placement?: Placement;
  onClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({
      id: item.id,
      data: { fromMain: !placement },
    });
  return (
    <motion.li
      ref={setNodeRef}
      className={isDragging ? "produce-row is-dragging" : "produce-row"}
      layout
      layoutId={item.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
    >
      <Button
        variant="outline"
        className="produce-button"
        onClick={onClick}
        aria-label={`${placement ? "Return" : "Sort"} ${item.name}${placement ? " to main list" : ` into ${item.type}`}`}
      >
        <span className="produce-emoji" aria-hidden="true">
          {item.emoji}
        </span>
        <span className="grow text-left">{item.name}</span>
        {placement ? (
          <>
            <ArrowLeft className="return-arrow size-4" />
            <span className="timer-label">
              <Timer className="size-3" /> 5s
            </span>
          </>
        ) : (
          <ArrowUpRight className="item-arrow size-4" />
        )}
        {placement && (
          <motion.span
            aria-hidden="true"
            className="countdown"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{
              duration: RETURN_DELAY / 1000,
              ease: "linear",
            }}
          />
        )}
      </Button>
      <Button
        ref={setActivatorNodeRef}
        variant="ghost"
        size="icon"
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${item.name}`}
      >
        <GripVertical size={16} />
      </Button>
    </motion.li>
  );
};

const DropColumn = ({
  column,
  index,
  children,
}: {
  column: string;
  index: number;
  children: ReactNode;
}) => {
  const { setNodeRef, isOver, active } = useDroppable({ id: column });
  const item = active ? itemById.get(String(active.id)) : undefined;
  const fromMain = active?.data.current?.fromMain;
  const accepts =
    item && (fromMain ? column === item.type : column === "All items");
  return (
    <section
      ref={setNodeRef}
      className={`board-column column-${index}${accepts ? " drop-allowed" : ""}${isOver && accepts ? " drop-over" : ""}`}
      aria-labelledby={`column-${index}`}
    >
      {children}
    </section>
  );
};

export const TodoBoard = () => {
  const { board, sort, returnItem, reset } = useTodoBoard();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const activeItem = activeId ? itemById.get(activeId) : undefined;
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const id = String(active.id);
    const item = itemById.get(id);
    if (over.id === "All items") returnItem(id);
    else if (active.data.current?.fromMain && item?.type === over.id) sort(id);
  };
  return (
    <MotionConfig reducedMotion="user">
      <main className="app-shell">
        <header className="site-header">
          <Link href="/" className="brand">
            <span className="brand-icon">
              <Leaf size={21} />
            </span>{" "}
            freshsort<span className="brand-dot">.</span>
          </Link>
          <span className="header-note">A little order. A fresh start.</span>
          <a
            className="api-link"
            href="/api/departments"
            target="_blank"
            rel="noreferrer"
          >
            Department API <ArrowUpRight size={14} />
          </a>
        </header>
        <section className="intro">
          <div>
            <p className="eyebrow">
              <span /> THE AUTO-RETURN TODO LIST
            </p>
            <h1>
              Sort it. Watch it.
              <br />
              <span>Back in five.</span>
            </h1>
            <p className="intro-copy">
              A place for everything, just for a moment.
              <br />
              Click or drag an item. We’ll take care of the return trip.
            </p>
          </div>
          <div className="intro-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-leaf">✳</span>
            <span className="art-five">
              5<span>s</span>
            </span>
            <span className="art-caption">GOOD THINGS COME BACK</span>
          </div>
        </section>
        <div className="board-toolbar">
          <div className="flex items-center gap-2">
            <span className="status-dot" />
            <span>Ready to sort</span>
            <span className="toolbar-divider">/</span>
            <span className="muted">{ITEMS.length} fresh picks</span>
          </div>
          <Button variant="ghost" onClick={reset} className="reset-button">
            <RotateCcw size={14} /> Reset board
          </Button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={({ active }) => setActiveId(String(active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "To pick up an item, press Space. Use the arrow keys to move to a column, then press Space to drop. Press Escape to cancel. You can also use the item's sort or return button.",
            },
          }}
        >
          <LayoutGroup>
            <div className="board-grid">
              {(["All items", "Fruit", "Vegetable"] as const).map(
                (column, index) => {
                  const placements =
                    column === "All items"
                      ? []
                      : board.sorted.filter(
                          (p) => itemById.get(p.id)?.type === column,
                        );
                  const ids =
                    column === "All items"
                      ? board.available
                      : placements.map((p) => p.id);
                  return (
                    <DropColumn key={column} column={column} index={index}>
                      <div className="column-heading">
                        <div className="flex items-center gap-3">
                          <span className="column-symbol" aria-hidden="true">
                            {["☷", "◒", "❋"][index]}
                          </span>
                          <h2 id={`column-${index}`}>{column}</h2>
                          <span className="column-count">
                            {ids.length.toString().padStart(2, "0")}
                          </span>
                        </div>
                        {index > 0 && (
                          <span className="column-time">
                            <Timer size={12} /> 5 SEC
                          </span>
                        )}
                      </div>
                      <p className="column-description">
                        {index === 0
                          ? "Click an item or drag its handle"
                          : "Click or drag back to return early"}
                      </p>
                      <ul className="item-list">
                        <AnimatePresence initial={false} mode="popLayout">
                          {ids.map((id) => (
                            <ProduceButton
                              key={id}
                              item={itemById.get(id)!}
                              placement={placements.find((p) => p.id === id)}
                              onClick={() =>
                                column === "All items"
                                  ? sort(id)
                                  : returnItem(id)
                              }
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                      {ids.length === 0 && (
                        <div className="empty-state">
                          <span aria-hidden="true">
                            {index === 0 ? "✓" : index === 1 ? "🍐" : "🥬"}
                          </span>
                          <p>
                            {index === 0
                              ? "All sorted. Nicely done."
                              : `Room for ${column.toLowerCase()}.`}
                          </p>
                          <span>
                            {index === 0
                              ? "Your picks will be back soon."
                              : "Choose an item from the main list."}
                          </span>
                        </div>
                      )}
                      {index > 0 && (
                        <div className="column-footer">
                          <ArrowLeft size={13} /> Always returns to the bottom
                          of the list
                        </div>
                      )}
                    </DropColumn>
                  );
                },
              )}
            </div>
          </LayoutGroup>
          <DragOverlay dropAnimation={null}>
            {activeItem ? (
              <div className="produce-button drag-preview">
                <span className="produce-emoji">{activeItem.emoji}</span>
                <span>{activeItem.name}</span>
                <GripVertical size={16} className="ml-auto" />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        <aside className="how-it-works">
          <span className="how-title">A SIMPLE LITTLE LOOP</span>
          <span>
            <b>01</b> Pick an item
          </span>
          <ArrowUpRight size={14} />
          <span>
            <b>02</b> Into its column
          </span>
          <ArrowDown size={14} />
          <span>
            <b>03</b> Back after {RETURN_DELAY / 1000} seconds
          </span>
        </aside>
        <footer className="page-footer">
          <span>Nothing lost. Everything in its place.</span>
          <span>BUILT WITH NEXT.JS · SHADCN/UI · MOTION</span>
        </footer>
        <p role="status" className="sr-only">
          {board.available.length} items in main list. {board.sorted.length}{" "}
          items sorted, returning automatically after five seconds.
        </p>
      </main>
    </MotionConfig>
  );
};

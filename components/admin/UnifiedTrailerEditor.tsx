"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrailerSearchPanel } from "./TrailerSearchPanel";
import { YouTubeManualForm } from "./YouTubeManualForm";
import { TrailerItemCard } from "./TrailerItemCard";
import {
  TRAILER_CATEGORIES,
  type TrailerSectionItem,
  type TrailerCategory,
} from "@/lib/db/trailerSection";

type FilterTab = "All" | TrailerCategory;
const FILTER_TABS: FilterTab[] = ["All", ...TRAILER_CATEGORIES];

type AddTab = "search" | "youtube";

function getTrailerSortableId(item: TrailerSectionItem, index: number) {
  return `${item.mediaType}-${item.tmdbId ?? item.youtubeKey}-${item.category}-${index}`;
}

export function UnifiedTrailerEditor({
  initialItems,
}: {
  initialItems: TrailerSectionItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<TrailerSectionItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("All");
  const [addTab, setAddTab] = useState<AddTab>("search");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredWithGlobalIndex = useMemo(() => {
    if (filterTab === "All") {
      return items.map((item, i) => ({ item, globalIndex: i }));
    }
    return items
      .map((item, i) => ({ item, globalIndex: i }))
      .filter(({ item }) => item.category === filterTab);
  }, [items, filterTab]);

  const sortableIds = useMemo(
    () =>
      filteredWithGlobalIndex.map(({ item, globalIndex }) =>
        getTrailerSortableId(item, globalIndex)
      ),
    [filteredWithGlobalIndex]
  );

  const existingIds = useMemo(
    () =>
      new Set(
        items
          .filter((it) => it.tmdbId !== null)
          .map((it) => `${it.mediaType}-${it.tmdbId}`)
      ),
    [items]
  );

  const handleAdd = useCallback(
    (item: Omit<TrailerSectionItem, "addedAt" | "order">) => {
      setItems((prev) => [
        { ...item, addedAt: new Date().toISOString(), order: 0 },
        ...prev,
      ]);
      toast.success(`Added "${item.title}"`);
    },
    []
  );

  const handleRemove = useCallback((globalIndex: number) => {
    setItems((prev) => prev.filter((_, i) => i !== globalIndex));
  }, []);

  const handleCategoryChange = useCallback(
    (globalIndex: number, category: TrailerCategory) => {
      setItems((prev) =>
        prev.map((item, i) => (i === globalIndex ? { ...item, category } : item))
      );
    },
    []
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldDisplayIndex = sortableIds.indexOf(String(active.id));
    const newDisplayIndex = sortableIds.indexOf(String(over.id));
    if (oldDisplayIndex === -1 || newDisplayIndex === -1) return;

    if (filterTab === "All") {
      setItems((prev) => arrayMove(prev, oldDisplayIndex, newDisplayIndex));
    } else {
      setItems((prev) => {
        const oldGlobal = filteredWithGlobalIndex[oldDisplayIndex].globalIndex;
        const newGlobal = filteredWithGlobalIndex[newDisplayIndex].globalIndex;
        const next = [...prev];
        const [moved] = next.splice(oldGlobal, 1);
        next.splice(newGlobal, 0, moved);
        return next;
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const orderedItems = items.map((item, i) => ({ ...item, order: i }));
      const res = await fetch("/api/admin/trailers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderedItems }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save");
        return;
      }

      toast.success("Trailers saved successfully");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = JSON.stringify(items) !== JSON.stringify(initialItems);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: items.length };
    for (const cat of TRAILER_CATEGORIES) {
      c[cat] = items.filter((it) => it.category === cat).length;
    }
    return c;
  }, [items]);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trailers</h1>
          <p className="text-sm text-gray-500">
            {items.length} {items.length === 1 ? "trailer" : "trailers"} across{" "}
            {TRAILER_CATEGORIES.length} categories &middot; Drag to reorder
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap gap-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filterTab === tab
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {tab}
                  <span className="ml-1 text-[10px] opacity-70">
                    {counts[tab] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredWithGlobalIndex.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">
                {filterTab === "All"
                  ? "No trailers yet. Use the panel on the right to add trailers."
                  : `No trailers in "${filterTab}". Add some from the right panel.`}
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 pl-2 pr-1 font-medium w-16">
                            #
                          </th>
                          <th className="py-2 px-2 font-medium w-24">
                            Preview
                          </th>
                          <th className="py-2 pr-2 font-medium">Title</th>
                          <th className="py-2 px-1 font-medium w-24">
                            Category
                          </th>
                          <th className="py-2 font-medium w-10"></th>
                          <th className="py-2 pr-3 font-medium text-right w-20">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWithGlobalIndex.map(
                          ({ item, globalIndex }, displayIndex) => (
                            <TrailerItemCard
                              key={sortableIds[displayIndex]}
                              sortableId={sortableIds[displayIndex]}
                              item={item}
                              index={displayIndex}
                              onRemove={() => handleRemove(globalIndex)}
                              onCategoryChange={(cat) =>
                                handleCategoryChange(globalIndex, cat)
                              }
                            />
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        <div className="lg:sticky lg:top-6 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex gap-1 rounded-md border p-1">
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                    addTab === "search"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setAddTab("search")}
                >
                  Search TMDB
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                    addTab === "youtube"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setAddTab("youtube")}
                >
                  YouTube URL
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {addTab === "search" ? (
                <TrailerSearchPanel
                  existingIds={existingIds}
                  onAdd={handleAdd}
                />
              ) : (
                <YouTubeManualForm onAdd={handleAdd} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

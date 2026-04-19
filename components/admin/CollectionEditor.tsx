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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TmdbSearchPanel } from "./TmdbSearchPanel";
import { CollectionItemCard } from "./CollectionItemCard";
import type { HomeSectionItem } from "@/lib/db/homeSection";

function getSortableId(item: HomeSectionItem) {
  return `${item.mediaType}-${item.tmdbId}`;
}

export function CollectionEditor({
  slug,
  title,
  initialItems,
  defaultMediaType,
}: {
  slug: string;
  title: string;
  initialItems: HomeSectionItem[];
  defaultMediaType: "movie" | "tv";
}) {
  const router = useRouter();
  const [items, setItems] = useState<HomeSectionItem[]>(initialItems);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortableIds = useMemo(
    () => items.map((item) => getSortableId(item)),
    [items]
  );

  const existingIds = useMemo(
    () => new Set(items.map((it) => `${it.mediaType}-${it.tmdbId}`)),
    [items]
  );

  const handleAdd = useCallback(
    (item: Omit<HomeSectionItem, "addedAt" | "order">) => {
      setItems((prev) => [
        ...prev,
        { ...item, addedAt: new Date().toISOString(), order: prev.length },
      ]);
      toast.success(`Added "${item.title}"`);
    },
    []
  );

  const handleRemove = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = sortableIds.indexOf(String(active.id));
      const newIndex = sortableIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const orderedItems = items.map((item, i) => ({ ...item, order: i }));
      const res = await fetch(`/api/admin/collections/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderedItems }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save");
        return;
      }

      toast.success("Collection saved successfully");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = JSON.stringify(items) !== JSON.stringify(initialItems);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-gray-500">
            {items.length} {items.length === 1 ? "item" : "items"} &middot;
            Drag to reorder
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

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Items &middot; {items.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">
                No items yet. Search and add{" "}
                {defaultMediaType === "tv" ? "TV shows" : "movies"} from the
                panel on the right.
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
                  <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 pl-2 pr-1 font-medium w-16">
                            #
                          </th>
                          <th className="py-2 px-2 font-medium w-14">
                            Poster
                          </th>
                          <th className="py-2 pr-2 font-medium">Title</th>
                          <th className="py-2 pr-3 font-medium text-right w-20">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <CollectionItemCard
                            key={sortableIds[index]}
                            sortableId={sortableIds[index]}
                            item={item}
                            index={index}
                            onRemove={() => handleRemove(index)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Search TMDB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TmdbSearchPanel
                mediaType={defaultMediaType}
                existingIds={existingIds}
                onAdd={handleAdd}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

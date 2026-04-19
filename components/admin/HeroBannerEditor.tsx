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
import { HeroSlideCard } from "./HeroSlideCard";
import { HeroTmdbSearchPanel } from "./HeroTmdbSearchPanel";
import { HeroUploadForm } from "./HeroUploadForm";
import type { HeroSlideItem } from "@/lib/db/heroSection";

type AddTab = "search" | "upload";

function getSortableId(item: HeroSlideItem, index: number) {
  return `${item.source}-${item.tmdbId ?? item.s3Key ?? index}`;
}

export function HeroBannerEditor({
  initialItems,
}: {
  initialItems: HeroSlideItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<HeroSlideItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [addTab, setAddTab] = useState<AddTab>("search");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortableIds = useMemo(
    () => items.map((item, i) => getSortableId(item, i)),
    [items]
  );

  const existingTmdbIds = useMemo(
    () =>
      new Set(
        items.filter((it) => it.tmdbId !== null).map((it) => it.tmdbId!)
      ),
    [items]
  );

  const handleAdd = useCallback(
    (item: Omit<HeroSlideItem, "addedAt" | "order">) => {
      setItems((prev) => [
        ...prev,
        {
          ...item,
          addedAt: new Date().toISOString(),
          order: prev.length,
        },
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
      const res = await fetch("/api/admin/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderedItems }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save");
        return;
      }

      toast.success("Hero banner saved successfully");
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
          <h1 className="text-2xl font-bold">Hero Banner</h1>
          <p className="text-sm text-gray-500">
            {items.length} {items.length === 1 ? "slide" : "slides"} &middot;
            Drag to reorder &middot; Auto-advances every 3.5s on the homepage
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
        {/* Slides list */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {items.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">
                No slides yet. Add from TMDB or upload a custom image.
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
                          <th className="py-2 px-2 font-medium w-40">
                            Preview
                          </th>
                          <th className="py-2 pr-2 font-medium">Title</th>
                          <th className="py-2 px-1 font-medium w-20">
                            Source
                          </th>
                          <th className="py-2 pr-3 font-medium text-right w-20">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <HeroSlideCard
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

        {/* Right panel — sticky */}
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
                    addTab === "upload"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setAddTab("upload")}
                >
                  Upload Image
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {addTab === "search" ? (
                <HeroTmdbSearchPanel
                  existingIds={existingTmdbIds}
                  onAdd={handleAdd}
                />
              ) : (
                <HeroUploadForm onAdd={handleAdd} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

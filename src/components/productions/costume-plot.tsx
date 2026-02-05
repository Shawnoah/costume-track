"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  User,
  Theater,
  Shirt,
  Zap,
  Check,
} from "lucide-react";

interface Character {
  id: string;
  name: string;
  actorName: string | null;
  color: string | null;
  sortOrder: number;
}

interface Scene {
  id: string;
  name: string;
  act: number | null;
  scene: number | null;
  description: string | null;
  sortOrder: number;
}

interface Assignment {
  id: string;
  notes: string | null;
  isQuickChange: boolean;
  changeTimeSeconds: number | null;
  costumeItem: {
    id: string;
    name: string;
    category: { name: string; color: string | null } | null;
    photos: { url: string }[];
  } | null;
}

interface Costume {
  id: string;
  name: string;
  category: { name: string; color: string | null } | null;
  photo: string | null;
}

interface CostumePlotProps {
  production: {
    id: string;
    name: string;
  };
  characters: Character[];
  scenes: Scene[];
  assignments: Record<string, Record<string, Assignment>>;
  availableCostumes: Costume[];
}

export function CostumePlot({
  production,
  characters: initialCharacters,
  scenes: initialScenes,
  assignments: initialAssignments,
  availableCostumes,
}: CostumePlotProps) {
  const router = useRouter();
  const [characters, setCharacters] = useState(initialCharacters);
  const [scenes, setScenes] = useState(initialScenes);
  const [assignments, setAssignments] = useState(initialAssignments);

  // Dialog states
  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [addSceneOpen, setAddSceneOpen] = useState(false);
  const [assignmentDialog, setAssignmentDialog] = useState<{
    characterId: string;
    sceneId: string;
    character: Character;
    scene: Scene;
    existing: Assignment | null;
  } | null>(null);

  // Form states
  const [loading, setLoading] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [actorName, setActorName] = useState("");
  const [sceneName, setSceneName] = useState("");
  const [sceneAct, setSceneAct] = useState("");
  const [sceneNum, setSceneNum] = useState("");
  const [selectedCostumeId, setSelectedCostumeId] = useState<string | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [costumeSearchOpen, setCostumeSearchOpen] = useState(false);

  const refreshData = useCallback(() => {
    router.refresh();
  }, [router]);

  async function handleAddCharacter() {
    if (!characterName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/productions/${production.id}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: characterName,
          actorName: actorName || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to add character");

      const newCharacter = await res.json();
      setCharacters([...characters, newCharacter]);
      setCharacterName("");
      setActorName("");
      setAddCharacterOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCharacter(characterId: string) {
    if (!confirm("Delete this character and all their costume assignments?")) return;

    try {
      const res = await fetch(
        `/api/productions/${production.id}/characters/${characterId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete character");

      setCharacters(characters.filter((c) => c.id !== characterId));
      const newAssignments = { ...assignments };
      delete newAssignments[characterId];
      setAssignments(newAssignments);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAddScene() {
    if (!sceneName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/productions/${production.id}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sceneName,
          act: sceneAct ? parseInt(sceneAct) : null,
          scene: sceneNum ? parseInt(sceneNum) : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to add scene");

      const newScene = await res.json();
      setScenes([...scenes, newScene]);
      setSceneName("");
      setSceneAct("");
      setSceneNum("");
      setAddSceneOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteScene(sceneId: string) {
    if (!confirm("Delete this scene and all costume assignments in it?")) return;

    try {
      const res = await fetch(
        `/api/productions/${production.id}/scenes/${sceneId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete scene");

      setScenes(scenes.filter((s) => s.id !== sceneId));
      // Remove assignments for this scene
      const newAssignments = { ...assignments };
      for (const charId of Object.keys(newAssignments)) {
        delete newAssignments[charId][sceneId];
      }
      setAssignments(newAssignments);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSaveAssignment() {
    if (!assignmentDialog) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/productions/${production.id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: assignmentDialog.characterId,
          sceneId: assignmentDialog.sceneId,
          costumeItemId: selectedCostumeId,
          notes: assignmentNotes || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save assignment");

      refreshData();
      setAssignmentDialog(null);
      setSelectedCostumeId(null);
      setAssignmentNotes("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearAssignment() {
    if (!assignmentDialog) return;

    try {
      const res = await fetch(
        `/api/productions/${production.id}/assignments?characterId=${assignmentDialog.characterId}&sceneId=${assignmentDialog.sceneId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to clear assignment");

      refreshData();
      setAssignmentDialog(null);
      setSelectedCostumeId(null);
      setAssignmentNotes("");
    } catch (error) {
      console.error(error);
    }
  }

  function openAssignmentDialog(character: Character, scene: Scene) {
    const existing = assignments[character.id]?.[scene.id] || null;
    setAssignmentDialog({
      characterId: character.id,
      sceneId: scene.id,
      character,
      scene,
      existing,
    });
    setSelectedCostumeId(existing?.costumeItem?.id || null);
    setAssignmentNotes(existing?.notes || "");
  }

  // Detect quick changes (costume change between consecutive scenes)
  function isQuickChange(characterId: string, sceneIndex: number): boolean {
    if (sceneIndex === 0) return false;

    const currentScene = scenes[sceneIndex];
    const prevScene = scenes[sceneIndex - 1];

    const currentAssignment = assignments[characterId]?.[currentScene.id];
    const prevAssignment = assignments[characterId]?.[prevScene.id];

    return !!(
      currentAssignment?.costumeItem?.id &&
      prevAssignment?.costumeItem?.id &&
      currentAssignment.costumeItem.id !== prevAssignment.costumeItem.id
    );
  }

  const selectedCostume = availableCostumes.find((c) => c.id === selectedCostumeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-zinc-100">
            <Link href={`/productions/${production.id}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">Costume Plot</h1>
            <p className="text-sm text-zinc-400">{production.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddCharacterOpen(true)}
            className="border-zinc-700 text-zinc-300"
          >
            <User className="w-4 h-4 mr-2" />
            Add Character
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddSceneOpen(true)}
            className="border-zinc-700 text-zinc-300"
          >
            <Theater className="w-4 h-4 mr-2" />
            Add Scene
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
          {characters.length} Character{characters.length !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
          {scenes.length} Scene{scenes.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Costume Plot Matrix */}
      {characters.length === 0 || scenes.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
          <Theater className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-zinc-300 mb-1">
            {characters.length === 0 && scenes.length === 0
              ? "Start building your costume plot"
              : characters.length === 0
              ? "Add characters to get started"
              : "Add scenes to get started"}
          </h3>
          <p className="text-zinc-500 mb-4">
            Add characters and scenes to create your costume plot matrix
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-zinc-900 border-b border-r border-zinc-800 p-3 text-left text-zinc-400 font-medium min-w-[180px]">
                  Character
                </th>
                {scenes.map((scene) => (
                  <th
                    key={scene.id}
                    className="border-b border-zinc-800 p-2 text-center text-zinc-400 font-medium min-w-[120px] group"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-zinc-500">
                        {scene.act !== null && scene.scene !== null
                          ? `Act ${scene.act}, Sc ${scene.scene}`
                          : scene.act !== null
                          ? `Act ${scene.act}`
                          : ""}
                      </span>
                      <span className="text-sm">{scene.name}</span>
                      <button
                        onClick={() => handleDeleteScene(scene.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {characters.map((character) => (
                <tr key={character.id} className="group/row">
                  <td className="sticky left-0 z-10 bg-zinc-900 border-r border-b border-zinc-800 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-zinc-200">{character.name}</div>
                        {character.actorName && (
                          <div className="text-xs text-zinc-500">{character.actorName}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCharacter(character.id)}
                        className="opacity-0 group-hover/row:opacity-100 text-red-400 hover:text-red-300 transition-opacity p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  {scenes.map((scene, sceneIndex) => {
                    const assignment = assignments[character.id]?.[scene.id];
                    const quickChange = isQuickChange(character.id, sceneIndex);

                    return (
                      <td
                        key={scene.id}
                        className={`border-b border-zinc-800 p-1 text-center cursor-pointer hover:bg-zinc-800/50 transition-colors ${
                          quickChange ? "bg-orange-950/30" : ""
                        }`}
                        onClick={() => openAssignmentDialog(character, scene)}
                      >
                        {assignment?.costumeItem ? (
                          <div className="flex flex-col items-center gap-1 p-1">
                            {quickChange && (
                              <span title="Quick change">
                                <Zap className="w-3 h-3 text-orange-400" />
                              </span>
                            )}
                            {assignment.costumeItem.photos[0]?.url ? (
                              <div className="relative w-12 h-14 rounded overflow-hidden bg-zinc-800">
                                <Image
                                  src={assignment.costumeItem.photos[0].url}
                                  alt={assignment.costumeItem.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-14 rounded bg-zinc-800 flex items-center justify-center">
                                <Shirt className="w-4 h-4 text-zinc-600" />
                              </div>
                            )}
                            <span className="text-xs text-zinc-400 truncate max-w-[100px]">
                              {assignment.costumeItem.name}
                            </span>
                          </div>
                        ) : (
                          <div className="p-4 text-zinc-700 hover:text-zinc-500">
                            <Plus className="w-4 h-4 mx-auto" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-950/50 rounded" />
          <span>Quick change</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <span>Costume change from previous scene</span>
        </div>
      </div>

      {/* Add Character Dialog */}
      <Dialog open={addCharacterOpen} onOpenChange={setAddCharacterOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add Character</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add a new character to the costume plot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="charName" className="text-zinc-300">Character Name *</Label>
              <Input
                id="charName"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g., Romeo"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actorName" className="text-zinc-300">Actor Name</Label>
              <Input
                id="actorName"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                placeholder="e.g., John Smith"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddCharacterOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCharacter}
              disabled={loading || !characterName.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Character"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Scene Dialog */}
      <Dialog open={addSceneOpen} onOpenChange={setAddSceneOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add Scene</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add a new scene to the costume plot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sceneName" className="text-zinc-300">Scene Name *</Label>
              <Input
                id="sceneName"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="e.g., The Balcony"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actNum" className="text-zinc-300">Act Number</Label>
                <Input
                  id="actNum"
                  type="number"
                  value={sceneAct}
                  onChange={(e) => setSceneAct(e.target.value)}
                  placeholder="1"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sceneNum" className="text-zinc-300">Scene Number</Label>
                <Input
                  id="sceneNum"
                  type="number"
                  value={sceneNum}
                  onChange={(e) => setSceneNum(e.target.value)}
                  placeholder="1"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddSceneOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddScene}
              disabled={loading || !sceneName.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Scene"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={!!assignmentDialog} onOpenChange={() => setAssignmentDialog(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Assign Costume
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {assignmentDialog && (
                <>
                  <span className="text-purple-400">{assignmentDialog.character.name}</span>
                  {" in "}
                  <span className="text-green-400">{assignmentDialog.scene.name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Costume</Label>
              <Popover open={costumeSearchOpen} onOpenChange={setCostumeSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-zinc-800 border-zinc-700 text-zinc-100"
                  >
                    {selectedCostume ? (
                      <div className="flex items-center gap-2">
                        {selectedCostume.photo ? (
                          <div className="relative w-6 h-6 rounded overflow-hidden">
                            <Image
                              src={selectedCostume.photo}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <Shirt className="w-4 h-4 text-zinc-500" />
                        )}
                        <span className="truncate">{selectedCostume.name}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Select costume...</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 bg-zinc-900 border-zinc-800">
                  <Command className="bg-zinc-900">
                    <CommandInput
                      placeholder="Search costumes..."
                      className="bg-zinc-900 text-zinc-100"
                    />
                    <CommandList>
                      <CommandEmpty className="text-zinc-500 py-4 text-center">
                        No costume found
                      </CommandEmpty>
                      <CommandGroup>
                        {availableCostumes.map((costume) => (
                          <CommandItem
                            key={costume.id}
                            value={costume.name}
                            onSelect={() => {
                              setSelectedCostumeId(costume.id);
                              setCostumeSearchOpen(false);
                            }}
                            className="text-zinc-300"
                          >
                            <div className="flex items-center gap-3 w-full">
                              {costume.photo ? (
                                <div className="relative w-8 h-10 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                                  <Image
                                    src={costume.photo}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-10 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                  <Shirt className="w-4 h-4 text-zinc-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="truncate">{costume.name}</div>
                                {costume.category && (
                                  <div className="text-xs text-zinc-500">{costume.category.name}</div>
                                )}
                              </div>
                              {selectedCostumeId === costume.id && (
                                <Check className="w-4 h-4 text-purple-400" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignmentNotes" className="text-zinc-300">Notes</Label>
              <Input
                id="assignmentNotes"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Any notes about this costume in this scene..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {assignmentDialog?.existing && (
              <Button
                variant="outline"
                onClick={handleClearAssignment}
                className="border-red-800 text-red-400 hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => setAssignmentDialog(null)}
                className="border-zinc-700 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAssignment}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

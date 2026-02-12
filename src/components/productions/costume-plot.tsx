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
  Ruler,
  ImageIcon,
  X,
  Upload,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface CharacterSketch {
  id: string;
  url: string;
  key: string;
  name: string | null;
  description: string | null;
  sceneId: string | null;
}

interface Character {
  id: string;
  name: string;
  actorName: string | null;
  color: string | null;
  sortOrder: number;
  // Actor measurements
  height: string | null;
  weight: string | null;
  head: string | null;
  collar: string | null;
  chest: string | null;
  bust: string | null;
  underBust: string | null;
  waist: string | null;
  hip: string | null;
  inseam: string | null;
  outseam: string | null;
  sleeve: string | null;
  shoeSize: string | null;
  // Character sketches
  sketches: CharacterSketch[];
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
  const [measurementsDialog, setMeasurementsDialog] = useState<Character | null>(null);
  const [sketchesDialog, setSketchesDialog] = useState<Character | null>(null);
  const [deleteCharacterConfirmOpen, setDeleteCharacterConfirmOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  const [deleteSceneConfirmOpen, setDeleteSceneConfirmOpen] = useState(false);
  const [sceneToDelete, setSceneToDelete] = useState<string | null>(null);

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

  // Measurements form state
  const [measurements, setMeasurements] = useState({
    height: "",
    weight: "",
    head: "",
    collar: "",
    chest: "",
    bust: "",
    underBust: "",
    waist: "",
    hip: "",
    inseam: "",
    outseam: "",
    sleeve: "",
    shoeSize: "",
  });

  // Sketch upload state
  const [uploadingSketch, setUploadingSketch] = useState(false);
  const [sketchName, setSketchName] = useState("");
  const [sketchDescription, setSketchDescription] = useState("");

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
      setCharacters([...characters, { ...newCharacter, sketches: [] }]);
      setCharacterName("");
      setActorName("");
      setAddCharacterOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteCharacter(characterId: string) {
    setCharacterToDelete(characterId);
    setDeleteCharacterConfirmOpen(true);
  }

  async function confirmDeleteCharacter() {
    if (!characterToDelete) return;

    try {
      const res = await fetch(
        `/api/productions/${production.id}/characters/${characterToDelete}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete character");

      setCharacters(characters.filter((c) => c.id !== characterToDelete));
      const newAssignments = { ...assignments };
      delete newAssignments[characterToDelete];
      setAssignments(newAssignments);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteCharacterConfirmOpen(false);
      setCharacterToDelete(null);
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

  function handleDeleteScene(sceneId: string) {
    setSceneToDelete(sceneId);
    setDeleteSceneConfirmOpen(true);
  }

  async function confirmDeleteScene() {
    if (!sceneToDelete) return;

    try {
      const res = await fetch(
        `/api/productions/${production.id}/scenes/${sceneToDelete}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete scene");

      setScenes(scenes.filter((s) => s.id !== sceneToDelete));
      // Remove assignments for this scene
      const newAssignments = { ...assignments };
      for (const charId of Object.keys(newAssignments)) {
        delete newAssignments[charId][sceneToDelete];
      }
      setAssignments(newAssignments);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteSceneConfirmOpen(false);
      setSceneToDelete(null);
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

  function openMeasurementsDialog(character: Character) {
    setMeasurements({
      height: character.height || "",
      weight: character.weight || "",
      head: character.head || "",
      collar: character.collar || "",
      chest: character.chest || "",
      bust: character.bust || "",
      underBust: character.underBust || "",
      waist: character.waist || "",
      hip: character.hip || "",
      inseam: character.inseam || "",
      outseam: character.outseam || "",
      sleeve: character.sleeve || "",
      shoeSize: character.shoeSize || "",
    });
    setMeasurementsDialog(character);
  }

  async function handleSaveMeasurements() {
    if (!measurementsDialog) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/productions/${production.id}/characters/${measurementsDialog.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            height: measurements.height || null,
            weight: measurements.weight || null,
            head: measurements.head || null,
            collar: measurements.collar || null,
            chest: measurements.chest || null,
            bust: measurements.bust || null,
            underBust: measurements.underBust || null,
            waist: measurements.waist || null,
            hip: measurements.hip || null,
            inseam: measurements.inseam || null,
            outseam: measurements.outseam || null,
            sleeve: measurements.sleeve || null,
            shoeSize: measurements.shoeSize || null,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to save measurements");

      // Update local state
      setCharacters(
        characters.map((c) =>
          c.id === measurementsDialog.id
            ? {
                ...c,
                ...measurements,
                height: measurements.height || null,
                weight: measurements.weight || null,
                head: measurements.head || null,
                collar: measurements.collar || null,
                chest: measurements.chest || null,
                bust: measurements.bust || null,
                underBust: measurements.underBust || null,
                waist: measurements.waist || null,
                hip: measurements.hip || null,
                inseam: measurements.inseam || null,
                outseam: measurements.outseam || null,
                sleeve: measurements.sleeve || null,
                shoeSize: measurements.shoeSize || null,
              }
            : c
        )
      );
      setMeasurementsDialog(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openSketchesDialog(character: Character) {
    setSketchName("");
    setSketchDescription("");
    setSketchesDialog(character);
  }

  async function handleUploadSketch(file: File) {
    if (!sketchesDialog) return;
    setUploadingSketch(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const { url, key } = await uploadRes.json();

      // Save sketch to database
      const res = await fetch(
        `/api/productions/${production.id}/characters/${sketchesDialog.id}/sketches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            key,
            name: sketchName || null,
            description: sketchDescription || null,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to save sketch");

      const newSketch = await res.json();

      // Update local state
      setCharacters(
        characters.map((c) =>
          c.id === sketchesDialog.id
            ? { ...c, sketches: [...c.sketches, newSketch] }
            : c
        )
      );
      setSketchesDialog(
        characters.find((c) => c.id === sketchesDialog.id) || null
      );
      setSketchName("");
      setSketchDescription("");
      refreshData();
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingSketch(false);
    }
  }

  async function handleDeleteSketch(sketchId: string) {
    if (!sketchesDialog) return;

    try {
      const res = await fetch(
        `/api/productions/${production.id}/characters/${sketchesDialog.id}/sketches/${sketchId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete sketch");

      // Update local state
      setCharacters(
        characters.map((c) =>
          c.id === sketchesDialog.id
            ? { ...c, sketches: (c.sketches || []).filter((s) => s.id !== sketchId) }
            : c
        )
      );
      refreshData();
    } catch (error) {
      console.error(error);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await handleUploadSketch(acceptedFiles[0]);
      }
    },
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxFiles: 1,
    disabled: uploadingSketch,
  });

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
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-200">{character.name}</div>
                        {character.actorName && (
                          <div className="text-xs text-zinc-500">{character.actorName}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button
                          onClick={() => openMeasurementsDialog(character)}
                          className="text-zinc-500 hover:text-purple-400 p-1"
                          title="Actor measurements"
                        >
                          <Ruler className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openSketchesDialog(character)}
                          className="text-zinc-500 hover:text-purple-400 p-1 relative"
                          title="Costume sketches"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          {character.sketches?.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full text-[8px] flex items-center justify-center text-white">
                              {character.sketches.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteCharacter(character.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
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

      {/* Measurements Dialog */}
      <Dialog open={!!measurementsDialog} onOpenChange={() => setMeasurementsDialog(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-purple-400" />
              Actor Measurements
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {measurementsDialog && (
                <>
                  Measurements for{" "}
                  <span className="text-purple-400">{measurementsDialog.actorName || measurementsDialog.name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="body" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="upper">Upper Body</TabsTrigger>
              <TabsTrigger value="lower">Lower Body</TabsTrigger>
            </TabsList>

            <TabsContent value="body" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Height</Label>
                  <Input
                    value={measurements.height}
                    onChange={(e) => setMeasurements({ ...measurements, height: e.target.value })}
                    placeholder="e.g., 5ft 10in or 178cm"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Weight</Label>
                  <Input
                    value={measurements.weight}
                    onChange={(e) => setMeasurements({ ...measurements, weight: e.target.value })}
                    placeholder="e.g., 165 lbs or 75kg"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Head Circumference</Label>
                  <Input
                    value={measurements.head}
                    onChange={(e) => setMeasurements({ ...measurements, head: e.target.value })}
                    placeholder="Above ears/brow"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Shoe Size</Label>
                  <Input
                    value={measurements.shoeSize}
                    onChange={(e) => setMeasurements({ ...measurements, shoeSize: e.target.value })}
                    placeholder="e.g., 10 or 42 EU"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upper" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Collar (Neck)</Label>
                  <Input
                    value={measurements.collar}
                    onChange={(e) => setMeasurements({ ...measurements, collar: e.target.value })}
                    placeholder="Neck circumference"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Chest</Label>
                  <Input
                    value={measurements.chest}
                    onChange={(e) => setMeasurements({ ...measurements, chest: e.target.value })}
                    placeholder="At widest part"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Bust</Label>
                  <Input
                    value={measurements.bust}
                    onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value })}
                    placeholder="At fullest part"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Under Bust</Label>
                  <Input
                    value={measurements.underBust}
                    onChange={(e) => setMeasurements({ ...measurements, underBust: e.target.value })}
                    placeholder="Directly beneath bust"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Sleeve</Label>
                  <Input
                    value={measurements.sleeve}
                    onChange={(e) => setMeasurements({ ...measurements, sleeve: e.target.value })}
                    placeholder="Shoulder to wrist"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Waist</Label>
                  <Input
                    value={measurements.waist}
                    onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                    placeholder="Natural waistline"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lower" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Hip</Label>
                  <Input
                    value={measurements.hip}
                    onChange={(e) => setMeasurements({ ...measurements, hip: e.target.value })}
                    placeholder="Fullest part"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Inseam</Label>
                  <Input
                    value={measurements.inseam}
                    onChange={(e) => setMeasurements({ ...measurements, inseam: e.target.value })}
                    placeholder="Inner leg to ankle"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Outseam</Label>
                  <Input
                    value={measurements.outseam}
                    onChange={(e) => setMeasurements({ ...measurements, outseam: e.target.value })}
                    placeholder="Waist to ankle (outer)"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setMeasurementsDialog(null)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMeasurements}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Measurements"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Character Confirm */}
      <ConfirmDialog
        open={deleteCharacterConfirmOpen}
        onOpenChange={setDeleteCharacterConfirmOpen}
        onConfirm={confirmDeleteCharacter}
        title="Delete character?"
        description="This will delete the character and all their costume assignments. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />

      {/* Delete Scene Confirm */}
      <ConfirmDialog
        open={deleteSceneConfirmOpen}
        onOpenChange={setDeleteSceneConfirmOpen}
        onConfirm={confirmDeleteScene}
        title="Delete scene?"
        description="This will delete the scene and all costume assignments in it. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />

      {/* Sketches Dialog */}
      <Dialog open={!!sketchesDialog} onOpenChange={() => setSketchesDialog(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              Costume Sketches
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {sketchesDialog && (
                <>
                  Costume concept sketches for{" "}
                  <span className="text-purple-400">{sketchesDialog.name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Zone */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-zinc-300 text-sm">Sketch Name (optional)</Label>
                  <Input
                    value={sketchName}
                    onChange={(e) => setSketchName(e.target.value)}
                    placeholder="e.g., Ball Gown Concept"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-300 text-sm">Description (optional)</Label>
                  <Input
                    value={sketchDescription}
                    onChange={(e) => setSketchDescription(e.target.value)}
                    placeholder="Designer notes..."
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>

              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-600"}
                  ${uploadingSketch ? "pointer-events-none opacity-50" : ""}
                `}
              >
                <input {...getInputProps()} />
                {uploadingSketch ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    <p className="text-sm text-zinc-400">Uploading sketch...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-zinc-500" />
                    <p className="text-sm text-zinc-400">
                      Drop a sketch image here or click to select
                    </p>
                    <p className="text-xs text-zinc-500">
                      PNG, JPG, or WEBP
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Sketches */}
            {sketchesDialog && sketchesDialog.sketches.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-300">Uploaded Sketches</h4>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                  {sketchesDialog.sketches.map((sketch) => (
                    <div
                      key={sketch.id}
                      className="relative bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 group"
                    >
                      <div className="relative aspect-3/4">
                        <Image
                          src={sketch.url}
                          alt={sketch.name || "Costume sketch"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 bg-zinc-900/80 hover:bg-red-900"
                            onClick={() => handleDeleteSketch(sketch.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {(sketch.name || sketch.description) && (
                        <div className="p-2">
                          {sketch.name && (
                            <p className="text-sm font-medium text-zinc-200 truncate">{sketch.name}</p>
                          )}
                          {sketch.description && (
                            <p className="text-xs text-zinc-500 truncate">{sketch.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sketchesDialog && sketchesDialog.sketches.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No sketches uploaded yet</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSketchesDialog(null)}
              className="border-zinc-700 text-zinc-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

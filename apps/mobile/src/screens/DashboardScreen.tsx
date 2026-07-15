import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles";
import type { DispatchAlert, Pet, Task, TaskSubject } from "../types";

type QuickFilter = "all" | "human" | "pet";
const QUICK_FILTER_STORAGE_KEY = "pawscript.mobile.dashboard.quickFilter";

type Props = {
  pets: Pet[];
  tasks: Task[];
  alerts: DispatchAlert[];
  loadingData: boolean;
  triggeringPetId: string | null;
  onOpenPet: (petId: string) => void;
  onTriggerRandomEvent: (pet: Pet) => void;
  creatingTask: boolean;
  completingTaskId: string | null;
  onCreateTask: (payload: { title: string; subject: TaskSubject; petId?: string }) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
};

export function DashboardScreen({
  pets,
  tasks,
  alerts,
  loadingData,
  triggeringPetId,
  onOpenPet,
  onTriggerRandomEvent,
  creatingTask,
  completingTaskId,
  onCreateTask,
  onCompleteTask,
}: Props) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<TaskSubject>("human");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(QUICK_FILTER_STORAGE_KEY)
      .then((storedValue) => {
        if (!mounted || !storedValue) return;
        if (
          storedValue === "all" ||
          storedValue === "human" ||
          storedValue === "pet"
        ) {
          setQuickFilter(storedValue);
        }
      })
      .catch(() => {
        // Non-blocking: use default filter if storage read fails.
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(QUICK_FILTER_STORAGE_KEY, quickFilter).catch(() => {
      // Non-blocking: keep UI responsive if storage write fails.
    });
  }, [quickFilter]);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const aDue = a.next_due_at ? new Date(a.next_due_at).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.next_due_at ? new Date(b.next_due_at).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      }),
    [tasks]
  );

  const petTaskCount = (petId: string) =>
    tasks.filter((task) => task.subject === "pet" && task.pet_id === petId).length;

  const activePet = pets[0];

  async function handleCreateTask() {
    await onCreateTask({
      title,
      subject,
      petId: subject === "pet" ? selectedPetId ?? undefined : undefined,
    });
    setTitle("");
  }

  function dueLabel(nextDueAt: string | null) {
    if (!nextDueAt) return "No due date";
    const due = new Date(nextDueAt);
    return `Due ${due.toLocaleDateString()} ${due.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  const quickFilteredTasks = useMemo(() => {
    if (quickFilter === "human") return sortedTasks.filter((task) => task.subject === "human");
    if (quickFilter === "pet") return sortedTasks.filter((task) => task.subject === "pet");
    return sortedTasks;
  }, [quickFilter, sortedTasks]);

  const petTaskGroups = useMemo(
    () =>
      pets
        .map((pet) => ({
          pet,
          tasks: sortedTasks.filter((task) => task.subject === "pet" && task.pet_id === pet.id),
        }))
        .filter((group) => group.tasks.length > 0),
    [pets, sortedTasks]
  );

  function renderTaskRow(task: Task) {
    return (
      <View key={task.id} style={styles.petRow}>
        <View>
          <Text style={styles.petName}>
            {task.subject === "human" ? "🧍" : "🐾"} {task.title}
          </Text>
          <Text style={styles.petMeta}>
            {task.subject === "human"
              ? "Human task"
              : `Mission for ${pets.find((pet) => pet.id === task.pet_id)?.name ?? "pet"}`}{" "}
            · {task.category}
          </Text>
          <View style={styles.dueBadge}>
            <Text style={styles.dueBadgeText}>{dueLabel(task.next_due_at)}</Text>
          </View>
        </View>
        <Pressable
          style={[styles.completeButton, completingTaskId === task.id && styles.buttonDisabled]}
          disabled={completingTaskId === task.id}
          onPress={() => onCompleteTask(task.id)}
        >
          <Text style={styles.completeButtonText}>
            {completingTaskId === task.id ? "..." : "Complete"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View style={styles.heroHeader}>
        <Text style={styles.eyebrow}>PawScript</Text>
        <Text style={styles.title}>Active Pets</Text>
        <Text style={styles.subtitle}>
          {activePet
            ? `${activePet.avatar_emoji} ${activePet.name} is active. ${pets.length} pet${pets.length === 1 ? "" : "s"} connected.`
            : "No active pets yet."}
        </Text>
      </View>

      <View style={styles.padCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Active pets</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{pets.length}</Text>
          </View>
        </View>
        {loadingData ? (
          <ActivityIndicator />
        ) : pets.length === 0 ? (
          <Text style={styles.helper}>No pets found yet.</Text>
        ) : (
          pets.map((pet) => (
            <View key={pet.id} style={styles.petRow}>
              <View>
                <Text style={styles.petName}>
                  {pet.avatar_emoji} {pet.name}
                </Text>
                <Text style={styles.helper}>
                  {pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ""} · {petTaskCount(pet.id)} missions
                </Text>
              </View>
              <View style={styles.petButtons}>
                <Pressable style={styles.chipButton} onPress={() => onOpenPet(pet.id)}>
                  <Text style={styles.chipButtonText}>View</Text>
                </Pressable>
                <Pressable
                  style={[styles.chipButton, triggeringPetId === pet.id && styles.buttonDisabled]}
                  disabled={triggeringPetId === pet.id}
                  onPress={() => onTriggerRandomEvent(pet)}
                >
                  <Text style={styles.chipButtonText}>🎲 Event</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.padCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Common Task Pad</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{tasks.length} tasks</Text>
          </View>
        </View>

        <Text style={styles.inputLabel}>New task</Text>
        <TextInput
          placeholder="Add a task or mission"
          placeholderTextColor="#8b8b99"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
        <View style={styles.segmentedRow}>
          <Pressable
            style={[styles.segmentedButton, subject === "human" && styles.segmentedButtonActive]}
            onPress={() => setSubject("human")}
          >
            <Text style={[styles.segmentedText, subject === "human" && styles.segmentedTextActive]}>
              Human task
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentedButton, subject === "pet" && styles.segmentedButtonActive]}
            onPress={() => {
              setSubject("pet");
              if (!selectedPetId && pets[0]) setSelectedPetId(pets[0].id);
            }}
          >
            <Text style={[styles.segmentedText, subject === "pet" && styles.segmentedTextActive]}>
              Pet mission
            </Text>
          </Pressable>
        </View>

        {subject === "pet" ? (
          <View style={styles.segmentedRow}>
            {pets.map((pet) => (
              <Pressable
                key={pet.id}
                style={[
                  styles.segmentedButton,
                  selectedPetId === pet.id && styles.segmentedButtonActive,
                ]}
                onPress={() => setSelectedPetId(pet.id)}
              >
                <Text
                  style={[
                    styles.segmentedText,
                    selectedPetId === pet.id && styles.segmentedTextActive,
                  ]}
                >
                  {pet.avatar_emoji} {pet.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryButton, creatingTask && styles.buttonDisabled]}
          disabled={creatingTask}
          onPress={handleCreateTask}
        >
          <Text style={styles.primaryButtonText}>
            {creatingTask ? "Adding..." : "Add to Common Task Pad"}
          </Text>
        </Pressable>

        <View style={styles.rowBetween}>
          <Text style={styles.inputLabel}>Current tasks</Text>
          <Text style={styles.helper}>
            Human {tasks.filter((task) => task.subject === "human").length} · Pet{" "}
            {tasks.filter((task) => task.subject === "pet").length}
          </Text>
        </View>

        <View style={styles.segmentedRow}>
          <Pressable
            style={[styles.segmentedButton, quickFilter === "all" && styles.segmentedButtonActive]}
            onPress={() => setQuickFilter("all")}
          >
            <Text
              style={[styles.segmentedText, quickFilter === "all" && styles.segmentedTextActive]}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentedButton,
              quickFilter === "human" && styles.segmentedButtonActive,
            ]}
            onPress={() => setQuickFilter("human")}
          >
            <Text
              style={[
                styles.segmentedText,
                quickFilter === "human" && styles.segmentedTextActive,
              ]}
            >
              Human
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentedButton, quickFilter === "pet" && styles.segmentedButtonActive]}
            onPress={() => setQuickFilter("pet")}
          >
            <Text
              style={[styles.segmentedText, quickFilter === "pet" && styles.segmentedTextActive]}
            >
              Pet
            </Text>
          </Pressable>
        </View>

        {quickFilteredTasks.length === 0 ? (
          <Text style={styles.helper}>No tasks yet.</Text>
        ) : quickFilter === "pet" ? (
          petTaskGroups.length === 0 ? (
            <Text style={styles.helper}>No pet missions yet.</Text>
          ) : (
            petTaskGroups.map((group) => (
              <View key={group.pet.id}>
                <View style={styles.rowBetween}>
                  <Text style={styles.inputLabel}>
                    {group.pet.avatar_emoji} {group.pet.name}
                  </Text>
                  <Text style={styles.helper}>{group.tasks.length} missions</Text>
                </View>
                {group.tasks.slice(0, 8).map((task) => renderTaskRow(task))}
              </View>
            ))
          )
        ) : (
          quickFilteredTasks.slice(0, 12).map((task) => renderTaskRow(task))
        )}
      </View>

      <View style={styles.padCard}>
        <Text style={styles.cardTitle}>Recent dispatches</Text>
        {alerts.length === 0 ? (
          <Text style={styles.helper}>No dispatches available.</Text>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.dispatchItem}>
              <Text style={styles.dispatchTitle}>
                {(alert.pet?.avatar_emoji ?? "🐾") + " " + alert.title}
              </Text>
              <Text style={styles.dispatchBody}>{alert.body}</Text>
            </View>
          ))
        )}
      </View>
    </>
  );
}

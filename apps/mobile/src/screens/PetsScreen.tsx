import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import type { Pet, Task } from "../types";

type Props = {
  pets: Pet[];
  tasks: Task[];
  triggeringPetId: string | null;
  onOpenPet: (petId: string) => void;
  onTriggerRandomEvent: (pet: Pet) => void;
};

export function PetsScreen({
  pets,
  tasks,
  triggeringPetId,
  onOpenPet,
  onTriggerRandomEvent,
}: Props) {
  const petTaskCount = (petId: string) =>
    tasks.filter((task) => task.subject === "pet" && task.pet_id === petId).length;

  return (
    <View style={styles.padCard}>
      <Text style={styles.cardTitle}>Pets Directory</Text>
      {pets.length === 0 ? (
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
                <Text style={styles.chipButtonText}>Open</Text>
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
  );
}

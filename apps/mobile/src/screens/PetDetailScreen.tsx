import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import type { DispatchAlert, Pet } from "../types";

type Props = {
  pet: Pet;
  alerts: DispatchAlert[];
  triggeringPetId: string | null;
  onTriggerRandomEvent: (pet: Pet) => void;
  onBack: () => void;
};

export function PetDetailScreen({
  pet,
  alerts,
  triggeringPetId,
  onTriggerRandomEvent,
  onBack,
}: Props) {
  const petAlerts = alerts.filter((alert) => alert.pet_id === pet.id).slice(0, 5);

  return (
    <>
      <View style={styles.heroHeader}>
        <Text style={styles.eyebrow}>Active Pet</Text>
        <Text style={styles.title}>
          {pet.avatar_emoji} {pet.name}
        </Text>
        <Text style={styles.subtitle}>
          {pet.species}
          {pet.breed ? ` · ${pet.breed}` : ""}
        </Text>
      </View>

      <View style={styles.padCard}>
        <Text style={styles.cardTitle}>Pet quick actions</Text>
        <Pressable
          style={[styles.primaryButton, triggeringPetId === pet.id && styles.buttonDisabled]}
          disabled={triggeringPetId === pet.id}
          onPress={() => onTriggerRandomEvent(pet)}
        >
          <Text style={styles.primaryButtonText}>
            {triggeringPetId === pet.id ? "Rolling random event..." : "🎲 Random Event"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.padCard}>
        <Text style={styles.cardTitle}>Latest dispatches</Text>
        {petAlerts.length === 0 ? (
          <Text style={styles.helper}>No dispatches yet for this pet.</Text>
        ) : (
          petAlerts.map((alert) => (
            <View key={alert.id} style={styles.dispatchItem}>
              <Text style={styles.dispatchTitle}>{alert.title}</Text>
              <Text style={styles.dispatchBody}>{alert.body}</Text>
            </View>
          ))
        )}
      </View>

      <Pressable style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </Pressable>
    </>
  );
}

import { Pressable, Text, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { styles } from "../styles";

type Props = {
  session: Session;
  authBusy: boolean;
  onSignOut: () => void;
};

export function AccountScreen({ session, authBusy, onSignOut }: Props) {
  return (
    <View style={styles.padCard}>
      <Text style={styles.cardTitle}>Account</Text>
      <Text style={styles.helper}>Signed in as:</Text>
      <Text style={styles.petName}>{session.user.email ?? "unknown email"}</Text>
      <Text style={styles.helper}>Mobile starter is connected to Supabase auth.</Text>
      <Pressable
        style={[styles.secondaryButton, authBusy && styles.buttonDisabled]}
        disabled={authBusy}
        onPress={onSignOut}
      >
        <Text style={styles.secondaryButtonText}>{authBusy ? "Signing out..." : "Sign out"}</Text>
      </Pressable>
    </View>
  );
}

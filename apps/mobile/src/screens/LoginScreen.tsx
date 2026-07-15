import { Pressable, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { styles } from "../styles";

type Props = {
  email: string;
  password: string;
  authBusy: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: () => void;
};

export function LoginScreen({
  email,
  password,
  authBusy,
  onEmailChange,
  onPasswordChange,
  onSignIn,
}: Props) {
  return (
    <View style={styles.authWrap}>
      <StatusBar style="dark" />
      <Text style={styles.authTitle}>PawScript Mobile</Text>
      <Text style={styles.authSubtitle}>Sign in with your existing account</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#8b8b99"
        style={styles.input}
        value={email}
        onChangeText={onEmailChange}
      />
      <TextInput
        secureTextEntry
        placeholder="Password"
        placeholderTextColor="#8b8b99"
        style={styles.input}
        value={password}
        onChangeText={onPasswordChange}
      />
      <Pressable
        style={[styles.primaryButton, authBusy && styles.buttonDisabled]}
        disabled={authBusy}
        onPress={onSignIn}
      >
        <Text style={styles.primaryButtonText}>{authBusy ? "Signing in..." : "Sign in"}</Text>
      </Pressable>
    </View>
  );
}

import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import type { AppTab } from "../types";

type Props = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

const tabs: { key: AppTab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pets", label: "Pets" },
  { key: "account", label: "Account" },
];

export function TabBar({ activeTab, onChange }: Props) {
  return (
    <View style={styles.tabRow}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tabButton, active && styles.tabButtonActive]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

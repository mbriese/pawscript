import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f7f6ff",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  screenContent: {
    padding: 14,
    gap: 12,
  },
  authWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4a3eb2",
  },
  authSubtitle: {
    color: "#5e5e6e",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d7ff",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  header: {
    borderRadius: 16,
    backgroundColor: "#6a56df",
    padding: 16,
  },
  heroHeader: {
    borderRadius: 20,
    backgroundColor: "#6a56df",
    padding: 16,
    borderWidth: 1,
    borderColor: "#7e71eb",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  subtitle: {
    color: "#e8e3ff",
    marginTop: 2,
  },
  eyebrow: {
    color: "#dfd9ff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  signOutText: {
    marginTop: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  card: {
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ebe9ff",
    padding: 14,
    gap: 10,
  },
  padCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e4ff",
    padding: 14,
    gap: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countPill: {
    backgroundColor: "#efeaff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countPillText: {
    color: "#5b49d6",
    fontWeight: "700",
    fontSize: 12,
  },
  cardTitle: {
    fontWeight: "800",
    color: "#2f2a4f",
  },
  helper: {
    color: "#64607d",
  },
  inputLabel: {
    color: "#4d4970",
    fontSize: 12,
    fontWeight: "700",
  },
  segmentedRow: {
    flexDirection: "row",
    gap: 8,
  },
  segmentedButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#d8d3ff",
    backgroundColor: "#f8f6ff",
  },
  segmentedButtonActive: {
    backgroundColor: "#6a56df",
    borderColor: "#6a56df",
  },
  segmentedText: {
    color: "#4f3fd0",
    fontWeight: "700",
    fontSize: 12,
  },
  segmentedTextActive: {
    color: "#ffffff",
  },
  petRow: {
    borderTopWidth: 1,
    borderTopColor: "#efedff",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  petName: {
    fontWeight: "700",
    color: "#2f2a4f",
  },
  petButtons: {
    flexDirection: "row",
    gap: 8,
  },
  petMeta: {
    color: "#64607d",
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: "#6a56df",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 12,
    borderColor: "#6a56df",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: "#5a46d6",
    fontWeight: "700",
  },
  completeButton: {
    borderRadius: 8,
    backgroundColor: "#f3f0ff",
    borderColor: "#d9d3ff",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completeButtonText: {
    color: "#5a46d6",
    fontWeight: "700",
    fontSize: 12,
  },
  dueBadge: {
    borderRadius: 999,
    backgroundColor: "#f5f4ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dueBadgeText: {
    color: "#5a5674",
    fontSize: 11,
    fontWeight: "600",
  },
  chipButton: {
    borderRadius: 10,
    borderColor: "#d8d3ff",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#f6f4ff",
  },
  chipButtonText: {
    color: "#4f3fd0",
    fontWeight: "700",
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  dispatchItem: {
    borderTopWidth: 1,
    borderTopColor: "#f0eeff",
    paddingTop: 10,
  },
  dispatchTitle: {
    fontWeight: "700",
    color: "#342d60",
    marginBottom: 2,
  },
  dispatchBody: {
    color: "#5f5a7c",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  tabButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9184ea",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#ffffff22",
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
  },
  tabButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  tabButtonTextActive: {
    color: "#4f3fd0",
  },
});

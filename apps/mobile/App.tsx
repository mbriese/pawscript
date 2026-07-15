import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./src/lib/supabase";
import { createRandomEvent } from "./src/lib/random-events";
import { styles } from "./src/styles";
import type { DispatchAlert, DispatchAlertRow, Pet, Task, TaskSubject } from "./src/types";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { PetsScreen } from "./src/screens/PetsScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { PetDetailScreen } from "./src/screens/PetDetailScreen";

type RootStackParamList = {
  MainTabs: undefined;
  PetDetail: { petId: string };
};

type MainTabParamList = {
  Dashboard: undefined;
  Pets: undefined;
  Account: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [triggeringPetId, setTriggeringPetId] = useState<string | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alerts, setAlerts] = useState<DispatchAlert[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setPets([]);
      setTasks([]);
      setAlerts([]);
      setCompletingTaskId(null);
      setCreatingTask(false);
      return;
    }
    void loadDashboard();
  }, [session?.user?.id]);

  async function loadDashboard() {
    if (!session?.user?.id) return;
    setLoadingData(true);
    try {
      const [petsRes, tasksRes, alertsRes] = await Promise.all([
        supabase.from("pets").select("*").order("created_at", { ascending: true }),
        supabase
          .from("tasks")
          .select("id, title, subject, pet_id, category, frequency, next_due_at")
          .order("next_due_at", { ascending: true, nullsFirst: false }),
        supabase
          .from("alerts")
          .select("id, pet_id, kind, severity, title, body, created_at, pet:pets(name, avatar_emoji)")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (petsRes.error) throw petsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (alertsRes.error) throw alertsRes.error;

      const normalizedAlerts = ((alertsRes.data ?? []) as DispatchAlertRow[]).map((item) => ({
        ...item,
        pet: Array.isArray(item.pet) ? (item.pet[0] ?? null) : item.pet,
      }));

      setPets((petsRes.data ?? []) as Pet[]);
      setTasks((tasksRes.data ?? []) as Task[]);
      setAlerts(normalizedAlerts);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard";
      Alert.alert("Load error", message);
    } finally {
      setLoadingData(false);
    }
  }

  async function signIn() {
    if (!email || !password) {
      Alert.alert("Sign in", "Email and password are required.");
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setAuthBusy(false);
    if (error) {
      Alert.alert("Sign in failed", error.message);
      return;
    }
    setPassword("");
  }

  async function signOut() {
    setAuthBusy(true);
    await supabase.auth.signOut();
    setAuthBusy(false);
  }

  async function triggerRandomEventForPet(pet: Pet) {
    if (!session?.user?.id) return;
    setTriggeringPetId(pet.id);
    try {
      const event = createRandomEvent(pet);
      const { error } = await supabase.from("alerts").insert({
        user_id: session.user.id,
        pet_id: pet.id,
        kind: "event",
        severity: event.severity,
        title: event.title,
        body: event.body,
      });
      if (error) throw error;

      Alert.alert("Random event created", `${pet.avatar_emoji} ${pet.name}: ${event.title}`);
      await loadDashboard();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create random event";
      Alert.alert("Random event failed", message);
    } finally {
      setTriggeringPetId(null);
    }
  }

  async function createTask(payload: {
    title: string;
    subject: TaskSubject;
    petId?: string;
  }) {
    if (!session?.user?.id) return;
    const title = payload.title.trim();
    if (!title) {
      Alert.alert("Task title required", "Please enter a task title.");
      return;
    }
    if (payload.subject === "pet" && !payload.petId) {
      Alert.alert("Pet required", "Choose a pet for this mission.");
      return;
    }

    setCreatingTask(true);
    try {
      const category = payload.subject === "human" ? "wellness" : "household";
      const { error } = await supabase.from("tasks").insert({
        user_id: session.user.id,
        title,
        subject: payload.subject,
        pet_id: payload.subject === "pet" ? payload.petId ?? null : null,
        category,
        frequency: "1 day",
        next_due_at: new Date().toISOString(),
      });
      if (error) throw error;
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create task";
      Alert.alert("Create task failed", message);
    } finally {
      setCreatingTask(false);
    }
  }

  async function completeTask(taskId: string) {
    setCompletingTaskId(taskId);
    try {
      const { error } = await supabase.rpc("complete_task", { p_task_id: taskId, p_note: null });
      if (error) throw error;
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not complete task";
      Alert.alert("Complete task failed", message);
    } finally {
      setCompletingTaskId(null);
    }
  }

  if (!authReady) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator />
        <Text style={styles.helper}>Loading session...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoginScreen
          email={email}
          password={password}
          authBusy={authBusy}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSignIn={signIn}
        />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <RootStack.Navigator>
          <RootStack.Screen
            name="MainTabs"
            options={{
              headerShown: false,
            }}
          >
            {({ navigation }) => (
              <MainTabs.Navigator
                screenOptions={{
                  headerStyle: { backgroundColor: "#6a56df" },
                  headerTintColor: "#ffffff",
                  headerTitleStyle: { fontWeight: "700" },
                  tabBarActiveTintColor: "#5b49d6",
                  tabBarInactiveTintColor: "#8d84b9",
                  tabBarStyle: { backgroundColor: "#ffffff" },
                }}
              >
                <MainTabs.Screen name="Dashboard">
                  {() => (
                    <SafeAreaView style={styles.safe}>
                      <ScrollView contentContainerStyle={styles.screenContent}>
                        <DashboardScreen
                          pets={pets}
                          tasks={tasks}
                          alerts={alerts}
                          loadingData={loadingData}
                          triggeringPetId={triggeringPetId}
                          creatingTask={creatingTask}
                          completingTaskId={completingTaskId}
                          onOpenPet={(petId) => navigation.navigate("PetDetail", { petId })}
                          onTriggerRandomEvent={triggerRandomEventForPet}
                          onCreateTask={createTask}
                          onCompleteTask={completeTask}
                        />
                      </ScrollView>
                    </SafeAreaView>
                  )}
                </MainTabs.Screen>
                <MainTabs.Screen name="Pets">
                  {() => (
                    <SafeAreaView style={styles.safe}>
                      <ScrollView contentContainerStyle={styles.screenContent}>
                        <PetsScreen
                          pets={pets}
                          tasks={tasks}
                          triggeringPetId={triggeringPetId}
                          onOpenPet={(petId) => navigation.navigate("PetDetail", { petId })}
                          onTriggerRandomEvent={triggerRandomEventForPet}
                        />
                      </ScrollView>
                    </SafeAreaView>
                  )}
                </MainTabs.Screen>
                <MainTabs.Screen name="Account">
                  {() => (
                    <SafeAreaView style={styles.safe}>
                      <ScrollView contentContainerStyle={styles.screenContent}>
                        <AccountScreen session={session} authBusy={authBusy} onSignOut={signOut} />
                      </ScrollView>
                    </SafeAreaView>
                  )}
                </MainTabs.Screen>
              </MainTabs.Navigator>
            )}
          </RootStack.Screen>
          <RootStack.Screen
            name="PetDetail"
            options={{
              title: "Pet Detail",
              headerStyle: { backgroundColor: "#6a56df" },
              headerTintColor: "#ffffff",
              headerTitleStyle: { fontWeight: "700" },
            }}
          >
            {({ route, navigation }) => {
              const pet = pets.find((candidate) => candidate.id === route.params.petId) ?? null;
              return (
                <SafeAreaView style={styles.safe}>
                  <ScrollView contentContainerStyle={styles.screenContent}>
                    {pet ? (
                      <PetDetailScreen
                        pet={pet}
                        alerts={alerts}
                        triggeringPetId={triggeringPetId}
                        onTriggerRandomEvent={triggerRandomEventForPet}
                        onBack={() => navigation.goBack()}
                      />
                    ) : (
                      <View style={styles.padCard}>
                        <Text style={styles.cardTitle}>Pet not found</Text>
                        <Text style={styles.helper}>
                          This pet may have been removed. Return to Pets and refresh.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </SafeAreaView>
              );
            }}
          </RootStack.Screen>
        </RootStack.Navigator>
      </NavigationContainer>
    </>
  );
}

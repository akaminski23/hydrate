import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderInterval } from '@/store/useHydrateStore';

// Random notification messages
const NOTIFICATION_MESSAGES = [
  { title: "Time to hydrate!", body: "Don't forget to drink water and stay healthy." },
  { title: "Water break!", body: "Stay hydrated, stay healthy." },
  { title: "Drink some water!", body: "Your body needs hydration." },
  { title: "Hydration reminder", body: "Time for a refreshing glass of water." },
];

// Get random notification message
const getRandomMessage = () => {
  const index = Math.floor(Math.random() * NOTIFICATION_MESSAGES.length);
  return NOTIFICATION_MESSAGES[index];
};

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('hydration-reminders', {
      name: 'Hydration Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });
  }

  return true;
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All notifications cancelled');
}

// Schedule hydration reminders
export async function scheduleHydrationReminders(
  startTime: string, // "HH:MM" format
  endTime: string,   // "HH:MM" format
  interval: ReminderInterval
): Promise<void> {
  // GUARD: Validate interval (must be 1-4)
  if (!interval || interval < 1 || interval > 4) {
    console.error('Invalid interval:', interval);
    return;
  }

  // First cancel existing notifications
  await cancelAllNotifications();

  // Request permissions
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('Cannot schedule notifications - no permission');
    return;
  }

  // Parse times
  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);

  // GUARD: Validate parsed hours
  if (isNaN(startHour) || isNaN(endHour)) {
    console.error('Invalid time format:', startTime, endTime);
    return;
  }

  // GUARD: Start must be before or equal to end
  if (startHour > endHour) {
    console.error('Start time must be before end time');
    return;
  }

  // Calculate notification hours with safety limit
  const MAX_NOTIFICATIONS = 24;
  const notificationHours: number[] = [];

  for (let hour = startHour; hour <= endHour && notificationHours.length < MAX_NOTIFICATIONS; hour += interval) {
    notificationHours.push(hour);
  }

  // GUARD: Check if we have any notifications to schedule
  if (notificationHours.length === 0) {
    console.log('No notifications to schedule');
    return;
  }

  // Schedule notifications for each hour
  for (const hour of notificationHours) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to hydrate! 💧",
        body: "Don't forget to drink water and stay healthy",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hour,
        minute: 0,
      },
    });

    console.log(`Scheduled notification for ${hour}:00 - Title: Time to hydrate!`);
  }

  console.log(`Scheduled ${notificationHours.length} daily notifications`);
}

// Get all scheduled notifications (for debugging)
export async function getScheduledNotifications() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  console.log('Scheduled notifications:', notifications);
  return notifications;
}

// Send test notification immediately (for debugging)
export async function sendTestNotification(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('Cannot send test notification - no permission');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to hydrate! 💧",
      body: "Don't forget to drink water and stay healthy",
      sound: true,
    },
    trigger: null, // null = send immediately
  });

  console.log('Test notification sent!');
}

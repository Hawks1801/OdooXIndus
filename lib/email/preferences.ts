import { prisma } from "@/prisma/client";
import { logger } from "@/lib/logger";
import type {
  EmailPreferences,
  EmailNotificationType,
} from "@/types/auth";
import { DEFAULT_EMAIL_PREFERENCES } from "@/types/auth";

export async function getUserEmailPreferences(
  userId: string
): Promise<EmailPreferences> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailPreferences: true },
    });

    if (!user || !user.emailPreferences) {
      return DEFAULT_EMAIL_PREFERENCES;
    }

    try {
      const userPrefs = JSON.parse(user.emailPreferences);
      return {
        ...DEFAULT_EMAIL_PREFERENCES,
        ...userPrefs,
      };
    } catch {
      return DEFAULT_EMAIL_PREFERENCES;
    }
  } catch (error) {
    logger.error("Error getting user email preferences", { userId });
    return DEFAULT_EMAIL_PREFERENCES;
  }
}

export async function updateUserEmailPreferences(
  userId: string,
  preferences: Partial<EmailPreferences>
): Promise<EmailPreferences> {
  try {
    const currentPrefs = await getUserEmailPreferences(userId);
    const updatedPrefs: EmailPreferences = {
      ...currentPrefs,
      ...preferences,
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailPreferences: JSON.stringify(updatedPrefs),
        updatedAt: new Date(),
      },
    });

    return updatedPrefs;
  } catch (error) {
    logger.error("Error updating user email preferences", { userId });
    throw error;
  }
}

export async function isEmailNotificationEnabled(
  userId: string,
  notificationType: EmailNotificationType
): Promise<boolean> {
  const preferences = await getUserEmailPreferences(userId);
  return preferences[notificationType] ?? true;
}

import type { User } from "@supabase/supabase-js";

import type { AuthUser } from "@/types/auth";

const readMetadataString = (
  metadata: Record<string, unknown>,
  keys: string[],
): string | null => {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
};

export const toAuthUser = (user: User): AuthUser => {
  const metadata = user.user_metadata ?? {};
  const name =
    readMetadataString(metadata, ["full_name", "name", "user_name", "preferred_username"]) ??
    user.email ??
    "Developer";

  return {
    avatarUrl: readMetadataString(metadata, ["avatar_url", "picture"]),
    email: user.email ?? null,
    id: user.id,
    name,
  };
};

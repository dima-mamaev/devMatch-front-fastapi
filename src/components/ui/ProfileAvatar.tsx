import Image from "next/image";

type AvatarSize = "sm" | "md" | "lg";

interface ProfileAvatarProps {
  photoUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeConfig: Record<AvatarSize, { container: string; text: string; pixels: number }> = {
  sm: { container: "w-10 h-10", text: "text-sm", pixels: 40 },
  md: { container: "w-12 h-12", text: "text-sm", pixels: 48 },
  lg: { container: "w-14 h-14", text: "text-lg", pixels: 56 },
};

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";
}

export function ProfileAvatar({
  photoUrl,
  firstName,
  lastName,
  size = "md",
  className = "",
}: ProfileAvatarProps) {
  const config = sizeConfig[size];
  const initials = getInitials(firstName, lastName);
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "User";

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={fullName}
        width={config.pixels}
        height={config.pixels}
        className={`${config.container} rounded-full object-cover border-2 border-slate-100 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${config.container} rounded-full bg-indigo-500 flex items-center justify-center border-2 border-slate-100 ${className}`}
    >
      <span className={`${config.text} font-bold text-white`}>{initials}</span>
    </div>
  );
}

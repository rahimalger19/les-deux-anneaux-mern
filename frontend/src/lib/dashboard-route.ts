export function getDashboardRoute(role?: string) {
  if (role === "SUPER_ADMIN") {
    return "/super";
  }

  if (
    role === "RECEPTION" ||
    role === "MANAGER" ||
    role === "COMPTA" ||
    role === "READONLY"
  ) {
    return "/admin";
  }

  return "/espace";
}
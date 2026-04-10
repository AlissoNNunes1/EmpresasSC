export const ROLES = ["ADMIN", "ANALISTA", "VISUALIZADOR"] as const;

export type Role = (typeof ROLES)[number];

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/

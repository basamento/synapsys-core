export function formatFramework(fw) {
  if (fw === "springboot") return "Spring Boot";
  if (fw === "nodejs") return "Node.js";
  if (fw === "python") return "Python";
  return "Unknown";
}

export function formatType(type) {
  return type === "endless" ? "Endless" : "Progressive";
}

export function formatState(state) {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

export function formatActionType(type) {
  const map = { ack: "Ack", create: "Create", heartbeat: "Heartbeat", start: "Start", stop: "Stop" };
  return map[type] || type;
}

export type LearningStatus = "completed" | "current" | "planned";

export type LearningMilestone = {
  id: string;
  label: string;
  status: LearningStatus;
  slug?: string;
};

export const jvmMilestones: LearningMilestone[] = [
  { id: "runtime-model", label: "01 · Runtime model", status: "completed", slug: "android-runtime-from-source-to-art" },
  { id: "runtime-data-areas", label: "02 · Runtime data areas", status: "completed", slug: "jvm-runtime-data-areas" },
  { id: "object-creation", label: "03 · Object creation", status: "completed", slug: "java-object-creation-jvm" },
  { id: "classfile-bytecode", label: "04 · ClassFile / Bytecode", status: "completed", slug: "jvm-class-file-bytecode" },
  { id: "class-loading", label: "05 · Class loading", status: "completed" },
  { id: "gc-memory", label: "06 · GC / Memory", status: "completed", slug: "jvm-gc-memory" },
  { id: "jmm", label: "07 · JMM / happens-before", status: "current", slug: "jmm-basics" },
  { id: "java-concurrency", label: "08 · Java concurrency", status: "planned" },
];

export const androidFoundationMilestones: LearningMilestone[] = [
  { id: "handler-looper", label: "Handler / Looper", status: "planned" },
  { id: "activity-startup", label: "Activity startup", status: "planned" },
  { id: "binder", label: "Binder", status: "planned" },
  { id: "view-window", label: "View / Window", status: "planned" },
  { id: "compose", label: "Compose", status: "planned" },
  { id: "coroutines-flow", label: "Coroutines / Flow", status: "planned" },
];

export const web3Milestones: LearningMilestone[] = [
  { id: "blockchain-overview", label: "01 · Blockchain overview", status: "current" },
  { id: "account-address", label: "02 · Account / Address", status: "planned" },
  { id: "node-rpc", label: "06 · Node / RPC", status: "planned" },
  { id: "token-erc20", label: "07 · Token / ERC-20", status: "planned" },
];

export const walletMilestones: LearningMilestone[] = [
  { id: "key-signing", label: "03 · Private key / Signing", status: "planned" },
  { id: "mnemonic-hd", label: "04 · Mnemonic / HD Wallet", status: "planned" },
  { id: "transaction", label: "05 · Transaction", status: "planned" },
  { id: "android-wallet", label: "08 · Android Wallet practice", status: "planned" },
];

export const securityStatus = {
  label: "PLANNED",
  progress: 0,
} as const;

export function completedCount(items: LearningMilestone[]) {
  return items.filter((item) => item.status === "completed").length;
}

export function progressPercent(items: LearningMilestone[]) {
  if (items.length === 0) return 0;
  return Math.round((completedCount(items) / items.length) * 100);
}

export function currentMilestone(items: LearningMilestone[]) {
  return items.find((item) => item.status === "current");
}

export const primaryTrackMilestones = jvmMilestones;
export const secondaryTrackMilestones = [...web3Milestones, ...walletMilestones];

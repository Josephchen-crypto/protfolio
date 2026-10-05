import { Navigation } from "@/components/Navigation";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";
import { Bot, Boxes, Braces, Database, Smartphone, TerminalSquare } from "lucide-react";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

const tools = [
  { icon: Smartphone, name: "Android Studio", zh: "开发、Profiler、Logcat、Layout Inspector 与 Memory 分析。", en: "Development, Profiler, Logcat, Layout Inspector, and memory analysis.", tag: "ANDROID" },
  { icon: TerminalSquare, name: "JDK / javap", zh: "查看 ClassFile、字节码、常量池与 JVM 工具。", en: "Inspect ClassFile, bytecode, constant pool, and JVM tooling.", tag: "JVM" },
  { icon: Braces, name: "ADB / Perfetto", zh: "设备调试、性能分析与系统行为观察。", en: "Device debugging, performance tracing, and system inspection.", tag: "SYSTEM" },
  { icon: Database, name: "Obsidian", zh: "知识内容源、双链、原子笔记与长期维护。", en: "Knowledge source, backlinks, atomic notes, and long-term maintenance.", tag: "PKM" },
  { icon: Boxes, name: "n8n", zh: "自动化内容整理、工作流与个人生产流程。", en: "Automation for content processing and personal workflows.", tag: "AUTOMATION" },
  { icon: Bot, name: "ChatGPT / Codex / Claude", zh: "解释、代码辅助、模拟面试、知识校验与输出训练。", en: "Explanation, coding, mock interviews, knowledge checks, and output practice.", tag: "AI" },
] as const;

export default async function ToolboxPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = lang as Language;
  const dict = await getDict(language);
  const isZh = lang === "zh";

  return (
    <main className="min-h-screen bg-background">
      <Navigation lang={language} dict={dict} />
      <div className="mk-content-shell">
        <header className="mk-page-heading">
          <p className="mk-eyebrow">// ENGINEERING TOOLBOX</p>
          <h1>{isZh ? "工具箱" : "Toolbox"}</h1>
          <p>
            {isZh
              ? "记录真正进入学习与工程流程的工具。重点不是“收藏了什么”，而是“什么时候该用它”。"
              : "A practical collection of tools that actually enter the learning and engineering workflow."}
          </p>
        </header>

        <section className="mk-tool-grid">
          {tools.map(({ icon: Icon, name, zh, en, tag }) => (
            <article className="mk-tool-card" key={name}>
              <div className="mk-resource-top">
                <span className="mk-domain-icon"><Icon size={18} /></span>
                <span className="mk-resource-type">{tag}</span>
              </div>
              <h2>{name}</h2>
              <p>{isZh ? zh : en}</p>
              <span className="mk-tool-status">{isZh ? "工作流已接入" : "In workflow"}</span>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

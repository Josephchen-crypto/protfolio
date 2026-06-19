import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const fontsDir = path.join(rootDir, "lib/fonts");
const logosDir = path.join(rootDir, "public/logos");
const coversDir = path.join(rootDir, "public/covers");

// Font cache — loaded once, reused across all covers
let fontCache: {
  enRegular: Buffer;
  enBold: Buffer;
  monoRegular: Buffer;
  zhRegular: Buffer;
  zhBold: Buffer;
} | null = null;

function loadFonts() {
  if (fontCache) return fontCache;
  fontCache = {
    enRegular: fs.readFileSync(path.join(fontsDir, "space-grotesk-400.ttf")),
    enBold: fs.readFileSync(path.join(fontsDir, "space-grotesk-700.ttf")),
    monoRegular: fs.readFileSync(path.join(fontsDir, "jetbrains-mono-400.ttf")),
    zhRegular: fs.readFileSync(path.join(fontsDir, "noto-sans-sc-400.ttf")),
    zhBold: fs.readFileSync(path.join(fontsDir, "noto-sans-sc-700.ttf")),
  };
  return fontCache;
}

// Logo cache — loaded once, converted to base64 data URIs
const logoCache: Record<string, string> = {};

function getLogoUri(category: string): string {
  const key = (category || "").toLowerCase();
  if (logoCache[key]) return logoCache[key];

  const logoPath = path.join(logosDir, `${key}.svg`);
  if (fs.existsSync(logoPath)) {
    const svg = fs.readFileSync(logoPath, "utf-8");
    const b64 = Buffer.from(svg).toString("base64");
    logoCache[key] = `data:image/svg+xml;base64,${b64}`;
    return logoCache[key];
  }

  // Fallback to default logo
  const defaultPath = path.join(logosDir, "default.svg");
  if (fs.existsSync(defaultPath)) {
    const svg = fs.readFileSync(defaultPath, "utf-8");
    const b64 = Buffer.from(svg).toString("base64");
    logoCache[key] = `data:image/svg+xml;base64,${b64}`;
    return logoCache[key];
  }

  return "";
}

// Color schemes per tech category
interface ColorScheme {
  primary: string;
  secondary: string;
  light: string;
  dark: string;
  gradient: string;
}

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  android: { primary: "#3DDC84", secondary: "#34d399", light: "#d1fae5", dark: "#065f46", gradient: "180deg, #3DDC84 0%, #10b981 50%, #34d399 100%" },
  kotlin:   { primary: "#7F52FF", secondary: "#c084fc", light: "#ede9fe", dark: "#4c1d95", gradient: "180deg, #7F52FF 0%, #a855f7 50%, #c084fc 100%" },
  react:    { primary: "#61DAFB", secondary: "#22d3ee", light: "#e0f2fe", dark: "#075985", gradient: "180deg, #61DAFB 0%, #06b6d4 50%, #22d3ee 100%" },
  python:   { primary: "#3776AB", secondary: "#60a5fa", light: "#dbeafe", dark: "#1e3a5f", gradient: "180deg, #3776AB 0%, #3b82f6 50%, #60a5fa 100%" },
  essay:    { primary: "#6366f1", secondary: "#22d3ee", light: "#e0e7ff", dark: "#312e81", gradient: "180deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%" },
  default:  { primary: "#6366f1", secondary: "#22d3ee", light: "#e0e7ff", dark: "#312e81", gradient: "180deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%" },
};

function getColorScheme(category: string): ColorScheme {
  const key = (category || "").toLowerCase();
  return COLOR_SCHEMES[key] || COLOR_SCHEMES.essay;
}

export function getColorSchemeFor(category: string): ColorScheme {
  return getColorScheme(category);
}

export interface CoverPost {
  title: string;
  summary: string;
  category: string;
  date: string;
  lang: "en" | "zh";
}

export async function generateCover(post: CoverPost): Promise<Buffer> {
  const [satoriModule, resvgModule] = await Promise.all([
    import("satori"),
    import("@resvg/resvg-js"),
  ]);
  const satori = satoriModule.default;
  const Resvg = resvgModule.Resvg;
  const fonts = loadFonts();
  const colors = getColorScheme(post.category);
  const logoUrl = getLogoUri(post.category);
  const isZh = post.lang === "zh";
  const headingFont = isZh ? "NotoSansSC" : "SpaceGrotesk";
  const bodyFont = isZh ? "NotoSansSC" : "SpaceGrotesk";

  const dateStr = post.date
    ? new Date(post.date).toLocaleDateString(
        isZh ? "zh-CN" : "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      )
    : "";

  const element = {
    type: "div",
    props: {
      style: {
        width: 1200,
        height: 630,
        display: "flex" as const,
        background: "linear-gradient(160deg, #ffffff 0%, #f8fafc 45%, #f1f5f9 100%)",
        position: "relative" as const,
        overflow: "hidden" as const,
        padding: 0,
      },
      children: [
        // Left accent strip
        {
          type: "div",
          props: {
            style: {
              width: 6,
              height: 630,
              background: `linear-gradient(${colors.gradient})`,
            },
          },
        },
        // Decorative circles
        {
          type: "div",
          props: {
            style: {
              position: "absolute" as const,
              top: -120,
              right: -60,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute" as const,
              bottom: -80,
              left: 40,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${colors.primary}10 0%, transparent 70%)`,
            },
          },
        },
        // Main content
        {
          type: "div",
          props: {
            style: {
              display: "flex" as const,
              flexDirection: "column" as const,
              justifyContent: "space-between" as const,
              padding: "60px 72px 60px 88px",
              flex: 1,
              height: 630,
            },
            children: [
              // Top: category + logo
              {
                type: "div",
                props: {
                  style: {
                    display: "flex" as const,
                    justifyContent: "space-between" as const,
                    alignItems: "center" as const,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 13,
                          fontFamily: "JetBrainsMono",
                          fontWeight: 500,
                          color: colors.primary,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase" as const,
                        },
                        children: `~/ ${post.category}`,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex" as const, opacity: 0.55 },
                        children: logoUrl
                          ? [{ type: "img" as const, props: { src: logoUrl, width: 64, height: 64 } }]
                          : [],
                      },
                    },
                  ],
                },
              },
              // Center: title + accent bar + summary
              {
                type: "div",
                props: {
                  style: {
                    display: "flex" as const,
                    flexDirection: "column" as const,
                    gap: 28,
                    maxWidth: 840,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex" as const,
                          flexDirection: "column" as const,
                          gap: 20,
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                width: 56,
                                height: 4,
                                borderRadius: 2,
                                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                              },
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: isZh ? 52 : 56,
                                fontFamily: headingFont,
                                fontWeight: 700,
                                color: "#0f172a",
                                lineHeight: 1.1,
                                letterSpacing: isZh ? "0.01em" : "-0.025em",
                              },
                              children: post.title,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: isZh ? 24 : 22,
                          fontFamily: bodyFont,
                          fontWeight: 400,
                          color: "#64748b",
                          lineHeight: 1.6,
                          letterSpacing: "0.01em",
                        },
                        children: post.summary,
                      },
                    },
                  ],
                },
              },
              // Bottom: divider + meta
              {
                type: "div",
                props: {
                  style: {
                    display: "flex" as const,
                    flexDirection: "column" as const,
                    gap: 16,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { width: 48, height: 1, background: "#cbd5e1" },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex" as const,
                          justifyContent: "space-between" as const,
                          alignItems: "flex-end" as const,
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: 14,
                                fontFamily: "JetBrainsMono",
                                color: "#94a3b8",
                                fontWeight: 400,
                                letterSpacing: "0.04em",
                              },
                              children: dateStr,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: 14,
                                fontFamily: "JetBrainsMono",
                                color: "#1e293b",
                                fontWeight: 500,
                                letterSpacing: "0.16em",
                              },
                              children: "<JOSEPH CHEN />",
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };

  const satoriFonts = isZh
    ? [
        { name: "NotoSansSC", data: fonts.zhRegular, weight: 400 as const },
        { name: "NotoSansSC", data: fonts.zhBold, weight: 700 as const },
        { name: "JetBrainsMono", data: fonts.monoRegular, weight: 400 as const },
      ]
    : [
        { name: "SpaceGrotesk", data: fonts.enRegular, weight: 400 as const },
        { name: "SpaceGrotesk", data: fonts.enBold, weight: 700 as const },
        { name: "JetBrainsMono", data: fonts.monoRegular, weight: 400 as const },
      ];

  const svg = await satori(element as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: satoriFonts,
  });

  const resvg = new Resvg(svg);
  return resvg.render().asPng();
}

export async function ensureCoverDir(): Promise<void> {
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }
}

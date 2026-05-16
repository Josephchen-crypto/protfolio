"use client";

import { useState } from "react";
import { SectionTitle } from "./ui/SectionTitle";
import { Button } from "./ui/Button";
import { Mail, Github, Linkedin, Copy, Check } from "lucide-react";

export function Contact({
  title,
  email,
  github,
  linkedin,
  copied,
  description,
  cta,
  copyright,
}: {
  title: string;
  email: string;
  github: string;
  linkedin: string;
  copied: string;
  description: string;
  cta: string;
  copyright: string;
}) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  return (
    <section id="contact" className="py-24 px-6 bg-surface/50">
      <div className="max-w-2xl mx-auto text-center">
        <SectionTitle title={title} className="mb-12" />

        <div className="relative bg-surface border border-border rounded-2xl p-8 md:p-12 overflow-hidden">
          {/* Gradient corner accents */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neon-purple/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="text-slate-400 mb-8 text-lg">
              {description}
              <br />
              {cta}
            </p>

            <Button
              size="lg"
              variant="primary"
              onClick={copyEmail}
              className="mb-8 min-w-[200px]"
            >
              {copiedEmail ? (
                <>
                  <Check size={18} />
                  {copied}
                </>
              ) : (
                <>
                  <Copy size={18} />
                  {email}
                </>
              )}
            </Button>

            <div className="flex justify-center gap-6">
              <a
                href={`https://github.com/${github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-border rounded-full hover:bg-primary/20 hover:text-primary hover:shadow-md hover:shadow-primary/10 transition-all duration-300"
                aria-label="GitHub"
              >
                <Github size={24} />
              </a>
              <a
                href={`https://linkedin.com/in/${linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-border rounded-full hover:bg-primary/20 hover:text-primary hover:shadow-md hover:shadow-primary/10 transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin size={24} />
              </a>
              <a
                href={`mailto:${email}`}
                className="p-3 bg-border rounded-full hover:bg-primary/20 hover:text-primary hover:shadow-md hover:shadow-primary/10 transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={24} />
              </a>
            </div>
          </div>
        </div>

        <p className="text-slate-600 text-sm mt-8">
          &copy; {new Date().getFullYear()} Chen Deji. {copyright}
        </p>
      </div>
    </section>
  );
}

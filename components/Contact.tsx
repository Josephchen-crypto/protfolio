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
}: {
  title: string;
  email: string;
  github: string;
  linkedin: string;
  copied: string;
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

        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12">
          <p className="text-slate-400 mb-8 text-lg">
            Always open to new opportunities and collaborations.
            <br />
            Feel free to reach out!
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
              className="p-3 bg-border rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github size={24} />
            </a>
            <a
              href={`https://linkedin.com/in/${linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-border rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={24} />
            </a>
            <a
              href={`mailto:${email}`}
              className="p-3 bg-border rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
              aria-label="Email"
            >
              <Mail size={24} />
            </a>
          </div>
        </div>

        <p className="text-slate-600 text-sm mt-8">
          &copy; {new Date().getFullYear()} Chen Deji. All rights reserved.
        </p>
      </div>
    </section>
  );
}

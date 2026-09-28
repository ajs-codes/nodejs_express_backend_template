import Handlebars from 'handlebars';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MailTemplateDataMap, MailTemplateName } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, 'templates');

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

async function loadTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
  const cached = templateCache.get(name);
  if (cached) {
    return cached;
  }

  const filePath = join(templatesDir, `${name}.hbs`);
  const source = await readFile(filePath, 'utf-8');
  const compiled = Handlebars.compile(source);
  templateCache.set(name, compiled);
  return compiled;
}

export async function renderMailTemplate<T extends MailTemplateName>(
  template: T,
  data: MailTemplateDataMap[T],
): Promise<{ html: string; text: string }> {
  const compiled = await loadTemplate(template);
  const html = compiled(data);
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { html, text };
}

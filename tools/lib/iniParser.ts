export interface IniSection {
  keys: Record<string, string[]>;
  bare: string[];
}
export interface IniFile {
  sections: Record<string, IniSection>;
}

export function parseIni(content: string): IniFile {
  const file: IniFile = { sections: {} };
  let current = '';

  const ensure = (name: string): IniSection => {
    if (!file.sections[name]) file.sections[name] = { keys: {}, bare: [] };
    return file.sections[name];
  };

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      current = line.slice(1, -1).trim();
      ensure(current);
      continue;
    }

    const section = ensure(current);
    const eq = line.indexOf('=');
    if (eq === -1) {
      section.bare.push(line);
    } else {
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      (section.keys[key] ||= []).push(value);
    }
  }
  return file;
}

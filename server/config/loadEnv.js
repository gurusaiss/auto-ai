import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export function loadEnv(baseDir) {
  const candidates = [
    join(baseDir, '.env'),
    join(baseDir, 'server', '.env')
  ];

  candidates.forEach((filePath) => {
    if (existsSync(filePath)) {
      parseEnvFile(filePath);
    }
  });
}

import { NextResponse } from 'next/server';
import { homedir } from 'os';
import { join } from 'path';
import fs from 'fs/promises';

const HOME = homedir();
const ENV_LOCAL_PATH = join(process.cwd(), '.env.local');

interface SetupStatus {
  configured: boolean;
  openclawHome: string;
  configExists: boolean;
  version?: string;
  agentCount?: number;
  channelCount?: number;
  pluginCount?: number;
}

async function validateOpenClawPath(dirPath: string): Promise<SetupStatus> {
  const configPath = join(dirPath, 'openclaw.json');
  const result: SetupStatus = {
    configured: false,
    openclawHome: dirPath,
    configExists: false,
  };

  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(raw);
    result.configExists = true;
    result.configured = true;
    result.version = config?.meta?.lastTouchedVersion || 'unknown';
    result.agentCount = (config?.agents?.list || []).length;
    result.channelCount = Object.keys(config?.channels || {}).length;
    result.pluginCount = Object.keys(config?.plugins?.entries || {}).length;
  } catch {
    // Config doesn't exist or is invalid
  }

  return result;
}

export async function GET() {
  // Check if already configured via env
  const envHome = process.env.OPENCLAW_HOME;
  if (envHome) {
    const status = await validateOpenClawPath(envHome);
    return NextResponse.json(status);
  }

  // Check default path
  const defaultPath = join(HOME, '.openclaw');
  const status = await validateOpenClawPath(defaultPath);
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'detect') {
      // Auto-detect OpenClaw installation
      const candidates = [
        join(HOME, '.openclaw'),
        join(HOME, '.config', 'openclaw'),
        join(HOME, '.openclaw-dev'),
      ];

      const results: SetupStatus[] = [];
      for (const candidate of candidates) {
        const status = await validateOpenClawPath(candidate);
        if (status.configExists) {
          results.push(status);
        }
      }

      return NextResponse.json({ installations: results });
    }

    // Save configuration
    const body = await req.json();
    const { openclawHome } = body;

    if (!openclawHome) {
      return NextResponse.json({ error: 'openclawHome is required' }, { status: 400 });
    }

    // Validate the path
    const status = await validateOpenClawPath(openclawHome);
    if (!status.configExists) {
      return NextResponse.json({
        error: `openclaw.json not found at ${openclawHome}. Please verify the path.`,
      }, { status: 400 });
    }

    // Write to .env.local
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_LOCAL_PATH, 'utf-8');
    } catch { /* file doesn't exist yet */ }

    // Update or add OPENCLAW_HOME
    if (envContent.includes('OPENCLAW_HOME=')) {
      envContent = envContent.replace(/OPENCLAW_HOME=.*/g, `OPENCLAW_HOME=${openclawHome}`);
    } else {
      envContent = `OPENCLAW_HOME=${openclawHome}\n${envContent}`;
    }

    await fs.writeFile(ENV_LOCAL_PATH, envContent.trim() + '\n', 'utf-8');

    return NextResponse.json({
      ok: true,
      message: 'Configuration saved. Restart the dev server for changes to take effect.',
      status,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * /api/skills/scan — Hermes skill security scanner
 * Replaces: static filesystem regex scan → hermes/skills.scanSkill
 */
import { NextResponse } from 'next/server';
import { skills } from '@/lib/hermes';

export async function GET() {
  try {
    const allSkills = await skills.list();

    const scanResults = await Promise.allSettled(
      allSkills.map(skill => skills.scan(skill.id))
    );

    const results = scanResults.map((result, i) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        skillId: allSkills[i].id,
        riskLevel: 'low' as const,
        warnings: [`Scan failed: ${(result.reason as Error).message}`],
        dataAccess: [],
        externalCalls: [],
        writePermissions: [],
        scannedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      scanResults: results,
      summary: {
        total: results.length,
        critical: results.filter(r => r.riskLevel === 'critical').length,
        high: results.filter(r => r.riskLevel === 'high').length,
        medium: results.filter(r => r.riskLevel === 'medium').length,
        low: results.filter(r => r.riskLevel === 'low').length,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}

export async function POST(req: Request) {
  try {
    const { skillId } = await req.json();
    if (!skillId) {
      return NextResponse.json({ error: 'skillId is required' }, { status: 400 });
    }

    const result = await skills.scan(skillId);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

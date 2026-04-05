'use client';

import { useState, useEffect } from 'react';
import { Hammer, Zap, Code, ShieldCheck, GitCommit, CheckCircle2, Clock, Terminal } from 'lucide-react';
import { FoundryPattern } from '@/lib/types';

export default function ForgePage() {
  const [patterns, setPatterns] = useState<FoundryPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<FoundryPattern | null>(null);
  const [deploying, setDeploying] = useState(false);

  const fetchPatterns = () => {
    setLoading(true);
    fetch('/api/foundry/patterns')
      .then(r => r.json())
      .then(d => { setPatterns(d.patterns || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const handleDeploy = async () => {
    if (!selectedPattern) return;
    setDeploying(true);
    
    try {
      const res = await fetch('/api/foundry/crystallize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternId: selectedPattern.id,
          name: selectedPattern.name,
          description: selectedPattern.description,
          code: selectedPattern.proposedCode
        }),
      });
      
      if (res.ok) {
        alert('Tool Deploy Successful! The new skill has been crystallized.');
        // Remove deployed pattern
        setPatterns(patterns.filter(p => p.id !== selectedPattern.id));
        setSelectedPattern(null);
      } else {
        const error = await res.json();
        alert('Failed to deploy: ' + error.error);
      }
    } catch (err) {
      alert('Network error during deployment.');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="page-enter" style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Hammer size={24} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              The Forge
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
            OpenClaw Foundry: Review discovered workflow patterns and crystallize them into deployed tools.
          </p>
        </div>
        <button
          onClick={fetchPatterns}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px',
            cursor: 'pointer', transition: 'all var(--transition-fast)',
          }}
        >
          <Zap size={14} className={loading ? 'animate-spin' : ''} />
          Scan Workflows
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '24px', overflow: 'hidden' }}>
        
        {/* Left: Discovered Patterns List */}
        <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Discovered Patterns</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{patterns.length} Pending</div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>Analyzing Memory...</div>
          ) : patterns.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
              No mature workflow patterns detected.
            </div>
          ) : (
            patterns.map(pattern => (
              <div
                key={pattern.id}
                onClick={() => setSelectedPattern(pattern)}
                className="glass-card element-hover"
                style={{
                  padding: '16px', cursor: 'pointer',
                  border: selectedPattern?.id === pattern.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: selectedPattern?.id === pattern.id ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{pattern.name}</div>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>
                    {(pattern.successRate * 100).toFixed(0)}% Match
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {pattern.description}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <GitCommit size={14} /> {pattern.frequency} times
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> {pattern.averageDuration}ms avg
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: The Anvil (Crystallization Workspace) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedPattern ? (
            <div className="glass-card-static" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0' }}>
              
              {/* Header */}
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Crystallize Tool: {selectedPattern.name}</h2>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>This generated tool collapses {selectedPattern.toolsUsed.length} manual tool calls into a single action.</div>
                  </div>
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
                      background: 'var(--accent-primary)', border: 'none',
                      borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '14px', fontWeight: 600,
                      cursor: 'pointer', opacity: deploying ? 0.7 : 1, transition: 'background var(--transition-fast)',
                    }}
                  >
                    <ShieldCheck size={16} />
                    {deploying ? 'Deploying...' : 'Approve & Deploy Tool'}
                  </button>
                </div>
              </div>

              {/* Data Pane */}
              <div style={{ display: 'flex', gap: '24px', padding: '24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-body)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Example User Goal</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    "{selectedPattern.exampleGoal}"
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Detected Tool Sequence</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedPattern.toolsUsed.map((tool, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'var(--accent-subtle)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)' }}>
                          {tool}
                        </span>
                        {idx < selectedPattern.toolsUsed.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Code Preview */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Terminal size={14} color="var(--text-secondary)" />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Generated Logic preview (index.js)</div>
                </div>
                
                <div style={{
                  flex: 1, background: '#1e1e1e', borderRadius: 'var(--radius-md)', padding: '16px',
                  overflowY: 'auto', border: '1px solid var(--border-default)', color: '#d4d4d4', 
                  fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedPattern.proposedCode}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card-static" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', gap: '16px' }}>
              <Code size={48} opacity={0.2} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>No Pattern Selected</div>
                <div style={{ fontSize: '14px', maxWidth: '300px', lineHeight: 1.5 }}>Select an observed workflow pattern from the left to review its crystallized code.</div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

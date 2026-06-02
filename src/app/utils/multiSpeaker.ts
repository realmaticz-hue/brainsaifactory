// Multi-speaker script management

import { CustomAvatar } from './avatarGenerator';
import { VoiceProfile } from './voiceLibrary';

export interface ScriptSegment {
  id: string;
  text: string;
  startTime: number; // seconds
  endTime: number;
  speaker: {
    type: 'avatar' | 'voice';
    avatarId?: string;
    avatar?: CustomAvatar;
    voiceId?: string;
    voice?: VoiceProfile;
  };
  pauseAfter?: number; // milliseconds
  phoneticOverrides?: Array<{
    original: string;
    phonetic: string;
  }>;
}

export interface MultiSpeakerScript {
  id: string;
  name: string;
  segments: ScriptSegment[];
  totalDuration: number;
  createdAt: Date;
  lastModified: Date;
}

export class MultiSpeakerManager {
  private scripts: Map<string, MultiSpeakerScript> = new Map();

  constructor() {
    this.loadScripts();
  }

  createScript(name: string): MultiSpeakerScript {
    const script: MultiSpeakerScript = {
      id: `script-${Date.now()}`,
      name,
      segments: [],
      totalDuration: 0,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.scripts.set(script.id, script);
    this.saveScripts();
    return script;
  }

  addSegment(
    scriptId: string,
    text: string,
    speaker: ScriptSegment['speaker'],
    pauseAfter: number = 0
  ): ScriptSegment | null {
    const script = this.scripts.get(scriptId);
    if (!script) return null;

    const lastSegment = script.segments[script.segments.length - 1];
    const startTime = lastSegment ? lastSegment.endTime : 0;
    
    // Estimate duration based on text length (avg 150 words per minute)
    const wordCount = text.split(' ').length;
    const estimatedDuration = (wordCount / 150) * 60;
    const endTime = startTime + estimatedDuration;

    const segment: ScriptSegment = {
      id: `segment-${Date.now()}`,
      text,
      startTime,
      endTime,
      speaker,
      pauseAfter,
      phoneticOverrides: []
    };

    script.segments.push(segment);
    script.totalDuration = endTime + (pauseAfter / 1000);
    script.lastModified = new Date();

    this.saveScripts();
    return segment;
  }

  updateSegment(
    scriptId: string,
    segmentId: string,
    updates: Partial<ScriptSegment>
  ): void {
    const script = this.scripts.get(scriptId);
    if (!script) return;

    const segmentIndex = script.segments.findIndex(s => s.id === segmentId);
    if (segmentIndex < 0) return;

    script.segments[segmentIndex] = {
      ...script.segments[segmentIndex],
      ...updates
    };

    // Recalculate timings
    this.recalculateTimings(scriptId);
    script.lastModified = new Date();
    this.saveScripts();
  }

  removeSegment(scriptId: string, segmentId: string): void {
    const script = this.scripts.get(scriptId);
    if (!script) return;

    script.segments = script.segments.filter(s => s.id !== segmentId);
    this.recalculateTimings(scriptId);
    script.lastModified = new Date();
    this.saveScripts();
  }

  reorderSegments(scriptId: string, newOrder: string[]): void {
    const script = this.scripts.get(scriptId);
    if (!script) return;

    const reordered = newOrder
      .map(id => script.segments.find(s => s.id === id))
      .filter(Boolean) as ScriptSegment[];

    script.segments = reordered;
    this.recalculateTimings(scriptId);
    script.lastModified = new Date();
    this.saveScripts();
  }

  addPhoneticOverride(
    scriptId: string,
    segmentId: string,
    original: string,
    phonetic: string
  ): void {
    const script = this.scripts.get(scriptId);
    if (!script) return;

    const segment = script.segments.find(s => s.id === segmentId);
    if (!segment) return;

    if (!segment.phoneticOverrides) {
      segment.phoneticOverrides = [];
    }

    segment.phoneticOverrides.push({ original, phonetic });
    script.lastModified = new Date();
    this.saveScripts();
  }

  getProcessedText(segment: ScriptSegment): string {
    let text = segment.text;

    if (segment.phoneticOverrides) {
      segment.phoneticOverrides.forEach(override => {
        text = text.replace(
          new RegExp(override.original, 'g'),
          override.phonetic
        );
      });
    }

    return text;
  }

  private recalculateTimings(scriptId: string): void {
    const script = this.scripts.get(scriptId);
    if (!script) return;

    let currentTime = 0;

    script.segments.forEach(segment => {
      segment.startTime = currentTime;
      
      const wordCount = segment.text.split(' ').length;
      const duration = (wordCount / 150) * 60;
      
      segment.endTime = currentTime + duration;
      currentTime = segment.endTime + (segment.pauseAfter || 0) / 1000;
    });

    script.totalDuration = currentTime;
  }

  getScript(scriptId: string): MultiSpeakerScript | undefined {
    return this.scripts.get(scriptId);
  }

  getAllScripts(): MultiSpeakerScript[] {
    return Array.from(this.scripts.values()).sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
    );
  }

  deleteScript(scriptId: string): void {
    this.scripts.delete(scriptId);
    this.saveScripts();
  }

  private saveScripts(): void {
    try {
      const data = Array.from(this.scripts.entries());
      localStorage.setItem('multiSpeakerScripts', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving multi-speaker scripts:', error);
    }
  }

  private loadScripts(): void {
    try {
      const saved = localStorage.getItem('multiSpeakerScripts');
      if (saved) {
        const data = JSON.parse(saved);
        this.scripts = new Map(
          data.map(([id, script]: [string, any]) => [
            id,
            {
              ...script,
              createdAt: new Date(script.createdAt),
              lastModified: new Date(script.lastModified)
            }
          ])
        );
      }
    } catch (error) {
      console.error('Error loading multi-speaker scripts:', error);
    }
  }

  exportScript(scriptId: string): string {
    const script = this.scripts.get(scriptId);
    if (!script) return '';

    let output = `# ${script.name}\n\n`;
    output += `Duration: ${Math.round(script.totalDuration)}s\n\n`;
    output += `---\n\n`;

    script.segments.forEach((segment, index) => {
      const speakerName = segment.speaker.avatar?.name || 
                         segment.speaker.voice?.name || 
                         `Speaker ${index + 1}`;
      
      output += `## ${speakerName} (${segment.startTime.toFixed(1)}s - ${segment.endTime.toFixed(1)}s)\n\n`;
      output += `${this.getProcessedText(segment)}\n\n`;
      
      if (segment.pauseAfter) {
        output += `[Pause: ${segment.pauseAfter}ms]\n\n`;
      }
    });

    return output;
  }
}

export const multiSpeakerManager = new MultiSpeakerManager();

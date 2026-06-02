// Git Repair Summary Download Utility

interface ErrorItem {
  id: string;
  type: 'error' | 'warning' | 'security' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
  timestamp: number;
  fixed: boolean;
  agentId?: number;
}

interface RepairLog {
  id: string;
  timestamp: number;
  agentId: number;
  action: string;
  status: 'success' | 'failed' | 'in-progress';
  duration?: number;
  errorId?: string;
}

interface ScanResult {
  timestamp: number;
  totalErrors: number;
  totalWarnings: number;
  securityIssues: number;
  performanceIssues: number;
  filesScanned: number;
  duration: number;
  errors: ErrorItem[];
}

export function downloadGitRepairSummary(
  errors: ErrorItem[],
  repairLogs: RepairLog[],
  scanResults: ScanResult | null,
  buildStatus: 'idle' | 'testing' | 'success' | 'failed',
  brainAgents: any[]
) {
  const fixedErrors = errors.filter(e => e.fixed);
  const remainingErrors = errors.filter(e => !e.fixed);
  
  // Group errors by file
  const errorsByFile: Record<string, { fixed: ErrorItem[], remaining: ErrorItem[] }> = {};
  
  errors.forEach(error => {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = { fixed: [], remaining: [] };
    }
    if (error.fixed) {
      errorsByFile[error.file].fixed.push(error);
    } else {
      errorsByFile[error.file].remaining.push(error);
    }
  });

  // Generate comprehensive report
  const report = {
    title: 'Git Repair - Self-Healing Build System Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalErrors: errors.length,
      fixedCount: fixedErrors.length,
      remainingCount: remainingErrors.length,
      successRate: errors.length > 0 ? ((fixedErrors.length / errors.length) * 100).toFixed(1) + '%' : '0%',
      filesAffected: Object.keys(errorsByFile).length,
      scanDuration: scanResults?.duration || 0,
      buildStatus: buildStatus,
    },
    fixedErrors: fixedErrors.map(e => ({
      id: e.id,
      type: e.type,
      severity: e.severity,
      message: e.message,
      file: e.file,
      line: e.line,
      suggestion: e.suggestion,
      agentId: e.agentId,
      agentName: brainAgents.find(a => a.id === e.agentId)?.name || 'Unknown',
      timestamp: new Date(e.timestamp).toISOString(),
    })),
    remainingErrors: remainingErrors.map(e => ({
      id: e.id,
      type: e.type,
      severity: e.severity,
      message: e.message,
      file: e.file,
      line: e.line,
      suggestion: e.suggestion,
      agentId: e.agentId,
      agentName: brainAgents.find(a => a.id === e.agentId)?.name || 'Unknown',
      timestamp: new Date(e.timestamp).toISOString(),
    })),
    fileBreakdown: Object.entries(errorsByFile).map(([file, data]) => ({
      file,
      totalErrors: data.fixed.length + data.remaining.length,
      fixed: data.fixed.length,
      remaining: data.remaining.length,
      status: data.remaining.length === 0 ? 'Clean' : 'Needs Attention',
    })).sort((a, b) => b.remaining - a.remaining),
    repairActivity: repairLogs.slice(0, 50).map(log => ({
      timestamp: new Date(log.timestamp).toISOString(),
      agent: brainAgents.find(a => a.id === log.agentId)?.name || 'Unknown',
      action: log.action,
      status: log.status,
      duration: log.duration,
    })),
  };

  // Generate markdown format
  const markdown = `# Git Repair System - Summary Report

**Generated:** ${new Date().toLocaleString()}

---

## 📊 Summary

- **Total Errors Detected:** ${report.summary.totalErrors}
- **Errors Fixed:** ${report.summary.fixedCount} ✅
- **Remaining Errors:** ${report.summary.remainingCount} ❌
- **Success Rate:** ${report.summary.successRate}
- **Files Affected:** ${report.summary.filesAffected}
- **Build Status:** ${report.summary.buildStatus === 'success' ? '✅ SUCCESS' : report.summary.buildStatus === 'failed' ? '❌ FAILED' : '⏳ ' + report.summary.buildStatus.toUpperCase()}

---

## 📁 Files Breakdown

${report.fileBreakdown.map(f => `### ${f.file}
- **Total Errors:** ${f.totalErrors}
- **Fixed:** ${f.fixed} ✅
- **Remaining:** ${f.remaining} ${f.remaining > 0 ? '⚠️' : '✅'}
- **Status:** ${f.status}
`).join('\n')}

---

## ✅ Fixed Errors (${report.summary.fixedCount})

${fixedErrors.length === 0 ? '_No errors have been fixed yet._' : fixedErrors.map((e, i) => `### ${i + 1}. ${e.type.toUpperCase()} - ${e.severity.toUpperCase()}
**File:** \`${e.file}${e.line ? ':' + e.line : ''}\`  
**Message:** ${e.message}  
**Suggestion:** ${e.suggestion || 'N/A'}  
**Fixed by:** ${brainAgents.find(a => a.id === e.agentId)?.name || 'Unknown Agent'}  
**Time:** ${new Date(e.timestamp).toLocaleString()}

---
`).join('\n')}

## ❌ Remaining Errors (${report.summary.remainingCount})

${remainingErrors.length === 0 ? '_All errors have been fixed! 🎉_' : remainingErrors.map((e, i) => `### ${i + 1}. ${e.type.toUpperCase()} - ${e.severity.toUpperCase()}
**File:** \`${e.file}${e.line ? ':' + e.line : ''}\`  
**Message:** ${e.message}  
**Suggestion:** ${e.suggestion || 'N/A'}  
**Detected by:** ${brainAgents.find(a => a.id === e.agentId)?.name || 'Unknown Agent'}  
**Time:** ${new Date(e.timestamp).toLocaleString()}

---
`).join('\n')}

## 🔧 Recent Repair Activity

${repairLogs.length === 0 ? '_No repair activity yet._' : repairLogs.slice(0, 20).map((log, i) => `${i + 1}. **[${log.status.toUpperCase()}]** ${log.action}  
   _Agent: ${brainAgents.find(a => a.id === log.agentId)?.name} | ${new Date(log.timestamp).toLocaleTimeString()}${log.duration ? ' | ' + log.duration + 'ms' : ''}_
`).join('\n')}

---

## 🧠 System Information

- **Scan Duration:** ${report.summary.scanDuration}ms
- **AI Agents Active:** Error Detector, Error Researcher, Self-Healer, Build Executor, Test Generator, Security Auditor
- **Repair System:** Autonomous 12-Agent Brain System
- **Report Format:** Markdown

---

_Generated by Git Repair - Self-Healing Build System_
`;

  // Create markdown download
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `git-repair-summary-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Also create JSON version
  const jsonBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const jsonLink = document.createElement('a');
  jsonLink.href = jsonUrl;
  jsonLink.download = `git-repair-summary-${Date.now()}.json`;
  document.body.appendChild(jsonLink);
  jsonLink.click();
  document.body.removeChild(jsonLink);
  URL.revokeObjectURL(jsonUrl);

  return { markdown, json: report };
}

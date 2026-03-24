import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const urls = [
    "https://theteachablemachine.srv922041.hstgr.cloud/",
    "https://theteachablemachine.srv922041.hstgr.cloud/lernen",
    "https://theteachablemachine.srv922041.hstgr.cloud/impressum",
    "https://theteachablemachine.srv922041.hstgr.cloud/datenschutz"
];

let report = "# Barrierefreiheits- und Performance-Bericht\n\n";

for (const url of urls) {
    console.log(`Testing ${url}...`);
    try {
        execSync(`npx lighthouse "${url}" --only-categories=accessibility,performance --output json --output-path report.json --chrome-flags="--headless --no-sandbox"`, { stdio: 'inherit' });
        const data = JSON.parse(readFileSync('report.json', 'utf8'));
        const perf = Math.round(data.categories.performance.score * 100);
        const a11y = Math.round(data.categories.accessibility.score * 100);
        
        report += `## ${url}\n`;
        report += `- **Performance**: ${perf}%\n`;
        report += `- **Barrierefreiheit (Accessibility)**: ${a11y}%\n\n`;
        
        // Extract top issues for a11y
        const a11yAuditRefs = data.categories.accessibility.auditRefs.map(ref => ref.id);
        const a11yIssues = Object.values(data.audits)
            .filter(audit => audit.score !== null && audit.score < 1 && a11yAuditRefs.includes(audit.id))
            .map(audit => audit.title);
            
        if (a11yIssues.length > 0) {
            report += `**Verbesserungspotenzial Barrierefreiheit:**\n`;
            a11yIssues.forEach(issue => report += `- ${issue}\n`);
            report += `\n`;
        } else {
            report += `Keine kritischen Barrierefreiheits-Probleme gefunden!\n\n`;
        }
        
        // Extract top issues for performance
        const perfAuditRefs = data.categories.performance.auditRefs.map(ref => ref.id);
        const perfIssues = Object.values(data.audits)
            .filter(audit => audit.score !== null && audit.score < 1 && perfAuditRefs.includes(audit.id))
            .sort((a, b) => a.score - b.score)
            .slice(0, 5)
            .map(audit => audit.title);
            
        if (perfIssues.length > 0) {
            report += `**Verbesserungspotenzial Performance:**\n`;
            perfIssues.forEach(issue => report += `- ${issue}\n`);
            report += `\n`;
        }
        
    } catch (e) {
        report += `## ${url}\n`;
        report += `Fehler beim Testen.\n\n`;
        console.error(e.message);
    }
}

writeFileSync('final_report.md', report);
console.log("Report generated in final_report.md");

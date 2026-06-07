import type { DecryptedVaultItem, PasswordAuditIssue, PasswordAuditResult } from "@/types/vault";

function isWeakPassword(password:string){
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    const varietyScore = [
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSymbol,
    ].filter(Boolean).length;

    return password.length < 12 || varietyScore < 3;

}

function getReusedPasswordMap(items: DecryptedVaultItem[]){
    const passwordMap = new Map<string, DecryptedVaultItem[]>();

    items.forEach((item) => {
        if (!item.password) return;

        const existingItems = passwordMap.get(item.password) ?? [];
        passwordMap.set(item.password, [...existingItems, item]);
    });

    return passwordMap;
}

export function auditPasswords(items: DecryptedVaultItem[]): PasswordAuditResult{
    const issues: PasswordAuditIssue[] = [];
    const reusedPasswordMap = getReusedPasswordMap(items);

    let weakCount = 0;
    let shortCount = 0;
    let reusedCount = 0;
    let missingUsernameCount = 0;
    let missingUrlCount = 0;

    items.forEach((item) => {
        if (item.password.length < 12) {
            shortCount++;

            issues.push({
                itemId: item.id,
                title: item.title,
                type: "short",
                severity: "high",
                message: "Password is shorter than 12 characters.",
            });
        }

        if (isWeakPassword(item.password)){
            weakCount++;

            issues.push({
                itemId: item.id,
                title: item.title,
                type: "weak",
                severity: "high",
                message:
                    "Password may be weak. Use more length and a mix of character types."
            });
        }

        const reusedItems = reusedPasswordMap.get(item.password) ?? [];

        if (item.password && reusedItems.length > 1) {
            reusedCount++;

            issues.push({
                itemId: item.id,
                title: item.title,
                type: "reused",
                severity: "high",
                message: "This password is reused on another saved item.",
            });
        }

        if (!item.username.trim()) {
            missingUsernameCount++;

            issues.push({
                itemId: item.id,
                title: item.title,
                type: "missing_username",
                severity: "low",
                message: "This saved key has no username or email.",
            });
        }

        if (!item.url.trim()) {
            missingUrlCount++;

            issues.push({
                itemId: item.id,
                title: item.title,
                type: "missing_url",
                severity: "low",
                message: "This saved key has no website URL.",
            });
            }
        });

        const highSeverityCount = issues.filter(
            (issue) => issue.severity === "high"
        ).length;

        const mediumSeverityCount = issues.filter(
            (issue) => issue.severity === "medium"
        ).length;

        const lowSeverityCount = issues.filter(
            (issue) => issue.severity === "low"
        ).length;

        const penalty = 
            highSeverityCount * 12 + mediumSeverityCount * 7 + lowSeverityCount * 3;
        
        const score = Math.max(0, Math.min(100, 100-penalty));

        return{
            score,
            totalItems: items.length,
            weakCount,
            shortCount,
            reusedCount,
            missingUsernameCount,
            missingUrlCount,
            issues,
        };
}


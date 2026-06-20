"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionCompareService = void 0;
const Requirement_1 = require("../models/Requirement");
class VersionCompareService {
    static async compareVersions(currentRequirementId) {
        const current = await Requirement_1.Requirement.findById(currentRequirementId);
        if (!current || !current.parentVersionId) {
            return [];
        }
        const parent = await Requirement_1.Requirement.findById(current.parentVersionId);
        if (!parent) {
            return [];
        }
        const changes = [];
        if (current.title !== parent.title) {
            changes.push(`Title changed from "${parent.title}" to "${current.title}"`);
        }
        if (current.description !== parent.description) {
            const parentWords = new Set(parent.description.toLowerCase().match(/\b\w+\b/g) || []);
            const currentWords = new Set(current.description.toLowerCase().match(/\b\w+\b/g) || []);
            const added = Array.from(currentWords).filter((w) => !parentWords.has(w));
            const removed = Array.from(parentWords).filter((w) => !currentWords.has(w));
            let diffDesc = 'Description updated:';
            if (added.length > 0) {
                diffDesc += ` Added terms [${added.slice(0, 3).join(', ')}${added.length > 3 ? '...' : ''}]`;
            }
            if (removed.length > 0) {
                diffDesc += ` Removed terms [${removed.slice(0, 3).join(', ')}${removed.length > 3 ? '...' : ''}]`;
            }
            if (added.length === 0 && removed.length === 0) {
                diffDesc += ' Formatting modifications';
            }
            changes.push(diffDesc);
        }
        if (current.category !== parent.category) {
            changes.push(`Category changed from "${parent.category}" to "${current.category}"`);
        }
        return changes;
    }
}
exports.VersionCompareService = VersionCompareService;
exports.default = VersionCompareService;

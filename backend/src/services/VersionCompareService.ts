import { Types } from 'mongoose';
import { Requirement } from '../models/Requirement';

export class VersionCompareService {
  static async compareVersions(currentRequirementId: string | Types.ObjectId): Promise<string[]> {
    const current = await Requirement.findById(currentRequirementId);
    if (!current || !current.parentVersionId) {
      return [];
    }

    const parent = await Requirement.findById(current.parentVersionId);
    if (!parent) {
      return [];
    }

    const changes: string[] = [];
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
export default VersionCompareService;

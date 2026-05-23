export const parseCsvContacts = (buffer: Buffer): any[] => {
    let content = buffer.toString('utf8');
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }

    
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    const contacts = [];

    if (lines.length === 0) return [];

    const parseLine = (line: string): string[] => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur.trim());
        return result;
    };

    // Detect headers
    const firstLine = lines[0].toLowerCase();
    const headers = parseLine(firstLine);

    // Header name variations
    const nameKeywords = ['name', 'full name', 'contact name', 'first name', 'username'];
    const phoneKeywords = ['phone', 'mobile', 'number', 'phone number', 'contact number', 'mobile number'];
    const groupKeywords = ['group', 'category', 'tag'];

    // Find indices
    let nameIdx = headers.findIndex(h => nameKeywords.some(kw => h.includes(kw)));
    let phoneIdx = headers.findIndex(h => phoneKeywords.some(kw => h.includes(kw)));
    let groupIdx = headers.findIndex(h => groupKeywords.some(kw => h.includes(kw)));

    const isHeader = nameIdx !== -1 || phoneIdx !== -1 || groupIdx !== -1;

    // Fallback indices if no header detected OR some columns not found
    if (!isHeader) {
        nameIdx = 0;
        phoneIdx = 1;
        groupIdx = 2;
    } else {
        // If header detected but specific column NOT found, try to use defaults or remain -1
        if (nameIdx === -1) nameIdx = 0;
        if (phoneIdx === -1) phoneIdx = 1;
        if (groupIdx === -1) groupIdx = 2;
    }

    const startIndex = isHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const parts = parseLine(lines[i]);
        if (parts.length < 2 && !parts[0] && !parts[1]) continue;

        let name = parts[nameIdx] || '';
        let phone = parts[phoneIdx] || '';
        let group = parts[groupIdx] || '';
        
        name = name.replace(/^"|"$/g, '').trim();
        phone = phone.replace(/^"|"$/g, '').trim();
        group = group.replace(/^"|"$/g, '').trim();

        contacts.push({
            name: name,
            phone: phone,
            group: group
        });
    }
    return contacts;
};


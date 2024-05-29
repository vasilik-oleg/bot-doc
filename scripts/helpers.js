function removeNumberingFromHeaders(content) {
	let cleanedContent = '';
	const lines = content.split('\n');

	lines.forEach(line => {
		const headerMatch = line.match(/^(#{1,6})\s+(?:\*\*)?\d+(\.\d+)*\.\s+(.*?)(?:\*\*)?$/);

		if (headerMatch) {
			cleanedContent += `${headerMatch[1]} ${headerMatch[3]}\n`;
		} else {
			cleanedContent += `${line}\n`;
		}
	});

	return cleanedContent.trim();
}

function addNumberingToHeaders(content, initialSectionNumber = 0) {
	const sectionNumbers = [initialSectionNumber];


	let resultContent = '';

	content.split('\n').forEach(line => {
		const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);

		if (!headerMatch) {
			resultContent += `${line}\n`;
			return;
		}

		const level = headerMatch[1].length;

		if (sectionNumbers.length < level) {
			while (sectionNumbers.length < level) {
				sectionNumbers.push(0);
			}
		} else {
			sectionNumbers.length = level;
		}

		sectionNumbers[level - 1]++;
		const sectionNumber = sectionNumbers.join('.');
		const sectionHashes = headerMatch[1];
		const sectionTextWithAnchor = addAnchorToHeader(headerMatch[2])


		resultContent += `${sectionHashes} ${sectionNumber}. ${sectionTextWithAnchor}\n`;
	})


	return resultContent.trim();
}


function slugify(s) {
	return String(s).trim().toLowerCase().replace(/\s+/g, '-')
}


function addAnchorToHeader(line) {
	const slug = slugify(line.replace(/<Anchor.*$/, '').trim());

	const anchorMatch = line.match(/<Anchor\s*:ids="\[([^\]]*)\]"\s*\/>/);
	if (!anchorMatch) return `${line} <Anchor :ids="['${slug}']" />`;

	const existingIds = anchorMatch[1].split(',').map(id => id.trim().replace(/^'(.*)'$/, '$1'));
	if (existingIds.includes(slug)) return line;

	existingIds.push(slug);
	const newIds = existingIds.map(id => `'${id}'`).join(', ');

	return line.replace(anchorMatch[0], `<Anchor :ids="[${newIds}]" />`);
}


module.exports = {
	addNumberingToHeaders,
	removeNumberingFromHeaders
}

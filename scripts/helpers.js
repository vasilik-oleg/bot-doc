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

		resultContent += `${headerMatch[1]} ${sectionNumber}. ${headerMatch[2]}\n`;
	})


	return resultContent.trim();
}

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


module.exports = {
	addNumberingToHeaders,
	removeNumberingFromHeaders
}

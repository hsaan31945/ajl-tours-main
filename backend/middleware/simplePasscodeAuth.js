module.exports = function simplePasscodeAuth(req, res, next) {
	try {
		const header = req.header('X-Admin-Passcode') || req.header('x-admin-passcode');
		const expected = process.env.ADMIN_PASSCODE || '';
		
		// Trim whitespace and normalize
		const headerTrimmed = header ? header.trim() : null;
		const expectedTrimmed = expected ? expected.trim() : null;
		
		if (!expectedTrimmed || !headerTrimmed || headerTrimmed !== expectedTrimmed) {
			return res.status(401).json({ message: 'Invalid or missing admin passcode' });
		}
		// Optionally expose actor
		req.adminActor = 'passcode-admin';
		next();
	} catch (err) {
		return res.status(401).json({ message: 'Unauthorized' });
	}
}




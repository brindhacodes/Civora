const test = require('node:test');
const assert = require('node:assert/strict');
const { validateComplaint } = require('../src/middleware/validateComplaint');

const validReport = {
    name: 'Validation test', phone: '9876543210', area: 'Anna Nagar',
    city: 'Chennai', issueType: 'Pothole', description: 'Test road damage',
};

test('accepts a valid Indian PIN code and preserves compatibility when omitted', () => {
    for (const pincode of ['600040', '', undefined]) {
        let accepted = false;
        validateComplaint({ body: { ...validReport, pincode } }, {
            status: () => assert.fail('Valid report was rejected'),
        }, () => { accepted = true; });
        assert.equal(accepted, true);
    }
});

test('rejects invalid PIN codes before creating a complaint', () => {
    for (const pincode of ['60004', '6000400', '000000', 'abcdef', '600 40']) {
        let body;
        validateComplaint({ body: { ...validReport, pincode } }, {
            status(code) { assert.equal(code, 400); return this; },
            json(value) { body = value; },
        }, () => assert.fail('Invalid PIN was accepted'));
        assert.match(body.error.details.join(' '), /PIN code/);
    }
});

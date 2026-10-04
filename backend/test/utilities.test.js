const test = require('node:test');
const assert = require('node:assert/strict');

const { routeToDepartment } = require('../src/utils/departmentRouter');
const { generateComplaintId } = require('../src/utils/generateId');
const { generateWhatsAppLink } = require('../src/utils/whatsapp');

test('routes known civic issues to the responsible department', () => {
    assert.equal(routeToDepartment('Large pothole'), 'Roads Department');
    assert.equal(routeToDepartment('Garbage overflow'), 'Sanitation');
    assert.equal(routeToDepartment('Water pipe leak'), 'Water Department');
    assert.equal(routeToDepartment('Streetlight not working'), 'Electrical Department');
    assert.equal(routeToDepartment('Unknown issue'), 'General Administration');
});

test('generates complaint IDs in the public Civora format', () => {
    assert.match(generateComplaintId(), new RegExp(`^CIV-${new Date().getFullYear()}-\\d{6}$`));
});

test('creates an encoded WhatsApp status link and handles missing phones', () => {
    assert.equal(generateWhatsAppLink('', {}), null);
    const link = generateWhatsAppLink('90940 24324', {
        complaintId: 'CIV-2026-123456', issueType: 'Pothole', area: 'Anna Nagar', city: 'Chennai', status: 'Submitted'
    });
    assert.match(link, /^https:\/\/wa\.me\/919094024324\?text=/);
    assert.match(decodeURIComponent(link), /CIV-2026-123456/);
});

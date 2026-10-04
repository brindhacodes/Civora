// Human-readable complaint ID, e.g. CIV-2026-004821.
const generateComplaintId = () => {
    const year = new Date().getFullYear();
    const number = String(Math.floor(Math.random() * 900000) + 100000);
    return `CIV-${year}-${number}`;
};

module.exports = { generateComplaintId };

const router     = require('express').Router();
const Loan       = require('../models/Loan');
const Payment    = require('../models/Payment');
const auth       = require('../middleware/auth');

// ── Auto hard-delete loans trashed > 7 days ago (runs on every server boot + hourly) ──
async function purgeOldTrash() {
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stale  = await Loan.find({ deletedAt: { $ne: null, $lt: cutoff } }).select('_id');
    for (const loan of stale) {
      await Payment.deleteMany({ loanId: loan._id });
      await Loan.findByIdAndDelete(loan._id);
    }
    if (stale.length) console.log(`[Trash] Auto-purged ${stale.length} loan(s) older than 7 days.`);
  } catch (e) { console.error('[Trash] Purge error:', e.message); }
}
purgeOldTrash();
setInterval(purgeOldTrash, 60 * 60 * 1000); // run every hour
const multer     = require('multer');
const { cloudinary } = require('../config/cloudinary');
const streamifier = require('streamifier');

// ── Multer (memory storage — files go to Cloudinary, not disk) ──────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per photo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// ── Helper: upload a buffer to Cloudinary ──────────────────────────────────
function uploadToCloudinary(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, overwrite: true, resource_type: 'image' },
      (err, result) => { if (err) reject(err); else resolve(result.secure_url); }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

const calc = (amount, interest, weeks, overrideTotal = 0) => {
  const intAmt    = (amount * interest) / 100;
  const autoTotal = amount + intAmt;
  const total     = overrideTotal > 0 ? overrideTotal : autoTotal;
  return { totalAmount: total, weeklyEMI: Math.round((total / weeks) * 100) / 100 };
};

// ── GET all loans (exclude trashed) ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const loans = await Loan.find({ createdBy: req.user.id, deletedAt: null }).sort({ cardNo: 1 });
    res.json(loans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET trash (soft-deleted loans) ───────────────────────────────────────────
router.get('/trash', auth, async (req, res) => {
  try {
    const loans = await Loan.find({
      createdBy: req.user.id,
      deletedAt: { $ne: null }
    }).sort({ deletedAt: -1 });
    res.json(loans);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── CREATE loan ──────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { name, village, aadhar, phone, address, amount, interest, startDate, weeks } = req.body;

    const existing = await Loan.findOne({ aadhar, closed: false, createdBy: req.user.id });
    if (existing) return res.status(400).json({
      message: `Active loan already exists for Aadhar ${aadhar} (${existing.name})`
    });

    // Card number is now manually provided — validate uniqueness
    const cardNo = parseInt(req.body.cardNo);
    if (!cardNo || cardNo <= 0) return res.status(400).json({ message: 'Card number is required.' });
    const cardDup = await Loan.findOne({ cardNo, createdBy: req.user.id });
    if (cardDup) return res.status(400).json({ message: `Card No ${cardNo} is already in use by ${cardDup.name}.` });

    const { totalAmount, weeklyEMI } = calc(amount, interest, weeks);
    const loan = await Loan.create({
      cardNo, name, village, aadhar, phone, address,
      amount, interest, startDate, weeks, totalAmount, weeklyEMI,
      createdBy: req.user.id
    });
    res.status(201).json(loan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── UPLOAD PHOTOS  POST /api/loans/:id/photos ────────────────────────────────
// Accepts multipart/form-data with fields: aadhar, person, house (all optional)
router.post(
  '/:id/photos',
  auth,
  upload.fields([
    { name: 'aadhar', maxCount: 1 },
    { name: 'person', maxCount: 1 },
    { name: 'house',  maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const loan = await Loan.findOne({ _id: req.params.id, createdBy: req.user.id });
      if (!loan) return res.status(404).json({ message: 'Loan not found.' });

      const updates = {};
      const folder  = `gramseva/loans/${loan._id}`;

      if (req.files?.aadhar?.[0]) {
        updates['photos.aadharUrl'] = await uploadToCloudinary(
          req.files.aadhar[0].buffer, folder, `aadhar`
        );
      }
      if (req.files?.person?.[0]) {
        updates['photos.personUrl'] = await uploadToCloudinary(
          req.files.person[0].buffer, folder, `person`
        );
      }
      if (req.files?.house?.[0]) {
        updates['photos.houseUrl'] = await uploadToCloudinary(
          req.files.house[0].buffer, folder, `house`
        );
      }

      if (Object.keys(updates).length === 0)
        return res.status(400).json({ message: 'No photos provided.' });

      const updated = await Loan.findByIdAndUpdate(
        req.params.id, { $set: updates }, { new: true }
      );
      res.json({ photos: updated.photos });
    } catch (err) { res.status(500).json({ message: err.message }); }
  }
);

// ── UPDATE loan ──────────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, village, aadhar, phone, address, amount, interest, startDate, weeks, overrideTotal } = req.body;
    const { totalAmount, weeklyEMI } = calc(amount, interest, weeks, overrideTotal || 0);
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { name, village, aadhar: aadhar||'', phone, address, amount, interest, startDate, weeks,
        overrideTotal: overrideTotal||0, totalAmount, weeklyEMI },
      { new: true }
    );
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    res.json(loan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── SOFT DELETE loan → moves to trash ────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!loan) return res.status(404).json({ message: 'Loan not found.' });
    res.json({ message: 'Loan moved to trash.', loan });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── RESTORE loan from trash ───────────────────────────────────────────────────
router.patch('/:id/restore', auth, async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true }
    );
    if (!loan) return res.status(404).json({ message: 'Loan not found in trash.' });
    res.json(loan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PERMANENT DELETE from trash ───────────────────────────────────────────────
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    await Payment.deleteMany({ loanId: req.params.id });
    await Loan.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    res.json({ message: 'Loan permanently deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── CLOSE loan ───────────────────────────────────────────────────────────────
router.patch('/:id/close', auth, async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { closed: true }, { new: true }
    );
    res.json(loan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── RENEW loan ───────────────────────────────────────────────────────────────
router.post('/:id/renew', auth, async (req, res) => {
  try {
    await Loan.findOneAndUpdate({ _id: req.params.id }, { closed: true });
    const { name, village, aadhar, phone, address, amount, interest, startDate, weeks, overrideTotal } = req.body;
    const { totalAmount, weeklyEMI } = calc(amount, interest, weeks, overrideTotal || 0);
    // Use same card number as the previous (closed) loan
    const prevLoan = await Loan.findById(req.params.id);
    const cardNo = prevLoan?.cardNo || (() => { throw new Error('Previous loan not found'); })();
    const newLoan = await Loan.create({
      cardNo, name, village, aadhar: aadhar||'', phone, address,
      amount, interest, startDate, weeks, overrideTotal: overrideTotal||0,
      totalAmount, weeklyEMI, renewedFrom: req.params.id, createdBy: req.user.id
    });
    res.status(201).json(newLoan);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

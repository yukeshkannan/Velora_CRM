const Attendance = require('../models/Attendance');
const { getCache, setCache, delCachePattern } = require('../../../packages/utils');

const activeCheckIns = new Set();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check In
exports.checkIn = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    await delCachePattern('hr:attendance:*');

    const key = userId.toString();
    
    // Simple serialization/locking for concurrent check-in requests
    let attempts = 0;
    while (activeCheckIns.has(key) && attempts < 10) {
      await sleep(200);
      attempts++;
    }

    activeCheckIns.add(key);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Auto-checkout any open sessions from previous days for this user
    try {
      const olderOpenSessions = await Attendance.find({
        userId,
        date: { $lt: today },
        checkOut: { $exists: false }
      });

      for (const session of olderOpenSessions) {
        const checkInTime = new Date(session.checkIn);
        const autoCheckOutTime = new Date(checkInTime.getTime() + 8 * 60 * 60 * 1000);
        session.checkOut = autoCheckOutTime;
        session.totalHours = 8.00;
        await session.save();
        console.log(`[Auto-Checkout] Closed stale session ${session._id} for user ${userId} with 8 hours`);
      }
    } catch (err) {
      console.error('[checkIn] Auto-checkout older sessions error:', err);
    }

    // Check if there is an ACTIVE session for today (checkOut is null or undefined)
    const openSession = await Attendance.findOne({ 
        userId, 
        date: today, 
        checkOut: { $exists: false } 
    });

    if (openSession) {
      activeCheckIns.delete(key);
      // Idempotent success - return existing open session
      return res.status(200).json({ success: true, message: 'Already checked in', data: openSession });
    }

    // Create NEW session (even if others exist for today)
    const attendance = await Attendance.create({
      userId,
      date: today,
      checkIn: new Date(),
      status: 'Present'
    });

    activeCheckIns.delete(key);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    if (req.body.userId) {
      activeCheckIns.delete(req.body.userId.toString());
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check Out
exports.checkOut = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Find the LATEST active session (no checkOut) for this user
    const attendance = await Attendance.findOne({ 
        userId, 
        checkOut: { $exists: false } 
    }).sort({ checkIn: -1 });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No active session found' });
    }

    const checkOutTime = new Date();
    attendance.checkOut = checkOutTime;
    
    // Calculate total hours
    const durationMs = checkOutTime - new Date(attendance.checkIn);
    const hours = durationMs / (1000 * 60 * 60);
    attendance.totalHours = hours.toFixed(2);

    await attendance.save();
    await delCachePattern('hr:attendance:*');

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('[checkOut] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    await delCachePattern('hr:attendance:*');

    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Attendance (User / All)
exports.getAttendance = async (req, res) => {
  try {
    const { userId } = req.query;
    const cacheKey = `hr:attendance:${userId || 'all'}`;
    const cachedRecords = await getCache(cacheKey);
    if (cachedRecords) {
      return res.json(cachedRecords);
    }

    let query = {};
    if (userId) query.userId = userId;

    const records = await Attendance.find(query)
        .sort({ date: -1, createdAt: -1 })
        .populate('userId', 'name email role department designation');
    
    const responsePayload = { success: true, count: records.length, data: records };
    await setCache(cacheKey, responsePayload, 60); // Cache for 60 seconds
    res.json(responsePayload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
